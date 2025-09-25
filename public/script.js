// Enhanced video element management with duplicate cleanup
function ensureVideoElements() {
    // Clean up any duplicate video elements first
    cleanupDuplicateVideoElements();

    // Wait for DOM to be ready before accessing elements
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureVideoElements);
        return;
    }

    if (!localVideo) {
        localVideo = document.getElementById('localVideo');
    }
    if (!remoteVideo) {
        remoteVideo = document.getElementById('remoteVideo');
    }

    if (localVideo) {
        localVideo.autoplay = true;
        localVideo.playsInline = true;
        localVideo.muted = true;
        localVideo.setAttribute('playsinline', '');
        localVideo.setAttribute('webkit-playsinline', '');
        console.log('Local video element configured with attributes:', {
            autoplay: localVideo.autoplay,
            playsInline: localVideo.playsInline,
            muted: localVideo.muted
        });
    }

    if (remoteVideo) {
        remoteVideo.autoplay = true;
        remoteVideo.playsInline = true;
        remoteVideo.muted = false;
        remoteVideo.controls = false;
        remoteVideo.setAttribute('playsinline', '');
        remoteVideo.setAttribute('webkit-playsinline', '');
        console.log('Remote video element configured with attributes:', {
            autoplay: remoteVideo.autoplay,
            playsInline: remoteVideo.playsInline,
            muted: remoteVideo.muted,
            controls: remoteVideo.controls
        });
    }

    console.log('Video elements status:', {
        localVideo: localVideo ? 'ready' : 'missing',
        remoteVideo: remoteVideo ? 'ready' : 'missing'
    });
}

// Function to clean up duplicate video elements
function cleanupDuplicateVideoElements() {
    // Find all elements with localVideo ID
    const localVideoElements = document.querySelectorAll('#localVideo');
    if (localVideoElements.length > 1) {
        console.log(`Found ${localVideoElements.length} localVideo elements, removing duplicates`);
        // Keep the first one, remove the rest
        for (let i = 1; i < localVideoElements.length; i++) {
            localVideoElements[i].remove();
        }
    }

    // Find all elements with remoteVideo ID
    const remoteVideoElements = document.querySelectorAll('#remoteVideo');
    if (remoteVideoElements.length > 1) {
        console.log(`Found ${remoteVideoElements.length} remoteVideo elements, removing duplicates`);
        // Keep the first one, remove the rest
        for (let i = 1; i < remoteVideoElements.length; i++) {
            remoteVideoElements[i].remove();
        }
    }

    // Also clean up any video elements without proper IDs that might be duplicates
    const videoContainer = document.getElementById('videoContainer');
    if (videoContainer) {
        const allVideoElements = videoContainer.querySelectorAll('video');
        const validVideoElements = [];

        allVideoElements.forEach(video => {
            if (video.id === 'localVideo' || video.id === 'remoteVideo') {
                validVideoElements.push(video);
            } else if (!video.id || video.id === '') {
                // Remove video elements without proper IDs (likely duplicates)
                console.log('Removing video element without proper ID:', video);
                video.remove();
            }
        });
    }
}

// Call this function when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ensureVideoElements();
    // ... rest of initialization
});

// DOM Elements
const homePage = document.getElementById('homePage');
const homeScreen = document.getElementById('homeScreen');
const chatContainer = document.getElementById('chatContainer');
const videoContainer = document.getElementById('videoContainer');
const startNowBtn = document.getElementById('startNowBtn');
const startChatBtn = document.getElementById('startChatBtn');
const startVideoBtn = document.getElementById('startVideoBtn');
let strangerVideoWindow = null;

function startVideoChat() {
    if (strangerVideoWindow) {
        strangerVideoWindow.classList.add('connecting'); // Loader ON
    }
}
const termsModal = document.getElementById('termsModal');
const closeTermsModal = document.getElementById('closeTermsModal');
const agreeBtn = document.getElementById('agreeBtn');
const chatExitBtn = document.getElementById('chatExitBtn');
const videoExitBtn = document.getElementById('videoExitBtn');
const chatMessages = document.getElementById('chatMessages');
const videoChatMessages = document.getElementById('videoChatMessages');
const messageInput = document.getElementById('messageInput');
const videoMessageInput = document.getElementById('videoMessageInput');
const sendBtn = document.getElementById('sendBtn');
const videoSendBtn = document.getElementById('videoSendBtn');
const userCountText = document.getElementById('userCountText');
const videoUserCountText = document.getElementById('videoUserCountText');
const attachBtn = document.getElementById('attachBtn');
const attachMenu = document.getElementById('attachMenu');
const sendLocation = document.getElementById('sendLocation');
const sendPhoto = document.getElementById('sendPhoto');
const footerTermsBtn = document.getElementById('footerTermsBtn');
const footerPrivacyBtn = document.getElementById('footerPrivacyBtn');
const footerAboutBtn = document.getElementById('footerAboutBtn');
const sendVideo = document.getElementById('sendVideo');
let remoteVideo = null;
let localVideo = null;
let peerConnection = null;
const messageMenu = document.getElementById('messageMenu');
const deleteMessageBtn = document.getElementById('deleteMessage');
const replyMessage = document.getElementById('replyMessage');
const termsLink = document.getElementById('termsLink');
const privacyLink = document.getElementById('privacyLink');
const backToHome = document.getElementById('backToHome');
const photoInput = document.getElementById('photoInput');
const videoInput = document.getElementById('videoInput');
const interestsInput = document.getElementById('interestsInput');
const connectBtn = document.getElementById('connectBtn');
const videoConnectBtn = document.getElementById('videoConnectBtn');

