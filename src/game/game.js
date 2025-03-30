import * as THREE from '../../node_modules/three/build/three.module.js';
import Player from '../objects/player.js';
import Track from '../scenes/track.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Game state
        this.gameSpeed = 1.0; // Global speed multiplier
        this.distance = 0; // Distance traveled
        this.isPaused = false;
        
        // Camera properties
        this.cameraMode = 'follow'; // 'follow' or 'free'
        this.cameraOffset = new THREE.Vector3(0, 5, 10); // Offset behind and above player
        this.cameraLerpFactor = 0.1; // For smooth camera movement
        this.currentCameraPosition = new THREE.Vector3();
        this.currentCameraLookAt = new THREE.Vector3();
        
        this.initialize();
    }
    
    initialize() {
        // Set up renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000022); // Dark blue background
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Set up initial camera position
        this.camera.position.set(0, 10, 30); // Lower and closer to see the player
        this.camera.lookAt(0, 0, -20);
        
        // Initialize track - Pass the scene
        this.track = new Track(this.scene);
        
        // Add the player - pass the track so player can follow it
        this.player = new Player(this.track);
        this.scene.add(this.player.mesh);
        
        // Add ambient light and directional light for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);
        
        // Create HUD for distance
        this.createHUD();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Add event listeners for speed control and camera
        this.setupEventListeners();
        
        // Start render loop
        this.animate();
    }
    
    createHUD() {
        // Container for HUD elements
        this.hudContainer = document.createElement('div');
        this.hudContainer.style.position = 'absolute';
        this.hudContainer.style.top = '10px';
        this.hudContainer.style.left = '10px';
        this.hudContainer.style.color = 'white';
        this.hudContainer.style.fontFamily = 'Arial, sans-serif';
        this.hudContainer.style.fontSize = '14px';
        this.hudContainer.style.textShadow = '1px 1px 2px black';
        document.body.appendChild(this.hudContainer);
        
        // Distance display
        this.distanceDisplay = document.createElement('div');
        this.distanceDisplay.textContent = 'Distance: 0m';
        this.distanceDisplay.style.marginBottom = '5px';
        this.hudContainer.appendChild(this.distanceDisplay);
        
        // Speed display
        this.speedDisplay = document.createElement('div');
        this.speedDisplay.textContent = `Speed: ${this.gameSpeed.toFixed(1)}x`;
        this.speedDisplay.style.marginBottom = '5px';
        this.hudContainer.appendChild(this.speedDisplay);
        
        // Track info
        this.trackInfoDisplay = document.createElement('div');
        this.trackInfoDisplay.textContent = 'Track Points: Loading...';
        this.trackInfoDisplay.style.marginBottom = '5px';
        this.hudContainer.appendChild(this.trackInfoDisplay);
        
        // Lateral position display
        this.lateralDisplay = document.createElement('div');
        this.lateralDisplay.textContent = 'Position: Center';
        this.lateralDisplay.style.marginBottom = '5px';
        this.hudContainer.appendChild(this.lateralDisplay);
        
        // Camera position
        this.cameraInfoDisplay = document.createElement('div');
        this.cameraInfoDisplay.textContent = 'Camera: 0, 0, 0';
        this.cameraInfoDisplay.style.marginBottom = '5px';
        this.hudContainer.appendChild(this.cameraInfoDisplay);
        
        // Camera mode display
        this.cameraModeDisplay = document.createElement('div');
        this.cameraModeDisplay.textContent = 'Camera Mode: Follow';
        this.cameraModeDisplay.style.marginBottom = '5px';
        this.hudContainer.appendChild(this.cameraModeDisplay);
        
        // Help container
        const helpContainer = document.createElement('div');
        helpContainer.style.position = 'absolute';
        helpContainer.style.bottom = '10px';
        helpContainer.style.left = '10px';
        helpContainer.style.color = 'white';
        helpContainer.style.fontFamily = 'Arial, sans-serif';
        helpContainer.style.fontSize = '12px';
        helpContainer.style.textShadow = '1px 1px 2px black';
        helpContainer.innerHTML = `
            Controls:<br>
            A/D or ←/→: Steer left/right<br>
            W/S or ↑/↓: Increase/decrease speed<br>
            SPACE: Generate new track<br>
            C: Toggle camera mode (follow/free)<br>
            Free camera: Q/E (left/right), R/F (up/down), T/G (fwd/back)
        `;
        document.body.appendChild(helpContainer);
        
        // Update track info if track exists
        if (this.track) {
            this.trackInfoDisplay.textContent = `Track Points: ${this.track.controlPoints.length}`;
        }
    }
    
    updateCameraInfo() {
        if (this.cameraInfoDisplay) {
            const pos = this.camera.position;
            this.cameraInfoDisplay.textContent = `Camera: ${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`;
        }
        
        if (this.cameraModeDisplay) {
            this.cameraModeDisplay.textContent = `Camera Mode: ${this.cameraMode.charAt(0).toUpperCase() + this.cameraMode.slice(1)}`;
        }
        
        if (this.lateralDisplay && this.player) {
            let positionText = 'Center';
            const lateralPos = this.player.lateralPosition;
            
            if (lateralPos < -0.2) positionText = 'Left';
            else if (lateralPos > 0.2) positionText = 'Right';
            
            this.lateralDisplay.textContent = `Position: ${positionText} (${lateralPos.toFixed(2)})`;
        }
    }
    
    setupEventListeners() {
        // Speed control keys
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    // Increase speed
                    this.gameSpeed = Math.min(2.5, this.gameSpeed + 0.1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    // Decrease speed
                    this.gameSpeed = Math.max(0.3, this.gameSpeed - 0.1);
                    break;
                case ' ': // Spacebar
                    // Generate a new random track
                    this.regenerateTrack();
                    break;
                
                // Toggle camera mode with C key
                case 'c':
                case 'C':
                    this.cameraMode = this.cameraMode === 'follow' ? 'free' : 'follow';
                    if (this.cameraMode === 'free') {
                        // Set up for free camera
                        this.camera.position.set(0, 50, 50);
                        this.camera.lookAt(0, 0, -150);
                    }
                    break;
                
                // Camera control for free camera mode
                case 'q':
                    if (this.cameraMode === 'free') this.camera.position.x -= 5;
                    break;
                case 'e':
                    if (this.cameraMode === 'free') this.camera.position.x += 5;
                    break;
                case 'r':
                    if (this.cameraMode === 'free') this.camera.position.y += 5;
                    break;
                case 'f':
                    if (this.cameraMode === 'free') this.camera.position.y -= 5;
                    break;
                case 't':
                    if (this.cameraMode === 'free') this.camera.position.z -= 5;
                    break;
                case 'g':
                    if (this.cameraMode === 'free') this.camera.position.z += 5;
                    break;
            }
            
            // Update camera target and info
            if (this.cameraMode === 'free') {
                this.camera.lookAt(0, 0, -150);
            }
            this.updateCameraInfo();
            
            // Update speed display
            this.speedDisplay.textContent = `Speed: ${this.gameSpeed.toFixed(1)}x`;
        });
    }
    
    regenerateTrack() {
        // Remove current track from scene
        if (this.track) {
            this.scene.remove(this.track.group);
        }
        
        // Create a new track
        this.track = new Track(this.scene);
        
        // Reset player position on new track
        if (this.player) {
            this.player.track = this.track;
            this.player.trackTime = 0;
            this.player.distance = 0;
            this.player.updatePositionOnTrack();
        }
        
        // Update track info
        if (this.trackInfoDisplay) {
            this.trackInfoDisplay.textContent = `Track Points: ${this.track.controlPoints.length}`;
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        if (this.isPaused) return;
        
        // Update player
        if (this.player) {
            this.distance = this.player.update(this.gameSpeed);
            this.distanceDisplay.textContent = `Distance: ${Math.floor(this.distance)}m`;
            
            // Update lateral position display
            this.updateCameraInfo();
            
            // Update camera if in follow mode
            if (this.cameraMode === 'follow') {
                this.updateFollowCamera();
            }
        }
        
        // Update camera info each frame
        this.updateCameraInfo();
    }
    
    updateFollowCamera() {
        if (!this.player || !this.player.mesh) return;
        
        // Get player's position and rotation
        const playerPos = this.player.mesh.position.clone();
        const playerRotation = new THREE.Euler().copy(this.player.mesh.rotation);
        
        // Use player's forward direction (based on its rotation)
        const directionVector = new THREE.Vector3(0, 0, 1);
        directionVector.applyEuler(playerRotation);
        
        // Calculate camera position - behind and above player
        const offsetVector = new THREE.Vector3(
            this.cameraOffset.x,
            this.cameraOffset.y,
            this.cameraOffset.z
        );
        offsetVector.applyEuler(playerRotation);
        
        // Calculate target camera position
        const targetCameraPos = playerPos.clone().add(offsetVector);
        
        // Look at a point ahead of the player
        const lookAheadDistance = 10; // Look further ahead for smoother experience
        const lookAtVector = new THREE.Vector3(0, 0, -lookAheadDistance);
        lookAtVector.applyEuler(playerRotation);
        const targetLookAt = playerPos.clone().add(lookAtVector);
        
        // If we don't have initial positions, set them directly
        if (!this.currentCameraPosition.lengthSq()) {
            this.currentCameraPosition.copy(targetCameraPos);
            this.currentCameraLookAt.copy(targetLookAt);
        } else {
            // Smoothly interpolate camera position
            this.currentCameraPosition.lerp(targetCameraPos, this.cameraLerpFactor);
            this.currentCameraLookAt.lerp(targetLookAt, this.cameraLerpFactor);
        }
        
        // Set camera position and look at point
        this.camera.position.copy(this.currentCameraPosition);
        this.camera.lookAt(this.currentCameraLookAt);
        
        // Add a subtle camera shake/bob based on speed
        const shakeAmount = 0.03 * this.gameSpeed;
        this.camera.position.y += Math.sin(this.distance * 0.3) * shakeAmount;
        this.camera.position.x += Math.sin(this.distance * 0.5) * shakeAmount * 0.5;
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.render();
    }
}

// Initialize the game when the window loads
window.addEventListener('load', () => {
    const game = new Game();
});
