
// Client-side NSFW Detection Module
class ClientNSFWDetector {
    constructor() {
        this.model = null;
        this.isLoading = false;
        this.detectionCanvas = null;
        this.detectionContext = null;
        this.detectionInterval = null;
        this.violationCount = 0;
        this.isBlocked = false;
        this.detectionFrequency = 2000; // Check every 2 seconds
        this.threshold = 0.6;
    }

    async initialize() {
        if (this.model || this.isLoading) return;
        
        this.isLoading = true;
        try {
            // Load TensorFlow.js and NSFWJS from CDN
            if (typeof tf === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js');
            }
            if (typeof nsfwjs === 'undefined') {
                await this.loadScript('https://unpkg.com/nsfwjs@latest/dist/nsfwjs.min.js');
            }

            console.log('Loading NSFW detection model...');
            this.model = await nsfwjs.load();
            
            // Create detection canvas
            this.detectionCanvas = document.createElement('canvas');
            this.detectionCanvas.width = 224;
            this.detectionCanvas.height = 224;
            this.detectionContext = this.detectionCanvas.getContext('2d');
            
            console.log('NSFW model loaded successfully');
        } catch (error) {
            console.error('Error loading NSFW model:', error);
        } finally {
            this.isLoading = false;
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    startMonitoring(videoElement) {
        if (!videoElement || this.detectionInterval) return;

        this.detectionInterval = setInterval(async () => {
            if (this.isBlocked || !this.model || !videoElement.videoWidth) return;
            
            try {
                await this.analyzeVideo(videoElement);
            } catch (error) {
                console.error('Error during video analysis:', error);
            }
        }, this.detectionFrequency);
    }

    stopMonitoring() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }

    async analyzeVideo(videoElement) {
        if (!this.model || !this.detectionContext) return;

        try {
            // Draw video frame to detection canvas
            this.detectionContext.drawImage(
                videoElement, 
                0, 0, 
                this.detectionCanvas.width, 
                this.detectionCanvas.height
            );

            // Get predictions
            const predictions = await this.model.classify(this.detectionCanvas);
            
            // Check for NSFW content
            const nsfwPredictions = predictions.filter(p => 
                p.className === 'Porn' || 
                p.className === 'Sexy' || 
                p.className === 'Hentai'
            );

            const maxConfidence = Math.max(...nsfwPredictions.map(p => p.probability));
            
            if (maxConfidence > this.threshold) {
                this.handleNSFWDetection(maxConfidence, predictions);
            }
        } catch (error) {
            console.error('Error analyzing video frame:', error);
        }
    }

    handleNSFWDetection(confidence, predictions) {
        this.violationCount++;
        this.isBlocked = true;

        console.log('NSFW content detected:', { confidence, predictions });

        // Block local video stream
        if (localVideo && localVideo.srcObject) {
            const tracks = localVideo.srcObject.getTracks();
            tracks.forEach(track => {
                if (track.kind === 'video') {
                    track.enabled = false;
                }
            });
        }

        // Notify server
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'nsfw_violation',
                confidence: confidence,
                timestamp: Date.now()
            }));
        }

        // Show warning to user
        this.showWarning(confidence);

        // Auto-unblock after 10 seconds (give user chance to adjust)
        setTimeout(() => {
            this.isBlocked = false;
            if (localVideo && localVideo.srcObject) {
                const tracks = localVideo.srcObject.getTracks();
                tracks.forEach(track => {
                    if (track.kind === 'video') {
                        track.enabled = true;
                    }
                });
            }
        }, 10000);
    }

    showWarning(confidence) {
        // Create warning overlay
        const warningOverlay = document.createElement('div');
        warningOverlay.className = 'nsfw-warning-overlay';
        warningOverlay.innerHTML = `
            <div class="nsfw-warning-content">
                <h3>⚠️ Content Warning</h3>
                <p>Inappropriate content detected and blocked.</p>
                <p>Confidence: ${(confidence * 100).toFixed(1)}%</p>
                <p>Please ensure your video is appropriate for all audiences.</p>
                <small>Video will resume automatically in 10 seconds.</small>
            </div>
        `;

        document.body.appendChild(warningOverlay);

        // Remove warning after 10 seconds
        setTimeout(() => {
            if (warningOverlay.parentNode) {
                warningOverlay.parentNode.removeChild(warningOverlay);
            }
        }, 10000);
    }
}

// Initialize global NSFW detector
const clientNSFWDetector = new ClientNSFWDetector();
