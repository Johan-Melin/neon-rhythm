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
        
        // Set up camera position for better visualization of the spline
        this.camera.position.set(0, 50, 50); // Position camera high and back
        this.camera.lookAt(0, 0, -150); // Look at the middle of the track
        
        // Initialize track
        this.track = new Track();
        this.scene.add(this.track.group);
        
        // Temporarily disable player for spline visualization
        // this.player = new Player();
        // this.scene.add(this.player.mesh);
        
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
        
        // Add event listeners for speed control
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
                
                // Camera control for visualization
                case 'q':
                    // Move camera left
                    this.camera.position.x -= 5;
                    break;
                case 'e':
                    // Move camera right
                    this.camera.position.x += 5;
                    break;
                case 'r':
                    // Move camera up
                    this.camera.position.y += 5;
                    break;
                case 'f':
                    // Move camera down
                    this.camera.position.y -= 5;
                    break;
                case 't':
                    // Move camera forward
                    this.camera.position.z -= 5;
                    break;
                case 'g':
                    // Move camera backward
                    this.camera.position.z += 5;
                    break;
            }
            
            // Update camera target and info
            this.camera.lookAt(0, 0, -150);
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
        this.track = new Track();
        this.scene.add(this.track.group);
        
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
        
        // Update camera info each frame
        this.updateCameraInfo();
        
        // Temporarily disable player update for spline visualization
        // if (this.player) {
        //     this.player.update();
        // }
        
        // For now, we don't need to update the track - just visualize it
        // if (this.track) {
        //     // Apply game speed to track movement
        //     this.track.speed = 0.2 * this.gameSpeed;
        //     this.track.update();
        //     
        //     // Update distance traveled
        //     this.distance = this.track.getDistanceTraveled();
        //     this.distanceDisplay.textContent = `Distance: ${Math.floor(this.distance)}m`;
        // }
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