// Configuration - Use local WebSocket server for Replit environment  
const REPLIT_DOMAIN = window.location.host; // Dynamic domain detection
const WS_SERVERS = [
    // Primary: Use current domain (Replit local server)
    `wss://${window.location.host}`,
    // Fallback: External server if local fails
    `wss://omegle-1-nat9.onrender.com/`
];
let currentServerIndex = 0;
const WS_SERVER_URL = WS_SERVERS[currentServerIndex];
// Enhanced ICE servers configuration for reliable NAT traversal
const ICE_SERVERS = [
    // Multiple STUN servers for better connectivity
    {urls: 'stun:stun.l.google.com:19302'},
    {urls: 'stun:stun1.l.google.com:19302'},
    {urls: 'stun:stun2.l.google.com:19302'},
    // Reliable TURN servers for NAT traversal fallback
    { 
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    { 
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject', 
        credential: 'openrelayproject'
    },
    { 
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    // Additional Google STUN servers for redundancy
    {urls: 'stun:stun3.l.google.com:19302'},
    {urls: 'stun:stun4.l.google.com:19302'}
];

// State variables
let isConnected = false;
let isTyping = false;
let typingTimeout;
let currentChatType = null; // 'text' or 'video'
let selectedMessage = null;
let localStream = null;
let dataChannel = null;
let socket = null;
let reconnectAttempts = 0;
let connectionTimeout = null;
let isInitiator = false;
let iceCandidateQueue = []; // Queue for ICE candidates
let isRemoteDescriptionSet = false;
let peerConnectionTimeout = null; // Timeout for peer connection
let webrtcRetryAttempts = 0; // WebRTC specific retry counter
// Fix 1: Add shouldReconnect flag to track if user is still in active chat
let shouldReconnect = false;
// Fix 5: Add heartbeat/ping system variables
let heartbeatInterval = null;
let lastPingTime = null;
let awaitingPong = false;
// Fix: Add flag to track user-initiated skip operations
let isUserSkipping = false;
// Enhanced skip functionality with debouncing and acknowledgment
let skipDebounceTimeout = null;
let lastSkipTime = 0;
let pendingSkipAcknowledgment = false;
const SKIP_DEBOUNCE_DELAY = 1000; // 1 second between skip attempts
const SKIP_ACKNOWLEDGMENT_TIMEOUT = 5000; // 5 seconds to wait for server acknowledgment
const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_WEBRTC_RETRIES = 3; // Maximum WebRTC connection retry attempts
const CONNECTION_TIMEOUT = 5000; // Reduced from 10 seconds to 5 seconds
const PEER_CONNECTION_TIMEOUT = 7000; // Reduced from 10 seconds to 7 seconds
const HEARTBEAT_INTERVAL = 10000; // Reduced to 10 seconds for better reliability

// Enhanced Debug Logging System
const DebugLogger = {
    userId: Math.random().toString(36).substr(2, 9),

    getTimestamp() {
        return new Date().toISOString().substr(11, 12);
    },

    formatMessage(category, message, data = null) {
        const timestamp = this.getTimestamp();
        const userPrefix = `[${this.userId}]`;
        const baseMessage = `${timestamp} ${userPrefix} ${category} ${message}`;
        return data ? [baseMessage, data] : [baseMessage];
    },

    // 🔵 Connection Events
    connection(message, data = null) {
        console.log(...this.formatMessage('🔵 CONNECTION:', message, data));
    },

    // 🟡 ICE Candidates  
    ice(message, data = null) {
        console.log(...this.formatMessage('🟡 ICE:', message, data));
    },

    // 🟠 Signaling
    signaling(message, data = null) {
        console.log(...this.formatMessage('🟠 SIGNALING:', message, data));
    },

    // 🟥 Errors
    error(message, data = null) {
        console.error(...this.formatMessage('🟥 ERROR:', message, data));
    },

    // ✅ Success Feedback
    success(message, data = null) {
        console.log(...this.formatMessage('✅ SUCCESS:', message, data));
    },

    // 📱 Mobile/UI Events
    ui(message, data = null) {
        console.log(...this.formatMessage('📱 UI:', message, data));
    },

    // 🎥 Video/Media Events
    video(message, data = null) {
        console.log(...this.formatMessage('🎥 VIDEO:', message, data));
    },

    // 🔧 Debug/State Changes
    debug(message, data = null) {
        console.log(...this.formatMessage('🔧 DEBUG:', message, data));
    }
};

// XSS Sanitization function
function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Check media permissions using Permissions API
async function checkMediaPermissions() {
    try {
        if (!navigator.permissions) {
            console.warn('Permissions API not supported');
            return { camera: 'unknown', microphone: 'unknown' };
        }

        const [cameraPermission, microphonePermission] = await Promise.all([
            navigator.permissions.query({ name: 'camera' }).catch(() => ({ state: 'unknown' })),
            navigator.permissions.query({ name: 'microphone' }).catch(() => ({ state: 'unknown' }))
        ]);

        return {
            camera: cameraPermission.state,
            microphone: microphonePermission.state
        };
    } catch (error) {
        console.warn('Error checking permissions:', error);
        return { camera: 'unknown', microphone: 'unknown' };
    }
}

// Enhanced media permission error handling
async function handleMediaPermissionDenied() {
    const permissions = await checkMediaPermissions();

    let message = 'Camera/microphone access is required for video chat.\n\n';
    let feedbackMessage = 'Camera/Microphone Access Blocked';

    if (permissions.camera === 'denied' || permissions.microphone === 'denied') {
        message += 'Permissions have been blocked. To enable:\n';
        message += '1. Click the camera/microphone icon in your browser\'s address bar\n';
        message += '2. Select "Allow" for camera and microphone\n';
        message += '3. Refresh the page and try again\n\n';
        message += 'Or check your browser settings to unblock this site.';
        feedbackMessage = 'Media Permissions Blocked - Check Browser Settings';
    } else {
        message += 'Please allow camera and microphone access when prompted.';
        feedbackMessage = 'Media Access Denied - Allow Permissions When Prompted';
    }

    // Show enhanced user feedback
    showUserFeedback(feedbackMessage, 'error');
    showErrorFeedback('Camera/microphone access denied - check browser permissions');

    // Show detailed alert for critical error
    setTimeout(() => {
        alert(message);
    }, 1000);
}

// Add tap-to-play button overlay for autoplay restrictions
function addTapToPlayButton(videoElement, mode = '') {
    // Check if button already exists
    const existingButton = videoElement.parentNode?.querySelector('.tap-to-play-button');
    if (existingButton) return;

    const button = document.createElement('button');
    button.className = 'tap-to-play-button';
    button.innerHTML = '▶️ Tap to start video';
    button.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
    `;

    button.onmouseover = () => {
        button.style.transform = 'translate(-50%, -50%) scale(1.05)';
        button.style.background = 'rgba(0, 0, 0, 0.9)';
    };
    
    button.onmouseout = () => {
        button.style.transform = 'translate(-50%, -50%) scale(1)';
        button.style.background = 'rgba(0, 0, 0, 0.8)';
    };

    button.onclick = async () => {
        try {
            await videoElement.play();
            button.remove();
            console.log('✅ Video started after user interaction');
            showUserFeedback(`Video playback started! ${mode}`, 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('Failed to start video after tap:', error.name);
                showUserFeedback('Unable to start video playback', 'error');
            }
        }
    };

    // Make video container relative if not already
    if (videoElement.parentNode) {
        const container = videoElement.parentNode;
        const currentPosition = window.getComputedStyle(container).position;
        if (currentPosition === 'static') {
            container.style.position = 'relative';
        }
        container.appendChild(button);
    }
}

// Typing indicator functions
function showTypingIndicator() {
    const typingEl = currentChatType === 'text' ? 
        document.getElementById("typingIndicator") : 
        document.getElementById("videoTypingIndicator");
    
    if (typingEl) {
        typingEl.style.display = "flex";
        // Auto scroll to show typing indicator
        const container = currentChatType === 'text' ? chatMessages : videoChatMessages;
        if (container) {
            scrollToLatestMessage(container, true);
        }
    }

    // Clear any existing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    // Auto-hide after 2 seconds of no typing (improved from 3 seconds)
    typingTimeout = setTimeout(() => {
        hideTypingIndicator();
    }, 2000);
}

function hideTypingIndicator() {
    const typingEl = currentChatType === 'text' ? 
        document.getElementById("typingIndicator") : 
        document.getElementById("videoTypingIndicator");
    
    if (typingEl) {
        typingEl.style.display = "none";
    }
}

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator && 'caches' in window) {
        console.log('Service Worker: Browser supports service workers');

        // Check if service worker file exists before registering
        fetch('/service-worker.js', { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    window.addEventListener('load', () => {
                        navigator.serviceWorker.register('/service-worker.js', {
                            scope: '/'
                        })
                        .then((registration) => {
                            console.log('Service Worker: Registration successful', {
                                scope: registration.scope,
                                updateViaCache: registration.updateViaCache
                            });

                            // Check for updates
                            registration.addEventListener('updatefound', () => {
                                console.log('Service Worker: Update found');
                                const newWorker = registration.installing;

                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        console.log('Service Worker: New version available');
                                        showUserFeedback('App update available! Refresh to get the latest version.', 'info');
                                    }
                                });
                            });

                        })
                        .catch((error) => {
                            console.log('Service Worker: Registration failed', error.message);
                        });
                    });
                } else {
                    console.log('Service Worker: Registration skipped - no service worker file available');
                }
            })
            .catch(() => {
                console.log('Service Worker: Registration skipped - no service worker file available');
            });

    } else {
        console.warn('Service Worker: Not supported in this browser');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    remoteVideo = document.getElementById('remoteVideo');
    localVideo = document.getElementById('localVideo');
    strangerVideoWindow = document.querySelector('.stranger-video');

    // Register service worker first
    registerServiceWorker();

    setupEventListeners();
    showHomePage();
    updateUserCount(0);

    // Apply viewport settings based on device
    if (isDesktopDevice()) {
        ensureDesktopViewport();
    } else {
        ensureMobileViewport();
    }

    // Apply initial device layout for all pages
    applyDeviceLayout();
    applyHomePageLayout();

    // Store initial viewport heights with null checks
    initialViewportHeight = window.innerHeight || 600;
    visualViewportHeight = (window.visualViewport ? window.visualViewport.height : window.innerHeight) || 600;

    console.log('📱 Initial viewport setup:', {
        windowHeight: window.innerHeight,
        visualViewportHeight: visualViewportHeight,
        hasVisualViewport: !!window.visualViewport,
        deviceType: getDeviceType()
    });

    // Enhanced resize handler with debouncing and mobile keyboard detection
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            applyDeviceLayout();
            applyHomePageLayout();

            // Specific handling for video chat
            if (currentChatType === 'video' && videoContainer.style.display === 'flex') {
                adjustVideoLayout();
            }

            // Handle mobile viewport changes (keyboard show/hide)
            handleMobileViewportChange();
        }, 150);
    }, { passive: true });

    // Handle orientation change on mobile devices
    window.addEventListener('orientationchange', () => {
        console.log('📱 Orientation changed');
        setTimeout(() => {
            // Reset viewport heights after orientation change
            initialViewportHeight = window.innerHeight;
            visualViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            keyboardVisible = false;
            isInputFocused = false;
            focusedInput = null;

            console.log('📱 Post-orientation viewport:', {
                windowHeight: window.innerHeight,
                visualViewportHeight: visualViewportHeight
            });

            // Unlock any locked focus states
            unlockInputFocus();

            applyDeviceLayout();
            applyHomePageLayout();
            if (currentChatType === 'video' && videoContainer.style.display === 'flex') {
                adjustVideoLayout();
            }

            // Restore normal layout and scroll
            restoreNormalLayout();

            // Ensure messages stay visible after orientation change
            setTimeout(() => {
                ensureMessageVisibility();
            }, 500);
        }, 300);
    }, { passive: true });

    // Setup mobile-specific input handlers with visual viewport support
    setupMobileInputHandlers();

    // Fix 3: Handle page visibility change - skip reconnect when tab is hidden, reconnect when visible
    document.addEventListener('visibilitychange', () => {
        console.log('Visibility changed:', document.hidden ? 'hidden' : 'visible');

        if (document.hidden) {
            // Page is hidden, pause reconnection attempts
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                connectionTimeout = null;
            }
            // Stop heartbeat when tab is hidden
            stopHeartbeat();
        } else {
            // Page became visible, check if we need to reconnect
            if (shouldReconnect && currentChatType && (!socket || socket.readyState !== WebSocket.OPEN)) {
                console.log('Tab became visible and WebSocket is disconnected, attempting reconnection...');
                // Silent reconnection - no user message shown

                // Reset attempts when coming back from hidden state
                reconnectAttempts = 0;
                connectWebSocket();
            }
        }
    });

    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
        cleanupConnections();
    });
});

// Mobile-first responsive viewport
function ensureMobileViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
    }
    // Mobile-first responsive viewport
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

// Desktop-optimized viewport
function ensureDesktopViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
    }
    // Desktop viewport with zoom capabilities
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=yes');
}

// Enhanced device detection and responsive behavior
function getDeviceType() {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
}

function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isTabletDevice() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function isDesktopDevice() {
    return window.innerWidth > 1024 && !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function applyDeviceLayout() {
    const videoContainer = document.getElementById('videoContainer');
    const videoSection = document.querySelector('.video-section');
    const chatSection = document.querySelector('.chat-section');
    const body = document.body;

    // Null checks to prevent errors
    if (!body) {
        console.warn('Document body not found during layout application');
        return;
    }

    // Remove all existing device classes
    const deviceClasses = ['mobile-layout', 'tablet-layout', 'desktop-layout', 
                          'mobile-video-section', 'tablet-video-section', 'desktop-video-section',
                          'mobile-chat-section', 'tablet-chat-section', 'desktop-chat-section'];

    deviceClasses.forEach(className => {
        if (videoContainer && videoContainer.classList) {
            videoContainer.classList.remove(className);
        }
        if (videoSection && videoSection.classList) {
            videoSection.classList.remove(className);
        }
        if (chatSection && chatSection.classList) {
            chatSection.classList.remove(className);
        }
        if (body && body.classList) {
            body.classList.remove(className);
        }
    });

    // Get actual device type
    const deviceType = getDeviceType();

    // Apply appropriate layout classes with null checks
    if (videoContainer && videoContainer.classList) {
        videoContainer.classList.add(`${deviceType}-layout`);
    }
    if (videoSection && videoSection.classList) {
        videoSection.classList.add(`${deviceType}-video-section`);
    }
    if (chatSection && chatSection.classList) {
        chatSection.classList.add(`${deviceType}-chat-section`);
    }
    if (body && body.classList) {
        body.classList.add(`${deviceType}-layout`);
    }

    // Desktop-specific optimizations
    if (isDesktopDevice()) {
        applyDesktopOptimizations();
    }

    // Adjust video chat layout for better responsive behavior
    if (currentChatType === 'video' && videoContainer && videoContainer.style && videoContainer.style.display === 'flex') {
        adjustVideoLayout();
    }
}

function applyDesktopOptimizations() {
    // Desktop-specific optimizations
    const chatMessages = document.getElementById('chatMessages');
    const videoChatMessages = document.getElementById('videoChatMessages');
    const messageInput = document.getElementById('messageInput');
    const videoMessageInput = document.getElementById('videoMessageInput');

    // Optimize chat containers for desktop
    if (chatMessages) {
        chatMessages.style.maxHeight = 'calc(100vh - 140px)';
        chatMessages.style.overflowY = 'auto';
        chatMessages.style.scrollBehavior = 'smooth';
    }

    if (videoChatMessages) {
        videoChatMessages.style.maxHeight = 'calc(100vh - 180px)';
        videoChatMessages.style.overflowY = 'auto';
        videoChatMessages.style.scrollBehavior = 'smooth';
    }

    // Enhance input fields for desktop
    if (messageInput) {
        messageInput.setAttribute('autocomplete', 'off');
        messageInput.setAttribute('spellcheck', 'true');
    }

    if (videoMessageInput) {
        videoMessageInput.setAttribute('autocomplete', 'off');
        videoMessageInput.setAttribute('spellcheck', 'true');
    }

    console.log('Desktop optimizations applied');
}

function adjustVideoLayout() {
    const videoSection = document.querySelector('.video-section');
    const chatSection = document.querySelector('.chat-section');
    const userVideo = document.querySelector('.user-video');
    const floatingVideo = document.querySelector('.local-video-float');
    const localVideo = document.getElementById('localVideo');
    const strangerVideoContainer = document.querySelector('.stranger-video');

    if (!videoSection || !chatSection) {
        console.warn('Video layout elements not found');
        return;
    }

    if (isMobileDevice()) {
        // Mobile layout - local video floats inside stranger video container
        if (localVideo && strangerVideoContainer && !strangerVideoContainer.contains(localVideo)) {
            strangerVideoContainer.appendChild(localVideo);
        }

        // Ensure mobile floating styles are applied
        if (localVideo) {
            localVideo.style.position = 'absolute';
            localVideo.style.top = '10px';
            localVideo.style.right = '10px';
            localVideo.style.width = '90px';
            localVideo.style.height = '70px';
            localVideo.style.zIndex = '10';
            localVideo.style.borderRadius = '8px';
            localVideo.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
            localVideo.style.objectFit = 'cover';
            localVideo.style.display = 'block';
            localVideo.style.opacity = '1';
            localVideo.style.visibility = 'visible';
            localVideo.style.border = '2px solid white';
            localVideo.style.backgroundColor = '#2a2a2a';
        }

        // Hide the separate floating video container on mobile
        if (floatingVideo && floatingVideo.style) {
            floatingVideo.style.display = 'none';
        }
    } else if (isDesktopDevice()) {
        // Enhanced desktop layout
        if (videoSection && videoSection.style) {
            videoSection.style.width = '500px';
            videoSection.style.minWidth = '500px';
            videoSection.style.height = 'calc(100vh - 100px)';
            videoSection.style.background = '#f8f9fa';
            videoSection.style.borderRadius = '15px';
            videoSection.style.padding = '15px';
            videoSection.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        }

        if (chatSection && chatSection.style) {
            chatSection.style.flex = '1';
            chatSection.style.minWidth = '400px';
            chatSection.style.background = 'white';
            chatSection.style.borderRadius = '15px';
            chatSection.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
            chatSection.style.border = '1px solid #e9ecef';
            chatSection.style.borderLeft = '1px solid #e9ecef';
        }

        // Reset local video positioning for desktop
        if (localVideo && localVideo.style) {
            localVideo.style.position = 'static';
            localVideo.style.width = '100%';
            localVideo.style.height = '100%';
            localVideo.style.top = 'auto';
            localVideo.style.right = 'auto';
            localVideo.style.zIndex = 'auto';
            localVideo.style.border = 'none';
            localVideo.style.borderRadius = '0';
            localVideo.style.boxShadow = 'none';
        }

        // Move local video back to user video container on desktop
        if (localVideo && userVideo && !userVideo.contains(localVideo)) {
            userVideo.appendChild(localVideo);
        }

        // Ensure floating video is hidden on desktop
        if (floatingVideo && floatingVideo.style) {
            floatingVideo.style.display = 'none';
        }

        console.log('Desktop video layout applied');
    } else {
        // Tablet layout: fallback to original mobile behavior
        const videoWidth = '450px';
        if (videoSection && videoSection.style) {
            videoSection.style.width = videoWidth;
            videoSection.style.height = 'calc(100vh - 60px)';
        }
        if (chatSection && chatSection.style) {
            chatSection.style.width = `calc(100% - ${videoWidth})`;
            chatSection.style.height = 'calc(100vh - 60px)';
            chatSection.style.borderLeft = '1px solid #ddd';
            chatSection.style.borderTop = 'none';
        }

        // Reset user video positioning for tablet
        if (userVideo && userVideo.style) {
            userVideo.style.position = 'relative';
            userVideo.style.width = '100%';
            userVideo.style.height = 'calc(45vh - 60px)';
            userVideo.style.top = 'auto';
            userVideo.style.right = 'auto';
            userVideo.style.zIndex = 'auto';
        }

        // Move local video back to user video container on tablet
        if (localVideo && userVideo && !userVideo.contains(localVideo)) {
            userVideo.appendChild(localVideo);
        }

        // Ensure floating video is hidden on tablet
        if (floatingVideo && floatingVideo.style) {
            floatingVideo.style.display = 'none';
        }
    }
}

function applyHomePageLayout() {
    const homePage = document.getElementById('homePage');

    if (!homePage) return;

    // Remove all existing home page device classes
    const homePageClasses = ['home-mobile-layout', 'home-tablet-layout', 'home-desktop-layout'];
    homePageClasses.forEach(className => {
        if (homePage.classList) {
            homePage.classList.remove(className);
        }
    });

    // Apply responsive layout based on device
    const deviceType = getDeviceType();
    if (homePage.classList) {
        homePage.classList.add(`home-${deviceType}-layout`);
    }
}

// UI Functions
function showHomePage() {
    // Fix 1: Reset shouldReconnect when going back to home page
    shouldReconnect = false;
    homePage.style.display = 'block';
    homeScreen.style.display = 'none';
    chatContainer.style.display = 'none';
    videoContainer.style.display = 'none';
    cleanupConnections(true); // Full cleanup when going home
}

function showChatSelection() {
    // Fix 1: Reset shouldReconnect when going to chat selection
    shouldReconnect = false;
    homePage.style.display = 'none';
    homeScreen.style.display = 'flex';
    chatContainer.style.display = 'none';
    videoContainer.style.display = 'none';
    cleanupConnections(true); // Full cleanup when going to chat selection
}

function showTermsModal() {
    termsModal.style.display = 'flex';
}

function hideTermsModal() {
    termsModal.style.display = 'none';
}

// Fix 5: Heartbeat/ping system to keep WebSocket alive
function startHeartbeat() {
    // Clear any existing heartbeat
    stopHeartbeat();

    DebugLogger.connection('Starting WebSocket heartbeat system', { intervalMs: HEARTBEAT_INTERVAL });
    heartbeatInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            if (awaitingPong) {
                DebugLogger.error('Heartbeat timeout - previous ping did not receive pong');
                // Connection might be dead, trigger reconnection
                handleConnectionError('Heartbeat failed - connection timeout');
                return;
            }

            lastPingTime = Date.now();
            awaitingPong = true;

            DebugLogger.connection('Sending heartbeat ping', { timestamp: lastPingTime });

            try {
                socket.send(JSON.stringify({
                    type: 'ping',
                    timestamp: lastPingTime
                }));
            } catch (error) {
                DebugLogger.error('Failed to send heartbeat ping', error);
                handleConnectionError('Failed to send heartbeat ping');
            }
        } else {
            DebugLogger.connection('WebSocket not open, stopping heartbeat');
            stopHeartbeat();
        }
    }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        DebugLogger.connection('Stopping WebSocket heartbeat system');
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    awaitingPong = false;
    lastPingTime = null;
}

function handlePongResponse(data) {
    awaitingPong = false;
    const roundTripTime = Date.now() - (data.timestamp || lastPingTime || Date.now());
    DebugLogger.success(`Heartbeat pong received`, { rttMs: roundTripTime });
}

// Enhanced cleanup with comprehensive video element management and debugging
function cleanupConnections(fullCleanup = false) {
    DebugLogger.debug('Starting connection cleanup process', { fullCleanup });

    // Fix 1: Set shouldReconnect to false when cleaning up
    shouldReconnect = false;

    // Fix 5: Stop heartbeat when cleaning up
    stopHeartbeat();

    // Clean up error state manager
    errorStateManager.cleanup();

    // Remove mobile body class with null check (only on full cleanup)
    if (fullCleanup && document.body) {
        document.body.classList.remove('mobile-video-active');
        console.log('✅ Removed mobile-video-active class from body');
    }

    // Clear all timeouts with detailed logging
    const timeoutsCleared = [];
    if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
        timeoutsCleared.push('connectionTimeout');
    }
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
        timeoutsCleared.push('typingTimeout');
    }
    if (peerConnectionTimeout) {
        clearTimeout(peerConnectionTimeout);
        peerConnectionTimeout = null;
        timeoutsCleared.push('peerConnectionTimeout');
    }
    if (timeoutsCleared.length > 0) {
        console.log('✅ Cleared timeouts:', timeoutsCleared);
    }

    // Reset layout classes with comprehensive null checks (only on full cleanup)
    if (fullCleanup) {
        try {
            const layoutClassesRemoved = [];
            if (videoContainer) {
                const containerClasses = ['mobile-layout', 'desktop-layout', 'tablet-layout'];
                containerClasses.forEach(cls => {
                    if (videoContainer.classList.contains(cls)) {
                        videoContainer.classList.remove(cls);
                        layoutClassesRemoved.push(`videoContainer.${cls}`);
                    }
                });
            }
            const videoSection = document.querySelector('.video-section');
            if (videoSection) {
                const sectionClasses = ['mobile-video-section', 'desktop-video-section', 'tablet-video-section'];
                sectionClasses.forEach(cls => {
                    if (videoSection.classList.contains(cls)) {
                        videoSection.classList.remove(cls);
                        layoutClassesRemoved.push(`videoSection.${cls}`);
                    }
                });
            }
            const chatSection = document.querySelector('.chat-section');
            if (chatSection) {
                const chatClasses = ['mobile-chat-section', 'desktop-chat-section', 'tablet-chat-section'];
                chatClasses.forEach(cls => {
                    if (chatSection.classList.contains(cls)) {
                        chatSection.classList.remove(cls);
                        layoutClassesRemoved.push(`chatSection.${cls}`);
                    }
                });
            }
            if (layoutClassesRemoved.length > 0) {
                console.log('✅ Reset layout classes:', layoutClassesRemoved);
            }
        } catch (error) {
            console.error('❌ Error resetting layout classes:', error);
        }
    }

    // Stop NSFW monitoring with error handling (only on full cleanup)
    if (fullCleanup) {
        try {
            if (typeof clientNSFWDetector !== 'undefined' && clientNSFWDetector) {
                clientNSFWDetector.stopMonitoring();
                console.log('✅ NSFW monitoring stopped');
            }
        } catch (error) {
            console.error('❌ Error stopping NSFW monitoring:', error);
        }
    }

    // Perform video cleanup (full or partial based on context)
    if (fullCleanup) {
        performVideoCleanup('full_cleanup');
        cleanupWebRTCConnection('full_cleanup');
    } else {
        // Partial cleanup - preserve local stream
        stopPeerConnection();
        cleanupRemoteVideo();
    }

    // Reset state variables with logging
    const stateReset = {
        isConnected: isConnected,
        isInitiator: isInitiator,
        reconnectAttempts: reconnectAttempts,
        webrtcRetryAttempts: webrtcRetryAttempts,
        iceCandidateQueueLength: iceCandidateQueue.length,
        isRemoteDescriptionSet: isRemoteDescriptionSet
    };

    isConnected = false;
    isInitiator = false;
    reconnectAttempts = 0;
    webrtcRetryAttempts = 0;
    iceCandidateQueue = [];
    isRemoteDescriptionSet = false;

    console.log('✅ State variables reset:', stateReset);

    disconnect();
    console.log('🏁 Cleanup completed (full:', fullCleanup, ')');
}

function startTextChat() {
    currentChatType = 'text';
    // Fix 1: Set shouldReconnect to true when starting chat
    shouldReconnect = true;
    homePage.style.display = 'none';
    homeScreen.style.display = 'none';
    chatContainer.style.display = 'flex';
    videoContainer.style.display = 'none';

    if (messageInput) messageInput.focus();
    if (chatMessages) chatMessages.innerHTML = '';

    addSystemMessage("Looking for people online");
    setAttachButtonEnabled(false);
    connectWebSocket();
}

async function startVideoChat() {
    console.log('🎥 Starting video chat...');
    currentChatType = 'video';
    // Fix 1: Set shouldReconnect to true when starting video chat
    shouldReconnect = true;
    homePage.style.display = 'none';
    homeScreen.style.display = 'none';
    chatContainer.style.display = 'none';
    videoContainer.style.display = 'flex';

    // Add mobile body class to prevent scrolling
    if (isMobileDevice()) {
        document.body.classList.add('mobile-video-active');
    }

    applyDeviceLayout();

    if (videoChatMessages) videoChatMessages.innerHTML = '';
    addVideoSystemMessage("Looking for people online");

    // Setup connecting circle - show it initially
    if (connectingCircle) {
        connectingCircle.style.display = 'block';
        console.log('✅ Connecting circle displayed');
    }

    strangerVideoWindow.classList.add('connecting'); // Loader ON

    try {
        console.log('🔍 Checking for existing media stream...');

        // Check if we already have an active local stream
        if (localStream && localStream.active) {
            console.log('✅ Reusing existing local stream');

            // Ensure local video is connected to the existing stream
            if (localVideo) {
                localVideo.srcObject = localStream;

                // Ensure proper mobile positioning
                if (isMobileDevice()) {
                    const strangerVideoContainer = document.querySelector('.stranger-video');
                    if (strangerVideoContainer && localVideo && !strangerVideoContainer.contains(localVideo)) {
                        strangerVideoContainer.appendChild(localVideo);
                        console.log('✅ Local video positioned for mobile');
                    }

                    // Apply mobile floating styles
                    if (localVideo) {
                        localVideo.style.position = 'absolute';
                        localVideo.style.top = '10px';
                        localVideo.style.right = '10px';
                        localVideo.style.width = '90px';
                        localVideo.style.height = '70px';
                        localVideo.style.zIndex = '10';
                        localVideo.style.borderRadius = '8px';
                        localVideo.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
                        localVideo.style.objectFit = 'cover';
                        localVideo.style.display = 'block';
                        localVideo.style.opacity = '1';
                        localVideo.style.visibility = 'visible';
                        localVideo.style.border = '2px solid white';
                        localVideo.style.backgroundColor = '#2a2a2a';
                    }
                }

                // Ensure video is playing
                if (localVideo.paused) {
                    localVideo.play().catch(e => {
                        console.warn('Local video autoplay issue:', e);
                    });
                }
            }

            console.log('✅ Local stream ready, connecting to WebSocket...');
            connectWebSocket();
        } else {
            console.log('🎥 Requesting new media permissions...');
            const hasMedia = await requestMediaPermissions();
            if (hasMedia) {
                console.log('✅ Media permissions granted, connecting to WebSocket...');
                connectWebSocket();
            } else {
                throw new Error('permissions denied');
            }
        }
    } catch (error) {
        console.error('❌ Video chat initialization failed:', error);
        addVideoSystemMessage("Please check your camera/microphone permissions");

        // Handle permission denied specifically
        await handleMediaPermissionDenied();

        // Give user option to try again
        setTimeout(() => {
            const tryAgainBtn = document.createElement('button');
            tryAgainBtn.textContent = 'Try Again';
            tryAgainBtn.style.margin = '10px';
            tryAgainBtn.style.padding = '8px 16px';
            tryAgainBtn.style.backgroundColor = '#4a90e2';
            tryAgainBtn.style.color = 'white';
            tryAgainBtn.style.border = 'none';
            tryAgainBtn.style.borderRadius = '4px';
            tryAgainBtn.style.cursor = 'pointer';

            tryAgainBtn.onclick = () => {
                startVideoChat();
            };

            if (videoChatMessages) {
                const msgDiv = document.createElement('div');
                msgDiv.appendChild(tryAgainBtn);
                videoChatMessages.appendChild(msgDiv);
            }
        }, 2000);
    }
}

// WebSocket Functions
function connectWebSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.log('WebSocket already connected or connecting');
        return;
    }

    const currentServer = WS_SERVERS[currentServerIndex];
    console.log(`Connecting to WebSocket server ${currentServerIndex + 1}/${WS_SERVERS.length}: ${currentServer}`);

    try {
        socket = new WebSocket(currentServer);

        // Clear any existing timeout
        errorStateManager.clearTimeoutAlert('websocket');

        // Set connection timeout using new system
        timeoutAlert('websocket', CONNECTION_TIMEOUT, 
            'WebSocket connection timed out. Please check your internet connection.',
            () => connectWebSocket()
        );

        socket.onopen = () => {
            DebugLogger.connection('WebSocket connection established');

            // Clear timeout on successful connection
            errorStateManager.clearTimeoutAlert('websocket');

            reconnectAttempts = 0;

            // Remove any reconnecting overlay (disabled)

            // Fix 5: Start heartbeat system when connection opens
            startHeartbeat();

            if (socket.readyState === WebSocket.OPEN) {
                const interests = interestsInput ? interestsInput.value.split(',').map(i => i.trim()).filter(i => i) : [];

                DebugLogger.signaling('Sending join request', { chatType: currentChatType, interests });
                socket.send(JSON.stringify({
                    type: 'join',
                    chatType: currentChatType,
                    interests: interests
                }));
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        socket.onclose = (event) => {
            DebugLogger.connection('WebSocket connection closed', { code: event.code, reason: event.reason, server: currentServer });

            // Clear timeout
            errorStateManager.clearTimeoutAlert('websocket');

            // Fix 5: Stop heartbeat when connection closes
            stopHeartbeat();

            isConnected = false;
            updateConnectionStatus(false);

            // Try next server if current one failed
            if (event.code === 1006 && currentServerIndex < WS_SERVERS.length - 1) {
                currentServerIndex++;
                DebugLogger.connection(`Trying next WebSocket server: ${WS_SERVERS[currentServerIndex]}`);

                setTimeout(() => {
                    if (shouldReconnect && currentChatType) connectWebSocket();
                }, 1000);
                return;
            }

            // Reset to first server after trying all
            if (currentServerIndex >= WS_SERVERS.length - 1) {
                currentServerIndex = 0;
            }

            // Fix 1 & 3: Only attempt reconnection if shouldReconnect is true, we're in chat, haven't exceeded max attempts, and tab is visible
            if (shouldReconnect && currentChatType && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !document.hidden) {
                reconnectAttempts++;
                // Fixed retry interval of 2 seconds instead of exponential backoff for faster reconnection
                const delay = 2000;

                DebugLogger.connection(`Scheduling reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`, { delayMs: delay, strategy: 'fixed_interval' });

                connectionTimeout = setTimeout(() => {
                    if (shouldReconnect && currentChatType) connectWebSocket();
                }, delay);
            } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && shouldReconnect) {
                DebugLogger.error('Maximum reconnection attempts reached on all servers');
                // Show critical error overlay with retry options
                errorStateManager.showCriticalError({
                    title: 'Connection Failed',
                    message: 'Unable to connect to any server after multiple attempts. Please check your internet connection and try again.',
                    type: 'connection',
                    onRetry: () => {
                        reconnectAttempts = 0;
                        currentServerIndex = 0;
                        connectWebSocket();
                    },
                    onGoBack: () => {
                        cleanupConnections();
                        showHomePage();
                    }
                });
            }
        };

        socket.onerror = (error) => {
            // Enhanced error logging with detailed information
            DebugLogger.error('WebSocket connection error:', {
                errorName: error.name || 'Unknown',
                errorMessage: error.message || 'No message',
                errorType: error.type || 'Unknown type',
                serverUrl: currentServer,
                readyState: socket?.readyState,
                timestamp: new Date().toISOString()
            });
            console.error('WebSocket error details:', error.name, error.message, error.stack);
            
            // Development mode fallback
            if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
                console.log('Development mode detected - WebSocket connections may not work locally');
                addSystemMessage('Demo mode: WebSocket features disabled in development');
            }
        };

    } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        handleConnectionError('Failed to connect to server');
    }
}

function handleConnectionError(message) {
    console.error('Connection error:', message);

    if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
    }

    // Don't show generic connection error messages to user
    // Only show specific meaningful messages
    if (message && !message.includes('Connection error occurred')) {
        currentChatType === 'text' 
            ? addSystemMessage(message)
            : addVideoSystemMessage(message);
    }

    setConnectButtonDisabled(false);
}

function handleWebSocketMessage(data) {
    if (!data || typeof data.type !== 'string') {
        console.warn('Invalid WebSocket message:', data);
        return;
    }

    switch (data.type) {
        case 'stranger_connected':
            handleStrangerConnected(data);
            break;
        case 'waiting':
            setConnectButtonDisabled(false);
            const waitMessage = data.message || "Looking for people online";
            currentChatType === 'text' 
                ? addSystemMessage(waitMessage)
                : addVideoSystemMessage(waitMessage);

            // Add connecting animation for video chat
            if (currentChatType === 'video') {
                const strangerVideo = document.querySelector('.stranger-video');
                const connectingCircle = document.getElementById('connectingCircle');
                
                if (strangerVideo) {
                    strangerVideo.classList.add('connecting');
                }
                
                if (connectingCircle) {
                    connectingCircle.classList.remove('hidden');
                    connectingCircle.style.display = 'block';
                }
            }
            break;
        case 'message':
            handleReceivedMessage(data);
            break;
        case 'media':
            handleReceivedMedia(data);
            break;
        case 'typing':
            handleTypingIndicator(data);
            break;
        case 'stranger_disconnected':
            handleStrangerDisconnected();
            break;
        case 'user_count':
            updateUserCount(data.count || 0);
            break;
        case 'webrtc_offer':
            handleWebRTCOffer(data);
            break;
        case 'webrtc_answer':
            handleWebRTCAnswer(data);
            break;
        case 'webrtc_ice_candidate':
            handleWebRTCIceCandidate(data);
            break;
        case 'nsfw_warning':
            handleNSFWWarning(data);
            break;
        case 'partner_video_blocked':
            handlePartnerVideoBlocked(data);
            break;
        case 'pong':
            // Fix 5: Handle pong response from server
            handlePongResponse(data);
            break;
        case 'skip_acknowledged':
            handleSkipAcknowledgment(data);
            break;
        case 'media_validation_error':
            handleMediaValidationError(data);
            break;
        case 'error':
            console.error('Server error:', data.message);
            const errorMessage = data.message || 'Server error occurred';
            currentChatType === 'text' 
                ? addSystemMessage(errorMessage)
                : addVideoSystemMessage(errorMessage);
            break;
        default:
            console.warn('Unknown message type:', data.type);
    }
}

// Message Handling with XSS protection
function sendMessage() {
    const message = messageInput?.value?.trim();
    if (!message || !isConnected || !socket || socket.readyState !== WebSocket.OPEN) return;

    // Sanitize input before sending
    const sanitizedMessage = sanitizeInput(message);
    addUserMessage(sanitizedMessage);

    try {
        socket.send(JSON.stringify({
            type: 'message',
            message: sanitizedMessage
        }));
    } catch (error) {
        console.error('Error sending message:', error);
        addSystemMessage('Failed to send message');
    }

    messageInput.value = '';
    
    // Stop typing indicator immediately when message is sent
    isTyping = false;
    sendTypingStatus(false);

    // Ensure message visibility after sending on mobile
    setTimeout(() => {
        if (chatMessages) {
            scrollToLatestMessage(chatMessages, true);
        }
    }, 100);
}

function sendVideoMessage() {
    const message = videoMessageInput?.value?.trim();
    if (!message || !isConnected || !socket || socket.readyState !== WebSocket.OPEN) return;

    // Sanitize input before sending
    const sanitizedMessage = sanitizeInput(message);
    addVideoUserMessage(sanitizedMessage);

    try {
        socket.send(JSON.stringify({
            type: 'message',
            message: sanitizedMessage
        }));
    } catch (error) {
        console.error('Error sending video message:', error);
        addVideoSystemMessage('Failed to send message');
    }

    videoMessageInput.value = '';
    
    // Stop typing indicator immediately when message is sent
    sendTypingStatus(false);

    // Ensure message visibility after sending on mobile
    setTimeout(() => {
        if (videoChatMessages) {
            scrollToLatestMessage(videoChatMessages, true);
        }
    }, 100);
}

// Message Display Functions with XSS protection
function addUserMessage(message) {
    addMessage(chatMessages, message, 'user-message');
}

function addStrangerMessage(message) {
    addMessage(chatMessages, message, 'stranger-message');
}

function addSystemMessage(message) {
    const el = addMessage(chatMessages, message, 'system-message');
    if (!el) return null;
    
    // Auto-delete system messages after 10 seconds
    setTimeout(() => {
        if (!el.parentElement) return; // Already removed
        el.classList.add('fade-out');
        setTimeout(() => {
            if (el.parentElement) {
                el.remove();
            }
        }, 300); // Fade out duration
    }, 10000); // 10 seconds delay
    
    return el;
}

function addVideoUserMessage(message) {
    addMessage(videoChatMessages, message, 'user-message');
}

function addVideoStrangerMessage(message) {
    addMessage(videoChatMessages, message, 'stranger-message');
}

// List of video success messages that should auto-disappear
const TRANSIENT_VIDEO_SUCCESS = [
    'Video call connected successfully!',
    '✅ Remote video connected successfully!'
];

function addVideoSystemMessage(message, options = {}) {
    const el = addMessage(videoChatMessages, message, 'system-message');
    if (!el) return null;
    
    // Auto-delete ALL system messages after 10 seconds (unless explicitly disabled)
    if (options.autoDismiss !== false) {
        setTimeout(() => {
            if (!el.parentElement) return; // Already removed
            el.classList.add('fade-out');
            setTimeout(() => {
                if (el.parentElement) {
                    el.remove();
                }
            }, 300); // Fade out duration
        }, 10000); // 10 seconds delay
    }
    
    return el;
}

// Message interaction handlers
let longPressTimer = null;
let isLongPressing = false;
let swipeStartX = null;
let swipeStartY = null;
let selectedMessageForReply = null;

function addMessage(container, message, className) {
    if (!container || !message) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    // Use textContent to prevent XSS
    messageDiv.textContent = message;
    
    // Add gesture support for user and stranger messages (not system messages)
    if (className !== 'system-message') {
        addMessageGestureSupport(messageDiv, message, className);
    }
    
    container.appendChild(messageDiv);

    // Enhanced mobile-responsive auto-scroll
    scrollToLatestMessage(container);
    return messageDiv;
}

// Media context menu functionality
function showMediaContextMenu(event, fileURL, fileName, mediaType, messageElement) {
    // Remove any existing context menus
    const existingMenu = document.querySelector('.media-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'media-context-menu';
    menu.innerHTML = `
        <div class="context-menu-item" data-action="download">
            <i class="fas fa-download"></i> Download
        </div>
        <div class="context-menu-item" data-action="delete">
            <i class="fas fa-trash"></i> Delete
        </div>
    `;
    
    // Position the menu
    const rect = event.target.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;
    menu.style.zIndex = '10000';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ddd';
    menu.style.borderRadius = '8px';
    menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    menu.style.padding = '4px 0';
    menu.style.minWidth = '120px';
    menu.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    document.body.appendChild(menu);
    
    // Handle menu clicks
    menu.addEventListener('click', (e) => {
        const action = e.target.closest('.context-menu-item')?.dataset.action;
        if (action === 'download') {
            showDownloadQualityMenu(event, fileURL, fileName, mediaType);
        } else if (action === 'delete') {
            deleteMediaMessage(messageElement);
        }
        menu.remove();
    });
    
    // Remove menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function menuClickHandler(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', menuClickHandler);
            }
        });
    }, 100);
    
    console.log('📱 Media context menu shown for:', fileName);
}

function showDownloadQualityMenu(event, fileURL, fileName, mediaType) {
    // For videos, download directly without quality options
    if (mediaType === 'video') {
        downloadMediaWithQuality(fileURL, fileName, mediaType, 'original');
        return;
    }
    
    // Remove any existing quality menus
    const existingMenu = document.querySelector('.download-quality-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'download-quality-menu';
    menu.innerHTML = `
        <div class="context-menu-item" data-quality="original">
            <i class="fas fa-star"></i> Original Quality
        </div>
        <div class="context-menu-item" data-quality="medium">
            <i class="fas fa-adjust"></i> Medium Quality
        </div>
        <div class="context-menu-item" data-quality="low">
            <i class="fas fa-compress"></i> Low Quality
        </div>
    `;
    
    // Position the menu
    const rect = event.target.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left + 130}px`; // Offset to the right
    menu.style.zIndex = '10001';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ddd';
    menu.style.borderRadius = '8px';
    menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    menu.style.padding = '4px 0';
    menu.style.minWidth = '140px';
    menu.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    document.body.appendChild(menu);
    
    // Handle quality selection
    menu.addEventListener('click', (e) => {
        const quality = e.target.closest('.context-menu-item')?.dataset.quality;
        if (quality) {
            downloadMediaWithQuality(fileURL, fileName, mediaType, quality);
        }
        menu.remove();
    });
    
    // Remove menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function qualityMenuClickHandler(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', qualityMenuClickHandler);
            }
        });
    }, 100);
}

async function downloadMediaWithQuality(fileURL, fileName, mediaType, quality) {
    try {
        let processedDataURL = fileURL;
        let downloadFileName = fileName;
        
        // Apply quality processing for images
        if (mediaType === 'image' && quality !== 'original') {
            processedDataURL = await resizeImageForDownload(fileURL, quality);
            const extension = fileName.split('.').pop();
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
            downloadFileName = `${nameWithoutExt}_${quality}.${extension}`;
        } else if (quality !== 'original') {
            // For videos, add quality suffix to filename
            const extension = fileName.split('.').pop();
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
            downloadFileName = `${nameWithoutExt}_${quality}.${extension}`;
        }
        
        // Create download link
        const link = document.createElement('a');
        link.href = processedDataURL;
        link.download = downloadFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`📥 Downloaded ${downloadFileName} in ${quality} quality`);
        showUserFeedback(`Downloaded ${downloadFileName}`, 'success');
        setTimeout(hideUserFeedback, 2000);
        
    } catch (error) {
        console.error('Error downloading media:', error);
        showUserFeedback('Failed to download media', 'error');
        setTimeout(hideUserFeedback, 3000);
    }
}

async function resizeImageForDownload(dataURL, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let { width, height } = img;
            
            // Apply quality scaling
            if (quality === 'medium') {
                width *= 0.7;
                height *= 0.7;
            } else if (quality === 'low') {
                width *= 0.4;
                height *= 0.4;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Apply quality compression
            const compressionQuality = quality === 'medium' ? 0.8 : quality === 'low' ? 0.6 : 0.9;
            const resizedDataURL = canvas.toDataURL('image/jpeg', compressionQuality);
            
            resolve(resizedDataURL);
        };
        img.onerror = reject;
        img.src = dataURL;
    });
}

function deleteMediaMessage(messageElement) {
    if (confirm('Are you sure you want to delete this media message?')) {
        messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, 300);
        
        console.log('🗑️ Media message deleted');
    }
}

function addMessageGestureSupport(messageEl, message, type) {
    // Long-press for context menu
    messageEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Only left click
        startLongPress(messageEl, e, message, type);
    });
    
    // Right-click context menu support (Desktop)
    messageEl.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Prevent default browser context menu
        showMessageContextMenu(messageEl, e, message, type);
    });
    
    messageEl.addEventListener('touchstart', (e) => {
        startLongPress(messageEl, e, message, type);
        // Store swipe start position
        const touch = e.touches[0];
        swipeStartX = touch.clientX;
        swipeStartY = touch.clientY;
    });
    
    // Touch move for swipe detection
    messageEl.addEventListener('touchmove', (e) => {
        if (!swipeStartX || isLongPressing) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - swipeStartX;
        const deltaY = touch.clientY - swipeStartY;
        
        // Check if it's a horizontal swipe (more horizontal than vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            cancelLongPress();
            if (deltaX > 0) { // Swipe right
                handleMessageReply(messageEl, message, type);
            }
        }
    });
    
    // End events
    const endEvents = ['mouseup', 'mouseleave', 'touchend', 'touchcancel'];
    endEvents.forEach(event => {
        messageEl.addEventListener(event, () => {
            cancelLongPress();
            swipeStartX = null;
            swipeStartY = null;
        });
    });
}

function startLongPress(messageEl, event, message, type) {
    if (isLongPressing) return;
    
    longPressTimer = setTimeout(() => {
        isLongPressing = true;
        showMessageContextMenu(messageEl, event, message, type);
    }, 800); // 800ms for long press
}

function cancelLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    isLongPressing = false;
}

function showMessageContextMenu(messageEl, event, message, type) {
    // Remove any existing context menus
    const existingMenu = document.querySelector('.message-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'message-context-menu';
    menu.innerHTML = `
        <div class="context-menu-item" data-action="reply">
            <i class="fas fa-reply"></i> Reply
        </div>
        <div class="context-menu-item" data-action="delete">
            <i class="fas fa-trash"></i> Delete
        </div>
    `;
    
    // Position the menu
    const rect = messageEl.getBoundingClientRect();
    const menuHeight = 80; // Approximate height of menu with 2 items
    let top = rect.top - menuHeight - 10;
    let left = rect.left;
    
    // Ensure menu stays within viewport
    if (top < 10) {
        top = rect.bottom + 10;
    }
    if (left + 150 > window.innerWidth) {
        left = window.innerWidth - 160;
    }
    if (left < 10) {
        left = 10;
    }
    
    menu.style.position = 'fixed';
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.style.zIndex = '10000';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ddd';
    menu.style.borderRadius = '8px';
    menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    menu.style.padding = '4px 0';
    menu.style.minWidth = '140px';
    menu.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    document.body.appendChild(menu);
    
    // Handle menu clicks
    menu.addEventListener('click', (e) => {
        const action = e.target.closest('.context-menu-item')?.dataset.action;
        if (action === 'delete') {
            deleteMessage(messageEl);
        } else if (action === 'reply') {
            handleMessageReply(messageEl, message, type);
        }
        menu.remove();
    });
    
    // Remove menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function menuClickHandler(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', menuClickHandler);
            }
        });
    }, 100);
    
    console.log('📱 Message context menu shown with Reply and Delete options');
}

