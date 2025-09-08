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
const deleteMessage = document.getElementById('deleteMessage');
const replyMessage = document.getElementById('replyMessage');
const termsLink = document.getElementById('termsLink');
const privacyLink = document.getElementById('privacyLink');
const backToHome = document.getElementById('backToHome');
const photoInput = document.getElementById('photoInput');
const videoInput = document.getElementById('videoInput');
const interestsInput = document.getElementById('interestsInput');
const connectBtn = document.getElementById('connectBtn');
const videoConnectBtn = document.getElementById('videoConnectBtn');

// Configuration - Use multiple fallback WebSocket servers
const WS_SERVERS = [
    'wss://omegle-xyz-1.onrender.com/',
    
];
let currentServerIndex = 0;
const WS_SERVER_URL = WS_SERVERS[currentServerIndex];
const ICE_SERVERS = [
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
    }
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
const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_WEBRTC_RETRIES = 3; // Maximum WebRTC connection retry attempts
const CONNECTION_TIMEOUT = 10000;
const PEER_CONNECTION_TIMEOUT = 10000;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

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
    
    // Auto-hide after 3 seconds of no typing
    typingTimeout = setTimeout(() => {
        hideTypingIndicator();
    }, 3000);
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
                const delay = Math.min(2000 * Math.pow(2, reconnectAttempts - 1), 10000);

                DebugLogger.connection(`Scheduling reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`, { delayMs: delay });

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
            DebugLogger.error('WebSocket connection error', error);
            
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
    return addMessage(chatMessages, message, 'system-message');
}

function addVideoUserMessage(message) {
    addMessage(videoChatMessages, message, 'user-message');
}

function addVideoStrangerMessage(message) {
    addMessage(videoChatMessages, message, 'stranger-message');
}

function addVideoSystemMessage(message) {
    return addMessage(videoChatMessages, message, 'system-message');
}

function addMessage(container, message, className) {
    if (!container || !message) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    // Use textContent to prevent XSS
    messageDiv.textContent = message;
    container.appendChild(messageDiv);

    // Enhanced mobile-responsive auto-scroll
    scrollToLatestMessage(container);
    return messageDiv;
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
    messageDiv.className = `message ${className}`;

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

        // Add download functionality
        let pressTimer;
        const handleLongPress = () => {
            pressTimer = setTimeout(() => {
                showDownloadOption(fileURL, fileName);
            }, 500);
        };

        const clearPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        img.addEventListener('mousedown', handleLongPress);
        img.addEventListener('mouseup', clearPress);
        img.addEventListener('mouseleave', clearPress);
        img.addEventListener('touchstart', handleLongPress);
        img.addEventListener('touchend', clearPress);

        messageDiv.appendChild(img);
    } else if (mediaType === 'video') {
        const video = document.createElement('video');
        video.src = fileURL;
        video.controls = true;
        video.style.maxWidth = '250px';
        video.style.maxHeight = '200px';
        video.style.borderRadius = '8px';
        video.style.display = 'block';
        video.style.marginBottom = '5px';

        // Add download functionality
        let pressTimer;
        const handleLongPress = () => {
            pressTimer = setTimeout(() => {
                showDownloadOption(fileURL, fileName);
            }, 500);
        };

        const clearPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        video.addEventListener('mousedown', handleLongPress);
        video.addEventListener('mouseup', clearPress);
        video.addEventListener('mouseleave', clearPress);
        video.addEventListener('touchstart', handleLongPress);
        video.addEventListener('touchend', clearPress);

        messageDiv.appendChild(video);
    }

    const caption = document.createElement('div');
    caption.style.fontSize = '0.8rem';
    caption.style.color = '#666';
    caption.textContent = `${sanitizeInput(fileName)} (${fileSize}MB)`;
    messageDiv.appendChild(caption);

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
            // Fallback to video only if audio fails
            console.warn('Audio failed, trying video only:', error);
            try {
                constraints = { video: constraints.video };
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (videoError) {
                console.error('Video also failed:', videoError);
                throw videoError;
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

        peerConnection = new RTCPeerConnection({ 
            iceServers: ENHANCED_ICE_SERVERS,
            iceCandidatePoolSize: 10,
            iceTransportPolicy: 'all',
            bundlePolicy: 'balanced',
            rtcpMuxPolicy: 'require'
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

        // Add local stream tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                console.log('Adding track:', track.kind, track.label);
                const sender = peerConnection.addTrack(track, localStream);
                console.log('Track added with sender:', sender);
            });
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

                        // Attempt to play with timeout
                        const playPromise = remoteVideo.play();
                        const playTimeout = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Video play timeout')), 5000);
                        });

                        await Promise.race([playPromise, playTimeout]);

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
                                        await remoteVideo.play();
                                        console.log('✅ Remote video playing after user interaction');
                                        addVideoSystemMessage('✅ Remote video enabled!');
                                        showUserFeedback('Remote video enabled!', 'success');
                                        webrtcDebugger.mediaStreamActive = true;
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
                            addVideoSystemMessage('❌ Remote video connection failed');
                            showErrorFeedback('Failed to play remote video: ' + playError.message);
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
                            console.error("Remote video autoplay failed in onloadedmetadata (legacy):", e);
                            addVideoSystemMessage('Click anywhere to enable remote video playback (legacy mode)');
                        });
                    };

                    // Timed fallback for legacy browsers
                    setTimeout(() => {
                        if (remoteVideo.paused && remoteVideo.readyState >= 2) {
                            console.log('Attempting fallback play after timeout (legacy)');
                            remoteVideo.play().catch((e) => {
                                console.error("Fallback play failed after timeout (legacy):", e);
                                addVideoSystemMessage('Remote video requires manual play (legacy mode)');
                            });
                        }
                    }, 1000);

                    remoteVideo.play().then(() => {
                        console.log('Remote video playing successfully (legacy)');
                        showUserFeedback('Remote video connected! (legacy mode)', 'success');
                    }).catch(e => {
                        console.error('Error playing remote video (legacy):', e);
                        showUserFeedback('Failed to play remote video (legacy) - check browser permissions', 'error');
                        showErrorFeedback('Failed to play remote video');
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

                if (socket?.readyState === WebSocket.OPEN) {
                    DebugLogger.signaling('Sending ICE candidate to peer');
                    socket.send(JSON.stringify({
                        type: 'webrtc_ice_candidate',
                        candidate: event.candidate.toJSON()
                    }));
                } else {
                    DebugLogger.error('Cannot send ICE candidate - WebSocket not open');
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
                console.error('❌ Failed to add ICE candidate:', {
                    error: candidateError.message,
                    errorName: candidateError.name,
                    candidateType: data.candidate.type,
                    signalingState: peerConnection.signalingState,
                    iceConnectionState: peerConnection.iceConnectionState,
                    connectionState: peerConnection.connectionState
                });

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
            console.error('Error adding queued ICE candidate:', candidateError);
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
            endVideoCall();
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
                }, 1500); // Stop typing after 1.5 seconds of no input
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
                }, 1500); // Stop typing after 1.5 seconds of no input
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

    // Connect buttons with enhanced Skip functionality
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            const label = connectBtn.querySelector('span');
            if (label && label.textContent === "New") {
                if (chatMessages) chatMessages.innerHTML = '';
                addSystemMessage("Looking for people online");
                setConnectButtonDisabled(true);
                setTimeout(() => {
                    connectWebSocket();
                }, 100);
            } else if (label && label.textContent === "Skip") {
                console.log('👆 Text chat Skip button clicked - starting disconnect process...');
                addSystemMessage("You disconnected from the stranger.");
                cleanupConnections();
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
                setTimeout(() => {
                    connectWebSocket();
                }, 100);
            } else if (label && label.textContent === "Skip") {
                console.log('👆 Video chat Skip button clicked - starting proper skip cleanup...');
                handleVideoSkip();
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
    if (!data.message) return;

    // Check if it's a media message
    if (data.mediaType && data.mediaURL) {
        // Extract filename and size from the message if available
        const match = data.message.match(/(\S+)\s*\(([0-9.]+)MB\)/);
        const fileName = match ? match[1] : 'Media file';
        const fileSize = match ? match[2] : '0.00';
        
        // Add media message for stranger
        if (currentChatType === 'text') {
            addStrangerMediaMessage(fileName, fileSize, data.mediaURL, data.mediaType);
        } else {
            addVideoStrangerMediaMessage(fileName, fileSize, data.mediaURL, data.mediaType);
        }
    } else {
        // Regular text message
        const sanitizedMessage = sanitizeInput(data.message);
        currentChatType === 'text' 
            ? addStrangerMessage(sanitizedMessage)
            : addVideoStrangerMessage(sanitizedMessage);
    }
}

