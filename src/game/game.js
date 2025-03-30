import * as THREE from '../../node_modules/three/build/three.module.js';

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
        
        // Add a simple cube to verify the scene is working
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
        
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
        // Game logic update will go here
        // Rotate the cube for visibility
        if (this.cube) {
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
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