function deleteMessage(messageEl) {
    messageEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    messageEl.style.opacity = '0';
    messageEl.style.transform = 'translateX(-100%)';
    
    setTimeout(() => {
        if (messageEl.parentElement) {
            messageEl.remove();
        }
    }, 300);
    
    console.log('🗑️ Message deleted');
}

function handleMessageReply(messageEl, message, type) {
    selectedMessageForReply = message;
    
    // Get the appropriate input element
    const inputElement = currentChatType === 'video' ? videoMessageInput : messageInput;
    if (!inputElement) return;
    
    // Set reply prefix
    const replyPrefix = `> ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}\n`;
    inputElement.value = replyPrefix;
    inputElement.focus();
    
    // Visual feedback
    messageEl.style.backgroundColor = '#e3f2fd';
    setTimeout(() => {
        messageEl.style.backgroundColor = '';
    }, 1000);
    
    console.log('💬 Reply initiated for message:', message.substring(0, 30));
}

// Enhanced mobile-responsive auto-scroll function
function scrollToLatestMessage(container, force = false) {
    if (!container) return;

    // Check if user was near bottom before adding message (tolerance of 100px)
    const wasNearBottom = force || (container.scrollHeight - container.scrollTop - container.clientHeight) <= 100;

    if (wasNearBottom) {
        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
            // Multiple scroll attempts to handle dynamic content sizing
            container.scrollTop = container.scrollHeight;

            // Additional scroll after a brief delay for mobile browsers
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 50);

            // Final scroll to ensure visibility on mobile
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 150);
        });
    }
}

// Enhanced mobile viewport and keyboard handling
let initialViewportHeight = window.innerHeight;
let visualViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
let keyboardVisible = false;
let scrollTimeoutId = null;
let focusedInput = null;
let keyboardHeight = 0;
let isInputFocused = false;
let viewportChangeTimer = null;
const connectingCircle = document.getElementById("connectingCircle");

// Enhanced viewport change detection with visual viewport API
function handleMobileViewportChange() {
    // Use visual viewport if available, fallback to window dimensions
    const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const currentWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const heightDifference = initialViewportHeight - currentHeight;

    // More accurate keyboard detection
    const wasKeyboardVisible = keyboardVisible;
    keyboardVisible = heightDifference > 100; // Reduced threshold for better detection
    keyboardHeight = keyboardVisible ? heightDifference : 0;

    console.log('Enhanced viewport change:', {
        currentHeight,
        currentWidth,
        initialHeight: initialViewportHeight,
        visualViewportHeight,
        heightDifference,
        keyboardHeight,
        keyboardVisible,
        wasKeyboardVisible,
        isInputFocused,
        focusedInput: focusedInput ? focusedInput.id : null
    });

    // Clear existing timeout
    if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
    }

    // Handle keyboard state changes with smooth transitions
    if (keyboardVisible && !wasKeyboardVisible) {
        // Keyboard appeared
        console.log('📱 Mobile keyboard appeared');
        adjustChatContainersForKeyboard(true);
        lockInputFocus();

        // Smooth scroll to input after keyboard animation
        requestAnimationFrame(() => {
            scrollInputIntoView();
            scrollTimeoutId = setTimeout(() => {
                ensureMessageVisibility();
            }, 300);
        });

    } else if (!keyboardVisible && wasKeyboardVisible) {
        // Keyboard hidden
        console.log('📱 Mobile keyboard hidden');
        adjustChatContainersForKeyboard(false);
        unlockInputFocus();

        // Restore normal layout
        scrollTimeoutId = setTimeout(() => {
            restoreNormalLayout();
            ensureMessageVisibility();
        }, 200);
    }

    // Handle ongoing keyboard visibility with input focus
    if (keyboardVisible && isInputFocused) {
        // Continuously ensure input stays visible
        if (viewportChangeTimer) {
            clearTimeout(viewportChangeTimer);
        }
        viewportChangeTimer = setTimeout(() => {
            scrollInputIntoView();
        }, 100);
    }
}

// Enhanced input focus management
function lockInputFocus() {
    console.log('🔒 Locking input focus for keyboard mode');
    isInputFocused = true;

    // Prevent body scroll
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Add mobile keyboard class
    document.body.classList.add('mobile-keyboard-active');

    // Lock focus on active input
    if (focusedInput) {
        // Prevent focus loss
        focusedInput.addEventListener('blur', preventBlurDuringKeyboard, { passive: false });
    }
}

function unlockInputFocus() {
    console.log('🔓 Unlocking input focus, keyboard hidden');
    isInputFocused = false;

    // Restore body scroll
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.overflow = '';

    // Remove mobile keyboard class
    document.body.classList.remove('mobile-keyboard-active');

    // Remove blur prevention
    if (focusedInput) {
        focusedInput.removeEventListener('blur', preventBlurDuringKeyboard);
    }
}

// Prevent input blur when keyboard is visible
function preventBlurDuringKeyboard(event) {
    if (keyboardVisible && isInputFocused) {
        console.log('🚫 Preventing input blur during keyboard visibility');
        event.preventDefault();
        event.stopPropagation();

        // Refocus after a brief delay
        setTimeout(() => {
            if (focusedInput && keyboardVisible) {
                focusedInput.focus();
            }
        }, 10);

        return false;
    }
}

// Smooth input scrolling with proper positioning
function scrollInputIntoView() {
    if (!focusedInput || !keyboardVisible) return;

    console.log('📱 Scrolling input into view');

    requestAnimationFrame(() => {
        try {
            // Calculate safe position above keyboard
            const inputRect = focusedInput.getBoundingClientRect();
            const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const safeZone = viewportHeight - 50; // 50px buffer above keyboard

            if (inputRect.bottom > safeZone) {
                const scrollOffset = inputRect.bottom - safeZone + 20; // Extra 20px padding

                // Smooth scroll with behavior
                const inputContainer = focusedInput.closest('.chat-input-container, .video-chat-input-container');
                if (inputContainer) {
                    inputContainer.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'end',
                        inline: 'nearest'
                    });
                }

                // Fallback manual scroll
                setTimeout(() => {
                    window.scrollBy({
                        top: -scrollOffset,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        } catch (error) {
            console.warn('Error scrolling input into view:', error);
        }
    });
}

// Restore normal layout after keyboard closes
function restoreNormalLayout() {
    console.log('🔄 Restoring normal layout');

    // Reset all dynamic styles
    const chatMessages = document.getElementById('chatMessages');
    const videoChatMessages = document.getElementById('videoChatMessages');

    if (chatMessages) {
        chatMessages.style.height = '';
        chatMessages.style.maxHeight = '';
        chatMessages.style.paddingBottom = '';
    }

    if (videoChatMessages) {
        videoChatMessages.style.height = '';
        videoChatMessages.style.maxHeight = '';
        videoChatMessages.style.paddingBottom = '';
    }

    // Ensure message containers are scrolled to bottom
    requestAnimationFrame(() => {
        ensureMessageVisibility();
    });
}

// Enhanced message visibility with better mobile handling
function ensureMessageVisibility() {
    requestAnimationFrame(() => {
        if (currentChatType === 'text' && chatMessages) {
            scrollToLatestMessage(chatMessages, true);
        } else if (currentChatType === 'video' && videoChatMessages) {
            scrollToLatestMessage(videoChatMessages, true);
        }
    });
}

// Enhanced chat container adjustments for mobile keyboard
function adjustChatContainersForKeyboard(keyboardShown) {
    const chatMessages = document.getElementById('chatMessages');
    const videoChatMessages = document.getElementById('videoChatMessages');
    const chatInputContainer = document.querySelector('.chat-input-container');
    const videoChatInputContainer = document.querySelector('.video-chat-input-container');

    console.log('📱 Adjusting chat containers for keyboard:', {
        keyboardShown,
        keyboardHeight,
        viewportHeight: window.visualViewport ? window.visualViewport.height : window.innerHeight
    });

    if (keyboardShown) {
        // Keyboard shown - optimize for reduced viewport
        const availableHeight = window.visualViewport ? window.visualViewport.height : (window.innerHeight - keyboardHeight);

        if (chatMessages) {
            // Dynamic height based on available space
            const headerHeight = 60;
            const inputHeight = 80;
            const safeHeight = Math.max(200, availableHeight - headerHeight - inputHeight - 40);

            chatMessages.style.height = `${safeHeight}px`;
            chatMessages.style.maxHeight = `${safeHeight}px`;
            chatMessages.style.paddingBottom = '10px';
            chatMessages.style.overflowY = 'auto';
            chatMessages.style.overscrollBehavior = 'contain';
        }

        if (videoChatMessages) {
            // For video chat, use proportional space
            const videoHeight = availableHeight * 0.35; // 35% of available height
            const chatHeight = Math.max(120, videoHeight - 80);

            videoChatMessages.style.height = `${chatHeight}px`;
            videoChatMessages.style.maxHeight = `${chatHeight}px`;
            videoChatMessages.style.paddingBottom = '10px';
            videoChatMessages.style.overflowY = 'auto';
            videoChatMessages.style.overscrollBehavior = 'contain';
        }

        // Enhanced input container positioning
        if (chatInputContainer) {
            chatInputContainer.style.position = 'fixed';
            chatInputContainer.style.bottom = '0';
            chatInputContainer.style.left = '0';
            chatInputContainer.style.right = '0';
            chatInputContainer.style.zIndex = '10000';
            chatInputContainer.style.backgroundColor = '#1a1a2e';
            chatInputContainer.style.borderTop = '1px solid #333';
            chatInputContainer.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.2)';
            // Add safe area for devices with notches
            chatInputContainer.style.paddingBottom = 'max(15px, env(safe-area-inset-bottom))';
        }

        if (videoChatInputContainer) {
            videoChatInputContainer.style.position = 'fixed';
            videoChatInputContainer.style.bottom = '0';
            videoChatInputContainer.style.left = '0';
            videoChatInputContainer.style.right = '0';
            videoChatInputContainer.style.zIndex = '10003';
            videoChatInputContainer.style.backgroundColor = 'white';
            videoChatInputContainer.style.borderTop = '1px solid #ddd';
            videoChatInputContainer.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.1)';
            // Add safe area for devices with notches
            videoChatInputContainer.style.paddingBottom = 'max(10px, env(safe-area-inset-bottom))';
        }

    } else {
        // Keyboard hidden - restore normal layout smoothly
        console.log('📱 Restoring normal layout');

        // Reset message containers
        if (chatMessages) {
            chatMessages.style.height = '';
            chatMessages.style.maxHeight = '';
            chatMessages.style.paddingBottom = '';
            chatMessages.style.overflowY = '';
            chatMessages.style.overscrollBehavior = '';
        }

        if (videoChatMessages) {
            videoChatMessages.style.height = '';
            videoChatMessages.style.maxHeight = '';
            videoChatMessages.style.paddingBottom = '';
            videoChatMessages.style.overflowY = '';
            videoChatMessages.style.overscrollBehavior = '';
        }

        // Reset input containers
        if (chatInputContainer) {
            chatInputContainer.style.position = '';
            chatInputContainer.style.bottom = '';
            chatInputContainer.style.left = '';
            chatInputContainer.style.right = '';
            chatInputContainer.style.zIndex = '';
            chatInputContainer.style.backgroundColor = '';
            chatInputContainer.style.borderTop = '';
            chatInputContainer.style.boxShadow = '';
            chatInputContainer.style.paddingBottom = '';
        }

        if (videoChatInputContainer) {
            videoChatInputContainer.style.position = '';
            videoChatInputContainer.style.bottom = '';
            videoChatInputContainer.style.left = '';
            videoChatInputContainer.style.right = '';
            videoChatInputContainer.style.zIndex = '';
            videoChatInputContainer.style.backgroundColor = '';
            videoChatInputContainer.style.borderTop = '';
            videoChatInputContainer.style.boxShadow = '';
            videoChatInputContainer.style.paddingBottom = '';
        }
    }
}

// Enhanced mobile input handlers with advanced focus management
function setupMobileInputHandlers() {
    const messageInput = document.getElementById('messageInput');
    const videoMessageInput = document.getElementById('videoMessageInput');

    // Setup visual viewport listener if available
    if (window.visualViewport) {
        console.log('📱 Setting up visual viewport listeners');

        // Use passive listeners for better performance
        window.visualViewport.addEventListener('resize', () => {
            requestAnimationFrame(handleMobileViewportChange);
        }, { passive: true });

        window.visualViewport.addEventListener('scroll', () => {
            if (keyboardVisible && isInputFocused) {
                requestAnimationFrame(scrollInputIntoView);
            }
        }, { passive: true });
    }

    // Enhanced text chat input handlers
    if (messageInput) {
        messageInput.addEventListener('focus', (e) => {
            console.log('📝 Text input focused');
            focusedInput = messageInput;
            isInputFocused = true;

            // Prevent zoom on iOS
            messageInput.style.fontSize = '16px';

            // Handle focus with delay for keyboard animation
            setTimeout(() => {
                handleInputFocus(messageInput, 'text');
            }, 100);
        }, { passive: true });

        messageInput.addEventListener('blur', (e) => {
            console.log('📝 Text input blurred');

            // Only handle blur if keyboard is actually hidden
            setTimeout(() => {
                if (!keyboardVisible) {
                    handleInputBlur(messageInput, 'text');
                }
            }, 100);
        }, { passive: true });

        // Handle input during typing
        messageInput.addEventListener('input', () => {
            if (keyboardVisible) {
                // Ensure input stays visible during typing
                requestAnimationFrame(() => {
                    scrollInputIntoView();
                });
            }
        }, { passive: true });

        // Prevent scroll when input is active
        messageInput.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });
    }

    // Enhanced video chat input handlers
    if (videoMessageInput) {
        videoMessageInput.addEventListener('focus', (e) => {
            console.log('📹 Video input focused');
            focusedInput = videoMessageInput;
            isInputFocused = true;

            // Prevent zoom on iOS
            videoMessageInput.style.fontSize = '16px';

            setTimeout(() => {
                handleInputFocus(videoMessageInput, 'video');
            }, 100);
        }, { passive: true });

        videoMessageInput.addEventListener('blur', (e) => {
            console.log('📹 Video input blurred');

            setTimeout(() => {
                if (!keyboardVisible) {
                    handleInputBlur(videoMessageInput, 'video');
                }
            }, 100);
        }, { passive: true });

        videoMessageInput.addEventListener('input', () => {
            if (keyboardVisible) {
                requestAnimationFrame(() => {
                    scrollInputIntoView();
                });
            }
        }, { passive: true });

        videoMessageInput.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });
    }
}

// Handle input focus with smooth UX
function handleInputFocus(input, chatType) {
    console.log(`📱 Handling ${chatType} input focus`);

    // Store original viewport height if not already stored
    if (!initialViewportHeight) {
        initialViewportHeight = window.innerHeight;
    }

    // Wait for keyboard to potentially appear
    setTimeout(() => {
        if (keyboardVisible) {
            console.log(`📱 Keyboard detected for ${chatType} input`);
            lockInputFocus();
            scrollInputIntoView();
        }

        // Ensure messages are visible
        setTimeout(() => {
            if (chatType === 'text' && chatMessages) {
                scrollToLatestMessage(chatMessages, true);
            } else if (chatType === 'video' && videoChatMessages) {
                scrollToLatestMessage(videoChatMessages, true);
            }
        }, 300);
    }, 300);
}

// Handle input blur with cleanup
function handleInputBlur(input, chatType) {
    console.log(`📱 Handling ${chatType} input blur`);

    // Only cleanup if keyboard is actually hidden
    if (!keyboardVisible) {
        focusedInput = null;
        isInputFocused = false;
        unlockInputFocus();

        setTimeout(() => {
            restoreNormalLayout();
            if (chatType === 'text' && chatMessages) {
                scrollToLatestMessage(chatMessages, true);
            } else if (chatType === 'video' && videoChatMessages) {
                scrollToLatestMessage(videoChatMessages, true);
            }
        }, 200);
    }
}

function addUserMediaMessage(fileName, fileSize, fileURL, mediaType) {
    addMediaMessage(chatMessages, fileName, fileSize, fileURL, mediaType, 'user-message');
}

function addVideoUserMediaMessage(fileName, fileSize, fileURL, mediaType) {
    addMediaMessage(videoChatMessages, fileName, fileSize, fileURL, mediaType, 'user-message');
}

function addStrangerMediaMessage(fileName, fileSize, fileURL, mediaType) {
    addMediaMessage(chatMessages, fileName, fileSize, fileURL, mediaType, 'stranger-message');
}

function addVideoStrangerMediaMessage(fileName, fileSize, fileURL, mediaType) {
    addMediaMessage(videoChatMessages, fileName, fileSize, fileURL, mediaType, 'stranger-message');
}