function handleTypingIndicator(data) {
    if (currentChatType === 'text') {
        if (data.isTyping) {
            showTypingIndicator();
        } else {
            hideTypingIndicator();
        }
    }
}

function handleStrangerDisconnected() {
    console.log('🔌 Stranger disconnected - starting comprehensive cleanup...');

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

// Enhanced video skip handler that preserves local stream
function handleVideoSkip() {
    console.log('🔄 Starting video skip process...');

    // Add user disconnect message
    addVideoSystemMessage("You disconnected from the stranger.");

    // Stop peer connection and remote stream cleanup
    stopPeerConnection();

    // Clean up remote video only (preserve local video stream)
    cleanupRemoteVideo();

    // Reset UI for new connection
    resetVideoUIForNewConnection();

    // Disconnect from WebSocket
    disconnect();

    console.log('✅ Video skip completed - ready for new connection');
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

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
        alert('File size exceeds 500MB limit. Please select a smaller file.');
        event.target.value = '';
        return;
    }

    const fileName = sanitizeInput(file.name);
    const fileSize = (file.size / 1024 / 1024).toFixed(2);

    try {
        const fileURL = URL.createObjectURL(file);

        currentChatType === 'text'
            ? addUserMediaMessage(fileName, fileSize, fileURL, 'image')
            : addVideoUserMediaMessage(fileName, fileSize, fileURL, 'image');

        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'message',
                message: `📷 Photo: ${fileName} (${fileSize}MB)`,
                mediaType: 'image',
                mediaURL: fileURL
            }));
        }
    } catch (error) {
        console.error('Error handling photo upload:', error);
        alert('Failed to upload photo');
    }
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
        alert('File size exceeds 500MB limit. Please select a smaller file.');
        event.target.value = '';
        return;
    }

    const fileName = sanitizeInput(file.name);
    const fileSize = (file.size / 1024 / 1024).toFixed(2);

    try {
        const fileURL = URL.createObjectURL(file);

        currentChatType === 'text'
            ? addUserMediaMessage(fileName, fileSize, fileURL, 'video')
            : addVideoUserMediaMessage(fileName, fileSize, fileURL, 'video');

        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'message',
                message: `🎥 Video: ${fileName} (${fileSize}MB)`,
                mediaType: 'video',
                mediaURL: fileURL
            }));
        }
    } catch (error) {
        console.error('Error handling video upload:', error);
        alert('Failed to upload video');
    }
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
