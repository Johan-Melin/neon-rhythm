import * as THREE from '../../../node_modules/three/build/three.module.js';

export default class Track {
    constructor(length = 100) {
        // Track properties
        this.length = length; // Total length of the track
        this.width = 7; // Width of the track
        
        // Create a group to hold all track objects
        this.group = new THREE.Group();
        
        // Generate control points for the track's spline
        this.controlPoints = this.generateControlPoints();
        
        // Create the spline from control points
        this.createSpline();
        
        // Visualize the spline with a line
        this.visualizeSpline();
    }
    
    /**
     * Generates an array of 3D points that define the path of the track.
     * Each point is a THREE.Vector3 with x, y, z coordinates.
     * - x: lateral position (left/right)
     * - y: elevation (up/down)
     * - z: forward position (ahead/behind)
     * 
     * @returns {Array<THREE.Vector3>} Array of control points
     */
    generateControlPoints() {
        // Array to store our control points
        const controlPoints = [];
        
        // Track parameters
        const trackLength = 400; // Total track length
        const numSegments = 20; // Number of track segments
        const segmentLength = trackLength / numSegments; // Length of each segment
        
        // Randomization parameters
        const maxLateralChange = 15; // Maximum change in x per segment
        const maxElevationChange = 5; // Maximum change in y per segment
        const maxElevation = 10; // Maximum elevation (y) allowed
        const turnProbability = 0.4; // Probability of a turn vs straight segment
        const elevationChangeProbability = 0.3; // Probability of elevation change
        
        // Start at origin
        let currentX = 0;
        let currentY = 0;
        let currentZ = 0;
        
        // Starting direction is straight ahead
        let direction = new THREE.Vector3(0, 0, -1);
        
        // Add first control point at origin
        controlPoints.push(new THREE.Vector3(currentX, currentY, currentZ));
        
        // Generate track segments
        for (let i = 0; i < numSegments; i++) {
            // Decide if this segment will have a turn
            const shouldTurn = Math.random() < turnProbability;
            
            // Decide if this segment will have elevation change
            const shouldChangeElevation = Math.random() < elevationChangeProbability;
            
            // Calculate lateral change (x direction)
            let lateralChange = 0;
            if (shouldTurn) {
                // Random turn amount (-1 for left, +1 for right)
                lateralChange = (Math.random() * 2 - 1) * maxLateralChange;
                
                // Prevent turn from going too far from center
                if (currentX + lateralChange > 30) lateralChange = 30 - currentX;
                if (currentX + lateralChange < -30) lateralChange = -30 - currentX;
            }
            
            // Calculate elevation change (y direction)
            let elevationChange = 0;
            if (shouldChangeElevation) {
                // Random elevation change
                elevationChange = (Math.random() * 2 - 1) * maxElevationChange;
                
                // Prevent elevation from going too high or below ground
                if (currentY + elevationChange > maxElevation) elevationChange = maxElevation - currentY;
                if (currentY + elevationChange < 0) elevationChange = -currentY;
            }
            
            // Update position for next control point
            currentX += lateralChange;
            currentY += elevationChange;
            currentZ -= segmentLength; // Move forward along z-axis
            
            // Add new control point
            controlPoints.push(new THREE.Vector3(currentX, currentY, currentZ));
        }
        
        // Ensure the last segments form a smooth curve back toward the start
        // Getting close to the x=0 line in the last 3 segments
        const lastIndex = controlPoints.length - 1;
        if (lastIndex >= 3) {
            // Modify the last few points to gradually return toward starting x position
            const finalX = controlPoints[lastIndex].x;
            
            // Adjust x positions to gradually approach 0
            controlPoints[lastIndex-2].x = finalX * 0.75;
            controlPoints[lastIndex-1].x = finalX * 0.5;
            controlPoints[lastIndex].x = finalX * 0.25;
        }
        
        return controlPoints;
    }
    
    /**
     * Creates a spline curve from the control points
     */
    createSpline() {
        // Create a Catmull-Rom spline that passes through all control points
        this.curve = new THREE.CatmullRomCurve3(this.controlPoints);
        this.curve.closed = false; // Open-ended curve (not a loop)
    }
    
    /**
     * Visualizes the spline with a colored line
     */
    visualizeSpline() {
        // Sample more points along the curve for a smooth visualization
        const points = this.curve.getPoints(200);
        
        // Create a geometry from the points
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create materials for different parts of the track
        const straightMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 }); // Yellow for straight sections
        
        // Create the line from the geometry and material
        const splineLine = new THREE.Line(geometry, straightMaterial);
        
        // Add to the group
        this.group.add(splineLine);
        
        // Visualize the control points as small spheres
        this.visualizeControlPoints();
    }
    
    /**
     * Visualizes the control points as small spheres
     */
    visualizeControlPoints() {
        const sphereGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red
        
        // Create a sphere for each control point
        this.controlPoints.forEach(point => {
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.copy(point);
            this.group.add(sphere);
        });
    }
    
    /**
     * Updates the track's position and state
     * This will be used later for movement
     */
    update() {
        // For now, just a placeholder
        // Later, we'll add movement logic here
    }
    
    /**
     * Gets the total distance traveled
     * This is a placeholder for now
     */
    getDistanceTraveled() {
        return 0;
    }
}