function addMediaMessage(container, fileName, fileSize, fileURL, mediaType, className) {
    if (!container) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className} media-message`;
    messageDiv.style.position = 'relative';
    messageDiv.style.display = 'flex';
    messageDiv.style.alignItems = 'flex-start';
    messageDiv.style.gap = '8px';

    // Create three-dot menu button
    const menuButton = document.createElement('div');
    menuButton.className = 'media-menu-button';
    menuButton.innerHTML = '⋮';
    menuButton.style.cssText = `
        cursor: pointer;
        padding: 4px 8px;
        font-size: 16px;
        color: #666;
        background: rgba(0,0,0,0.05);
        border-radius: 12px;
        margin-top: 4px;
        user-select: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        transition: background-color 0.2s ease;
    `;

    // Menu button hover effect
    menuButton.addEventListener('mouseenter', () => {
        menuButton.style.backgroundColor = 'rgba(0,0,0,0.1)';
    });
    menuButton.addEventListener('mouseleave', () => {
        menuButton.style.backgroundColor = 'rgba(0,0,0,0.05)';
    });

    // Create media content container
    const mediaContainer = document.createElement('div');
    mediaContainer.style.flex = '1';

    if (mediaType === 'image') {
        const img = document.createElement('img');
        img.src = fileURL;
        img.alt = sanitizeInput(fileName);
        img.style.maxWidth = '250px';
        img.style.maxHeight = '200px';
        img.style.borderRadius = '8px';
        img.style.cursor = 'pointer';
        img.style.display = 'block';
        img.style.marginBottom = '5px';

        mediaContainer.appendChild(img);
    } else if (mediaType === 'video') {
        const video = document.createElement('video');
        video.src = fileURL;
        video.controls = true;
        video.style.maxWidth = '250px';
        video.style.maxHeight = '200px';
        video.style.borderRadius = '8px';
        video.style.display = 'block';
        video.style.marginBottom = '5px';

        mediaContainer.appendChild(video);
    }

    // Add three-dot menu functionality
    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showMediaContextMenu(e, fileURL, fileName, mediaType, messageDiv);
    });

    // Assemble the message
    messageDiv.appendChild(menuButton);
    messageDiv.appendChild(mediaContainer);

    const caption = document.createElement('div');
    caption.style.fontSize = '0.8rem';
    caption.style.color = '#666';
    caption.style.marginTop = '4px';
    caption.textContent = `${sanitizeInput(fileName)} (${fileSize}MB)`;
    mediaContainer.appendChild(caption);

    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    return messageDiv;
}

function showDownloadOption(fileURL, fileName) {
    if (confirm(`Download ${sanitizeInput(fileName)}?`)) {
        try {
            const link = document.createElement('a');
            link.href = fileURL;
            link.download = sanitizeInput(fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
        }
    }
}

// Enhanced WebRTC Functions with proper error handling
async function requestMediaPermissions() {
    try {
        // First check permissions
        const permissions = await checkMediaPermissions();

        if (permissions.camera === 'denied' || permissions.microphone === 'denied') {
            await handleMediaPermissionDenied();
            return false;
        }

        // First try with video and audio
        let constraints = {
            video: {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                facingMode: 'user',
                frameRate: { ideal: 30, max: 60 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: { ideal: 48000 }
            }
        };

        try {
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            // Graceful fallback to video only if audio fails
            if (error.name === 'NotFoundError' || error.name === 'PermissionDeniedError' || error.name === 'NotAllowedError') {
                console.log('No microphone detected or permission denied, continuing with video only');
                showUserFeedback('No microphone detected, continuing with video only', 'info');
                addVideoSystemMessage('ℹ️ Video-only mode: No microphone available');
                
                try {
                    constraints = { video: constraints.video };
                    localStream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (videoError) {
                    console.error('Video also failed:', videoError);
                    throw videoError;
                }
            } else {
                // For other audio errors, still try video-only fallback
                console.log('Audio initialization failed, attempting video-only fallback');
                try {
                    constraints = { video: constraints.video };
                    localStream = await navigator.mediaDevices.getUserMedia(constraints);
                    showUserFeedback('Audio unavailable, using video only', 'info');
                } catch (videoError) {
                    console.error('Video also failed:', videoError);
                    throw videoError;
                }
            }
        }

        if (localVideo && localStream) {
            // Check if we actually have tracks
            const videoTracks = localStream.getVideoTracks();
            const audioTracks = localStream.getAudioTracks();

            if (videoTracks.length === 0 && audioTracks.length === 0) {
                throw new Error('No media tracks available - camera/microphone may be blocked');
            }

            // Enhanced audio tracks debugging for mute/permission issues
            console.log("Audio tracks:", audioTracks);
            audioTracks.forEach((track, index) => {
                console.log(`Audio track ${index}:`, {
                    id: track.id,
                    label: track.label,
                    enabled: track.enabled,
                    muted: track.muted,
                    readyState: track.readyState,
                    constraints: track.getConstraints(),
                    settings: track.getSettings()
                });
            });

            // Log track information for debugging
            console.log(`Media tracks: ${videoTracks.length} video, ${audioTracks.length} audio`);

            // Set local video source to show user's own video with error handling
            try {
                localVideo.srcObject = localStream;
                localVideo.muted = true; // Prevent feedback

                // For mobile devices, ensure local video is positioned correctly inside stranger video container
                if (isMobileDevice()) {
                    const strangerVideoContainer = document.querySelector('.stranger-video');
                    if (strangerVideoContainer && localVideo && !strangerVideoContainer.contains(localVideo)) {
                        // Move local video inside stranger video container for mobile floating effect
                        strangerVideoContainer.appendChild(localVideo);
                        console.log('Local video moved to stranger video container for mobile floating preview');
                    }

                    // Ensure local video has the correct mobile floating styles
                    if (localVideo) {
                        localVideo.style.position = 'absolute';
                        localVideo.style.top = '10px';
                        localVideo.style.right = '10px';
                        localVideo.style.width = '90px';
                        localVideo.style.height = '70px';
                        localVideo.style.zIndex = '10';
                        localVideo.style.borderRadius = '8px';
                        localVideo.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
                        localVideo.style.objectFit = 'cover';
                        localVideo.style.display = 'block';
                        localVideo.style.opacity = '1';
                        localVideo.style.visibility = 'visible';
                        localVideo.style.border = '2px solid white';
                        localVideo.style.backgroundColor = '#2a2a2a';
                    }

                    // Hide the separate floating video container on mobile
                    const floatingContainer = document.querySelector('.local-video-float');
                    if (floatingContainer) {
                        floatingContainer.style.display = 'none';
                    }
                } else {
                    // Desktop behavior - keep local video in its designated container
                    const userVideoContainer = document.querySelector('.user-video');
                    if (userVideoContainer && localVideo && !userVideoContainer.contains(localVideo)) {
                        userVideoContainer.appendChild(localVideo);
                    }

                    // Reset local video styles for desktop
                    if (localVideo) {
                        localVideo.style.position = 'static';
                        localVideo.style.width = '100%';
                        localVideo.style.height = '100%';
                        localVideo.style.top = 'auto';
                        localVideo.style.right = 'auto';
                        localVideo.style.zIndex = 'auto';
                        localVideo.style.border = 'none';
                    }

                    // Hide floating video on desktop to prevent confusion
                    const floatingContainer = document.querySelector('.local-video-float');
                    if (floatingContainer) {
                        floatingContainer.style.display = 'none';
                    }
                }

                // Wait for video to be ready
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Video load timeout'));
                    }, 5000);

                    localVideo.addEventListener('loadeddata', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                });
            } catch (videoLoadError) {
                console.error('Error loading local video:', videoLoadError);
                throw new Error('Failed to initialize camera display');
            }

            // Initialize NSFW detection for local video
            try {
                if (typeof clientNSFWDetector !== 'undefined') {
                    await clientNSFWDetector.initialize();
                    clientNSFWDetector.startMonitoring(localVideo);
                }
            } catch (nsfwError) {
                console.warn('NSFW detector failed to initialize:', nsfwError);
            }
        }

        return true;
    } catch (error) {
        console.error('Error accessing media devices:', error);

        let errorMessage = "Camera access denied or not found.";
        let errorType = 'error';

        if (error.name === 'NotAllowedError') {
            errorMessage = "Camera/microphone access denied. Please allow permissions and try again.";
            errorType = 'permission';

            // Show permission error overlay
            showUserFeedback(errorMessage, errorType, {
                fullModal: true,
                persistent: true,
                onRetry: () => startVideoChat(),
                onGoBack: () => {
                    cleanupConnections();
                    showHomePage();
                }
            });
        } else if (error.name === 'NotFoundError') {
            errorMessage = "No camera/microphone found. Please check your devices and try again.";
            showUserFeedback(errorMessage, 'error', {
                fullModal: true,
                onRetry: () => startVideoChat()
            });
        } else if (error.name === 'NotReadableError') {
            errorMessage = "Camera/microphone is already in use by another application. Please close other apps and try again.";
            showUserFeedback(errorMessage, 'error', {
                fullModal: true,
                onRetry: () => startVideoChat()
            });
        } else if (error.name === 'OverconstrainedError') {
            errorMessage = "Camera constraints not supported. Trying with basic settings.";
            showUserFeedback(errorMessage, 'warning');
        } else {
            // Generic error with full modal
            showUserFeedback(errorMessage, 'error', {
                fullModal: true,
                onRetry: () => startVideoChat()
            });
        }

        addVideoSystemMessage(errorMessage);
        return false;
    }
}

// Advanced WebRTC Debugging Agent
class WebRTCDebugger {
    constructor() {
        this.connectionStates = [];
        this.peerId = Math.random().toString(36).substr(2, 9);
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelays = [2000, 4000, 8000]; // Exponential backoff
        this.lastFailureReason = null;
        this.mediaStreamActive = false;
        this.iceGatheringComplete = false;
        this.remotePeerActive = false;
        this.turnServerUsed = false;
        this.iceCandidatesExhausted = false;
        this.startTime = Date.now();
        this.lastStateChange = Date.now();
    }

    logStateTransition(type, oldState, newState, context = {}) {
        const timestamp = Date.now();
        const duration = timestamp - this.lastStateChange;

        const stateLog = {
            timestamp: new Date(timestamp).toISOString(),
            peerId: this.peerId,
            type,
            oldState,
            newState,
            duration,
            context,
            sessionDuration: timestamp - this.startTime
        };

        this.connectionStates.push(stateLog);
        this.lastStateChange = timestamp;

        console.log(`🔍 WebRTC State Change [${type}]:`, {
            peerId: this.peerId,
            transition: `${oldState} → ${newState}`,
            duration: `${duration}ms`,
            sessionTime: `${(timestamp - this.startTime) / 1000}s`,
            context
        });

        // Store in sessionStorage for debugging
        try {
            const debugHistory = JSON.parse(sessionStorage.getItem('webrtc_debug_history') || '[]');
            debugHistory.push(stateLog);
            // Keep only last 50 entries
            if (debugHistory.length > 50) debugHistory.shift();
            sessionStorage.setItem('webrtc_debug_history', JSON.stringify(debugHistory));
        } catch (e) {
            console.warn('Failed to store debug history:', e);
        }
    }

    analyzeConnectionFailure(peerConnection) {
        const analysis = {
            timestamp: Date.now(),
            peerId: this.peerId,
            iceConnectionState: peerConnection?.iceConnectionState,
            connectionState: peerConnection?.connectionState,
            signalingState: peerConnection?.signalingState,
            remotePeerActive: this.remotePeerActive,
            iceCandidatesExhausted: this.iceCandidatesExhausted,
            turnServerUsed: this.turnServerUsed,
            mediaStreamActive: this.mediaStreamActive,
            iceGatheringComplete: this.iceGatheringComplete,
            queuedCandidates: iceCandidateQueue.length,
            retryAttempt: this.retryCount,
            sessionDuration: Date.now() - this.startTime,
            recentStates: this.connectionStates.slice(-10)
        };

        console.log('🚨 Connection Failure Analysis:', analysis);

        // Determine failure reason
        let failureReason = 'unknown';
        if (analysis.iceConnectionState === 'failed') {
            if (!analysis.turnServerUsed && analysis.iceCandidatesExhausted) {
                failureReason = 'nat_traversal_failed';
            } else if (!analysis.remotePeerActive) {
                failureReason = 'remote_peer_disconnected';
            } else {
                failureReason = 'ice_connectivity_failed';
            }
        } else if (analysis.connectionState === 'failed') {
            failureReason = 'peer_connection_failed';
        } else if (analysis.signalingState === 'closed') {
            failureReason = 'signaling_closed';
        }

        this.lastFailureReason = failureReason;
        analysis.failureReason = failureReason;

        return analysis;
    }

    shouldRetry(analysis) {
        if (this.retryCount >= this.maxRetries) {
            console.log('❌ Maximum retry attempts reached');
            return false;
        }

        // Don't retry if remote peer explicitly disconnected
        if (analysis.failureReason === 'remote_peer_disconnected') {
            console.log('❌ Remote peer disconnected, not retrying');
            return false;
        }

        // Don't retry if signaling is closed
        if (analysis.failureReason === 'signaling_closed') {
            console.log('❌ Signaling closed, not retrying');
            return false;
        }

        return true;
    }

    getRetryStrategy(analysis) {
        const strategy = {
            method: 'ice_restart',
            delay: this.retryDelays[Math.min(this.retryCount, this.retryDelays.length - 1)],
            reason: analysis.failureReason
        };

        // Use full reconnection for certain failure types
        if (analysis.failureReason === 'peer_connection_failed' || 
            analysis.sessionDuration > 300000) { // 5 minutes
            strategy.method = 'full_reconnection';
        }

        return strategy;
    }

    reset() {
        this.retryCount = 0;
        this.lastFailureReason = null;
        this.startTime = Date.now();
        this.lastStateChange = Date.now();
        this.mediaStreamActive = false;
        this.iceGatheringComplete = false;
        this.remotePeerActive = false;
        this.turnServerUsed = false;
        this.iceCandidatesExhausted = false;
    }
}

// Global WebRTC debugger instance
const webrtcDebugger = new WebRTCDebugger();

// Enhanced ICE servers with better TURN fallback
const ENHANCED_ICE_SERVERS = [
    {urls: 'stun:stun.l.google.com:19302'},
    {urls: 'stun:stun1.l.google.com:19302'},
    {urls: 'stun:stun2.l.google.com:19302'},
    {urls: 'stun:stun3.l.google.com:19302'},
    {urls: 'stun:stun4.l.google.com:19302'},
    { 
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    { 
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    { 
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    // Additional TURN servers for better reliability
    {
        urls: 'turn:relay1.expressturn.com:3478',
        username: 'efPLPK4Q8MZTQZU3QW',
        credential: 'ux9JTBHb1dZt7d7A'
    }
];

// Enhanced WebRTC initialization with comprehensive debugging
async function initializeWebRTC(initiator) {
    try {
        console.log('🚀 Initializing WebRTC with advanced debugging, initiator:', initiator);
        isInitiator = initiator;

        // Reset debugger for new connection
        webrtcDebugger.reset();
        webrtcDebugger.peerId = Math.random().toString(36).substr(2, 9);

        // Clean up existing connection
        if (peerConnection) {
            webrtcDebugger.logStateTransition('cleanup', 'existing', 'closing', {
                reason: 'new_connection_initialization'
            });
            peerConnection.close();
            peerConnection = null;
        }

        // Reset ICE candidate queue with logging
        const queueLength = iceCandidateQueue.length;
        iceCandidateQueue = [];
        isRemoteDescriptionSet = false;

        if (queueLength > 0) {
            console.log(`🧹 Cleared ${queueLength} queued ICE candidates`);
        }

        // Optimized peer connection configuration for fast connections
        peerConnection = new RTCPeerConnection({ 
            iceServers: ENHANCED_ICE_SERVERS,
            iceCandidatePoolSize: 10, // Pre-gather ICE candidates
            iceTransportPolicy: 'all', // Allow both STUN and TURN
            bundlePolicy: 'max-bundle', // Faster negotiation
            rtcpMuxPolicy: 'require', // Reduce ports needed
            // Enable trickle ICE for faster connection setup
            iceGatheringPolicy: 'all'
        });
        
        // Log peer connection configuration for debugging
        DebugLogger.connection('PeerConnection created with optimized config:', {
            iceServers: ENHANCED_ICE_SERVERS.length,
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            trickleIceEnabled: true
        });

        webrtcDebugger.logStateTransition('peer_connection', 'null', 'created', {
            iceServers: ENHANCED_ICE_SERVERS.length,
            isInitiator: initiator
        });

        // Set peer connection timeout with enhanced error handling
        peerConnectionTimeout = setTimeout(() => {
            if (peerConnection && peerConnection.connectionState !== 'connected') {
                console.log('⏰ Peer connection timeout triggered');

                const analysis = webrtcDebugger.analyzeConnectionFailure(peerConnection);
                webrtcDebugger.logStateTransition('timeout', 'connecting', 'timeout', analysis);

                handleEnhancedWebRTCFailure(analysis, 'connection_timeout');
            }
        }, PEER_CONNECTION_TIMEOUT);

        // Add local stream tracks immediately for faster negotiation
        if (localStream) {
            localStream.getTracks().forEach(track => {
                console.log('Adding track for immediate negotiation:', track.kind, track.label);
                const sender = peerConnection.addTrack(track, localStream);
                console.log('Track added with sender:', sender);
                DebugLogger.video('Local track added for fast negotiation:', {
                    kind: track.kind,
                    enabled: track.enabled,
                    readyState: track.readyState
                });
            });
            // Start negotiation immediately after adding tracks
            DebugLogger.connection('Local stream added - ready for immediate negotiation');
        }

        // Handle remote stream - modern approach with ontrack
        peerConnection.ontrack = (event) => {
            console.log('Received remote track:', {
                kind: event.track.kind,
                streamsCount: event.streams.length,
                trackId: event.track.id,
                trackEnabled: event.track.enabled,
                trackReadyState: event.track.readyState,
                trackMuted: event.track.muted
            });

            // Log detailed track state
            console.log('Track details:', {
                enabled: event.track.enabled,
                readyState: event.track.readyState,
                muted: event.track.muted,
                label: event.track.label
            });

            // Set remote video source and remove connecting animation
            if (event.streams && event.streams.length > 0) {
                remoteVideo.srcObject = event.streams[0];

                // Remove connecting animation immediately when remote stream is received
                const strangerVideo = document.querySelector('.stranger-video');
                if (strangerVideo) {
                    strangerVideo.classList.remove('connecting');
                    console.log('✅ Connecting animation removed - remote stream received');
                }

                console.log('✅ Remote video source set and connecting animation removed');
            }

            // Hide connecting circle when remote track is received
            if (connectingCircle) {
                connectingCircle.style.display = 'none';
                console.log('✅ Connecting circle hidden - remote track received');
            }

            // Ensure remote video element is available and properly configured
            if (!remoteVideo) {
                remoteVideo = document.getElementById('remoteVideo');
                console.log('Re-fetching remote video element:', remoteVideo ? 'found' : 'not found');
                if (!remoteVideo) {
                    console.error('Remote video element not found in DOM');
                    addVideoSystemMessage('Error: Remote video element not found');
                    return;
                }
            }

            // Set remote video source directly
            if (remoteVideo && event.streams && event.streams.length > 0) {
                remoteVideo.srcObject = event.streams[0];
                console.log('✅ Remote video source set from ontrack event');
            }

            if (event.streams && event.streams.length > 0) {
                const stream = event.streams[0];
                console.log('Setting remote video source with stream:', {
                    streamId: stream.id,
                    streamActive: stream.active,
                    audioTracks: stream.getAudioTracks().length,
                    videoTracks: stream.getVideoTracks().length
                });

                // Log detailed stream state
                stream.getTracks().forEach((track, index) => {
                    console.log(`Stream track ${index} (${track.kind}):`, {
                        id: track.id,
                        enabled: track.enabled,
                        readyState: track.readyState,
                        muted: track.muted,
                        label: track.label
                    });
                });

                // Ensure video element has correct attributes before setting stream
                remoteVideo.autoplay = true;
                remoteVideo.playsInline = true;
                remoteVideo.muted = false;
                remoteVideo.controls = false;
                remoteVideo.setAttribute('playsinline', '');
                remoteVideo.setAttribute('webkit-playsinline', '');

                // Set the remote stream
                remoteVideo.srcObject = stream;

                // Enhanced video play handling with comprehensive error detection
                const attemptVideoPlay = async () => {
                    try {
                        console.log('🎬 Attempting to play remote video...');

                        webrtcDebugger.logStateTransition('remote_video', 'received', 'attempting_play', {
                            readyState: remoteVideo.readyState,
                            networkState: remoteVideo.networkState,
                            videoWidth: remoteVideo.videoWidth,
                            videoHeight: remoteVideo.videoHeight,
                            streamActive: stream.active,
                            trackCount: stream.getTracks().length
                        });

                        // Enhanced readyState checking to prevent AbortError
                        if (remoteVideo.readyState < 2) { // HAVE_CURRENT_DATA
                            console.log('⏳ Waiting for video to have sufficient data (readyState >= 2)...');
                            await new Promise((resolve, reject) => {
                                const timeout = setTimeout(() => {
                                    reject(new Error('Video data load timeout - insufficient buffering'));
                                }, 8000);

                                const checkReadyState = () => {
                                    console.log(`📊 Video readyState: ${remoteVideo.readyState}`);
                                    if (remoteVideo.readyState >= 2) {
                                        clearTimeout(timeout);
                                        console.log('✅ Video has sufficient data to play');
                                        resolve();
                                    }
                                };

                                // Check multiple events for readiness
                                remoteVideo.addEventListener('loadeddata', checkReadyState, { once: true });
                                remoteVideo.addEventListener('canplay', checkReadyState, { once: true });
                                remoteVideo.addEventListener('canplaythrough', checkReadyState, { once: true });

                                // Initial check in case video is already ready
                                checkReadyState();
                            });
                        }

                        // Additional safety check before play
                        if (remoteVideo.readyState < 1) {
                            throw new Error('Video metadata not loaded - cannot play');
                        }

                        console.log('📊 Final video state before play attempt:', {
                            readyState: remoteVideo.readyState,
                            networkState: remoteVideo.networkState,
                            paused: remoteVideo.paused,
                            currentTime: remoteVideo.currentTime,
                            videoWidth: remoteVideo.videoWidth,
                            videoHeight: remoteVideo.videoHeight,
                            duration: remoteVideo.duration,
                            buffered: remoteVideo.buffered.length > 0 ? 
                                `${remoteVideo.buffered.start(0)}-${remoteVideo.buffered.end(0)}` : 'none'
                        });

                        // Attempt to play with timeout - wrapped to handle AbortError
                        try {
                            const playPromise = remoteVideo.play();
                            const playTimeout = new Promise((_, reject) => {
                                setTimeout(() => reject(new Error('Video play timeout')), 5000);
                            });

                            await Promise.race([playPromise, playTimeout]);
                        } catch (playError) {
                            // Silently handle AbortError as it's normal during stream transitions
                            if (playError.name === 'AbortError') {
                                console.log('Video play interrupted (normal during stream changes)');
                            } else {
                                throw playError;
                            }
                        }

                        // Verify playback started successfully
                        if (remoteVideo.paused) {
                            throw new Error('Video failed to start - still paused after play()');
                        }

                        console.log('🎉 Remote video playing successfully!');
                        webrtcDebugger.logStateTransition('remote_video', 'attempting_play', 'playing', {
                            currentTime: remoteVideo.currentTime,
                            duration: remoteVideo.duration,
                            videoWidth: remoteVideo.videoWidth,
                            videoHeight: remoteVideo.videoHeight
                        });

                        webrtcDebugger.mediaStreamActive = true;
                        addVideoSystemMessage('✅ Remote video connected successfully!');
                        showUserFeedback('Remote video connected!', 'success');

                        // Remove connecting animation when video starts playing
                        const strangerVideo = document.querySelector('.stranger-video');
                        if (strangerVideo) {
                            strangerVideo.classList.remove('connecting');
                            console.log('✅ Removed connecting animation - video call established');
                        }

                    } catch (playError) {
                        console.error('❌ Remote video play failed:', {
                            error: playError.message,
                            name: playError.name,
                            videoReadyState: remoteVideo.readyState,
                            networkState: remoteVideo.networkState,
                            paused: remoteVideo.paused,
                            videoSrc: remoteVideo.srcObject ? 'stream_set' : 'no_stream',
                            streamActive: stream?.active,
                            trackStates: stream?.getTracks().map(t => ({
                                kind: t.kind,
                                enabled: t.enabled,
                                readyState: t.readyState,
                                muted: t.muted
                            })) || []
                        });

                        webrtcDebugger.logStateTransition('remote_video', 'attempting_play', 'play_failed', {
                            error: playError.name,
                            message: playError.message,
                            readyState: remoteVideo.readyState
                        });

                        // Handle specific error types
                        if (playError.name === 'NotAllowedError') {
                            console.log('🚫 Autoplay blocked by browser policy');
                            addVideoSystemMessage('🖱️ Click anywhere to enable remote video playback');

                            const enablePlayback = async () => {
                                try {
                                    // Re-check readyState before retry
                                    if (remoteVideo.readyState >= 2) {
                                        try {
                                            await remoteVideo.play();
                                            console.log('✅ Remote video playing after user interaction');
                                            addVideoSystemMessage('✅ Remote video enabled!');
                                            showUserFeedback('Remote video enabled!', 'success');
                                            webrtcDebugger.mediaStreamActive = true;
                                        } catch (playError) {
                                            if (playError.name !== 'AbortError') {
                                                console.warn('Video play failed after user interaction:', playError.name);
                                            }
                                        }
                                    } else {
                                        throw new Error('Video not ready for playback after user interaction');
                                    }
                                } catch (retryError) {
                                    console.error('❌ Remote video still failed after user interaction:', retryError);
                                    addVideoSystemMessage('❌ Remote video failed to play - connection issue detected');
                                    showErrorFeedback('Failed to enable remote video - try refreshing');
                                }
                            };

                            // Listen for user interaction
                            document.addEventListener('click', enablePlayback, { once: true });
                            document.addEventListener('touchstart', enablePlayback, { once: true });

                        } else if (playError.name === 'AbortError') {
                            console.log('⚠️ Video play aborted - likely due to insufficient data');
                            addVideoSystemMessage('⚠️ Video loading interrupted - retrying...');

                            // Retry after a short delay
                            setTimeout(() => {
                                if (remoteVideo.readyState >= 2) {
                                    attemptVideoPlay();
                                } else {
                                    addVideoSystemMessage('❌ Remote video stream unavailable');
                                }
                            }, 2000);

                        } else {
                            if (playError.name === 'NotAllowedError') {
                                // Handle autoplay restriction gracefully
                                console.log('Autoplay blocked, adding tap-to-play button');
                                addTapToPlayButton(remoteVideo);
                                addVideoSystemMessage('📱 Tap video to start playback');
                            } else if (playError.name !== 'AbortError') {
                                addVideoSystemMessage('❌ Remote video connection failed');
                                showUserFeedback('Tap video to start playback', 'info');
                            }
                        }
                    }
                };

                // Start play attempt with proper timing
                if (remoteVideo.readyState >= 1) { // HAVE_METADATA or higher
                    console.log('Video metadata already available, playing immediately');
                    attemptVideoPlay();
                } else {
                    console.log('Waiting for video metadata to load...');
                    remoteVideo.onloadedmetadata = () => {
                        console.log('Video metadata loaded event fired');
                        attemptVideoPlay();
                    };

                    // Fallback timeout in case metadata doesn't load
                    setTimeout(() => {
                        if (remoteVideo.readyState < 1) {
                            console.log('Metadata load timeout, attempting play anyway');
                            attemptVideoPlay();
                        }
                    }, 3000);
                }

            } else {
                console.warn('No remote stream available in ontrack event');
                console.warn('Event details:', {
                    streams: event.streams,
                    track: event.track
                });
                addVideoSystemMessage('No remote video stream received');
                showUserFeedback('No remote stream received', 'warning');
            }
        };

        // Enhanced browser compatibility: fallback for older browsers using onaddstream
        if (typeof peerConnection.onaddstream !== 'undefined') {
            console.log('Adding legacy onaddstream support for browser compatibility');
            peerConnection.onaddstream = (event) => {
                console.log('Received remote stream (legacy onaddstream):', event.stream);
                if (remoteVideo && event.stream) {
                    console.log('Setting remote video source (legacy)');

                    // Ensure video element has correct attributes for legacy browsers
                    remoteVideo.autoplay = true;
                    remoteVideo.playsInline = true;
                    remoteVideo.muted = false;
                    remoteVideo.controls = false;

                    remoteVideo.srcObject = event.stream;

                    // Add same browser compatibility fallbacks for legacy mode
                    remoteVideo.onloadedmetadata = () => {
                        console.log('Remote video metadata loaded (legacy)');
                        remoteVideo.play().catch((e) => {
                            // Only show error for non-AbortError cases
                            if (e.name !== 'AbortError') {
                                console.warn("Remote video autoplay failed in onloadedmetadata (legacy):", e.name);
                                addVideoSystemMessage('Click anywhere to enable remote video playback (legacy mode)');
                            }
                        });
                    };

                    // Timed fallback for legacy browsers
                    setTimeout(() => {
                        if (remoteVideo.paused && remoteVideo.readyState >= 2) {
                            console.log('Attempting fallback play after timeout (legacy)');
                            remoteVideo.play().catch((e) => {
                                if (e.name !== 'AbortError') {
                                    console.warn("Fallback play failed after timeout (legacy):", e.name);
                                    addVideoSystemMessage('Remote video requires manual play (legacy mode)');
                                }
                            });
                        }
                    }, 1000);

                    remoteVideo.play().then(() => {
                        console.log('Remote video playing successfully (legacy)');
                        showUserFeedback('Remote video connected! (legacy mode)', 'success');
                    }).catch(e => {
                        if (e.name === 'AbortError') {
                            // Silently handle AbortError as normal
                            console.log('Video play interrupted (normal during stream changes) (legacy)');
                        } else if (e.name === 'NotAllowedError') {
                            // Handle autoplay restriction gracefully
                            console.log('Autoplay blocked, adding tap-to-play button (legacy)');
                            addTapToPlayButton(remoteVideo, 'legacy mode');
                        } else {
                            console.warn('Error playing remote video (legacy):', e.name);
                            showUserFeedback('Tap video to start playback (legacy mode)', 'info');
                        }
                    });
                } else {
                    console.warn('No remote video element or stream available (legacy)');
                    showUserFeedback('No remote stream received (legacy)', 'warning');
                }
            };
        }

        // Enhanced ICE candidate handling with comprehensive debugging
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const candidateInfo = {
                    type: event.candidate.type,
                    protocol: event.candidate.protocol,
                    address: event.candidate.address?.substring(0, 10) + '...',
                    port: event.candidate.port,
                    priority: event.candidate.priority,
                    foundation: event.candidate.foundation,
                    relatedAddress: event.candidate.relatedAddress?.substring(0, 10) + '...',
                    relatedPort: event.candidate.relatedPort
                };

                DebugLogger.ice('ICE candidate generated', candidateInfo);

                // Track TURN server usage
                if (event.candidate.type === 'relay') {
                    webrtcDebugger.turnServerUsed = true;
                    DebugLogger.ice('TURN relay candidate detected - NAT traversal via relay');
                }

                // Immediate ICE candidate sending with retry mechanism
                if (socket?.readyState === WebSocket.OPEN) {
                    try {
                        DebugLogger.signaling('Sending ICE candidate to peer immediately');
                        socket.send(JSON.stringify({
                            type: 'webrtc_ice_candidate',
                            candidate: event.candidate.toJSON()
                        }));
                        DebugLogger.ice('ICE candidate sent successfully', candidateInfo);
                    } catch (sendError) {
                        DebugLogger.error('Failed to send ICE candidate:', {
                            errorName: sendError.name,
                            errorMessage: sendError.message,
                            candidateType: event.candidate.type,
                            readyState: socket?.readyState
                        });
                        console.error('ICE candidate send error:', sendError.name, sendError.message, sendError.stack);
                    }
                } else {
                    DebugLogger.error('Cannot send ICE candidate - WebSocket not ready:', {
                        readyState: socket?.readyState,
                        candidateType: event.candidate.type,
                        socketExists: !!socket
                    });
                    console.error('WebSocket not ready for ICE candidate:', socket?.readyState);
                }
            } else {
                DebugLogger.ice('ICE gathering complete - End of candidates');
                webrtcDebugger.iceGatheringComplete = true;
                webrtcDebugger.logStateTransition('ice_candidate', 'gathering', 'complete', {
                    turnServerUsed: webrtcDebugger.turnServerUsed
                });
            }
        };

        // Enhanced connection state monitoring with comprehensive debugging
        peerConnection.onconnectionstatechange = () => {
            const oldState = webrtcDebugger.connectionStates.length > 0 ? 
                webrtcDebugger.connectionStates[webrtcDebugger.connectionStates.length - 1].newState : 'unknown';

            const stateInfo = {
                oldState,
                newState: peerConnection.connectionState,
                iceConnectionState: peerConnection.iceConnectionState,
                signalingState: peerConnection.signalingState,
                localDescription: !!peerConnection.localDescription,
                remoteDescription: !!peerConnection.remoteDescription
            };

            DebugLogger.connection('PeerConnection state changed', stateInfo);
            webrtcDebugger.logStateTransition('connection', oldState, peerConnection.connectionState, stateInfo);

            switch (peerConnection.connectionState) {
                case 'connecting':
                    DebugLogger.connection('WebRTC connection establishing...');
                    addVideoSystemMessage('🔄 Connecting to video call...');
                    webrtcDebugger.remotePeerActive = true;
                    break;
                case 'connected':
                    const connectionMetrics = {
                        peerId: webrtcDebugger.peerId,
                        connectionTime: Date.now() - webrtcDebugger.startTime,
                        retryAttempts: webrtcDebugger.retryCount,
                        iceGatheringComplete: webrtcDebugger.iceGatheringComplete
                    };
                    DebugLogger.success('WebRTC connection established', connectionMetrics);

                    addVideoSystemMessage('✅ Video call connected successfully!');
                    webrtcRetryAttempts = 0;
                    webrtcDebugger.retryCount = 0;
                    webrtcDebugger.remotePeerActive = true;
                    webrtcDebugger.mediaStreamActive = true;

                    // Clear timeout on successful connection
                    if (peerConnectionTimeout) {
                        clearTimeout(peerConnectionTimeout);
                        peerConnectionTimeout = null;
                    }
                    break;
                case 'disconnected':
                    DebugLogger.connection('WebRTC connection disconnected');
                    addVideoSystemMessage('⚠️ Video call disconnected.');
                    webrtcDebugger.remotePeerActive = false;

                    const disconnectAnalysis = webrtcDebugger.analyzeConnectionFailure(peerConnection);
                    DebugLogger.debug('Disconnection analysis', disconnectAnalysis);

                    // Attempt automatic reconnection for disconnected state
                    if (webrtcDebugger.shouldRetry(disconnectAnalysis)) {
                        const strategy = webrtcDebugger.getRetryStrategy(disconnectAnalysis);
                        DebugLogger.connection(`Scheduling reconnection attempt using ${strategy.method}`, { delay: strategy.delay });
                        addVideoSystemMessage(`🔄 Attempting to reconnect... (${webrtcDebugger.retryCount + 1}/${webrtcDebugger.maxRetries})`);
                        setTimeout(() => attemptWebRTCRecovery(strategy), strategy.delay);
                    } else {
                        DebugLogger.error('Cannot retry - maximum attempts reached or non-retryable failure');
                        showPermanentConnectionError(disconnectAnalysis.failureReason);
                    }
                    break;
                case 'failed':
                    DebugLogger.error('WebRTC connection failed');
                    const failureAnalysis = webrtcDebugger.analyzeConnectionFailure(peerConnection);
                    handleEnhancedWebRTCFailure(failureAnalysis, 'connection_failed');
                    break;
                case 'closed':
                    DebugLogger.connection('WebRTC connection closed');
                    webrtcDebugger.logStateTransition('connection', 'failed', 'closed', {
                        reason: 'peer_connection_closed'
                    });
                    addVideoSystemMessage('📞 Video call ended.');
                    webrtcDebugger.remotePeerActive = false;
                    webrtcDebugger.mediaStreamActive = false;

                    if (peerConnectionTimeout) {
                        clearTimeout(peerConnectionTimeout);
                        peerConnectionTimeout = null;
                    }
                    break;
            }
        };

        // Enhanced ICE connection state monitoring
        peerConnection.oniceconnectionstatechange = () => {
            const oldIceState = webrtcDebugger.connectionStates
                .filter(s => s.type === 'ice_connection')
                .slice(-1)[0]?.newState || 'unknown';

            webrtcDebugger.logStateTransition('ice_connection', oldIceState, peerConnection.iceConnectionState, {
                connectionState: peerConnection.connectionState,
                signalingState: peerConnection.signalingState,
                gatheringState: peerConnection.iceGatheringState
            });

            switch (peerConnection.iceConnectionState) {
                case 'checking':
                    console.log('🔍 ICE connectivity checks in progress...');
                    break;
                case 'connected':
                    console.log('✅ ICE connectivity established');
                    webrtcDebugger.remotePeerActive = true;
                    break;
                case 'completed':
                    console.log('🎯 ICE connectivity checks completed successfully');
                    webrtcDebugger.iceGatheringComplete = true;
                    break;
                case 'disconnected':
                    console.log('⚠️ ICE connection disconnected, monitoring for recovery...');
                    webrtcDebugger.remotePeerActive = false;

                    // Wait briefly for potential recovery before taking action
                    setTimeout(() => {
                        if (peerConnection && peerConnection.iceConnectionState === 'disconnected') {
                            console.log('🔄 ICE still disconnected after grace period, attempting restart...');
                            peerConnection.restartIce();
                        }
                    }, 3000);
                    break;
                case 'failed':
                    console.log('❌ ICE connection failed');
                    webrtcDebugger.iceCandidatesExhausted = true;
                    webrtcDebugger.remotePeerActive = false;

                    const iceFailureAnalysis = webrtcDebugger.analyzeConnectionFailure(peerConnection);
                    handleEnhancedWebRTCFailure(iceFailureAnalysis, 'ice_connection_failed');
                    break;
                case 'closed':
                    console.log('🔒 ICE connection closed');
                    webrtcDebugger.remotePeerActive = false;
                    break;
            }
        };

        // Enhanced ICE gathering state monitoring
        peerConnection.onicegatheringstatechange = () => {
            webrtcDebugger.logStateTransition('ice_gathering', 'unknown', peerConnection.iceGatheringState, {
                iceConnectionState: peerConnection.iceConnectionState
            });

            switch (peerConnection.iceGatheringState) {
                case 'gathering':
                    console.log('🔍 ICE gathering in progress...');
                    break;
                case 'complete':
                    console.log('✅ ICE gathering complete');
                    webrtcDebugger.iceGatheringComplete = true;

                    // Check if we used TURN servers
                    if (peerConnection.getStats) {
                        peerConnection.getStats().then(stats => {
                            stats.forEach(report => {
                                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                                    if (report.remoteCandidateId) {
                                        stats.forEach(candidate => {
                                            if (candidate.id === report.remoteCandidateId && 
                                                candidate.candidateType === 'relay') {
                                                webrtcDebugger.turnServerUsed = true;
                                                console.log('📡 TURN server being used for connection');
                                            }
                                        });
                                    }
                                }
                            });
                        }).catch(e => console.warn('Failed to get connection stats:', e));
                    }
                    break;
            }
        };

        // Enhanced signaling state monitoring
        peerConnection.onsignalingstatechange = () => {
            const oldSignalingState = webrtcDebugger.connectionStates
                .filter(s => s.type === 'signaling')
                .slice(-1)[0]?.newState || 'unknown';

            webrtcDebugger.logStateTransition('signaling', oldSignalingState, peerConnection.signalingState, {
                connectionState: peerConnection.connectionState,
                iceConnectionState: peerConnection.iceConnectionState
            });
        };

        // Create offer if initiator
        if (isInitiator) {
            setTimeout(async () => {
                await createOffer();
            }, 100);
        }

        return peerConnection;
    } catch (error) {
        console.error('Error initializing WebRTC:', error);
        addVideoSystemMessage('Failed to initialize video connection.');
        throw error;
    }
}

async function createOffer() {
    const offerStartTime = Date.now();

    try {
        console.log('🎯 Starting offer creation process...');
        console.log('📊 Pre-offer state:', {
            hasPeerConnection: !!peerConnection,
            signalingState: peerConnection?.signalingState,
            iceConnectionState: peerConnection?.iceConnectionState,
            connectionState: peerConnection?.connectionState,
            hasLocalStream: !!localStream,
            localStreamTracks: localStream?.getTracks().length || 0,
            isInitiator,
            queuedCandidates: iceCandidateQueue.length
        });

        if (!peerConnection || peerConnection.signalingState === 'closed') {
            throw new Error('Peer connection not available or closed');
        }

        // Enhanced state checking to prevent collisions
        if (peerConnection.signalingState !== 'stable') {
            console.log('⚠️ Cannot create offer, peer connection not in stable state:', {
                currentState: peerConnection.signalingState,
                iceConnectionState: peerConnection.iceConnectionState,
                connectionState: peerConnection.connectionState
            });
            return;
        }

        // Additional safety check for concurrent operations
        if (peerConnection.localDescription) {
            console.warn('⚠️ Local description already exists, potential collision:', {
                localDescriptionType: peerConnection.localDescription.type,
                remoteDescriptionType: peerConnection.remoteDescription?.type
            });
        }

        console.log('🔧 Creating WebRTC offer with constraints...');
        const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
            iceRestart: false
        });

        const offerCreateTime = Date.now() - offerStartTime;
        console.log(`✅ Offer created successfully in ${offerCreateTime}ms`);
        console.log('📄 Offer details:', {
            type: offer.type,
            sdpLength: offer.sdp.length,
            hasVideo: offer.sdp.includes('m=video'),
            hasAudio: offer.sdp.includes('m=audio'),
            fingerprint: offer.sdp.match(/a=fingerprint:(\S+)/)?.[1]?.substring(0, 20) + '...'
        });

        // Critical state verification before setting local description
        console.log('🔍 Pre-setLocalDescription state check:', {
            signalingState: peerConnection.signalingState,
            iceConnectionState: peerConnection.iceConnectionState,
            connectionState: peerConnection.connectionState,
            hasRemoteDescription: !!peerConnection.remoteDescription
        });

        // Double-check state before setting local description (race condition protection)
        if (peerConnection.signalingState !== 'stable') {
            console.log('❌ Signaling state changed during offer creation, aborting offer:', {
                expectedState: 'stable',
                currentState: peerConnection.signalingState,
                timeSinceStart: Date.now() - offerStartTime
            });
            return;
        }

        console.log('📝 Setting local description with offer...');
        await peerConnection.setLocalDescription(offer);

        const setLocalTime = Date.now() - offerStartTime;
        console.log(`✅ Local description set successfully in ${setLocalTime}ms total`);
        console.log('📊 Post-setLocalDescription state:', {
            signalingState: peerConnection.signalingState,
            iceConnectionState: peerConnection.iceConnectionState,
            connectionState: peerConnection.connectionState,
            localDescriptionType: peerConnection.localDescription?.type,
            iceGatheringState: peerConnection.iceGatheringState
        });

        // Verify WebSocket before sending
        if (socket?.readyState === WebSocket.OPEN) {
            console.log('📡 Sending offer to remote peer via WebSocket...');
            const offerMessage = {
                type: 'webrtc_offer',
                offer: offer.toJSON ? offer.toJSON() : offer,
                timestamp: Date.now()
            };

            socket.send(JSON.stringify(offerMessage));
            console.log('✅ Offer sent successfully');

        } else {
            throw new Error(`WebSocket not available for sending offer (state: ${socket?.readyState})`);
        }

        const totalTime = Date.now() - offerStartTime;
        console.log(`🎯 Offer creation process completed successfully in ${totalTime}ms`);

    } catch (error) {
        const errorTime = Date.now() - offerStartTime;
        console.error(`❌ Error creating offer after ${errorTime}ms:`, {
            error: error.message,
            errorStack: error.stack,
            peerConnectionState: peerConnection?.signalingState,
            iceConnectionState: peerConnection?.iceConnectionState,
            connectionState: peerConnection?.connectionState
        });

        addVideoSystemMessage('Failed to create video offer. Please try again.');

        // Enhanced state reset on error
        if (peerConnection && peerConnection.signalingState !== 'stable' && peerConnection.signalingState !== 'closed') {
            try {
                console.log('🔄 Attempting to reset peer connection state after offer creation error...');
                console.log('📊 State before reset:', {
                    signalingState: peerConnection.signalingState,
                    localDescription: peerConnection.localDescription?.type,
                    remoteDescription: peerConnection.remoteDescription?.type
                });

                await peerConnection.setLocalDescription(null);
                console.log('✅ Peer connection state reset successfully');
                console.log('📊 State after reset:', {
                    signalingState: peerConnection.signalingState,
                    localDescription: peerConnection.localDescription?.type,
                    remoteDescription: peerConnection.remoteDescription?.type
                });

                // Reset state flags
                isRemoteDescriptionSet = false;

                // Clear ICE candidate queue after reset
                const clearedCandidates = iceCandidateQueue.length;
                iceCandidateQueue = [];
                console.log(`🧹 Cleared ${clearedCandidates} ICE candidates after state reset`);

            } catch (resetError) {
                console.error('❌ Failed to reset state after offer error:', resetError);

                // If we can't reset cleanly, may need to recreate peer connection
                console.log('⚠️ State reset failed, peer connection may need to be recreated');
            }
        }
    }
}

async function handleWebRTCOffer(data) {
    try {
        console.log('Handling WebRTC offer...');

        if (!peerConnection) {
            console.log('No peer connection, initializing...');
            await initializeWebRTC(false);
        }

        if (!data.offer) {
            console.error('No offer data received');
            addVideoSystemMessage('Invalid video offer received.');
            return;
        }

        const currentState = peerConnection.signalingState;
        console.log('Current signaling state:', currentState);

        // Handle offer collision detection with enhanced logging
        if (currentState === 'have-local-offer') {
            console.log('🔄 OFFER COLLISION DETECTED! Both peers created offers simultaneously.');
            console.log('Collision Details:', {
                localSignalingState: peerConnection.signalingState,
                iceConnectionState: peerConnection.iceConnectionState,
                connectionState: peerConnection.connectionState,
                localOfferSDP: peerConnection.localDescription?.sdp.substring(0, 100) + '...',
                remoteOfferSDP: data.offer?.sdp?.substring(0, 100) + '...'
            });

            // Clear ICE candidate queue during collision resolution
            const queuedCandidatesCount = iceCandidateQueue.length;
            iceCandidateQueue = [];
            console.log(`Cleared ${queuedCandidatesCount} queued ICE candidates during collision resolution`);

            // Implement collision resolution using deterministic comparison
            const localOffer = peerConnection.localDescription;
            const remoteOffer = new RTCSessionDescription(data.offer);

            // Use deterministic comparison based on offer fingerprint/session info
            const localFingerprint = localOffer.sdp.match(/a=fingerprint:(\S+)/)?.[1] || '';
            const remoteFingerprint = remoteOffer.sdp.match(/a=fingerprint:(\S+)/)?.[1] || '';

            // Determine which peer should rollback (be "polite")
            const shouldRollback = localFingerprint < remoteFingerprint || 
                                   (localFingerprint === remoteFingerprint && Math.random() < 0.5);

            console.log('Collision Resolution Decision:', {
                localFingerprint: localFingerprint.substring(0, 20) + '...',
                remoteFingerprint: remoteFingerprint.substring(0, 20) + '...',
                shouldRollback,
                reason: shouldRollback ? 'Rolling back local offer' : 'Keeping local offer'
            });

            if (shouldRollback) {
                console.log('🔄 Rolling back local offer to resolve collision');

                try {
                    // Rollback local description using null (proper WebRTC way)
                    await peerConnection.setLocalDescription(null);
                    console.log('✅ Local description rolled back successfully');
                    console.log('Post-rollback state:', {
                        signalingState: peerConnection.signalingState,
                        iceConnectionState: peerConnection.iceConnectionState,
                        localDescription: peerConnection.localDescription,
                        remoteDescription: peerConnection.remoteDescription
                    });

                    // Reset state flags
                    isRemoteDescriptionSet = false;

                    // Now proceed to accept the remote offer
                    console.log('🔄 Setting remote description after rollback');
                    await peerConnection.setRemoteDescription(remoteOffer);
                    isRemoteDescriptionSet = true;

                    console.log('✅ Remote description set after collision resolution');
                    console.log('Post-remote-description state:', {
                        signalingState: peerConnection.signalingState,
                        iceConnectionState: peerConnection.iceConnectionState,
                        remoteDescriptionType: peerConnection.remoteDescription?.type,
                        queuedCandidates: iceCandidateQueue.length
                    });

                    // Flush any new ICE candidates that arrived during process
                    await flushQueuedCandidates();

                    // Create and send answer
                    const answer = await peerConnection.createAnswer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true
                    });

                    await peerConnection.setLocalDescription(answer);
                    console.log('✅ Answer created and set after collision resolution');
                    console.log('Final state after collision resolution:', {
                        signalingState: peerConnection.signalingState,
                        iceConnectionState: peerConnection.iceConnectionState,
                        connectionState: peerConnection.connectionState
                    });

                    if (socket?.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            type: 'webrtc_answer',
                            answer: answer.toJSON ? answer.toJSON() : answer
                        }));
                        console.log('✅ Answer sent after collision resolution');
                    } else {
                        throw new Error('WebSocket not available for sending answer after collision resolution');
                    }
                } catch (rollbackError) {
                    console.error('❌ Error during collision resolution rollback:', rollbackError);
                    addVideoSystemMessage('Failed to resolve connection collision. Please try again.');
                    throw rollbackError;
                }
            } else {
                console.log('⚠️ Ignoring remote offer due to collision resolution (keeping local offer)');
                console.log('Continuing with local offer, remote peer should rollback');
                // Keep our local offer and ignore the remote one
                return;
            }
        } else if (currentState === 'stable') {
            console.log('Setting remote description from offer (stable state)');
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            console.log('Remote description set successfully');

            // Mark remote description as set and flush queued candidates
            isRemoteDescriptionSet = true;
            await flushQueuedCandidates();

            // Create and send answer
            const answer = await peerConnection.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            console.log('Answer created, setting local description');
            await peerConnection.setLocalDescription(answer);
            console.log('Local description set');

            if (socket?.readyState === WebSocket.OPEN) {
                console.log('Sending answer to remote peer');
                socket.send(JSON.stringify({
                    type: 'webrtc_answer',
                    answer: answer.toJSON ? answer.toJSON() : answer
                }));
            } else {
                throw new Error('WebSocket not available for sending answer');
            }
        } else if (currentState === 'have-remote-offer') {
            console.log('Already have remote offer, skipping setRemoteDescription');
            // Remote description already set, just flush candidates if needed
            if (!isRemoteDescriptionSet) {
                isRemoteDescriptionSet = true;
                await flushQueuedCandidates();
            }
        } else {
            console.warn('Cannot set remote description in current signaling state:', currentState);
            addVideoSystemMessage('Invalid connection state for video offer.');
            return;
        }
    } catch (error) {
        console.error('Error handling offer:', error);
        addVideoSystemMessage('Failed to handle video offer. Connection may fail.');

        // Reset state on error to allow recovery
        if (peerConnection && peerConnection.signalingState !== 'stable') {
            try {
                console.log('Attempting to recover from offer handling error');
                await peerConnection.setLocalDescription(null);
                isRemoteDescriptionSet = false;
            } catch (recoveryError) {
                console.error('Failed to recover from offer error:', recoveryError);
            }
        }
    }
}

async function handleWebRTCAnswer(data) {
    try {
        console.log('Handling WebRTC answer...');

        if (!peerConnection) {
            console.error('No peer connection available for answer');
            addVideoSystemMessage('Video connection error: No peer connection.');
            return;
        }

        if (!data.answer) {
            console.error('No answer data received');
            addVideoSystemMessage('Invalid video answer received.');
            return;
        }

        const currentState = peerConnection.signalingState;
        console.log('Current signaling state when handling answer:', currentState);

        // Only set remote description if we're in the correct state
        if (currentState === 'have-local-offer') {
            console.log('Setting remote description from answer');
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('Remote description set successfully from answer');

            // Mark remote description as set and flush queued candidates
            isRemoteDescriptionSet = true;
            await flushQueuedCandidates();

            console.log('WebRTC negotiation completed successfully');
            addVideoSystemMessage('Video connection negotiation completed!');
        } else if (currentState === 'stable') {
            console.log('Connection already stable, answer may be duplicate or late');
            // Connection is already stable, might be a duplicate answer
            // Ensure we flush any remaining queued candidates
            if (!isRemoteDescriptionSet) {
                isRemoteDescriptionSet = true;
                await flushQueuedCandidates();
            }
        } else if (currentState === 'have-remote-offer') {
            console.warn('Received answer while in have-remote-offer state - possible collision aftermath');
            // This might happen after collision resolution, ignore gracefully
            return;
        } else {
            console.warn('Cannot set remote description in current signaling state:', currentState);
            addVideoSystemMessage('Invalid connection state for video answer.');
            return;
        }
    } catch (error) {
        console.error('Error handling answer:', error);
        addVideoSystemMessage('Failed to handle video answer. Connection may fail.');

        // Reset state on error to allow recovery
        if (peerConnection && peerConnection.signalingState !== 'stable') {
            try {
                console.log('Attempting to recover from answer handling error');
                isRemoteDescriptionSet = false;
            } catch (recoveryError) {
                console.error('Failed to recover from answer error:', recoveryError);
            }
        }
    }
}

// Enhanced ICE candidate handling with strict queueing and overflow prevention
async function handleWebRTCIceCandidate(data) {
    try {
        if (!peerConnection) {
            console.error('❌ No peer connection available for ICE candidate');
            return;
        }

        if (!data.candidate) {
            console.log('🏁 Received end-of-candidates signal');
            return;
        }

        console.log('🧊 Handling ICE candidate:', {
            type: data.candidate.type || 'unknown',
            protocol: data.candidate.protocol || 'unknown',
            address: data.candidate.address || 'unknown',
            port: data.candidate.port || 'unknown',
            priority: data.candidate.priority || 'unknown',
            foundation: data.candidate.foundation || 'unknown'
        });

        // Enhanced state checking for ICE candidate processing
        const canAddCandidate = isRemoteDescriptionSet && 
                                peerConnection.remoteDescription && 
                                peerConnection.signalingState !== 'closed' &&
                                peerConnection.signalingState !== 'have-local-offer';

        console.log('📊 ICE Candidate Processing Status:', {
            canAddCandidate,
            isRemoteDescriptionSet,
            hasRemoteDescription: !!peerConnection.remoteDescription,
            signalingState: peerConnection.signalingState,
            iceConnectionState: peerConnection.iceConnectionState,
            connectionState: peerConnection.connectionState,
            currentQueueLength: iceCandidateQueue.length
        });

        if (canAddCandidate) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                console.log('✅ ICE candidate added successfully:', {
                    type: data.candidate.type,
                    protocol: data.candidate.protocol,
                    address: data.candidate.address?.substring(0, 10) + '...'
                });
            } catch (candidateError) {
                // Enhanced error logging for ICE candidate failures
                DebugLogger.error('Failed to add ICE candidate:', {
                    errorName: candidateError.name,
                    errorMessage: candidateError.message,
                    errorStack: candidateError.stack?.substring(0, 200),
                    candidateType: data.candidate.type,
                    candidateProtocol: data.candidate.protocol,
                    candidateAddress: data.candidate.address?.substring(0, 15),
                    signalingState: peerConnection.signalingState,
                    iceConnectionState: peerConnection.iceConnectionState,
                    connectionState: peerConnection.connectionState,
                    hasRemoteDescription: !!peerConnection.remoteDescription
                });
                console.error('ICE candidate add error:', candidateError.name, candidateError.message, candidateError.stack);

                // Only queue candidates for specific recoverable errors
                const recoverableErrors = ['InvalidStateError', 'OperationError'];
                if (!recoverableErrors.includes(candidateError.name) && iceCandidateQueue.length < 50) {
                    console.log('⏳ Queueing failed candidate for retry (recoverable error)');
                    iceCandidateQueue.push(data.candidate);
                } else {
                    console.log('🚫 Not queueing candidate due to permanent error or queue overflow');
                }
            }
        } else {
            // Implement queue overflow protection
            const MAX_QUEUE_SIZE = 100;
            if (iceCandidateQueue.length >= MAX_QUEUE_SIZE) {
                console.warn('⚠️ ICE candidate queue overflow! Clearing oldest candidates');
                // Keep only the most recent candidates
                iceCandidateQueue = iceCandidateQueue.slice(-50);
                console.log(`Queue trimmed to ${iceCandidateQueue.length} candidates`);
            }

            // Queue the candidate for later processing
            iceCandidateQueue.push(data.candidate);
            console.log('⏳ Remote description not ready, queueing ICE candidate:', {
                isRemoteDescriptionSet,
                hasRemoteDescription: !!peerConnection.remoteDescription,
                signalingState: peerConnection.signalingState,
                iceConnectionState: peerConnection.iceConnectionState,
                newQueueLength: iceCandidateQueue.length,
                candidateType: data.candidate.type
            });
        }
    } catch (error) {
        console.error('❌ Error handling ICE candidate:', error);
    }
}

// Enhanced flush queued ICE candidates with better error handling
async function flushIceCandidateQueue() {
    if (!peerConnection || iceCandidateQueue.length === 0) {
        return;
    }

    console.log(`Flushing ${iceCandidateQueue.length} queued ICE candidates`);

    const candidatesToProcess = [...iceCandidateQueue]; // Create a copy
    iceCandidateQueue = []; // Clear the queue immediately

    for (const candidateData of candidatesToProcess) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
            console.log('Queued ICE candidate added successfully');
        } catch (candidateError) {
            // Enhanced error logging for queued candidate failures
            DebugLogger.error('Failed to add queued ICE candidate:', {
                errorName: candidateError.name,
                errorMessage: candidateError.message,
                errorStack: candidateError.stack?.substring(0, 200),
                candidateType: candidateData.type,
                candidateProtocol: candidateData.protocol
            });
            console.error('Queued ICE candidate error:', candidateError.name, candidateError.message, candidateError.stack);
            // Don't re-queue failed candidates to avoid infinite loops
        }
    }
}

// Enhanced function for flushing queued candidates with comprehensive error handling
async function flushQueuedCandidates() {
    if (!peerConnection || !isRemoteDescriptionSet || iceCandidateQueue.length === 0) {
        console.log('🚫 Cannot flush candidates:', {
            hasPeerConnection: !!peerConnection,
            isRemoteDescriptionSet,
            queueLength: iceCandidateQueue.length,
            signalingState: peerConnection?.signalingState,
            iceConnectionState: peerConnection?.iceConnectionState,
            connectionState: peerConnection?.connectionState
        });
        return;
    }

    const startTime = Date.now();
    const initialQueueLength = iceCandidateQueue.length;

    console.log(`🔄 Starting to flush ${initialQueueLength} queued ICE candidates`);
    console.log('📊 Connection state before flushing:', {
        signalingState: peerConnection.signalingState,
        iceConnectionState: peerConnection.iceConnectionState,
        connectionState: peerConnection.connectionState,
        hasRemoteDescription: !!peerConnection.remoteDescription,
        remoteDescriptionType: peerConnection.remoteDescription?.type
    });

    // Create a copy of candidates and immediately clear the queue to prevent overflow
    const candidatesToProcess = [...iceCandidateQueue];
    iceCandidateQueue = []; // Clear queue immediately to prevent new candidates from interfering

    let successCount = 0;
    let failCount = 0;
    const permanentFailures = [];
    const retryableCandidates = [];

    for (let i = 0; i < candidatesToProcess.length; i++) {
        const candidateData = candidatesToProcess[i];

        try {
            // Enhanced validation before adding candidate
            if (peerConnection.signalingState === 'closed') {
                console.log('⚠️ Peer connection closed, aborting flush of remaining candidates');
                // Don't re-queue remaining candidates if connection is closed
                break;
            }

            if (!peerConnection.remoteDescription) {
                console.warn('⚠️ Remote description lost during flush, stopping');
                // Re-queue remaining candidates
                retryableCandidates.push(...candidatesToProcess.slice(i));
                break;
            }

            await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
            console.log(`✅ ICE candidate ${i + 1}/${candidatesToProcess.length} added successfully:`, {
                type: candidateData.type,
                protocol: candidateData.protocol,
                address: candidateData.address?.substring(0, 15) + '...'
            });
            successCount++;

        } catch (error) {
            console.error(`❌ Failed to add queued ICE candidate ${i + 1}/${candidatesToProcess.length}:`, {
                error: error.message,
                errorName: error.name,
                candidateType: candidateData.type,
                candidateProtocol: candidateData.protocol,
                signalingState: peerConnection.signalingState,
                iceConnectionState: peerConnection.iceConnectionState
            });
            failCount++;

            // Categorize failures for appropriate handling
            const permanentErrors = ['OperationError', 'InvalidAccessError', 'NotSupportedError'];
            const retryableErrors = ['InvalidStateError', 'NetworkError'];

            if (permanentErrors.includes(error.name)) {
                permanentFailures.push(candidateData);
                console.log(`🚫 Permanent failure for candidate type ${candidateData.type}, not retrying`);
            } else if (retryableErrors.includes(error.name)) {
                retryableCandidates.push(candidateData);
                console.log(`⏳ Retryable failure for candidate type ${candidateData.type}, will retry`);
            } else {
                // Unknown error, treat as retryable but with caution
                if (retryableCandidates.length < 20) { // Limit retryable queue
                    retryableCandidates.push(candidateData);
                    console.log(`❓ Unknown error for candidate type ${candidateData.type}, treating as retryable`);
                } else {
                    console.log(`🚫 Too many retryable candidates, treating as permanent failure`);
                    permanentFailures.push(candidateData);
                }
            }
        }
    }

    const flushDuration = Date.now() - startTime;

    console.log(`🏁 ICE candidates flush completed in ${flushDuration}ms:`, {
        totalProcessed: candidatesToProcess.length,
        successful: successCount,
        failed: failCount,
        permanentFailures: permanentFailures.length,
        retryable: retryableCandidates.length,
        successRate: `${((successCount / candidatesToProcess.length) * 100).toFixed(1)}%`
    });

    // Handle retryable candidates - re-queue with limit
    if (retryableCandidates.length > 0 && peerConnection.signalingState !== 'closed') {
        const MAX_RETRY_QUEUE = 30;
        const candidatesToRequeue = retryableCandidates.slice(0, MAX_RETRY_QUEUE);

        console.log(`⏳ Re-queueing ${candidatesToRequeue.length} retryable candidates (limit: ${MAX_RETRY_QUEUE})`);
        iceCandidateQueue.push(...candidatesToRequeue);

        if (retryableCandidates.length > MAX_RETRY_QUEUE) {
            console.warn(`⚠️ Dropped ${retryableCandidates.length - MAX_RETRY_QUEUE} candidates due to retry queue limit`);
        }
    }

    // Log final queue status
    console.log('📊 Post-flush queue status:', {
        newQueueLength: iceCandidateQueue.length,
        connectionState: peerConnection.connectionState,
        signalingState: peerConnection.signalingState,
        iceConnectionState: peerConnection.iceConnectionState
    });

    // Show user feedback for significant issues
    if (failCount > successCount && candidatesToProcess.length > 5) {
        showUserFeedback(`Warning: ${failCount}/${candidatesToProcess.length} ICE candidates failed`, 'warning');
    } else if (successCount > 0) {
        console.log(`✅ Successfully processed ${successCount} ICE candidates`);
    }
}

// Enhanced WebRTC failure handler with intelligent recovery
function handleEnhancedWebRTCFailure(analysis, failureType) {
    console.log(`🚨 Enhanced WebRTC Failure Handler triggered:`, {
        failureType,
        analysis: analysis.failureReason,
        retryCount: webrtcDebugger.retryCount,
        maxRetries: webrtcDebugger.maxRetries
    });

    // Clear any existing timeouts
    if (peerConnectionTimeout) {
        clearTimeout(peerConnectionTimeout);
        peerConnectionTimeout = null;
    }

    if (webrtcDebugger.shouldRetry(analysis)) {
        const strategy = webrtcDebugger.getRetryStrategy(analysis);
        webrtcDebugger.retryCount++;

        console.log(`🔄 Attempting recovery using ${strategy.method} strategy (${webrtcDebugger.retryCount}/${webrtcDebugger.maxRetries})`);

        addVideoSystemMessage(`🔄 Connection failed (${analysis.failureReason}). Retrying... (${webrtcDebugger.retryCount}/${webrtcDebugger.maxRetries})`);
        showUserFeedback(`Attempting recovery using ${strategy.method} strategy`, 'warning');

        setTimeout(() => attemptWebRTCRecovery(strategy), strategy.delay);
    } else {
        console.log('❌ Maximum retry attempts reached or non-retryable failure');
        showPermanentConnectionError(analysis.failureReason);
    }
}

// Intelligent WebRTC recovery function
async function attemptWebRTCRecovery(strategy) {
    try {
        console.log(`🔄 Starting WebRTC recovery using ${strategy.method} strategy...`);

        webrtcDebugger.logStateTransition('recovery', 'failed', 'attempting', {
            strategy: strategy.method,
            retryCount: webrtcDebugger.retryCount,
            reason: strategy.reason
        });

        if (strategy.method === 'ice_restart' && peerConnection && peerConnection.signalingState !== 'closed') {
            console.log('🔄 Attempting ICE restart recovery...');

            // Clean ICE candidate queue before restart
            const clearedCandidates = iceCandidateQueue.length;
            iceCandidateQueue = [];
            isRemoteDescriptionSet = false;

            console.log(`🧹 Cleared ${clearedCandidates} queued ICE candidates before restart`);

            // Log state before ICE restart
            console.log('📊 Pre-ICE restart state:', {
                signalingState: peerConnection.signalingState,
                iceConnectionState: peerConnection.iceConnectionState,
                connectionState: peerConnection.connectionState,
                hasRemoteDescription: !!peerConnection.remoteDescription
            });

            // Restart ICE
            peerConnection.restartIce();

            // Set timeout for this recovery attempt
            peerConnectionTimeout = setTimeout(() => {
                if (peerConnection && peerConnection.connectionState !== 'connected') {
                    console.log('⏰ ICE restart recovery timed out');
                    const timeoutAnalysis = webrtcDebugger.analyzeConnectionFailure(peerConnection);
                    handleEnhancedWebRTCFailure(timeoutAnalysis, 'recovery_timeout');
                }
            }, PEER_CONNECTION_TIMEOUT);

        } else {
            console.log('🔄 Attempting full reconnection recovery...');

            // Full reconnection: clean up and reinitialize
            if (peerConnection) {
                peerConnection.close();
                peerConnection = null;
            }

            // Clear state completely
            iceCandidateQueue = [];
            isRemoteDescriptionSet = false;

            // Reset some debugger flags for new attempt
            webrtcDebugger.iceGatheringComplete = false;
            webrtcDebugger.iceCandidatesExhausted = false;
            webrtcDebugger.turnServerUsed = false;

            addVideoSystemMessage('🔄 Reinitializing video connection...');

            // Reinitialize WebRTC with same role
            await initializeWebRTC(isInitiator);

            // Trigger new negotiation if we're the initiator
            if (isInitiator) {
                setTimeout(() => createOffer(), 1000);
            }
        }

        console.log('✅ WebRTC recovery attempt initiated successfully');

    } catch (recoveryError) {
        console.error('❌ Error during WebRTC recovery:', recoveryError);
        webrtcDebugger.logStateTransition('recovery', 'attempting', 'failed', {
            error: recoveryError.message,
            strategy: strategy.method
        });

        addVideoSystemMessage(`Recovery failed: ${recoveryError.message}`);

        // Continue with failure handling for the recovery attempt
        const failureAnalysis = webrtcDebugger.analyzeConnectionFailure(peerConnection);
        handleEnhancedWebRTCFailure(failureAnalysis, 'recovery_failed');
    }
}

// Show permanent connection error with enhanced UI
function showPermanentConnectionError(failureReason) {
    console.log('❌ Showing permanent connection error UI');

    const reasonMessages = {
        'nat_traversal_failed': 'NAT traversal failed. Your network may be blocking video connections.',
        'ice_connectivity_failed': 'Failed to establish peer-to-peer connection.',
        'peer_connection_failed': 'Peer connection failed due to network issues.',
        'connection_timeout': 'Connection timed out. Please check your internet connection.',
        'remote_peer_disconnected': 'The other person has disconnected.',
        'unknown': 'Unknown connection error occurred.'
    };

    const userMessage = reasonMessages[failureReason] || reasonMessages.unknown;

    addVideoSystemMessage(`❌ ${userMessage}`);
    showErrorFeedback(`Connection failed permanently: ${userMessage}`);

    // Show comprehensive retry UI
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 12px;
        padding: 20px;
        margin: 15px 0;
        text-align: center;
    `;

    errorContainer.innerHTML = `
        <div style="color: #dc3545; font-size: 18px; margin-bottom: 10px;">🚫 Connection Failed</div>
        <div style="color: #6c757d; margin-bottom: 15px;">${userMessage}</div>
        <div style="font-size: 12px; color: #6c757d; margin-bottom: 15px;">
            Debug Info: ${failureReason} | Attempts: ${webrtcDebugger.retryCount}/${webrtcDebugger.maxRetries}
        </div>
    `;

    // Add retry button
    const retryBtn = document.createElement('button');
    retryBtn.textContent = '🔄 Try New Connection';
    retryBtn.style.cssText = `
        background-color: #28a745;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
        margin-right: 10px;
        transition: background-color 0.3s ease;
    `;

    retryBtn.onmouseover = () => retryBtn.style.backgroundColor = '#218838';
    retryBtn.onmouseout = () => retryBtn.style.backgroundColor = '#28a745';

    retryBtn.onclick = () => {
        console.log('🔄 User initiated manual retry after permanent failure');
        webrtcDebugger.reset();
        webrtcRetryAttempts = 0;
        cleanupConnections();

        setTimeout(() => {
            startVideoChat();
        }, 1000);
    };

    // Add debug info button
    const debugBtn = document.createElement('button');
    debugBtn.textContent = '🔍 Debug Info';
    debugBtn.style.cssText = `
        background-color: #6c757d;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
        transition: background-color 0.3s ease;
    `;

    debugBtn.onmouseover = () => debugBtn.style.backgroundColor = '#5a6268';
    debugBtn.onmouseout = () => debugBtn.style.backgroundColor = '#6c757d';

    debugBtn.onclick = () => {
        const debugInfo = JSON.stringify({
            peerId: webrtcDebugger.peerId,
            failureReason,
            connectionStates: webrtcDebugger.connectionStates.slice(-10),
            retryCount: webrtcDebugger.retryCount,
            sessionDuration: Date.now() - webrtcDebugger.startTime,
            userAgent: navigator.userAgent
        }, null, 2);

        navigator.clipboard.writeText(debugInfo).then(() => {
            showUserFeedback('Debug info copied to clipboard!', 'success');
        }).catch(() => {
            console.log('Debug Info:', debugInfo);
            alert('Debug info logged to console (F12)');
        });
    };

    errorContainer.appendChild(retryBtn);
    errorContainer.appendChild(debugBtn);

    if (videoChatMessages) {
        videoChatMessages.appendChild(errorContainer);
        videoChatMessages.scrollTop = videoChatMessages.scrollHeight;
    }
}

