const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');
// Temporarily disable NSFW detector to focus on core functionality
// const NSFWDetector = require('./models/nsfw-detector.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Store connected users
const users = new Map();
let userCount = 0;

// Initialize NSFW detector - disabled for now
// const nsfwDetector = new NSFWDetector();
// nsfwDetector.initialize();

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

    // Validation: data.type should be a string
    if (typeof data.type !== 'string') return;

    // Handle ping/pong heartbeat immediately without rate limiting
    if (data.type === 'ping') {
        handlePing(userId, data);
        return;
    }

    // Anti-spam: simple rate limit
    const now = Date.now();
    if (!user.lastMessageTime) user.lastMessageTime = 0;

    if (data.type === 'message') {
        if (typeof data.message !== 'string' || data.message.length === 0 || data.message.length > 500) {
            return; // invalid message
        }

        if (now - user.lastMessageTime < 500) { // 500ms cooldown
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
    
    // Find a matching partner
    const partner = findPartner(userId);
    
    if (partner) {
        // Pair these users
        user.partner = partner.id;
        partner.user.partner = userId;
        user.waiting = false;
        partner.user.waiting = false;

        // Notify both users if connections are still open
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
            // If either connection is closed, reset the pairing
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
        // No partner found yet
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

function handleTyping(userId, data) {
    const user = users.get(userId);
    if (!user || !user.partner) return;
    
    // Validate typing data
    if (typeof data.isTyping !== 'boolean') return;
    
    const partner = users.get(user.partner);
    if (partner && partner.ws.readyState === WebSocket.OPEN) {
        console.log(`User ${userId} typing status: ${data.isTyping}`);
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

    console.log(`Received ping from user ${userId}`);
    
    // Send pong response back to the client
    if (user.ws.readyState === WebSocket.OPEN) {
        const pongResponse = {
            type: 'pong',
            timestamp: data.timestamp || Date.now()
        };
        
        user.ws.send(JSON.stringify(pongResponse));
        console.log(`Sent pong to user ${userId}`);
    } else {
        console.warn(`Cannot send pong to user ${userId}, WebSocket not open`);
    }
}

function handleNSFWViolation(userId, data) {
    const user = users.get(userId);
    if (!user) return;

    // Log violation
    console.log(`NSFW violation detected for user ${userId}:`, {
        confidence: data.confidence,
        timestamp: new Date().toISOString()
    });

    // Track violations
    if (!userViolations.has(userId)) {
        userViolations.set(userId, []);
    }
    userViolations.get(userId).push({
        timestamp: Date.now(),
        confidence: data.confidence
    });

    // Notify partner about video block
    if (user.partner && users.has(user.partner)) {
        const partner = users.get(user.partner);
        if (partner.ws.readyState === WebSocket.OPEN) {
            partner.ws.send(JSON.stringify({
                type: 'partner_video_blocked',
                reason: 'Inappropriate content detected'
            }));
        }
    }

    // Send warning to violating user
    if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify({
            type: 'nsfw_warning',
            message: 'Inappropriate content detected. Video transmission blocked.',
            violations: userViolations.get(userId).length
        }));
    }

    // Auto-disconnect after multiple violations
    const violations = userViolations.get(userId);
    if (violations.length >= 3) {
        console.log(`User ${userId} auto-disconnected for repeated violations`);
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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
