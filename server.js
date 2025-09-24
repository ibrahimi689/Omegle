const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
    server,
    maxPayload: 15 * 1024 * 1024 // 15MB max payload (above our media limits)
});

// Enable CORS
app.use(cors());
app.use(express.json());

// ✅ Sirf public folder expose hoga
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const users = new Map();
let userCount = 0;

// Store user violations
const userViolations = new Map();

// WebSocket server
wss.on('connection', (ws) => {
    const userId = generateUserId();
    users.set(userId, { ws, interests: [], chatType: null, partner: null, waiting: false });
    userCount++;
    
    // Broadcast real-time user count
    broadcastUserCount();

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(userId, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    
    ws.on('close', () => {
        const user = users.get(userId);
        if (user) {
            // Notify partner about disconnection
            if (user.partner && users.has(user.partner)) {
                const partner = users.get(user.partner);
                if (partner.ws.readyState === WebSocket.OPEN) {
                    partner.ws.send(JSON.stringify({ type: 'stranger_disconnected' }));
                }
                partner.partner = null;
            }
            users.delete(userId);
            userCount--;
            broadcastUserCount();
        }
    });
});

function handleMessage(userId, data) {
    const user = users.get(userId);
    if (!user) return;

    if (typeof data.type !== 'string') return;

    if (data.type === 'ping') {
        handlePing(userId, data);
        return;
    }

    const now = Date.now();
    if (!user.lastMessageTime) user.lastMessageTime = 0;

    if (data.type === 'message') {
        if (typeof data.message !== 'string' || data.message.length === 0 || data.message.length > 500) {
            return;
        }

        if (now - user.lastMessageTime < 500) {
            console.log(`User ${userId} is spamming, ignoring message`);
            return;
        }

        user.lastMessageTime = now;
    }

    switch (data.type) {
        case 'join':
            handleJoin(userId, data);
            break;
        case 'message':
            handleUserMessage(userId, data);
            break;
        case 'media':
            handleMediaMessage(userId, data);
            break;
        case 'typing':
            handleTyping(userId, data);
            break;
        case 'leave':
            handleLeave(userId);
            break;
        case 'webrtc_offer':
        case 'webrtc_answer':
        case 'webrtc_ice_candidate':
            forwardWebRTCData(userId, data);
            break;
        case 'nsfw_violation':
            handleNSFWViolation(userId, data);
            break;
        default:
            console.warn('Unknown message type:', data.type);
    }
}

function handleJoin(userId, data) {
    const user = users.get(userId);
    if (!user) return;

    user.chatType = (data.chatType === 'text' || data.chatType === 'video') ? data.chatType : 'text';
    user.interests = Array.isArray(data.interests) ? data.interests : []; 
    
    const partner = findPartner(userId);
    
    if (partner) {
        user.partner = partner.id;
        partner.user.partner = userId;
        user.waiting = false;
        partner.user.waiting = false;

        if (user.ws.readyState === WebSocket.OPEN && partner.user.ws.readyState === WebSocket.OPEN) {
            user.ws.send(JSON.stringify({
                type: 'stranger_connected',
                chatType: user.chatType
            }));
            partner.user.ws.send(JSON.stringify({
                type: 'stranger_connected',
                chatType: partner.user.chatType
            }));
        } else {
            user.partner = null;
            user.waiting = true;
            if (user.ws.readyState === WebSocket.OPEN) {
                user.ws.send(JSON.stringify({
                    type: 'waiting',
                    message: 'Looking for people online'
                }));
            }
        }
    } else {
        user.waiting = true;
        if (user.ws.readyState === WebSocket.OPEN) {
            user.ws.send(JSON.stringify({ 
                type: 'waiting',
                message: 'Looking for people online'
            }));
        }
    }
}

function findPartner(userId) {
    const currentUser = users.get(userId);
    if (!currentUser) return null;

    for (const [id, user] of users.entries()) {
        if (id !== userId && 
            !user.partner && 
            user.chatType === currentUser.chatType &&
            user.waiting &&
            (user.interests.length === 0 || 
             currentUser.interests.length === 0 ||
             hasCommonInterest(user.interests, currentUser.interests))) {
            return { id, user };
        }
    }
    return null;
}

function hasCommonInterest(interests1, interests2) {
    return interests1.some(interest => interests2.includes(interest));
}

function handleUserMessage(userId, data) {
    const user = users.get(userId);
    if (!user || !user.partner) return;

    const partner = users.get(user.partner);
    if (partner && partner.ws.readyState === WebSocket.OPEN) {
        partner.ws.send(JSON.stringify({
            type: 'message',
            message: data.message
        }));
    }
}

function handleMediaMessage(userId, data) {
    const user = users.get(userId);
    if (!user || !user.partner) return;

    // Rate limiting for media messages
    const now = Date.now();
    if (!user.lastMediaTime) user.lastMediaTime = 0;
    if (now - user.lastMediaTime < 2000) { // 2 seconds between media messages
        console.log(`User ${userId} is sending media too fast, ignoring`);
        user.ws.send(JSON.stringify({
            type: 'media_validation_error',
            message: 'Please wait 2 seconds between media uploads'
        }));
        return;
    }
    user.lastMediaTime = now;

    // Validate media message structure
    if (!data.mediaType || !data.name || !data.data) {
        console.warn('Invalid media message structure:', data);
        user.ws.send(JSON.stringify({
            type: 'media_validation_error',
            message: 'Invalid media message format'
        }));
        return;
    }

    // Validate filename
    if (typeof data.name !== 'string' || data.name.length > 255 || data.name.length === 0) {
        user.ws.send(JSON.stringify({
            type: 'media_validation_error',
            message: 'Invalid filename'
        }));
        return;
    }

    // Validate media type
    const allowedTypes = ['image', 'video'];
    if (!allowedTypes.includes(data.mediaType)) {
        console.warn('Invalid media type:', data.mediaType);
        user.ws.send(JSON.stringify({
            type: 'media_validation_error',
            message: 'Invalid media type. Only images and videos are allowed'
        }));
        return;
    }

    // Validate data URL format
    if (!data.data.startsWith('data:' + data.mediaType + '/')) {
        user.ws.send(JSON.stringify({
            type: 'media_validation_error',
            message: 'Invalid media data format'
        }));
        return;
    }

    // Size validation (rough base64 size check)
    const dataSizeBytes = (data.data.length * 3) / 4; // Approximate base64 to bytes conversion
    const dataSizeMB = dataSizeBytes / (1024 * 1024);
    
    const maxSizeMB = data.mediaType === 'image' ? 5 : 10; // 5MB for images, 10MB for videos
    if (dataSizeMB > maxSizeMB) {
        user.ws.send(JSON.stringify({
            type: 'media_validation_error',
            message: `${data.mediaType} file too large: ${dataSizeMB.toFixed(2)}MB. Maximum allowed: ${maxSizeMB}MB`
        }));
        return;
    }

    const partner = users.get(user.partner);
    if (partner && partner.ws.readyState === WebSocket.OPEN) {
        partner.ws.send(JSON.stringify({
            type: 'media',
            mediaType: data.mediaType,
            name: data.name,
            data: data.data,
            size: data.size
        }));
        console.log(`📷 Media message forwarded: ${data.name} (${data.mediaType}, ${dataSizeMB.toFixed(2)}MB)`);
    }
}

function handleTyping(userId, data) {
    const user = users.get(userId);
    if (!user || !user.partner) return;
    
    if (typeof data.isTyping !== 'boolean') return;
    
    const partner = users.get(user.partner);
    if (partner && partner.ws.readyState === WebSocket.OPEN) {
        partner.ws.send(JSON.stringify({
            type: 'typing',
            isTyping: data.isTyping,
            timestamp: Date.now()
        }));
    }
}

function handleLeave(userId) {
    const user = users.get(userId);
    if (!user) return;
    
    if (user.partner && users.has(user.partner)) {
        const partner = users.get(user.partner);
        if (partner.ws.readyState === WebSocket.OPEN) {
            partner.ws.send(JSON.stringify({ type: 'stranger_disconnected' }));
        }
        partner.partner = null;
    }
    
    users.delete(userId);
    userCount--;
    broadcastUserCount();
}

function forwardWebRTCData(userId, data) {
    const user = users.get(userId);
    if (!user || !user.partner) return;
    
    const partner = users.get(user.partner);
    if (partner && partner.ws.readyState === WebSocket.OPEN) {
        partner.ws.send(JSON.stringify(data));
    }
}

function broadcastUserCount() {
    const countMessage = JSON.stringify({
        type: 'user_count',
        count: userCount
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(countMessage);
        }
    });
}