// Legacy function wrapper for backward compatibility
function handleWebRTCConnectionFailure() {
    const analysis = webrtcDebugger.analyzeConnectionFailure(peerConnection);
    handleEnhancedWebRTCFailure(analysis, 'legacy_failure');
}

// Enhanced error feedback function for user-facing alerts
function showErrorFeedback(message) {
    // Console log for debugging
    console.error('Error feedback:', message);

    // Create a visual error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translateX(-50%)';
    errorDiv.style.backgroundColor = '#dc3545';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '12px 20px';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    errorDiv.style.zIndex = '10000';
    errorDiv.style.maxWidth = '400px';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.fontWeight = 'bold';
    errorDiv.style.animation = 'slideInFromTop 0.3s ease-out';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);

    // Also show browser alert for critical errors
    if (message.includes('permanently') || message.includes('refresh')) {
        setTimeout(() => {
            alert(message);
        }, 100);
    }
}

// Fix 4: Manual retry button when reconnection fails
function showManualRetryButton() {
    console.log('Showing manual retry button after failed reconnection attempts');

    const retryBtn = document.createElement('button');
    retryBtn.textContent = '🔄 Retry Connection Now';
    retryBtn.style.margin = '10px';
    retryBtn.style.padding = '12px 20px';
    retryBtn.style.backgroundColor = '#28a745';
    retryBtn.style.color = 'white';
    retryBtn.style.border = 'none';
    retryBtn.style.borderRadius = '6px';
    retryBtn.style.cursor = 'pointer';
    retryBtn.style.fontWeight = 'bold';
    retryBtn.style.fontSize = '14px';

    retryBtn.onclick = () => {
        console.log('Manual retry button clicked');
        // Reset reconnection attempts and try again
        reconnectAttempts = 0;

        // Silent reconnection attempt - no user message shown

        // Remove the retry button
        if (retryBtn.parentNode) {
            retryBtn.parentNode.removeChild(retryBtn);
        }

        // Attempt reconnection
        connectWebSocket();
    };

    // Add button to appropriate chat container
    const targetContainer = currentChatType === 'text' ? chatMessages : videoChatMessages;
    if (targetContainer) {
        const btnContainer = document.createElement('div');
        btnContainer.style.textAlign = 'center';
        btnContainer.style.margin = '10px 0';
        btnContainer.appendChild(retryBtn);
        targetContainer.appendChild(btnContainer);
        targetContainer.scrollTop = targetContainer.scrollHeight;
    }
}

