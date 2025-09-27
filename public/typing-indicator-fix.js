// Comprehensive Typing Indicator Fix
console.log('🔧 Loading comprehensive typing indicator fix...');

// Wait for DOM and main script to load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🔄 Applying typing indicator fixes...');
        
        // Store original functions
        window.originalSendTypingStatus = window.sendTypingStatus;
        window.originalHandleStrangerConnected = window.handleStrangerConnected;
        window.originalHandleTypingIndicator = window.handleTypingIndicator;
        
        // Enhanced sendTypingStatus with comprehensive debugging
        window.sendTypingStatus = function(typing) {
            console.log('📤 Enhanced sendTypingStatus called:', { 
                typing, 
                isConnected, 
                currentChatType, 
                socketState: socket?.readyState,
                socketOpen: socket?.readyState === WebSocket.OPEN
            });
            
            // Check if we have a valid connection
            if (socket?.readyState === WebSocket.OPEN) {
                // Always send typing status if socket is open, even if isConnected is false
                // This handles timing issues where isConnected might not be set yet
                try {
                    socket.send(JSON.stringify({
                        type: 'typing',
                        isTyping: !!typing,
                        timestamp: Date.now()
                    }));
                    console.log('✅ Typing status sent successfully:', !!typing);
                    return;
                } catch (error) {
                    console.error('❌ Error sending typing status:', error);
                }
            }
            
            console.warn('⚠️ Cannot send typing status:', { 
                socketReady: socket?.readyState === WebSocket.OPEN,
                isConnected,
                socketState: socket?.readyState,
                socketExists: !!socket
            });
        };
        
        // Enhanced handleStrangerConnected to ensure proper state
        window.handleStrangerConnected = function(data) {
            console.log('🔗 Enhanced handleStrangerConnected called:', { 
                data, 
                currentChatTypeBefore: currentChatType, 
                isConnectedBefore: isConnected 
            });
            
            // Set connection state immediately
            isConnected = true;
            currentChatType = data.chatType || currentChatType;
            
            console.log('✅ Connection state set:', { isConnected, currentChatType });
            
            // Call original function if it exists
            if (window.originalHandleStrangerConnected) {
                window.originalHandleStrangerConnected(data);
            }
            
            console.log('✅ Enhanced handleStrangerConnected completed');
        };
        
        // Enhanced handleTypingIndicator with debugging
        window.handleTypingIndicator = function(data) {
            console.log('📥 Enhanced handleTypingIndicator called:', data, { currentChatType });
            
            if (data.isTyping) {
                console.log('👀 Showing typing indicator for:', currentChatType);
                showTypingIndicator();
            } else {
                console.log('🙈 Hiding typing indicator for:', currentChatType);
                hideTypingIndicator();
            }
        };
        
        // Setup enhanced input event listeners
        function setupEnhancedInputListeners() {
            const messageInput = document.getElementById('messageInput');
            const videoMessageInput = document.getElementById('videoMessageInput');
            
            if (messageInput) {
                let textUserTyping = false;
                let textUserTypingTimeout = null;
                
                // Remove existing listeners if any
                messageInput.removeEventListener('input', window.textInputHandler);
                
                window.textInputHandler = function() {
                    console.log('📝 Text input event - State:', { 
                        isConnected, 
                        currentChatType, 
                        socketState: socket?.readyState 
                    });
                    
                    // Send typing status if we have a connection, regardless of isConnected flag
                    if (socket?.readyState === WebSocket.OPEN) {
                        if (!textUserTyping) {
                            textUserTyping = true;
                            sendTypingStatus(true);
                            console.log('📝 Started typing in text chat');
                        }

                        if (textUserTypingTimeout) {
                            clearTimeout(textUserTypingTimeout);
                        }

                        textUserTypingTimeout = setTimeout(() => {
                            textUserTyping = false;
                            sendTypingStatus(false);
                            console.log('📝 Stopped typing in text chat (timeout)');
                        }, 2000);
                    } else {
                        console.warn('⚠️ Text typing blocked - no connection');
                    }
                };
                
                messageInput.addEventListener('input', window.textInputHandler);
                console.log('✅ Enhanced text input listener attached');
            }
            
            if (videoMessageInput) {
                let videoUserTyping = false;
                let videoUserTypingTimeout = null;
                
                // Remove existing listeners if any
                videoMessageInput.removeEventListener('input', window.videoInputHandler);
                
                window.videoInputHandler = function() {
                    console.log('📹 Video input event - State:', { 
                        isConnected, 
                        currentChatType, 
                        socketState: socket?.readyState 
                    });
                    
                    // Send typing status if we have a connection, regardless of isConnected flag
                    if (socket?.readyState === WebSocket.OPEN) {
                        if (!videoUserTyping) {
                            videoUserTyping = true;
                            sendTypingStatus(true);
                            console.log('📹 Started typing in video chat');
                        }

                        if (videoUserTypingTimeout) {
                            clearTimeout(videoUserTypingTimeout);
                        }

                        videoUserTypingTimeout = setTimeout(() => {
                            videoUserTyping = false;
                            sendTypingStatus(false);
                            console.log('📹 Stopped typing in video chat (timeout)');
                        }, 2000);
                    } else {
                        console.warn('⚠️ Video typing blocked - no connection');
                    }
                };
                
                videoMessageInput.addEventListener('input', window.videoInputHandler);
                console.log('✅ Enhanced video input listener attached');
            }
        }
        
        // Setup enhanced listeners
        setupEnhancedInputListeners();
        
        // Debug functions
        window.debugTypingFix = function() {
            console.log('🔍 Typing Fix Debug State:', {
                isConnected,
                currentChatType,
                socketState: socket?.readyState,
                socketExists: !!socket,
                inputElements: {
                    messageInput: !!document.getElementById('messageInput'),
                    videoMessageInput: !!document.getElementById('videoMessageInput'),
                    typingIndicator: !!document.getElementById('typingIndicator'),
                    videoTypingIndicator: !!document.getElementById('videoTypingIndicator')
                },
                overriddenFunctions: {
                    sendTypingStatus: window.sendTypingStatus !== window.originalSendTypingStatus,
                    handleStrangerConnected: window.handleStrangerConnected !== window.originalHandleStrangerConnected,
                    handleTypingIndicator: window.handleTypingIndicator !== window.originalHandleTypingIndicator
                }
            });
        };
        
        window.testTypingIndicatorFix = function() {
            console.log('🧪 Testing typing indicator fix...');
            
            // Test showing indicator
            const indicator = currentChatType === 'text' ? 
                document.getElementById('typingIndicator') : 
                document.getElementById('videoTypingIndicator');
            
            if (indicator) {
                console.log('✅ Found indicator element, testing display...');
                indicator.style.display = 'flex';
                setTimeout(() => {
                    indicator.style.display = 'none';
                    console.log('✅ Typing indicator test completed');
                }, 3000);
            } else {
                console.error('❌ Typing indicator element not found');
            }
        };
        
        window.forceConnectedState = function() {
            console.log('🔧 Forcing connected state for testing...');
            isConnected = true;
            currentChatType = 'text';
            console.log('✅ Forced state:', { isConnected, currentChatType });
        };
        
        console.log('✅ Comprehensive typing indicator fix applied successfully!');
        console.log('🧪 Use debugTypingFix(), testTypingIndicatorFix(), or forceConnectedState() to debug');
        
    }, 1500); // Wait for main script to fully load
});