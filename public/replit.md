# Overview

This is a modern video chat platform serving as an alternative to the original Omegle. The platform enables anonymous video and text chat between random strangers worldwide, built with a focus on safety, privacy, and user experience. The application is designed as a Progressive Web App (PWA) with real-time communication capabilities and content moderation features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend uses a traditional multi-page web application approach with modern web technologies:
- **Static HTML pages** for different sections (landing, about, privacy, contact, etc.)
- **Vanilla JavaScript** for core chat functionality and WebRTC implementation
- **CSS with mobile-first responsive design** optimized for PWA experience
- **Service Worker** for offline functionality and caching
- **WebRTC API** for peer-to-peer video/audio communication
- **Client-side NSFW detection** using TensorFlow.js and NSFWJS for content moderation

## Backend Architecture  
The backend follows a simple Node.js WebSocket server pattern:
- **Express.js HTTP server** serving static files and handling basic routes
- **WebSocket server** using the 'ws' library for real-time signaling
- **In-memory user management** with Map-based storage for active connections
- **Room-based matching system** for pairing users based on interests and chat preferences
- **Server-side NSFW detection** using TensorFlow.js Node and Canvas for image processing

## Real-time Communication
- **WebRTC for direct peer-to-peer** video/audio streams between clients
- **WebSocket signaling server** to facilitate connection establishment and user matching
- **STUN/TURN server integration** (prepared for NAT traversal, currently using default configuration)

## Content Moderation & Safety
- **Dual NSFW detection** with both client-side and server-side TensorFlow.js models
- **Violation tracking system** with automatic user blocking for repeated offenses
- **Frame analysis pipeline** that samples video streams at regular intervals
- **Privacy-focused design** with no persistent data storage and anonymous connections

## Progressive Web App Features
- **Manifest.json** configuration for app-like installation
- **Service Worker** with caching strategies for offline functionality
- **Mobile-optimized UI** with touch-friendly controls and responsive design
- **iOS-specific optimizations** for video playback and user experience

# External Dependencies

## Core Technologies
- **Node.js runtime** for server execution
- **Express.js** for HTTP server and static file serving
- **WebSocket (ws)** library for real-time bidirectional communication
- **CORS middleware** for cross-origin request handling

## AI/ML Content Moderation
- **TensorFlow.js (@tensorflow/tfjs-node)** for server-side machine learning
- **NSFWJS library** for inappropriate content detection
- **Canvas (node-canvas)** for server-side image processing and frame analysis

## Frontend Libraries
- **Font Awesome CDN** for iconography and UI elements
- **TensorFlow.js browser version** for client-side content detection
- **WebRTC APIs** (built into modern browsers) for video communication

## Monitoring & Analytics
- **Google Analytics** integration (configured but requires measurement ID)
- **Google AdSense** preparation for monetization
- **Service Worker** for performance monitoring and caching

## Browser APIs
- **MediaDevices API** for camera and microphone access
- **WebRTC PeerConnection API** for direct peer communication
- **IndexedDB/localStorage** for client-side data persistence
- **Geolocation API** for location-based features (optional)