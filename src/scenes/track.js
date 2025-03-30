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
        
        // Create the actual road geometry
        this.createRoadGeometry();
        
        // Visualize the spline with a line (for debugging)
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
     * Creates the actual road geometry along the spline
     */
    createRoadGeometry() {
        // Number of segments to divide the road into
        const roadSegments = 200;
        
        // Get evenly spaced points along the curve
        const points = this.curve.getPoints(roadSegments);
        
        // Create a group to hold all road segments
        this.roadGroup = new THREE.Group();
        this.group.add(this.roadGroup);
        
        // Create material for the road surface
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333, // Dark gray asphalt
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        
        // Create road mesh by generating segments between each pair of points
        for (let i = 0; i < points.length - 1; i++) {
            const roadSegment = this.createRoadSegment(points[i], points[i + 1], roadMaterial);
            this.roadGroup.add(roadSegment);
        }
        
        // Add road markings
        this.addRoadMarkings(points);
        
        // Add side barriers
        this.addSideBarriers(points);
    }
    
    /**
     * Creates a single road segment between two points
     */
    createRoadSegment(p1, p2, material) {
        // Get direction vector between the points
        const direction = new THREE.Vector3().subVectors(p2, p1);
        const length = direction.length();
        direction.normalize();
        
        // Calculate the perpendicular vector for road width
        // First get world up vector
        const worldUp = new THREE.Vector3(0, 1, 0);
        
        // Calculate the right vector (perpendicular to direction and up)
        const right = new THREE.Vector3().crossVectors(direction, worldUp).normalize();
        
        // Recalculate a true up vector perpendicular to both
        const up = new THREE.Vector3().crossVectors(right, direction).normalize();
        
        // Create vertices for the road segment (a flat plane)
        const halfWidth = this.width / 2;
        
        // Define the four corners of the road segment
        const v1 = new THREE.Vector3().copy(p1).add(right.clone().multiplyScalar(-halfWidth)); // Back left
        const v2 = new THREE.Vector3().copy(p1).add(right.clone().multiplyScalar(halfWidth));  // Back right
        const v3 = new THREE.Vector3().copy(p2).add(right.clone().multiplyScalar(-halfWidth)); // Front left
        const v4 = new THREE.Vector3().copy(p2).add(right.clone().multiplyScalar(halfWidth));  // Front right
        
        // Create geometry from vertices
        const geometry = new THREE.BufferGeometry();
        
        // Define vertices
        const vertices = new Float32Array([
            // First triangle (back-left, back-right, front-left)
            v1.x, v1.y, v1.z,
            v2.x, v2.y, v2.z,
            v3.x, v3.y, v3.z,
            
            // Second triangle (back-right, front-right, front-left)
            v2.x, v2.y, v2.z,
            v4.x, v4.y, v4.z,
            v3.x, v3.y, v3.z
        ]);
        
        // Define normals (all pointing up)
        const normals = new Float32Array([
            up.x, up.y, up.z,
            up.x, up.y, up.z,
            up.x, up.y, up.z,
            
            up.x, up.y, up.z,
            up.x, up.y, up.z,
            up.x, up.y, up.z
        ]);
        
        // Define UVs for texture mapping
        const uvs = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            
            1, 0,
            1, 1,
            0, 1
        ]);
        
        // Set attributes
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        
        // Create the mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        return mesh;
    }
    
    /**
     * Adds road markings (center line and edge lines)
     */
    addRoadMarkings(points) {
        // Create material for road markings
        const centerLineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // White
        const edgeLineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });  // White
        
        // Create markings every few segments
        const markingInterval = 4; // Every 4th point gets a marking
        
        for (let i = 0; i < points.length - 1; i += markingInterval) {
            const p1 = points[i];
            const p2 = points[Math.min(i + markingInterval/2, points.length - 1)]; // Use half the interval for marking length
            
            // Create center line
            this.addRoadMarking(p1, p2, 0, 0.2, centerLineMaterial); // Center line (0 offset, 0.2 width)
            
            // Create edge lines
            const edgeOffset = this.width / 2 - 0.3; // 0.3 units from the edge
            this.addRoadMarking(p1, p2, -edgeOffset, 0.15, edgeLineMaterial); // Left edge
            this.addRoadMarking(p1, p2, edgeOffset, 0.15, edgeLineMaterial);  // Right edge
        }
    }
    
    /**
     * Adds a road marking line between two points
     */
    addRoadMarking(p1, p2, offset, width, material) {
        // Get direction vector between the points
        const direction = new THREE.Vector3().subVectors(p2, p1);
        const length = direction.length();
        direction.normalize();
        
        // Calculate the perpendicular vector for road width
        const worldUp = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(direction, worldUp).normalize();
        
        // Offset the marking from center
        const offsetVector = right.clone().multiplyScalar(offset);
        
        // Define the line corners with offset
        const halfWidth = width / 2;
        const offsetRight = right.clone().multiplyScalar(halfWidth);
        
        const v1 = new THREE.Vector3().copy(p1).add(offsetVector).sub(offsetRight);  // Back left
        const v2 = new THREE.Vector3().copy(p1).add(offsetVector).add(offsetRight);  // Back right
        const v3 = new THREE.Vector3().copy(p2).add(offsetVector).sub(offsetRight);  // Front left
        const v4 = new THREE.Vector3().copy(p2).add(offsetVector).add(offsetRight);  // Front right
        
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        
        // Define vertices
        const vertices = new Float32Array([
            // First triangle
            v1.x, v1.y + 0.01, v1.z, // Raise slightly above road to prevent z-fighting
            v2.x, v2.y + 0.01, v2.z,
            v3.x, v3.y + 0.01, v3.z,
            
            // Second triangle
            v2.x, v2.y + 0.01, v2.z,
            v4.x, v4.y + 0.01, v4.z,
            v3.x, v3.y + 0.01, v3.z
        ]);
        
        // Set position attribute
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        // Create the mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Add to the road group
        this.roadGroup.add(mesh);
    }
    
    /**
     * Adds barriers on the sides of the road
     */
    addSideBarriers(points) {
        // Create materials for barriers
        const leftBarrierMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF00FF, // Magenta
            emissive: 0xFF00FF,
            emissiveIntensity: 0.3,
            roughness: 0.5,
            metalness: 0.8
        });
        
        const rightBarrierMaterial = new THREE.MeshStandardMaterial({
            color: 0x00FFFF, // Cyan
            emissive: 0x00FFFF,
            emissiveIntensity: 0.3,
            roughness: 0.5,
            metalness: 0.8
        });
        
        // Create barriers every few points to reduce geometry
        const barrierInterval = 4;
        
        for (let i = 0; i < points.length - 1; i += barrierInterval) {
            const p1 = points[i];
            const p2 = points[Math.min(i + barrierInterval, points.length - 1)];
            
            // Create left and right barriers
            this.addBarrier(p1, p2, this.width / 2, leftBarrierMaterial);  // Left side
            this.addBarrier(p1, p2, -this.width / 2, rightBarrierMaterial); // Right side
        }
    }
    
    /**
     * Adds a single barrier segment between two points
     */
    addBarrier(p1, p2, offset, material) {
        // Get direction vector between the points
        const direction = new THREE.Vector3().subVectors(p2, p1);
        const length = direction.length();
        direction.normalize();
        
        // Calculate the perpendicular vector for road width
        const worldUp = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(direction, worldUp).normalize();
        
        // Calculate offset position
        const offsetVector = right.clone().multiplyScalar(offset);
        
        // Create barrier geometry
        const barrierHeight = 0.5;
        const barrierWidth = 0.3;
        const barrierGeometry = new THREE.BoxGeometry(barrierWidth, barrierHeight, length);
        
        // Create barrier mesh
        const barrier = new THREE.Mesh(barrierGeometry, material);
        
        // Position barrier at midpoint between the points, offset by the road width
        const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        midpoint.add(offsetVector);
        
        // Adjust height to sit on road
        midpoint.y += barrierHeight / 2;
        
        barrier.position.copy(midpoint);
        
        // Orient barrier along the road
        const lookPoint = new THREE.Vector3().addVectors(
            midpoint,
            direction
        );
        barrier.lookAt(lookPoint);
        
        // Add to road group
        this.roadGroup.add(barrier);
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
