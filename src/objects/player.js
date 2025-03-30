import * as THREE from '../../../node_modules/three/build/three.module.js';

export default class Player {
    constructor() {
        // Create a simple cube to represent the player's vehicle
        const geometry = new THREE.BoxGeometry(1, 0.5, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff // Cyan color for the player vehicle
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 0.25; // Position slightly above the track
        
        // Movement properties
        this.speed = 0.1;
        this.leftBound = -3;
        this.rightBound = 3;
        
        // Control state
        this.keys = {
            left: false,
            right: false
        };
        
        // Set up event listeners for keyboard input
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keydown event listener
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = true;
                    break;
            }
        });
        
        // Keyup event listener
        document.addEventListener('keyup', (event) => {
            switch(event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = false;
                    break;
            }
        });
    }
    
    update() {
        // Handle left movement
        if (this.keys.left && this.mesh.position.x > this.leftBound) {
            this.mesh.position.x -= this.speed;
        }
        
        // Handle right movement
        if (this.keys.right && this.mesh.position.x < this.rightBound) {
            this.mesh.position.x += this.speed;
        }
    }
} 