// Centralized Error State Manager
class ErrorStateManager {
    constructor() {
        this.activeOverlays = new Set();
        this.retryCallbacks = new Map();
        this.timeoutHandlers = new Map();
        this.isReconnecting = false;
    }

    // Show critical error overlay with full-page modal
    showCriticalError(config = {}) {
        const {
            title = 'Connection Error',
            message = 'Something went wrong',
            type = 'error',
            showRetry = true,
            showGoBack = true,
            onRetry = null,
            onGoBack = null,
            persistent = false
        } = config;

        // Prevent duplicate overlays
        if (this.activeOverlays.has(type)) return;
        this.activeOverlays.add(type);

        const overlay = document.createElement('div');
        overlay.className = 'error-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.3s ease-out;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.4s ease-out;
            position: relative;
        `;

        const iconMap = {
            error: '❌',
            timeout: '⏰',
            permission: '🚫',
            connection: '🌐',
            retry: '🔄'
        };

        modal.innerHTML = `
            <div style="font-size: 60px; margin-bottom: 20px;">${iconMap[type] || iconMap.error}</div>
            <h2 style="color: #333; margin-bottom: 15px; font-size: 24px;">${title}</h2>
            <p style="color: #666; margin-bottom: 30px; font-size: 16px; line-height: 1.6;">${message}</p>
            <div class="error-buttons" style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                ${showRetry ? `<button class="retry-btn" style="background: #28a745; color: white; border: none; padding: 12px 30px; border-radius: 25px; cursor: pointer; font-weight: bold; font-size: 16px; transition: all 0.3s ease;">🔄 Retry</button>` : ''}
                ${showGoBack ? `<button class="go-back-btn" style="background: #6c757d; color: white; border: none; padding: 12px 30px; border-radius: 25px; cursor: pointer; font-weight: bold; font-size: 16px; transition: all 0.3s ease;">← Go Back</button>` : ''}
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Button event listeners
        const retryBtn = modal.querySelector('.retry-btn');
        const goBackBtn = modal.querySelector('.go-back-btn');

        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.removeOverlay(overlay, type);
                if (onRetry) onRetry();
            });
        }

        if (goBackBtn) {
            goBackBtn.addEventListener('click', () => {
                this.removeOverlay(overlay, type);
                if (onGoBack) onGoBack();
                else showHomePage(); // Default action
            });
        }

        // Auto-close for non-persistent overlays
        if (!persistent) {
            setTimeout(() => {
                if (overlay.parentNode) {
                    this.removeOverlay(overlay, type);
                }
            }, 15000);
        }

        return overlay;
    }

    // Show reconnecting overlay with spinner (disabled)
    showReconnectingOverlay() {
        // Reconnecting overlay disabled - no UI shown
        return null;
    }

    // Remove overlay
    removeOverlay(overlay, type) {
        if (overlay && overlay.parentNode) {
            overlay.style.animation = 'fadeOut 0.3s ease-in';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }

        if (type) {
            this.activeOverlays.delete(type);
        }

        if (type === 'reconnecting') {
            this.isReconnecting = false;
        }
    }

    // Handle timeout alerts
    setupTimeoutAlert(timeoutType, duration, onTimeout) {
        const timeoutId = setTimeout(() => {
            console.log(`${timeoutType} timeout triggered after ${duration}ms`);

            if (onTimeout) {
                onTimeout();
            } else {
                // Default timeout handling
                this.showCriticalError({
                    title: 'Connection Timeout',
                    message: `Connection timed out after ${duration / 1000} seconds. Please check your internet connection and try again.`,
                    type: 'timeout',
                    onRetry: () => {
                        if (timeoutType === 'websocket') {
                            connectWebSocket();
                        } else if (timeoutType === 'webrtc') {
                            if (currentChatType === 'video') {
                                startVideoChat();
                            }
                        }
                    }
                });
            }
        }, duration);

        this.timeoutHandlers.set(timeoutType, timeoutId);
        return timeoutId;
    }

    // Clear timeout
    clearTimeoutAlert(timeoutType) {
        const timeoutId = this.timeoutHandlers.get(timeoutType);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeoutHandlers.delete(timeoutType);
        }
    }

    // Clear all timeouts and overlays
    cleanup() {
        // Clear all timeouts
        this.timeoutHandlers.forEach(timeoutId => clearTimeout(timeoutId));
        this.timeoutHandlers.clear();

        // Remove all overlays
        document.querySelectorAll('.error-overlay, .reconnecting-overlay').forEach(overlay => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });

        this.activeOverlays.clear();
        this.isReconnecting = false;
    }
}

// Global error state manager instance
const errorStateManager = new ErrorStateManager();

// Enhanced user feedback system
function showUserFeedback(message, type = 'error', options = {}) {
    console.log(`User feedback (${type}):`, message);

    const {
        fullModal = false,
        showSpinner = false,
        persistent = false,
        onRetry = null,
        onGoBack = null
    } = options;

    // For critical errors or if fullModal is requested, show overlay
    if (fullModal || type === 'critical' || type === 'timeout' || type === 'permission') {
        return errorStateManager.showCriticalError({
            title: type === 'permission' ? 'Permission Required' : 'Error',
            message,
            type,
            persistent,
            onRetry,
            onGoBack
        });
    }

    // Reconnecting feedback disabled - no overlay shown
    if (type === 'reconnecting' || showSpinner) {
        return null;
    }

    // Regular toast notification
    const colors = {
        error: { bg: '#dc3545', border: '#c82333' },
        warning: { bg: '#ffc107', border: '#e0a800', text: '#212529' },
        info: { bg: '#17a2b8', border: '#138496' },
        success: { bg: '#28a745', border: '#1e7e34' },
        // reconnecting feedback disabled
    };

    const colorScheme = colors[type] || colors.error;

    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${colorScheme.bg};
        color: ${colorScheme.text || 'white'};
        padding: 15px 25px;
        border-radius: 10px;
        border: 2px solid ${colorScheme.border};
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        z-index: 10001;
        max-width: 450px;
        text-align: center;
        font-size: 15px;
        font-weight: bold;
        animation: slideInFromTop 0.3s ease-out;
    `;

    const icons = {
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        success: '✅',
        // reconnecting icon disabled
    };

    feedbackDiv.innerHTML = `${icons[type] || icons.error} ${message}`;

    document.body.appendChild(feedbackDiv);

    // Auto-remove
    // Store reference for manual hiding
    feedbackDiv.dataset.feedbackId = Date.now();
    document.body.dataset.lastFeedbackId = feedbackDiv.dataset.feedbackId;
    
    setTimeout(() => {
        if (feedbackDiv.parentNode) {
            feedbackDiv.style.animation = 'slideOutToTop 0.3s ease-in';
            setTimeout(() => {
                if (feedbackDiv.parentNode) {
                    feedbackDiv.parentNode.removeChild(feedbackDiv);
                }
            }, 300);
        }
    }, persistent ? 10000 : 6000);

    return feedbackDiv;
}

// Function to manually hide user feedback
function hideUserFeedback() {
    // Remove all existing feedback divs
    const existingFeedback = document.querySelectorAll('[data-feedback-id]');
    existingFeedback.forEach(div => {
        if (div.parentNode) {
            div.style.animation = 'slideOutToTop 0.2s ease-in';
            setTimeout(() => {
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
            }, 200);
        }
    });
}

// Timeout alert utility
function timeoutAlert(timeoutType, duration, customMessage = null, onRetry = null) {
    const message = customMessage || `Operation timed out after ${duration / 1000} seconds. Please try again.`;

    return errorStateManager.setupTimeoutAlert(timeoutType, duration, () => {
        showUserFeedback(message, 'timeout', {
            fullModal: true,
            persistent: true,
            onRetry: onRetry || (() => {
                console.log(`Retrying ${timeoutType}...`);
                if (timeoutType === 'websocket') {
                    connectWebSocket();
                } else if (timeoutType === 'webrtc') {
                    if (currentChatType === 'video') {
                        startVideoChat();
                    }
                }
            }),
            onGoBack: () => {
                cleanupConnections();
                showHomePage();
            }
        });
    });
}

// Video Element Debugging and Verification Utility
function verifyVideoCleanupState() {
    console.log('🔍 Verifying video element cleanup state...');

    const verificationResults = {
        remoteVideo: {
            found: !!remoteVideo,
            hasSrcObject: remoteVideo ? !!remoteVideo.srcObject : false,
            paused: remoteVideo ? remoteVideo.paused : 'N/A',
            readyState: remoteVideo ? remoteVideo.readyState : 'N/A',
            networkState: remoteVideo ? remoteVideo.networkState : 'N/A',
            currentTime: remoteVideo ? remoteVideo.currentTime : 'N/A',
            videoWidth: remoteVideo ? remoteVideo.videoWidth : 'N/A',
            videoHeight: remoteVideo ? remoteVideo.videoHeight : 'N/A'
        },
        localVideo: {
            found: !!localVideo,
            hasSrcObject: localVideo ? !!localVideo.srcObject : false,
            paused: localVideo ? localVideo.paused : 'N/A',
            readyState: localVideo ? localVideo.readyState : 'N/A',
            networkState: localVideo ? localVideo.networkState : 'N/A',
            currentTime: localVideo ? localVideo.currentTime : 'N/A',
            videoWidth: localVideo ? localVideo.videoWidth : 'N/A',
            videoHeight: localVideo ? localVideo.videoHeight : 'N/A'
        },
        peerConnection: {
            exists: !!peerConnection,
            signalingState: peerConnection ? peerConnection.signalingState : 'N/A',
            iceConnectionState: peerConnection ? peerConnection.iceConnectionState : 'N/A',
            connectionState: peerConnection ? peerConnection.connectionState : 'N/A'
        },
        streams: {
            localStreamExists: !!localStream,
            localStreamActive: localStream ? localStream.active : 'N/A',
            localStreamTracks: localStream ? localStream.getTracks().length : 0
        },
        uiState: {
            isConnected,
            currentChatType,
            iceCandidateQueueLength: iceCandidateQueue.length,
            isRemoteDescriptionSet
        }
    };

    console.log('📊 Video cleanup verification results:', verificationResults);

    // Check for potential issues
    const issues = [];
    if (verificationResults.remoteVideo.hasSrcObject) {
        issues.push('Remote video still has srcObject after cleanup');
    }
    if (verificationResults.peerConnection.exists) {
        issues.push('PeerConnection still exists after cleanup');
    }
    if (verificationResults.remoteVideo.found && verificationResults.remoteVideo.readyState > 0) {
        issues.push('Remote video readyState suggests media is still loaded');
    }
    if (verificationResults.remoteVideo.found && !verificationResults.remoteVideo.paused) {
        issues.push('Remote video is still playing after cleanup');
    }

    if (issues.length > 0) {
        console.warn('⚠️ Potential cleanup issues detected:', issues);
        return { success: false, issues, results: verificationResults };
    } else {
        console.log('✅ Video cleanup verification passed - all elements properly cleaned');
        return { success: true, issues: [], results: verificationResults };
    }
}

// Expose debugging function to global scope for manual testing
window.verifyVideoCleanup = verifyVideoCleanupState;
window.debugVideoState = () => {
    console.log('🎥 Current video element state debug:');
    verifyVideoCleanupState();
};

// Test function to show circle indicator
window.testCircleIndicator = () => {
    console.log('🔍 Testing circle indicator visibility...');
    const strangerVideo = document.querySelector('.stranger-video');

    if (strangerVideo && connectingCircle) {
        // Remove connecting class to show circle
        strangerVideo.classList.remove('connecting');
        connectingCircle.style.display = 'block';
        console.log('✅ Circle indicator should now be visible');

        // Add connecting animation to test that too
        setTimeout(() => {
            strangerVideo.classList.add('connecting');
            connectingCircle.style.display = 'none';
            console.log('🔄 Added connecting animation, circle hidden');

            setTimeout(() => {
                strangerVideo.classList.remove('connecting');
                connectingCircle.style.display = 'block';
                console.log('✅ Removed connecting animation, circle should be visible again');
            }, 3000);
        }, 2000);
    } else {
        console.log('❌ Stranger video element or connecting circle not found');
    }
};

// Add CSS animations for feedback popups
if (!document.getElementById('feedbackAnimations')) {
    const style = document.createElement('style');
    style.id = 'feedbackAnimations';
    style.textContent = `
        @keyframes slideInFromTop {
            0% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
            100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slideOutToTop {
            0% { transform: translateX(-50%) translateY(0); opacity: 1; }
            100% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

function handleNSFWWarning(data) {
    addVideoSystemMessage(`⚠️ ${data.message}`);
    if (data.violations >= 3) {
        addVideoSystemMessage("Multiple violations detected. Connection will be terminated.");
        setTimeout(() => {
            endVideoCall();
            showChatSelection();
        }, 3000);
    }
}

function handlePartnerVideoBlocked(data) {
    addVideoSystemMessage(`Partner's video blocked: ${data.reason}`);

    // Show overlay on remote video
    const remoteVideoContainer = remoteVideo?.parentElement;
    if (remoteVideoContainer) {
        const blockOverlay = document.createElement('div');
        blockOverlay.className = 'video-block-overlay';
        blockOverlay.innerHTML = `
            <div class="block-message">
                <h3>🚫 Video Blocked</h3>
                <p>${sanitizeInput(data.reason)}</p>
            </div>
        `;
        remoteVideoContainer.appendChild(blockOverlay);

        // Remove overlay after 5 seconds
        setTimeout(() => {
            if (blockOverlay.parentNode) {
                blockOverlay.parentNode.removeChild(blockOverlay);
            }
        }, 5000);
    }
}

// Utility Functions
function disconnect() {
    // Fix 1: Set shouldReconnect to false when manually disconnecting
    shouldReconnect = false;

    if (socket) {
        try {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'leave' }));
            }
            socket.close();
        } catch (e) {
            console.error("Socket error on disconnect:", e);
        }
        socket = null;
    }

    isConnected = false;
    updateConnectionStatus(false);
    setAttachButtonEnabled(false);

    // Reset button labels
    const connectLabel = connectBtn?.querySelector('span');
    const videoConnectLabel = videoConnectBtn?.querySelector('span');

    if (connectLabel) connectLabel.textContent = "New";
    if (videoConnectLabel) videoConnectLabel.textContent = "New";

    setConnectButtonDisabled(false);
}

function updateUserCount(count) {
    const safeCount = Math.max(0, parseInt(count) || 0);
    const userText = `${safeCount} online`;

    if (userCountText) {
        userCountText.textContent = userText;
    }
    if (videoUserCountText) {
        videoUserCountText.textContent = userText;
    }
}

function updateConnectionStatus(connected) {
    const connectBtns = [connectBtn, videoConnectBtn].filter(btn => btn);
    connectBtns.forEach(btn => {
        if (connected) {
            btn.classList.remove('disconnected');
        } else {
            btn.classList.add('disconnected');
        }
    });
}

function sendTypingStatus(typing) {
    if (socket?.readyState === WebSocket.OPEN) {
        try {
            socket.send(JSON.stringify({
                type: 'typing',
                isTyping: !!typing
            }));
        } catch (error) {
            console.error('Error sending typing status:', error);
        }
    }
}

function setConnectButtonDisabled(isDisabled) {
    if (connectBtn) connectBtn.disabled = isDisabled;
    if (videoConnectBtn) videoConnectBtn.disabled = isDisabled;
}

function setAttachButtonEnabled(enabled) {
    if (attachBtn) {
        attachBtn.disabled = !enabled;
        attachBtn.style.opacity = enabled ? '1' : '0.5';
        attachBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';

        const menuOptions = attachMenu?.querySelectorAll('.attach-option') || [];
        menuOptions.forEach(option => {
            option.style.opacity = enabled ? '1' : '0.5';
            option.style.cursor = enabled ? 'pointer' : 'not-allowed';
            option.style.pointerEvents = enabled ? 'auto' : 'none';
        });
    }
}

