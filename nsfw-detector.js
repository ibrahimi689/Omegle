
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');
const { createCanvas, loadImage } = require('canvas');

class NSFWDetector {
    constructor() {
        this.model = null;
        this.isLoading = false;
        this.detectionThreshold = 0.6; // Sensitivity threshold
    }

    async initialize() {
        if (this.model || this.isLoading) return;
        
        this.isLoading = true;
        try {
            console.log('Loading NSFW detection model...');
            this.model = await nsfw.load();
            console.log('NSFW model loaded successfully');
        } catch (error) {
            console.error('Error loading NSFW model:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async analyzeFrame(imageData) {
        if (!this.model) {
            await this.initialize();
            if (!this.model) return { isNSFW: false, confidence: 0 };
        }

        try {
            // Convert image data to tensor
            const tensor = tf.browser.fromPixels(imageData);
            const predictions = await this.model.classify(tensor);
            tensor.dispose();

            // Check for NSFW content
            const nsfwPredictions = predictions.filter(p => 
                p.className === 'Porn' || 
                p.className === 'Sexy' || 
                p.className === 'Hentai'
            );

            const maxConfidence = Math.max(...nsfwPredictions.map(p => p.probability));
            const isNSFW = maxConfidence > this.detectionThreshold;

            return {
                isNSFW,
                confidence: maxConfidence,
                predictions: predictions
            };
        } catch (error) {
            console.error('Error analyzing frame:', error);
            return { isNSFW: false, confidence: 0 };
        }
    }

    async processVideoFrame(canvas, context) {
        if (!canvas || !context) return { isNSFW: false, confidence: 0 };

        try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            return await this.analyzeFrame(imageData);
        } catch (error) {
            console.error('Error processing video frame:', error);
            return { isNSFW: false, confidence: 0 };
        }
    }
}

module.exports = NSFWDetector;
