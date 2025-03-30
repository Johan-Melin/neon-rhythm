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
        
        // Camera settings
        this.cameraMode = 'follow'; // 'follow' or 'free'
        this.cameraOffset = new THREE.Vector3(0, 5, 10); // Offset behind and above player
        
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
        // Create a container for the HUD
        const hudContainer = document.createElement('div');
        hudContainer.id = 'hud-container';
        hudContainer.style.position = 'absolute';
        hudContainer.style.top = '10px';
        hudContainer.style.left = '10px';
        hudContainer.style.padding = '10px';
        hudContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        hudContainer.style.color = '#fff';
        hudContainer.style.fontFamily = 'Arial, sans-serif';
        hudContainer.style.borderRadius = '5px';
        document.body.appendChild(hudContainer);
        
        // Create the distance display
        this.distanceDisplay = document.createElement('div');
        this.distanceDisplay.textContent = 'Distance: 0m';
        hudContainer.appendChild(this.distanceDisplay);
        
        // Create the speed display
        this.speedDisplay = document.createElement('div');
        this.speedDisplay.textContent = 'Speed: 1.0x';
        hudContainer.appendChild(this.speedDisplay);
        
        // Create track info display
        this.trackInfoDisplay = document.createElement('div');
        if (this.track && this.track.controlPoints) {
            this.trackInfoDisplay.textContent = `Track Points: ${this.track.controlPoints.length}`;
        } else {
            this.trackInfoDisplay.textContent = 'Track: Loading...';
        }
        hudContainer.appendChild(this.trackInfoDisplay);
        
        // Add camera position display
        this.cameraInfoDisplay = document.createElement('div');
        this.updateCameraInfo();
        hudContainer.appendChild(this.cameraInfoDisplay);
        
        // Add help text
        const helpContainer = document.createElement('div');
        helpContainer.id = 'help-container';
        helpContainer.style.position = 'absolute';
        helpContainer.style.bottom = '10px';
        helpContainer.style.left = '10px';
        helpContainer.style.padding = '10px';
        helpContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        helpContainer.style.color = '#fff';
        helpContainer.style.fontFamily = 'Arial, sans-serif';
        helpContainer.style.borderRadius = '5px';
        document.body.appendChild(helpContainer);
        
        helpContainer.innerHTML = `
            <h3>Camera Controls:</h3>
            <p>Q/E: Move Left/Right</p>
            <p>R/F: Move Up/Down</p>
            <p>T/G: Move Forward/Back</p>
            <p>Press Space to generate a new track</p>
        `;
    }
    
    updateCameraInfo() {
        if (this.cameraInfoDisplay) {
            const pos = this.camera.position;
            this.cameraInfoDisplay.textContent = `Camera: X:${pos.x.toFixed(1)} Y:${pos.y.toFixed(1)} Z:${pos.z.toFixed(1)}`;
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
                    this.gameSpeed = Math.min(2.0, this.gameSpeed + 0.1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    // Decrease speed
                    this.gameSpeed = Math.max(0.5, this.gameSpeed - 0.1);
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
        
        // Set camera position
        this.camera.position.copy(playerPos).add(offsetVector);
        
        // Look at a point ahead of the player
        const lookAtVector = new THREE.Vector3(0, 0, -5);
        lookAtVector.applyEuler(playerRotation);
        const lookAtPos = playerPos.clone().add(lookAtVector);
        this.camera.lookAt(lookAtPos);
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