// Event Handlers
function setupEventListeners() {
    // Start Now button from home page
    if (startNowBtn) {
        startNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Start Now button clicked');
            showChatSelection();
        });
    }

    // Home screen buttons
    if (startChatBtn) {
        startChatBtn.addEventListener('click', () => {
            currentChatType = 'text';
            showTermsModal();
        });
    }

    if (startVideoBtn) {
        startVideoBtn.addEventListener('click', () => {
            currentChatType = 'video';
            showTermsModal();
        });
    }

    // Terms modal
    if (closeTermsModal) {
        closeTermsModal.addEventListener('click', hideTermsModal);
    }

    if (agreeBtn) {
        agreeBtn.addEventListener('click', () => {
            hideTermsModal();
            if (currentChatType === 'text') {
                startTextChat();
            } else {
                startVideoChat();
            }
        });
    }

    // Chat interface
    if (chatExitBtn) {
        chatExitBtn.addEventListener('click', () => {
            disconnect();
            showChatSelection();
        });
    }

    if (videoExitBtn) {
        videoExitBtn.addEventListener('click', () => {
            exitVideoChat();
            showChatSelection();
        });
    }

    // Message input handling with XSS protection
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && messageInput.value.trim()) {
                sendMessage();
                // Stop typing indicator when message is sent
                sendTypingStatus(false);
            }
        });

        // Enhanced typing detection
        let userTyping = false;
        let userTypingTimeout = null;

        messageInput.addEventListener('input', () => {
            if (isConnected) {
                // If user wasn't already typing, send typing start signal
                if (!userTyping) {
                    userTyping = true;
                    sendTypingStatus(true);
                }

                // Clear previous timeout
                if (userTypingTimeout) {
                    clearTimeout(userTypingTimeout);
                }

                // Set timeout to stop typing indicator
                userTypingTimeout = setTimeout(() => {
                    userTyping = false;
                    sendTypingStatus(false);
                }, 2000); // Stop typing after 2 seconds of no input
            }
        });

        // Stop typing on focus out
        messageInput.addEventListener('blur', () => {
            if (userTyping && isConnected) {
                userTyping = false;
                sendTypingStatus(false);
            }
        });
    }

    // Video chat input with XSS protection
    if (videoMessageInput) {
        videoMessageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && videoMessageInput.value.trim()) {
                sendVideoMessage();
                // Stop typing indicator when message is sent
                sendTypingStatus(false);
            }
        });

        // Enhanced typing detection for video chat
        let videoUserTyping = false;
        let videoUserTypingTimeout = null;

        videoMessageInput.addEventListener('input', () => {
            if (isConnected) {
                // If user wasn't already typing, send typing start signal
                if (!videoUserTyping) {
                    videoUserTyping = true;
                    sendTypingStatus(true);
                }

                // Clear previous timeout
                if (videoUserTypingTimeout) {
                    clearTimeout(videoUserTypingTimeout);
                }

                // Set timeout to stop typing indicator
                videoUserTypingTimeout = setTimeout(() => {
                    videoUserTyping = false;
                    sendTypingStatus(false);
                }, 2000); // Stop typing after 2 seconds of no input
            }
        });

        // Stop typing on focus out
        videoMessageInput.addEventListener('blur', () => {
            if (videoUserTyping && isConnected) {
                videoUserTyping = false;
                sendTypingStatus(false);
            }
        });
    }

    // Send buttons
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (videoSendBtn) {
        videoSendBtn.addEventListener('click', sendVideoMessage);
    }

    // Connect buttons with enhanced Skip functionality and debouncing
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            const label = connectBtn.querySelector('span');
            if (label && label.textContent === "New") {
                if (chatMessages) chatMessages.innerHTML = '';
                addSystemMessage("Looking for people online");
                setConnectButtonDisabled(true);
                connectWebSocket(); // Instant connection - no delay
            } else if (label && label.textContent === "Skip") {
                console.log('👆 Text chat Skip button clicked - starting proper skip process...');
                handleTextSkipWithDebouncing();
            }
        });
    }

    if (videoConnectBtn) {
        videoConnectBtn.addEventListener('click', () => {
            const label = videoConnectBtn.querySelector('span');
            if (label && label.textContent === "New") {
                if (videoChatMessages) videoChatMessages.innerHTML = '';
                addVideoSystemMessage("Looking for people online");
                setConnectButtonDisabled(true);
                connectWebSocket(); // Instant connection - no delay
            } else if (label && label.textContent === "Skip") {
                console.log('👆 Video chat Skip button clicked - starting proper skip cleanup...');
                handleVideoSkipWithDebouncing();
            }
        });
    }

    // File inputs
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoUpload);
    }

    if (videoInput) {
        videoInput.addEventListener('change', handleVideoUpload);
    }

    // Attach menu
    if (attachBtn) {
        attachBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isConnected) {
                alert('Please wait until you are connected to a stranger before sending files.');
                return;
            }
            toggleAttachMenu();
        });
    }

    // Close attach menu when clicking outside
    document.addEventListener('click', (e) => {
        if (attachMenu && !attachBtn?.contains(e.target) && !attachMenu.contains(e.target)) {
            hideAttachMenu();
        }
    });

    if (sendPhoto) {
        sendPhoto.addEventListener('click', () => {
            if (!isConnected) {
                alert('Please wait until you are connected to a stranger before sending photos.');
                return;
            }
            photoInput.click();
            hideAttachMenu();
        });
    }

    // Footer navigation buttons
    if (footerTermsBtn) {
        footerTermsBtn.addEventListener('click', () => {
            alert('Terms & Conditions\n\nBy using our website, you agree to the following terms and conditions. Please read them carefully before using the chat service.\n\nYou must be at least 18 years old to use this platform. We do not permit minors to access or use the services provided.\n\nThis website allows users to connect and chat with strangers anonymously via text or video. While the platform is designed for casual and fun interactions, users must not use it for harassment, bullying, threats, hate speech, illegal activities, or explicit content.\n\nWe are not responsible for user-generated content or behavior during chats. Conversations are not monitored in real-time, but users are encouraged to report any violations using the report option or contact form.\n\nWe do not store or retain chat history. Once a chat ends, all messages and video streams are gone permanently. We value your privacy and avoid unnecessary data collection.\n\nUsers are not allowed to exploit or attempt to disrupt the platform using scripts, bots, or hacks. Any such behavior may lead to a permanent ban.\n\nThe website reserves the right to terminate or block users at any time if they are found violating these terms or creating a negative experience for others.\n\nThese terms may be updated at any time. Continued use of the site implies your acceptance of any changes made.\n\nBy using this site, you acknowledge and agree that you are solely responsible for your interactions and understand the potential risks of speaking with strangers online.\n\nIf you do not agree with these terms, please stop using the site immediately.');
        });
    }

    if (footerPrivacyBtn) {
        footerPrivacyBtn.addEventListener('click', () => {
            alert('Privacy Policy\n\nYour privacy matters to us. This policy explains how we handle your data and ensure a safe browsing and chatting experience on our platform.\n\nWe do not require users to register or submit personal information. No email, no password, no identity details — just open and start chatting. We do not store text chats or video content. All connections are made peer-to-peer and disappear as soon as the chat ends.\n\nWe may temporarily collect anonymized technical data like IP address or device type to help improve security, prevent spam, and ensure fair usage. This data is not stored permanently or shared with any third-party vendors, except analytics tools that help us measure general site performance (such as Google Analytics).\n\nCookies may be used to remember your preferences or help keep you connected between sessions. These cookies do not collect personal data and can be cleared at any time from your browser settings.\n\nWe do not target children and this platform is strictly for users aged 18 and above. If you are under 18, please leave the site immediately.\n\nWe take reasonable security measures to protect our servers and platform, but no system is 100% secure. Users are advised never to share personal information (e.g., name, address, phone number) during conversations.\n\nWe may update this policy at any time. Significant changes will be announced on the homepage or through a notification.');
        });
    }

    if (footerAboutBtn) {
        footerAboutBtn.addEventListener('click', () => {
            alert('About Us\n\nWelcome to our anonymous chat platform — a modern and secure way to meet strangers from across the world. Whether you\'re looking for a quick conversation, new friendships, or simply passing time, our platform provides a safe and easy environment to chat through text or video.\n\nWe created this website to help people connect in a spontaneous, open, and anonymous setting. Unlike traditional social networks, you don\'t need to register or create an account. Just click "New" and you\'re instantly matched with someone looking to talk — just like you.\n\nOur team is focused on building a distraction-free space that puts user privacy and simplicity first. With powerful peer-to-peer WebRTC technology, your chats and video calls are never stored or recorded. Everything happens in real time.\n\nWe care about community and safety. Our platform includes basic protections, moderation tools, and a report system to help prevent misuse. While we do not monitor every conversation, we expect all users to follow respectful behavior and our terms.\n\nWe\'re constantly improving the platform, fixing bugs, and adding useful features based on user feedback. If you\'d like to contribute ideas or report an issue, we welcome your input through the contact page.\n\nThank you for being part of our global chat community!');
        });
    }

    // Global Community section click handler
    const globalCommunitySection = document.getElementById('globalCommunitySection');
    if (globalCommunitySection) {
        globalCommunitySection.addEventListener('click', () => {
            window.location.href = 'global-community.html';
        });
    }

    // Back Home button handler
    const backHomeBtn = document.getElementById('backHomeBtn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', () => {
            showHomePage();
        });
    }

    if (sendVideo) {
        sendVideo.addEventListener('click', () => {
            if (!isConnected) {
                alert('Please wait until you are connected to a stranger before sending videos.');
                return;
            }
            videoInput.click();
            hideAttachMenu();
        });
    }

    if (sendLocation) {
        sendLocation.addEventListener('click', () => {
            if (!isConnected) {
                alert('Please wait until you are connected to a stranger before sending location.');
                return;
            }
            sendCurrentLocation();
            hideAttachMenu();
        });
    }
}

function handleStrangerConnected(data) {
    console.log('Stranger connected, chat type:', currentChatType);
    isConnected = true;
    setConnectButtonDisabled(false);
    setAttachButtonEnabled(true);

    // Remove connecting animation and hide circle
    const strangerVideo = document.querySelector('.stranger-video');
    const connectingCircle = document.getElementById('connectingCircle');
    
    if (strangerVideo) {
        strangerVideo.classList.remove('connecting');
    }
    
    if (connectingCircle) {
        connectingCircle.classList.add('hidden');
        connectingCircle.style.display = 'none';
    }

    if (currentChatType === 'text') {
        const label = connectBtn?.querySelector('span');
        if (label) {
            label.textContent = "Skip";
        }

        if (chatMessages) chatMessages.innerHTML = '';
        addSystemMessage("Stranger connected! Start chatting now.");
    } else if (currentChatType === 'video') {
        const label = videoConnectBtn?.querySelector('span');
        if (label) {
            label.textContent = "Skip";
        }

        if (videoChatMessages) videoChatMessages.innerHTML = '';
        addVideoSystemMessage("Stranger connected! Initializing video connection...");

        // Initialize WebRTC as initiator
        setTimeout(async () => {
            try {
                await initializeWebRTC(true);
                console.log('WebRTC initialized successfully as initiator');
            } catch (error) {
                console.error('Failed to initialize WebRTC:', error);
                addVideoSystemMessage('Failed to establish video connection. Please try again.');
            }
        }, 500);
    }
}

function handleReceivedMessage(data) {
    // Handle new media message format
    if (data.type === 'media') {
        const fileName = data.name || 'Media file';
        const fileSize = data.size || '0.00';
        const fileURL = data.data;
        const mediaType = data.mediaType;
        
        // Add media message for stranger
        if (currentChatType === 'text') {
            addStrangerMediaMessage(fileName, fileSize, fileURL, mediaType);
        } else {
            addVideoStrangerMediaMessage(fileName, fileSize, fileURL, mediaType);
        }
        return;
    }

    // Handle legacy media message format (for backwards compatibility)
    if (data.mediaType && data.mediaURL) {
        const match = data.message?.match(/(\S+)\s*\(([0-9.]+)MB\)/);
        const fileName = match ? match[1] : 'Media file';
        const fileSize = match ? match[2] : '0.00';
        
        if (currentChatType === 'text') {
            addStrangerMediaMessage(fileName, fileSize, data.mediaURL, data.mediaType);
        } else {
            addVideoStrangerMediaMessage(fileName, fileSize, data.mediaURL, data.mediaType);
        }
        return;
    }

    // Regular text message
    if (data.message) {
        const sanitizedMessage = sanitizeInput(data.message);
        currentChatType === 'text' 
            ? addStrangerMessage(sanitizedMessage)
            : addVideoStrangerMessage(sanitizedMessage);
    }
}

function handleTypingIndicator(data) {
    if (data.isTyping) {
        showTypingIndicator();
    } else {
        hideTypingIndicator();
    }
}

function handleStrangerDisconnected() {
    console.log('🔌 Stranger disconnected - starting cleanup...', { isUserSkipping });

    // If this is a user-initiated skip, don't do full cleanup
    if (isUserSkipping) {
        console.log('🔄 Skipping stranger disconnect cleanup - user is skipping to new partner');
        return;
    }

    isConnected = false;
    setConnectButtonDisabled(false);
    setAttachButtonEnabled(false);

    // Hide typing indicator immediately
    hideTypingIndicator();
    
    // Clear typing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }

    // Remove connecting animation
    const strangerVideo = document.querySelector('.stranger-video');
    if (strangerVideo) {
        strangerVideo.classList.remove('connecting');
        console.log('✅ Removed connecting animation from stranger video container');
    }

    if (currentChatType === 'text') {
        addSystemMessage("Stranger has disconnected from the chat.");
        const label = connectBtn?.querySelector('span');
        if (label) {
            label.textContent = "New";
        }
        if (connectBtn) connectBtn.classList.add('disconnected');
    } else if (currentChatType === 'video') {
        addVideoSystemMessage("Stranger has disconnected from the video chat.");
        const label = videoConnectBtn?.querySelector('span');
        if (label) {
            label.textContent = "New";
        }
        if (videoConnectBtn) videoConnectBtn.classList.add('disconnected');

        // Perform comprehensive video cleanup for stranger disconnect
        performVideoCleanup('stranger_disconnect');
    }

    // Clean up WebRTC connection with detailed logging
    cleanupWebRTCConnection('stranger_disconnect');
}

// Enhanced video skip handler with debouncing
function handleVideoSkipWithDebouncing() {
    const currentTime = Date.now();
    
    // Check if we're already processing a skip or within debounce period
    if (pendingSkipAcknowledgment) {
        showUserFeedback('Skip in progress, please wait...', 'info');
        return;
    }
    
    if (currentTime - lastSkipTime < SKIP_DEBOUNCE_DELAY) {
        const remainingTime = Math.ceil((SKIP_DEBOUNCE_DELAY - (currentTime - lastSkipTime)) / 1000);
        showUserFeedback(`Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before skipping again`, 'warning');
        return;
    }
    
    lastSkipTime = currentTime;
    handleVideoSkip();
}

/**
 * Enhanced video skip handler - central skip coordinator with proper timeout and state management
 * Preserves local video stream while cleaning up remote connections and managing UI state
 */
