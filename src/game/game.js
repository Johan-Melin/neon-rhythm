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
        this.renderer.setClearColor(0x000000);
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Set up camera position
        this.camera.position.z = 7; // Move camera back a bit
        this.camera.position.y = 3; // Position camera higher
        this.camera.rotation.x = -0.3; // Tilt camera down slightly
        
        // Initialize track
        this.track = new Track();
        this.scene.add(this.track.group);
        
        // Initialize player
        this.player = new Player();
        this.scene.add(this.player.mesh);
        
        // Add ambient light to make materials visible
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
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
                    // Toggle pause
                    this.isPaused = !this.isPaused;
                    break;
            }
            
            // Update speed display
            this.speedDisplay.textContent = `Speed: ${this.gameSpeed.toFixed(1)}x`;
        });
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
            this.player.update();
        }
        
        // Update track with game speed
        if (this.track) {
            // Apply game speed to track movement
            this.track.speed = 0.2 * this.gameSpeed;
            this.track.update();
            
            // Update distance traveled
            this.distance = this.track.getDistanceTraveled();
            this.distanceDisplay.textContent = `Distance: ${Math.floor(this.distance)}m`;
        }
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
