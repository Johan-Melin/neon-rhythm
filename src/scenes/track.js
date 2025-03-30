import * as THREE from '../../../node_modules/three/build/three.module.js';

export default class Track {
    constructor(length = 100) {
        // Track properties
        this.length = length; // Length of the track
        this.width = 7; // Width of the track
        
        // Movement properties
        this.speed = 0.2; // Speed at which the track moves
        this.totalDistance = 0; // Total distance traveled
        
        // Create the track mesh
        this.createTrack();
    }
    
    createTrack() {
        // Create a group to hold all track elements
        this.group = new THREE.Group();
        
        // Create the main track surface
        const trackGeometry = new THREE.PlaneGeometry(this.width, this.length);
        const trackMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333, // Dark gray for the track
            side: THREE.DoubleSide
        });
        this.trackSurface = new THREE.Mesh(trackGeometry, trackMaterial);
        this.trackSurface.rotation.x = Math.PI / 2; // Rotate to be horizontal
        this.trackSurface.position.z = -this.length / 2; // Position track ahead of player
        this.group.add(this.trackSurface);
        
        // Add lane markers
        this.addLaneMarkers();
        
        // Add side boundaries/walls
        this.addSideBoundaries();
    }
    
    addLaneMarkers() {
        // Create lane divider markings
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // White lane markers
        
        // Create dashed line markers along the track
        const markerCount = Math.floor(this.length / 5); // One marker every 5 units
        const markerGeometry = new THREE.PlaneGeometry(0.2, 1);
        
        for (let i = 0; i < markerCount; i++) {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.rotation.x = Math.PI / 2; // Align with track
            marker.position.z = -i * 5 - 2.5; // Position along track with spacing
            marker.position.y = 0.01; // Slightly above track to prevent z-fighting
            this.group.add(marker);
        }
    }
    
    addSideBoundaries() {
        // Add neon side walls to make the track look more aesthetic
        const sideGeometry = new THREE.BoxGeometry(0.3, 0.5, this.length);
        const leftMaterial = new THREE.MeshBasicMaterial({ color: 0xFF00FF }); // Magenta
        const rightMaterial = new THREE.MeshBasicMaterial({ color: 0x00FFFF }); // Cyan
        
        // Left boundary
        const leftBoundary = new THREE.Mesh(sideGeometry, leftMaterial);
        leftBoundary.position.x = -this.width / 2 - 0.15;
        leftBoundary.position.y = 0.25;
        leftBoundary.position.z = -this.length / 2;
        this.group.add(leftBoundary);
        
        // Right boundary
        const rightBoundary = new THREE.Mesh(sideGeometry, rightMaterial);
        rightBoundary.position.x = this.width / 2 + 0.15;
        rightBoundary.position.y = 0.25;
        rightBoundary.position.z = -this.length / 2;
        this.group.add(rightBoundary);
    }
    
    update() {
        // Move the entire track group forward toward player
        this.group.position.z += this.speed;
        this.totalDistance += this.speed;
        
        // When the track has moved a certain distance, reset its position
        // This creates the illusion of an infinite track
        if (this.group.position.z > this.length / 2) {
            this.group.position.z = 0;
        }
    }
    
    // Getter for total distance traveled (useful for spawning obstacles later)
    getDistanceTraveled() {
        return this.totalDistance;
    }
} 