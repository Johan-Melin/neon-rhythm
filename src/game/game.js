import * as THREE from '../../node_modules/three/build/three.module.js';
import Player from '../objects/player.js';
import Track from '../scenes/track.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
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
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Start render loop
        this.animate();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        // Update player
        if (this.player) {
            this.player.update();
        }
        
        // Update track
        if (this.track) {
            this.track.update();
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