function handleVideoSkip() {
    console.log('🔄 Starting video skip process (preserving local stream)...');
    
    // Validate current state before proceeding
    if (!currentChatType || currentChatType !== 'video') {
        console.warn('⚠️ Skip called but not in video chat mode');
        return;
    }
    
    // Set flags to indicate this is a user-initiated skip (race condition prevention)
    isUserSkipping = true;
    pendingSkipAcknowledgment = true;
    console.log('🏁 Skip flags set:', { isUserSkipping, pendingSkipAcknowledgment });

    // Disable skip button during process to prevent double-clicks
    setConnectButtonDisabled(true);
    console.log('🔒 Skip button disabled during process');
    
    // Add user feedback message
    addVideoSystemMessage("You disconnected from the stranger.");
    console.log('💬 Disconnect message added to chat');

    try {
        // STEP 1: Clean up remote connections while preserving local stream
        console.log('📝 Step 1: Starting remote cleanup...');
        skipVideoCleanup();
        console.log('✅ Step 1: Remote cleanup completed');

        // STEP 2: Reset UI for skip (without connecting animation)
        console.log('📝 Step 2: Starting UI reset...');
        resetVideoUIForSkip();
        console.log('✅ Step 2: UI reset completed');

        // STEP 3: Send leave message to server with acknowledgment expectation
        console.log('📝 Step 3: Sending leave message to server...');
        if (socket && socket.readyState === WebSocket.OPEN) {
            const skipId = `skip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('📤 Sending leave message with skip ID:', skipId);
            
            socket.send(JSON.stringify({ 
                type: 'leave',
                skipId: skipId,
                expectAck: true,
                chatType: 'video'
            }));
            
            // Set timeout for server acknowledgment with graceful fallback
            const ackTimeout = setTimeout(() => {
                if (pendingSkipAcknowledgment) {
                    console.warn('⏰ Skip acknowledgment timeout after 5s, proceeding anyway');
                    console.log('🚀 Timeout reached - forcing skip completion');
                    proceedWithVideoSkip();
                }
            }, SKIP_ACKNOWLEDGMENT_TIMEOUT);
            
            // Store timeout ID for potential clearing
            window.currentSkipAckTimeout = ackTimeout;
            console.log('⏱️ Skip acknowledgment timeout set');
            
        } else {
            console.warn('⚠️ No WebSocket connection available, proceeding directly');
            // No WebSocket connection, proceed directly
            proceedWithVideoSkip();
        }
        
        console.log('✅ Step 3: Leave message handling completed');
        
    } catch (error) {
        console.error('🚨 Error during video skip process:', error);
        // Fallback: ensure we don't get stuck in skip state
        setTimeout(() => {
            if (pendingSkipAcknowledgment) {
                console.log('🔧 Error recovery: forcing skip completion');
                proceedWithVideoSkip();
            }
        }, 2000);
    }
    
    console.log('🏁 handleVideoSkip() completed - awaiting server acknowledgment or timeout');
}

/**
 * Skip-specific cleanup function - ONLY cleans remote connections while preserving local video
 * Prevents memory leaks by properly disposing of remote tracks and peer connections
 */
function skipVideoCleanup() {
    console.log('🔄 Skip cleanup: Removing ONLY remote connection, preserving local stream...');
    
    // STEP 1: Stop typing indicators and clear timeouts
    console.log('📝 Cleanup Step 1: Clearing typing indicators and timeouts...');
    hideTypingIndicator();
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
        console.log('✅ Typing timeout cleared');
    }
    
    // STEP 2: Clean up ONLY remote video tracks (preserve local stream)
    console.log('📝 Cleanup Step 2: Stopping remote video tracks...');
    if (remoteVideo && remoteVideo.srcObject) {
        const remoteStream = remoteVideo.srcObject;
        console.log('🛑 Stopping ONLY remote tracks during skip...');
        
        try {
            const remoteTracks = remoteStream.getTracks();
            console.log(`📊 Found ${remoteTracks.length} remote tracks to stop`);
            
            remoteTracks.forEach((track, index) => {
                console.log(`🛑 Stopping remote track ${index + 1}/${remoteTracks.length} (${track.kind})`);
                try {
                    // Check if track is already stopped to avoid double-stopping
                    if (track.readyState !== 'ended') {
                        track.stop();
                        console.log(`✅ Remote ${track.kind} track stopped successfully`);
                    } else {
                        console.log(`ℹ️ Remote ${track.kind} track already ended`);
                    }
                } catch (e) {
                    console.error(`❌ Error stopping remote ${track.kind} track:`, e);
                }
            });
            
            // Clear remote video element and force reload
            remoteVideo.srcObject = null;
            remoteVideo.load();
            console.log('✅ Remote video element cleared and reloaded');
            
        } catch (error) {
            console.error('❌ Error during remote tracks cleanup:', error);
        }
    } else {
        console.log('ℹ️ No remote video stream to clean up');
    }
    
    // STEP 3: Clean up peer connection and prevent memory leaks
    console.log('📝 Cleanup Step 3: Closing peer connection...');
    if (peerConnection) {
        console.log('🔗 Closing peer connection during skip...');
        
        try {
            // Remove all event listeners to prevent memory leaks
            peerConnection.ontrack = null;
            peerConnection.onicecandidate = null;
            peerConnection.onconnectionstatechange = null;
            peerConnection.oniceconnectionstatechange = null;
            peerConnection.onsignalingstatechange = null;
            peerConnection.ondatachannel = null;
            console.log('✅ Peer connection event listeners removed');
            
            // Close data channel if it exists
            if (dataChannel) {
                try {
                    dataChannel.close();
                    dataChannel = null;
                    console.log('✅ Data channel closed');
                } catch (e) {
                    console.error('❌ Error closing data channel:', e);
                }
            }
            
            // Close the peer connection
            peerConnection.close();
            console.log('✅ Peer connection closed successfully');
            
        } catch (e) {
            console.error('❌ Error during peer connection cleanup:', e);
        } finally {
            // Always null the reference to prevent memory leaks
            peerConnection = null;
            console.log('✅ Peer connection reference cleared');
        }
    } else {
        console.log('ℹ️ No peer connection to clean up');
    }
    
    // STEP 4: Clear ICE candidate queue to prevent memory buildup
    console.log('📝 Cleanup Step 4: Clearing ICE candidate queue...');
    if (iceCandidateQueue && iceCandidateQueue.length > 0) {
        iceCandidateQueue.length = 0;
        console.log('✅ ICE candidate queue cleared');
    }
    
    // STEP 5: Reset WebRTC state flags
    console.log('📝 Cleanup Step 5: Resetting WebRTC state flags...');
    isRemoteDescriptionSet = false;
    webrtcRetryAttempts = 0;
    console.log('✅ WebRTC state flags reset');
    
    // STEP 6: Verify local stream is still active (critical check)
    console.log('📝 Cleanup Step 6: Verifying local stream preservation...');
    if (localVideo && localStream) {
        console.log('📊 Local stream status after cleanup:', {
            hasStream: !!localVideo.srcObject,
            streamActive: localStream.active,
            videoTracks: localStream.getVideoTracks().length,
            audioTracks: localStream.getAudioTracks().length,
            videoReady: localVideo.readyState,
            paused: localVideo.paused
        });
        
        // Ensure local video is still connected and playing
        if (localVideo.srcObject !== localStream) {
            console.warn('⚠️ Local video lost stream connection, reconnecting...');
            localVideo.srcObject = localStream;
        }
        
        if (localVideo.paused) {
            localVideo.play().catch(e => {
                console.warn('⚠️ Could not resume local video after cleanup:', e.name);
            });
        }
        
        console.log('✅ Local stream verified and preserved');
    } else {
        console.warn('⚠️ Local video or stream not available after cleanup');
    }
    
    console.log('✅ Skip cleanup completed - LOCAL STREAM PRESERVED, remote cleaned up');
}

// Continue video skip process after acknowledgment or timeout
/**
 * Proceed with video skip - automatically initiate new stranger connection
 * Handles acknowledgment timeout gracefully and manages state transitions
 */
function proceedWithVideoSkip() {
    console.log('🚀 Proceeding with video skip - initiating auto-reconnection...');
    
    // STEP 1: Clear acknowledgment timeout to prevent duplicate calls
    console.log('📝 Skip Proceed Step 1: Clearing acknowledgment timeout...');
    if (window.currentSkipAckTimeout) {
        clearTimeout(window.currentSkipAckTimeout);
        window.currentSkipAckTimeout = null;
        console.log('✅ Skip acknowledgment timeout cleared');
    }
    
    // STEP 2: Verify local video is still active before proceeding (critical check)
    console.log('📝 Skip Proceed Step 2: Verifying local video before new connection...');
    if (localVideo && localStream) {
        const localStreamStatus = {
            hasStream: !!localVideo.srcObject,
            streamActive: localStream.active,
            videoTracks: localStream.getVideoTracks().filter(t => t.readyState === 'live').length,
            audioTracks: localStream.getAudioTracks().filter(t => t.readyState === 'live').length
        };
        
        console.log('📊 Local stream status before new connection:', localStreamStatus);
        
        if (!localStreamStatus.streamActive || 
            (localStreamStatus.videoTracks === 0 && localStreamStatus.audioTracks === 0)) {
            console.error('❌ Local stream is not active! Cannot proceed with skip.');
            // Try to recover local stream
            console.log('🔧 Attempting to recover local stream...');
            // This would trigger re-initialization of media
            return;
        }
        
        console.log('✅ Local stream verified active and ready for new connection');
    } else {
        console.error('❌ Local video or stream missing! Cannot proceed safely.');
        return;
    }
    
    // STEP 3: Start looking for new partner with proper timing
    console.log('📝 Skip Proceed Step 3: Starting search for new partner...');
    
    // Small delay to ensure cleanup is complete
    setTimeout(() => {
        console.log('🔍 Starting search for new video partner...');
        addVideoSystemMessage("Looking for people online");
        
        // STEP 4: Send join request for new stranger (auto-connection)
        console.log('📝 Skip Proceed Step 4: Sending join request...');
        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                // Get current interests for matching
                const interests = interestsInput ? 
                    interestsInput.value.split(',').map(i => i.trim()).filter(i => i.length > 0) : [];
                
                const joinMessage = {
                    type: 'join',
                    chatType: 'video',
                    interests: interests,
                    skipReconnect: true  // Flag to indicate this is a skip-initiated connection
                };
                
                socket.send(JSON.stringify(joinMessage));
                console.log('📤 Sent join request for new video partner:', {
                    interests: interests.length,
                    skipReconnect: true
                });
                
            } catch (error) {
                console.error('❌ Error sending join request:', error);
                // Fallback: show error and re-enable button
                addVideoSystemMessage("Connection error. Click 'New' to try again.");
                setConnectButtonDisabled(false);
            }
        } else {
            console.warn('⚠️ WebSocket not available for new connection');
            addVideoSystemMessage("Connection lost. Click 'New' to reconnect.");
            setConnectButtonDisabled(false);
        }
        
        // STEP 5: Clear skip flags after join request (race condition prevention)
        console.log('📝 Skip Proceed Step 5: Clearing skip flags...');
        setTimeout(() => {
            // Clear skip-related flags to allow normal operation
            isUserSkipping = false;
            pendingSkipAcknowledgment = false;
            
            // Re-enable connect button (will show 'Skip' when stranger connects)
            setConnectButtonDisabled(false);
            
            console.log('✅ Skip flags cleared:', {
                isUserSkipping: false,
                pendingSkipAcknowledgment: false,
                buttonEnabled: true
            });
            
            console.log('✅ Ready for normal stranger disconnect/connect handling');
            
        }, 150); // Short delay to ensure join request is processed
        
    }, 250); // Delay to ensure all cleanup operations are complete

    console.log('✅ Video skip process completed - auto-connection initiated, local video preserved');
}

// Enhanced text skip handler with debouncing
function handleTextSkipWithDebouncing() {
    const currentTime = Date.now();
    
    // Check if we're already processing a skip or within debounce period
    if (pendingSkipAcknowledgment) {
        showUserFeedback('Skip in progress, please wait...', 'info');
        return;
    }
    
    if (currentTime - lastSkipTime < SKIP_DEBOUNCE_DELAY) {
        const remainingTime = Math.ceil((SKIP_DEBOUNCE_DELAY - (currentTime - lastSkipTime)) / 1000);
        showUserFeedback(`Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before skipping again`, 'warning');
        return;
    }
    
    lastSkipTime = currentTime;
    handleTextSkip();
}

// Enhanced text chat skip handler that keeps WebSocket alive
function handleTextSkip() {
    console.log('🔄 Starting text chat skip process...');

    // Set flag to indicate this is a user-initiated skip (consistency with video skip)
    isUserSkipping = true;
    pendingSkipAcknowledgment = true;

    // Disable skip button during process
    setConnectButtonDisabled(true);

    // Add user disconnect message
    addSystemMessage("You disconnected from the stranger.");

    // Enhanced fast disconnect - immediately cleanup UI state
    fastDisconnectCleanup();

    // Reset UI for new connection
    const label = connectBtn?.querySelector('span');
    if (label) {
        label.textContent = "New";
    }
    if (connectBtn) connectBtn.classList.add('disconnected');

    // Send leave message to server with acknowledgment expectation
    if (socket && socket.readyState === WebSocket.OPEN) {
        const skipId = Date.now().toString();
        socket.send(JSON.stringify({ 
            type: 'leave',
            skipId: skipId,
            expectAck: true
        }));
        console.log('📤 Sent leave message to server with skip ID:', skipId);
        
        // Set timeout for server acknowledgment
        const ackTimeout = setTimeout(() => {
            if (pendingSkipAcknowledgment) {
                console.warn('⏰ Skip acknowledgment timeout, proceeding anyway');
                proceedWithTextSkip();
            }
        }, SKIP_ACKNOWLEDGMENT_TIMEOUT);
        
        // Store timeout ID for potential clearing
        window.currentSkipAckTimeout = ackTimeout;
        
    } else {
        // No WebSocket connection, proceed directly
        proceedWithTextSkip();
    }
}

// Continue text skip process after acknowledgment or timeout
function proceedWithTextSkip() {
    // Clear acknowledgment timeout if it exists
    if (window.currentSkipAckTimeout) {
        clearTimeout(window.currentSkipAckTimeout);
        window.currentSkipAckTimeout = null;
    }
    
    // Start looking for new partner
    setTimeout(() => {
        addSystemMessage("Looking for people online");
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            const interests = interestsInput ? interestsInput.value.split(',').map(i => i.trim()).filter(i => i) : [];
            socket.send(JSON.stringify({
                type: 'join',
                chatType: 'text',
                interests: interests
            }));
            console.log('📤 Sent join request for new text chat partner');
        }
        
        // Clear skip flags after join request is sent
        setTimeout(() => {
            isUserSkipping = false;
            pendingSkipAcknowledgment = false;
            setConnectButtonDisabled(false);
            console.log('✅ Text skip flag cleared - ready for normal stranger disconnect handling');
        }, 100);
    }, 200);

    console.log('✅ Text chat skip completed - ready for new connection');
}

// Stop and cleanup peer connection properly
function stopPeerConnection() {
    console.log('🔗 Stopping peer connection...');

    if (peerConnection) {
        console.log('📊 PeerConnection state before cleanup:', {
            signalingState: peerConnection.signalingState,
            iceConnectionState: peerConnection.iceConnectionState,
            connectionState: peerConnection.connectionState
        });

        // Remove all event listeners to prevent memory leaks
        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onsignalingstatechange = null;
        peerConnection.onicegatheringstatechange = null;
        peerConnection.ondatachannel = null;
        if (peerConnection.onaddstream) {
            peerConnection.onaddstream = null;
        }

        // Close the connection
        peerConnection.close();
        console.log('✅ PeerConnection closed and cleaned up');
    }

    // Close data channel if exists
    if (dataChannel) {
        dataChannel.onopen = null;
        dataChannel.onclose = null;
        dataChannel.onmessage = null;
        dataChannel.onerror = null;
        dataChannel.close();
        dataChannel = null;
        console.log('✅ DataChannel closed');
    }

    // Clear ICE candidate queue
    const queueLength = iceCandidateQueue.length;
    iceCandidateQueue = [];
    isRemoteDescriptionSet = false;
    if (queueLength > 0) {
        console.log(`🧹 Cleared ${queueLength} queued ICE candidates`);
    }

    // Clear timeouts
    if (peerConnectionTimeout) {
        clearTimeout(peerConnectionTimeout);
        peerConnectionTimeout = null;
        console.log('✅ Cleared peer connection timeout');
    }
}

// Clean up only remote video, preserve local video stream
function cleanupRemoteVideo() {
    console.log('🎥 Cleaning up remote video only...');

    if (remoteVideo) {
        console.log('📊 Remote video state before cleanup:', {
            hasSrcObject: !!remoteVideo.srcObject,
            paused: remoteVideo.paused,
            readyState: remoteVideo.readyState,
            networkState: remoteVideo.networkState,
            videoWidth: remoteVideo.videoWidth,
            videoHeight: remoteVideo.videoHeight,
            currentTime: remoteVideo.currentTime
        });

        if (remoteVideo.srcObject) {
            const stream = remoteVideo.srcObject;

            // Stop all tracks in the remote stream
            stream.getTracks().forEach((track, index) => {
                console.log(`🛑 Stopping remote track ${index} (${track.kind})`);
                try {
                    track.stop();
                } catch (trackError) {
                    console.error('❌ Error stopping remote track:', trackError);
                }
            });

            // Clear the remote video source
            remoteVideo.srcObject = null;
            console.log('✅ Remote video srcObject cleared');
        }

        // Reset remote video element
        try {
            remoteVideo.pause();
            remoteVideo.load();
            remoteVideo.currentTime = 0;
            console.log('✅ Remote video element reset');
        } catch (videoError) {
            console.error('❌ Error resetting remote video element:', videoError);
        }

        // Remove any connecting animations or overlays
        const strangerVideoContainer = document.querySelector('.stranger-video');
        if (strangerVideoContainer) {
            strangerVideoContainer.classList.remove('connecting');

            // Remove any video block overlays
            const blockOverlays = strangerVideoContainer.querySelectorAll('.video-block-overlay');
            blockOverlays.forEach(overlay => {
                overlay.remove();
            });
        }
    } else {
        console.log('⚠️ Remote video element not found during cleanup');
    }

    // NOTE: Local video stream is preserved for immediate reuse
    console.log('✅ Remote video cleanup completed, local stream preserved');
}

// Skip-specific UI reset that preserves stranger preview window
/**
 * Reset video UI for skip - keeps local video active while clearing stranger video
 * Preserves local video functionality and prepares UI for new connection
 */
function resetVideoUIForSkip() {
    console.log('🎨 Resetting video UI for skip (preserving local video active state)...');

    // STEP 1: Reset button state to "New" for next connection
    console.log('📝 UI Reset Step 1: Updating connect button state...');
    const label = videoConnectBtn?.querySelector('span');
    if (label) {
        label.textContent = "New";
        console.log('✅ Video connect button reset to "New"');
    } else {
        console.warn('⚠️ Video connect button label not found');
    }

    // STEP 2: Reset connection state flags
    console.log('📝 UI Reset Step 2: Resetting connection state flags...');
    isConnected = false;
    setConnectButtonDisabled(false); // Re-enable for next connection
    setAttachButtonEnabled(false);   // Disable until new stranger connects
    console.log('✅ Connection state flags reset');

    // STEP 3: Clear stranger video area (prepare for new connection)
    console.log('📝 UI Reset Step 3: Clearing stranger video area...');
    if (remoteVideo) {
        // Remove any previous error states or loading indicators
        remoteVideo.classList.remove('error', 'loading', 'connecting');
        
        // Ensure the video element is ready for new stream
        remoteVideo.poster = ''; // Clear any poster image
        console.log('✅ Stranger video area cleared and ready');
    }
    
    // Do NOT add connecting animation to stranger video during skip
    // The stranger area should be clean and ready for new connection
    console.log('✅ Stranger video area prepared for new connection');

    // STEP 4: Ensure local video remains visible and functional (CRITICAL)
    console.log('📝 UI Reset Step 4: Verifying local video active state...');
    if (localVideo && localStream) {
        console.log('📊 Local video state check:', {
            hasStream: !!localVideo.srcObject,
            streamActive: localStream.active,
            videoTracks: localStream.getVideoTracks().length,
            audioTracks: localStream.getAudioTracks().length,
            videoReady: localVideo.readyState,
            paused: localVideo.paused,
            muted: localVideo.muted
        });

        // Ensure local video is still connected to the stream
        if (!localVideo.srcObject && localStream) {
            console.log('🔧 Reconnecting local video to stream...');
            localVideo.srcObject = localStream;
            console.log('✅ Reconnected local video to preserved stream');
        }

        
        // Ensure local video is playing (critical for user experience)
        if (localVideo.paused) {
            console.log('🎬 Resuming local video playback...');
            localVideo.play().catch(e => {
                console.warn('⚠️ Local video autoplay issue after skip:', e.name);
                // Add user-interaction button if autoplay fails
                if (e.name === 'NotAllowedError') {
                    console.log('🔘 Adding tap-to-play button for local video');
                    addTapToPlayButton(localVideo, 'local video after skip');
                }
            });
        }
        
        // Ensure proper video attributes are maintained
        localVideo.muted = true;    // Local video should always be muted
        localVideo.autoplay = true;
        localVideo.playsInline = true;
        
        console.log('✅ Local video verified active and functional');
        
    } else {
        console.error('❌ Local video or stream not available during UI reset!');
        // This is a critical error - local video should always be available during skip
        if (!localVideo) {
            console.error('❌ Local video element missing!');
        }
        if (!localStream) {
            console.error('❌ Local stream missing!');
        }
    }
    
    // STEP 5: Clear any error messages or status indicators
    console.log('📝 UI Reset Step 5: Clearing error states and status indicators...');
    // Clear any previous error feedback
    const errorElements = document.querySelectorAll('.error-message, .connection-error');
    errorElements.forEach(el => el.remove());
    console.log('✅ Error states cleared');
    
    // STEP 6: Reset any video-specific UI elements
    console.log('📝 UI Reset Step 6: Resetting video-specific UI elements...');
    
    // Clear any video overlays or loading indicators
    const videoOverlays = document.querySelectorAll('.video-overlay, .loading-overlay');
    videoOverlays.forEach(overlay => {
        if (!overlay.classList.contains('local-video-overlay')) {
            overlay.remove();
        }
    });
    
    // Reset stranger video window state if it exists
    if (strangerVideoWindow) {
        strangerVideoWindow.classList.remove('connecting', 'error');
        console.log('✅ Stranger video window state reset');
    }
    
    console.log('✅ Skip UI reset completed - LOCAL VIDEO ACTIVE, stranger area ready for new connection');
}

// Reset video UI for new connection while preserving local video
function resetVideoUIForNewConnection() {
    console.log('🎨 Resetting video UI for new connection...');

    // Reset button state
    const label = videoConnectBtn?.querySelector('span');
    if (label) {
        label.textContent = "New";
        console.log('✅ Video connect button reset to "New"');
    }

    // Reset connection state
    isConnected = false;
    setConnectButtonDisabled(false);
    setAttachButtonEnabled(false);

    // Add connecting animation to stranger video
    const strangerVideo = document.querySelector('.stranger-video');
    if (strangerVideo) {
        strangerVideo.classList.add('connecting');
        console.log('✅ Added connecting animation to stranger video');
    }

    // Ensure local video remains visible and functional
    if (localVideo && localStream) {
        console.log('📊 Local video state after skip:', {
            hasStream: !!localVideo.srcObject,
            streamActive: localStream.active,
            videoReady: localVideo.readyState,
            paused: localVideo.paused
        });

        // Ensure local video is still connected to the stream
        if (!localVideo.srcObject && localStream) {
            localVideo.srcObject = localStream;
            console.log('✅ Reconnected local video to preserved stream');
        }

        // Ensure local video is playing
        if (localVideo.paused) {
            localVideo.play().catch(e => {
                console.warn('Local video autoplay after skip:', e);
            });
        }
    }

    // Reset WebRTC debugger
    if (typeof webrtcDebugger !== 'undefined') {
        webrtcDebugger.reset();
        console.log('✅ WebRTC debugger reset');
    }

    console.log('✅ Video UI reset completed - ready for new connection');
}

// Comprehensive video cleanup function with detailed logging
// Fast disconnect cleanup for immediate UI response
function fastDisconnectCleanup() {
    console.log('⚡ Fast disconnect cleanup initiated...');
    
    // Immediately hide typing indicator
    hideTypingIndicator();
    
    // Clear typing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }
    
    // Immediate remote video cleanup for video chat
    if (currentChatType === 'video' && remoteVideo) {
        // Stop remote video immediately
        if (remoteVideo.srcObject) {
            const stream = remoteVideo.srcObject;
            stream.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (e) {
                    console.warn('Error stopping track during fast cleanup:', e);
                }
            });
            remoteVideo.srcObject = null;
        }
        
        // Remove connecting animations immediately
        const strangerVideo = document.querySelector('.stranger-video');
        if (strangerVideo) {
            strangerVideo.classList.remove('connecting');
        }
    }
    
    // Reset connection state immediately
    isConnected = false;
    
    console.log('✅ Fast disconnect cleanup completed');
}

function performVideoCleanup(reason = 'unknown') {
    console.log(`🎥 Starting video cleanup (reason: ${reason})...`);

    const cleanupResults = {
        remoteVideoCleared: false,
        localVideoCleared: false,
        remoteStreamState: 'unknown',
        localStreamState: 'unknown',
        videoElementsFound: false
    };

    // Comprehensive remote video cleanup
    if (remoteVideo) {
        cleanupResults.videoElementsFound = true;

        // Log current state before cleanup
        console.log('📊 Remote video state before cleanup:', {
            hasSrcObject: !!remoteVideo.srcObject,
            paused: remoteVideo.paused,
            readyState: remoteVideo.readyState,
            networkState: remoteVideo.networkState,
            videoWidth: remoteVideo.videoWidth,
            videoHeight: remoteVideo.videoHeight,
            currentTime: remoteVideo.currentTime
        });

        if (remoteVideo.srcObject) {
            const stream = remoteVideo.srcObject;
            cleanupResults.remoteStreamState = stream.active ? 'active' : 'inactive';

            // Stop all tracks in the remote stream
            stream.getTracks().forEach((track, index) => {
                console.log(`🛑 Stopping remote track ${index} (${track.kind})`);
                try {
                    track.stop();
                } catch (trackError) {
                    console.error('❌ Error stopping remote track:', trackError);
                }
            });

            // Clear the video source
            remoteVideo.srcObject = null;
            cleanupResults.remoteVideoCleared = true;
            console.log('✅ Remote video srcObject cleared');
        }

        // Force video element to release resources
        try {
            remoteVideo.pause();
            remoteVideo.load();
            remoteVideo.currentTime = 0;
            console.log('✅ Remote video element reset and resources released');
        } catch (videoError) {
            console.error('❌ Error resetting remote video element:', videoError);
        }

        // Remove any connecting animations or overlays
        const strangerVideoContainer = document.querySelector('.stranger-video');
        if (strangerVideoContainer) {
            strangerVideoContainer.classList.remove('connecting');

            // Remove any video block overlays
            const blockOverlays = strangerVideoContainer.querySelectorAll('.video-block-overlay');
            blockOverlays.forEach(overlay => {
                overlay.remove();
                console.log('✅ Removed video block overlay');
            });
        }
    } else {
        console.log('⚠️ Remote video element not found during cleanup');
    }

    // Comprehensive local video cleanup (but don't stop the stream if still needed)
    if (localVideo) {
        console.log('📊 Local video state before cleanup:', {
            hasSrcObject: !!localVideo.srcObject,
            paused: localVideo.paused,
            readyState: localVideo.readyState,
            networkState: localVideo.networkState,
            videoWidth: localVideo.videoWidth,
            videoHeight: localVideo.videoHeight
        });

        if (localVideo.srcObject) {
            cleanupResults.localStreamState = localVideo.srcObject.active ? 'active' : 'inactive';

            // Only clear local video srcObject, don't stop tracks (they might be reused)
            localVideo.srcObject = null;
            cleanupResults.localVideoCleared = true;
            console.log('✅ Local video srcObject cleared (tracks preserved for reuse)');
        }

        // Reset local video element
        try {
            localVideo.pause();
            localVideo.load();
            console.log('✅ Local video element reset');
        } catch (videoError) {
            console.error('❌ Error resetting local video element:', videoError);
        }
    }

    // Log cleanup summary
    console.log('🎥 Video cleanup completed:', cleanupResults);

    return cleanupResults;
}

// Comprehensive WebRTC connection cleanup with detailed logging
function cleanupWebRTCConnection(reason = 'unknown') {
    console.log(`🔗 Starting WebRTC connection cleanup (reason: ${reason})...`);

    const cleanupResults = {
        peerConnectionClosed: false,
        dataChannelClosed: false,
        localStreamStopped: false,
        tracksStopped: 0,
        eventListenersCleared: false
    };

    // Enhanced WebRTC cleanup with better error handling and logging
    if (peerConnection) {
        console.log('📊 PeerConnection state before cleanup:', {
            signalingState: peerConnection.signalingState,
            iceConnectionState: peerConnection.iceConnectionState,
            connectionState: peerConnection.connectionState,
            iceGatheringState: peerConnection.iceGatheringState,
            hasLocalDescription: !!peerConnection.localDescription,
            hasRemoteDescription: !!peerConnection.remoteDescription
        });

        try {
            // Remove all event listeners to prevent memory leaks
            peerConnection.ontrack = null;
            peerConnection.onicecandidate = null;
            peerConnection.onconnectionstatechange = null;
            peerConnection.oniceconnectionstatechange = null;
            peerConnection.onsignalingstatechange = null;
            peerConnection.onicegatheringstatechange = null;
            peerConnection.ondatachannel = null;
            if (peerConnection.onaddstream) {
                peerConnection.onaddstream = null;
            }
            cleanupResults.eventListenersCleared = true;
            console.log('✅ PeerConnection event listeners cleared');

            // Close the connection
            peerConnection.close();
            console.log('✅ PeerConnection closed');
            cleanupResults.peerConnectionClosed = true;
        } catch (e) {
            console.error('❌ Error closing peer connection:', e);
        }
        peerConnection = null;
    }

    if (dataChannel) {
        console.log('📊 DataChannel state before cleanup:', {
            readyState: dataChannel.readyState,
            label: dataChannel.label,
            ordered: dataChannel.ordered,
            maxRetransmits: dataChannel.maxRetransmits
        });

        try {
            dataChannel.onopen = null;
            dataChannel.onclose = null;
            dataChannel.onmessage = null;
            dataChannel.onerror = null;
            dataChannel.close();
            cleanupResults.dataChannelClosed = true;
            console.log('✅ DataChannel closed');
        } catch (e) {
            console.error('❌ Error closing data channel:', e);
        }
        dataChannel = null;
    }

    // Stop and release all media tracks with detailed logging (only for full cleanup)
    if (localStream && reason === 'full_cleanup') {
        console.log('📊 LocalStream state before cleanup:', {
            active: localStream.active,
            trackCount: localStream.getTracks().length,
            audioTracks: localStream.getAudioTracks().length,
            videoTracks: localStream.getVideoTracks().length
        });

        try {
            localStream.getTracks().forEach((track, index) => {
                console.log(`🛑 Stopping local track ${index} (${track.kind}):`, {
                    id: track.id,
                    enabled: track.enabled,
                    readyState: track.readyState,
                    muted: track.muted,
                    label: track.label
                });

                try {
                    // Remove track event listeners
                    track.onended = null;
                    track.onmute = null;
                    track.onunmute = null;

                    track.stop();
                    cleanupResults.tracksStopped++;
                } catch (trackError) {
                    console.error(`❌ Error stopping track ${index}:`, trackError);
                }
            });

            localStream = null;
            cleanupResults.localStreamStopped = true;
            console.log('✅ LocalStream stopped and cleared');
        } catch (e) {
            console.error('❌ Error stopping local stream:', e);
        }
    } else if (localStream && reason !== 'full_cleanup') {
        console.log('📝 LocalStream preserved for potential reuse (partial cleanup)');
    }

    // Reset WebRTC-specific state variables
    const queueLength = iceCandidateQueue.length;
    iceCandidateQueue = [];
    isRemoteDescriptionSet = false;

    if (queueLength > 0) {
        console.log(`🧹 Cleared ${queueLength} queued ICE candidates`);
    }

    // Reset WebRTC debugger if doing full cleanup
    if (reason === 'full_cleanup' && typeof webrtcDebugger !== 'undefined') {
        webrtcDebugger.reset();
        console.log('✅ WebRTC debugger reset');
    }

    console.log('🔗 WebRTC connection cleanup completed:', cleanupResults);
    return cleanupResults;
}

function endVideoCall() {
    console.log('📞 Ending video call - performing comprehensive cleanup...');

    // Perform full cleanup when ending video call
    cleanupConnections(true);
    console.log('📞 Video call ended and cleanup completed');
}

// Full exit from video chat - stops both remote and local streams
function exitVideoChat() {
    console.log('🚪 Exiting video chat completely - stopping all streams...');
    
    // Add user disconnect message
    addVideoSystemMessage("You have left the video chat.");
    
    // FULL CLEANUP: Stop both remote and local streams
    cleanupConnections(true);
    
    // Reset shouldReconnect flag
    shouldReconnect = false;
    
    // Send leave message to server if connected
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'leave' }));
        console.log('📤 Sent leave message to server');
    }
    
    console.log('✅ Video chat exit completed - ALL STREAMS STOPPED (remote + local) ✅');
}

function toggleAttachMenu() {
    if (attachMenu) {
        const isVisible = attachMenu.classList.contains('show');
        if (isVisible) {
            attachMenu.classList.remove('show');
        } else {
            attachMenu.classList.add('show');
        }
    }
}

function hideAttachMenu() {
    if (attachMenu) {
        attachMenu.classList.remove('show');
    }
}

// Media validation constants
const MEDIA_VALIDATION = {
    ALLOWED_IMAGE_TYPES: [
        'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 
        'image/gif', 'image/bmp', 'image/tiff', 'image/tif',
        'image/heif', 'image/heic' // Apple HEIF/HEIC formats
    ],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/mov', 'video/avi'], // Enable video support
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB for images
    MAX_VIDEO_SIZE: 20 * 1024 * 1024, // 20MB for videos
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    COMPRESSION_QUALITY: 0.8
};

// Enhanced media validation function
function validateMediaFile(file) {
    const errors = [];
    
    // Check if file exists
    if (!file) {
        errors.push('No file selected');
        return { isValid: false, errors, fileType: null };
    }
    
    // Determine file type
    let fileType = null;
    if (MEDIA_VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        fileType = 'image';
    } else if (MEDIA_VALIDATION.ALLOWED_VIDEO_TYPES.includes(file.type)) {
        fileType = 'video';
    } else {
        errors.push(`Invalid file type: ${file.type}. Only JPEG, PNG, GIF, BMP, TIFF, WebP, HEIF/HEIC images and MP4, WebM, MOV, AVI videos are allowed.`);
        return { isValid: false, errors, fileType: null };
    }
    
    // Check file size based on type
    if (fileType === 'image' && file.size > MEDIA_VALIDATION.MAX_IMAGE_SIZE) {
        errors.push(`Image file too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${MEDIA_VALIDATION.MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    } else if (fileType === 'video' && file.size > MEDIA_VALIDATION.MAX_VIDEO_SIZE) {
        errors.push(`Video file too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${MEDIA_VALIDATION.MAX_VIDEO_SIZE / 1024 / 1024}MB`);
    }
    
    // Check file name for security
    const fileName = file.name;
    if (!fileName || fileName.length > 255) {
        errors.push('Invalid file name');
    }
    
    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.js', '.jar', '.zip'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (dangerousExtensions.some(ext => fileExtension.includes(ext))) {
        errors.push('File type not allowed for security reasons');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        fileType
    };
}

// Helper function to compress images using canvas
function compressImage(file, maxWidth = MEDIA_VALIDATION.MAX_WIDTH, maxHeight = MEDIA_VALIDATION.MAX_HEIGHT, quality = MEDIA_VALIDATION.COMPRESSION_QUALITY) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const aspectRatio = width / height;
                
                if (width > height) {
                    width = Math.min(width, maxWidth);
                    height = width / aspectRatio;
                } else {
                    height = Math.min(height, maxHeight);
                    width = height * aspectRatio;
                }
            }
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob with compression
            canvas.toBlob((blob) => {
                if (blob) {
                    // Convert blob to data URL
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                } else {
                    reject(new Error('Failed to compress image'));
                }
            }, file.type, quality);
        };
        
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        
        // Create object URL for the image
        img.src = URL.createObjectURL(file);
    });
}

// Helper function to convert file to base64 data URL with compression
function fileToBase64(file, shouldCompress = true) {
    return new Promise((resolve, reject) => {
        // Validate file first
        const validation = validateMediaFile(file);
        if (!validation.isValid) {
            reject(new Error(validation.errors.join('; ')));
            return;
        }
        
        if (validation.fileType === 'image' && shouldCompress) {
            // Compress image before converting to base64
            compressImage(file)
                .then(resolve)
                .catch(reject);
        } else {
            // Fallback to direct conversion (for non-images or when compression is disabled)
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        }
    });
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file using new security checks
    const validation = validateMediaFile(file);
    if (!validation.isValid) {
        alert('File validation failed:\n' + validation.errors.join('\n'));
        event.target.value = '';
        return;
    }

    // Only allow images
    if (validation.fileType !== 'image') {
        alert('Only image files (PNG, JPEG, WebP) are allowed.');
        event.target.value = '';
        return;
    }

    const fileName = sanitizeInput(file.name);
    const originalFileSize = (file.size / 1024 / 1024).toFixed(2);

    // Show user feedback about processing
    showUserFeedback('Processing and compressing image...', 'info');

    try {
        // Convert file to base64 data URL with compression
        fileToBase64(file, true).then(base64DataURL => {
            // Calculate compressed size
            const compressedSizeBytes = (base64DataURL.length * 3) / 4; // Approximate base64 to bytes
            const compressedSize = (compressedSizeBytes / 1024 / 1024).toFixed(2);
            
            // Hide processing feedback
            hideUserFeedback();
            
            // Show compression results if significant
            if (originalFileSize > compressedSize && (originalFileSize - compressedSize) > 0.1) {
                showUserFeedback(`Image compressed: ${originalFileSize}MB → ${compressedSize}MB`, 'success');
                setTimeout(hideUserFeedback, 3000);
            }

            // Display image locally using compressed base64 data URL
            currentChatType === 'text'
                ? addUserMediaMessage(fileName, compressedSize, base64DataURL, 'image')
                : addVideoUserMediaMessage(fileName, compressedSize, base64DataURL, 'image');

            // Send compressed base64 data URL to recipient with new format
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'media',
                    mediaType: 'image',
                    name: fileName,
                    data: base64DataURL,
                    size: compressedSize,
                    originalSize: originalFileSize
                }));
            }
        }).catch(error => {
            hideUserFeedback();
            console.error('Error processing photo:', error);
            alert('Failed to process photo: ' + error.message);
        });
    } catch (error) {
        hideUserFeedback();
        console.error('Error handling photo upload:', error);
        alert('Failed to upload photo: ' + error.message);
    }
    
    // Clear the file input
    event.target.value = '';
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file using new security checks
    const validation = validateMediaFile(file);
    if (!validation.isValid) {
        alert('File validation failed:\n' + validation.errors.join('\n'));
        event.target.value = '';
        return;
    }

    // Only allow videos
    if (validation.fileType !== 'video') {
        alert('Only video files (MP4, WebM, MOV, AVI) are allowed for video upload.');
        event.target.value = '';
        return;
    }

    const fileName = sanitizeInput(file.name);
    const fileSize = (file.size / 1024 / 1024).toFixed(2);

    // Show user feedback about processing
    showUserFeedback('Processing video...', 'info');

    try {
        // Convert file to base64 data URL (no compression for videos)
        fileToBase64(file, false).then(base64DataURL => {
            // Hide processing feedback
            hideUserFeedback();
            
            showUserFeedback(`Video uploaded: ${fileSize}MB`, 'success');
            setTimeout(hideUserFeedback, 3000);

            // Display video locally using base64 data URL
            currentChatType === 'text'
                ? addUserMediaMessage(fileName, fileSize, base64DataURL, 'video')
                : addVideoUserMediaMessage(fileName, fileSize, base64DataURL, 'video');

            // Send base64 data URL to recipient with new format
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'media',
                    mediaType: 'video',
                    name: fileName,
                    data: base64DataURL,
                    size: fileSize
                }));
            }
        }).catch(error => {
            hideUserFeedback();
            console.error('Error processing video:', error);
            alert('Failed to process video: ' + error.message);
        });
    } catch (error) {
        hideUserFeedback();
        console.error('Error handling video upload:', error);
        alert('Failed to upload video: ' + error.message);
    }
    
    // Clear the file input
    event.target.value = '';
}

// Handle skip acknowledgment from server
function handleSkipAcknowledgment(data) {
    console.log('✅ Received skip acknowledgment from server:', data.skipId);
    
    if (pendingSkipAcknowledgment) {
        // Clear acknowledgment timeout
        if (window.currentSkipAckTimeout) {
            clearTimeout(window.currentSkipAckTimeout);
            window.currentSkipAckTimeout = null;
        }
        
        // Proceed with appropriate skip process based on chat type
        if (currentChatType === 'video') {
            proceedWithVideoSkip();
        } else {
            proceedWithTextSkip();
        }
    }
}

// Handle media validation error from server
function handleMediaValidationError(data) {
    console.error('Server media validation error:', data.message);
    hideUserFeedback();
    showUserFeedback('Upload failed: ' + data.message, 'error');
    setTimeout(hideUserFeedback, 5000);
}

function sendCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const locationMessage = `📍 Location: https://maps.google.com/?q=${lat},${lng}`;

        currentChatType === 'text'
            ? addUserMessage(locationMessage)
            : addVideoUserMessage(locationMessage);

        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'message',
                message: locationMessage
            }));
        }
    }, (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location.';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please check your browser settings.';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable.';
                break;
            case error.TIMEOUT:
                errorMessage = 'Location request timed out.';
                break;
        }

        alert(errorMessage);
    });
}