function handlePing(userId, data) {
    const user = users.get(userId);
    if (!user) return;

    if (user.ws.readyState === WebSocket.OPEN) {
        const pongResponse = {
            type: 'pong',
            timestamp: data.timestamp || Date.now()
        };
        user.ws.send(JSON.stringify(pongResponse));
    }
}

function handleNSFWViolation(userId, data) {
    const user = users.get(userId);
    if (!user) return;

    if (!userViolations.has(userId)) {
        userViolations.set(userId, []);
    }
    userViolations.get(userId).push({
        timestamp: Date.now(),
        confidence: data.confidence
    });

    if (user.partner && users.has(user.partner)) {
        const partner = users.get(user.partner);
        if (partner.ws.readyState === WebSocket.OPEN) {
            partner.ws.send(JSON.stringify({
                type: 'partner_video_blocked',
                reason: 'Inappropriate content detected'
            }));
        }
    }

    if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify({
            type: 'nsfw_warning',
            message: 'Inappropriate content detected. Video transmission blocked.',
            violations: userViolations.get(userId).length
        }));
    }

    const violations = userViolations.get(userId);
    if (violations.length >= 3) {
        handleLeave(userId);
    }
}

function generateUserId() {
    return Math.random().toString(36).substring(2, 15);
}

// REST API endpoints
app.get('/api/users/count', (req, res) => {
    res.json({ count: userCount });
});

// ✅ Agar koi bhi route match na ho to index.html serve kare
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
