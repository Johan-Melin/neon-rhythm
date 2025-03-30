import * as THREE from '../../node_modules/three/build/three.module.js';
import Player from '../objects/player.js';

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
        this.camera.position.z = 5;
        this.camera.position.y = 2;
        this.camera.rotation.x = -0.3; // Tilt camera down slightly
        
        // Initialize player
        this.player = new Player();
        this.scene.add(this.player.mesh);
        
        // Add temporary ground plane for better orientation
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshBasicMaterial({
            color: 0x555555,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = Math.PI / 2; // Rotate to be horizontal
        ground.position.y = 0;
        this.scene.add(ground);
        
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
