import * as THREE from '../../node_modules/three/build/three.module.js';

export default class Player {
    constructor(track) {
        // Save reference to track
        this.track = track;
        
        // Group to hold all player parts
        this.mesh = new THREE.Group();
        
        // Create a more detailed vehicle
        this.createCarBody();
        this.createWindows();
        this.createWheels();
        this.createLights();
        this.createSpoiler();
        
        // Movement properties
        this.speed = 0.5; // Forward movement speed
        this.distance = 0; // Distance traveled along the track
        this.trackTime = 0; // Time parameter for the curve (0 to 1)
        this.lateralPosition = 0; // Left/right position on the track (-1 to 1)
        this.maxLateralPosition = 0.8; // How far from center player can move
        
        // Turning properties for smooth transitions
        this.turnAmount = 0; // Current turn amount (-1 to 1)
        this.maxTurnAmount = 0.5; // Max turn amount
        this.turnDamping = 0.92; // Damping factor for smooth turn recentering
        this.steeringAngle = 0; // Current steering wheel angle
        this.maxSteeringAngle = Math.PI / 4; // Maximum steering angle (45 degrees)
        
        // Control state
        this.keys = {
            left: false,
            right: false
        };
        
        // Setup initial position on the track
        this.updatePositionOnTrack();
        
        // Set up event listeners for keyboard input
        this.setupEventListeners();
    }
    
    createCarBody() {
        // Main body - more sleek and sporty
        const bodyGeometry = new THREE.BoxGeometry(1.5, 0.4, 2.8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x3388ff, // Blue color
            metalness: 0.8,
            roughness: 0.2
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 0.05; // Slight adjustment for wheels
        this.mesh.add(this.body);
        
        // Hood - sloping front
        const hoodGeometry = new THREE.BoxGeometry(1.4, 0.2, 0.8);
        const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
        hood.position.set(0, 0.15, -0.9);
        hood.rotation.x = -0.1; // Slight angle for aerodynamic look
        this.mesh.add(hood);
        
        // Roof - slightly rounded
        const roofGeometry = new THREE.BoxGeometry(1.3, 0.25, 1.2);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x3388ff,
            metalness: 0.8,
            roughness: 0.1
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 0.5, 0.1);
        this.mesh.add(roof);
        
        // Bumpers
        const bumperMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.5,
            roughness: 0.5
        });
        
        // Front bumper
        const frontBumperGeometry = new THREE.BoxGeometry(1.5, 0.25, 0.2);
        const frontBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
        frontBumper.position.set(0, -0.07, -1.35);
        this.mesh.add(frontBumper);
        
        // Rear bumper
        const rearBumperGeometry = new THREE.BoxGeometry(1.5, 0.25, 0.2);
        const rearBumper = new THREE.Mesh(rearBumperGeometry, bumperMaterial);
        rearBumper.position.set(0, -0.07, 1.35);
        this.mesh.add(rearBumper);
    }
    
    createWindows() {
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.7,
            metalness: 1.0,
            roughness: 0.1
        });
        
        // Windshield
        const windshieldGeometry = new THREE.BoxGeometry(1.2, 0.5, 0.1);
        const windshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
        windshield.position.set(0, 0.4, -0.5);
        windshield.rotation.x = Math.PI / 4; // Angled windshield
        this.mesh.add(windshield);
        
        // Rear window
        const rearWindowGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.1);
        const rearWindow = new THREE.Mesh(rearWindowGeometry, glassMaterial);
        rearWindow.position.set(0, 0.4, 0.7);
        rearWindow.rotation.x = -Math.PI / 6; // Angled rear window
        this.mesh.add(rearWindow);
        
        // Side windows
        const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.3, 1.0);
        
        // Left side window
        const leftWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
        leftWindow.position.set(-0.75, 0.4, 0.1);
        this.mesh.add(leftWindow);
        
        // Right side window
        const rightWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
        rightWindow.position.set(0.75, 0.4, 0.1);
        this.mesh.add(rightWindow);
    }
    
    createWheels() {
        // Higher quality wheel geometry
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.25, 24);
        wheelGeometry.rotateX(Math.PI / 2); // Rotate to align with car
        wheelGeometry.rotateY(Math.PI / 2); // Rotate to align with car

        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Rim material
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.1
        });
        
        // Wheel positions (moved slightly outward)
        const wheelPositions = [
            [-0.75, -0.2, -0.8], // Front left
            [0.75, -0.2, -0.8],  // Front right
            [-0.75, -0.2, 0.8],  // Back left
            [0.75, -0.2, 0.8]    // Back right
        ];
        
        // Store wheel references for rotation
        this.wheels = [];
        this.frontWheels = [];
        
        // Create wheels with rims
        wheelPositions.forEach((position, index) => {
            // Create wheel group for independent rotation
            const wheelGroup = new THREE.Group();
            wheelGroup.position.set(...position);
            this.mesh.add(wheelGroup);
            
            // Wheel
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheelGroup.add(wheel);
            
            // Rim
            const rimGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8);
            rimGeometry.rotateX(Math.PI / 2);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            wheelGroup.add(rim);
            
            // Store references
            this.wheels.push(wheelGroup);
            
            // Store front wheels separately for steering
            if (index < 2) {
                this.frontWheels.push(wheelGroup);
            }
        });
    }
    
    createLights() {
        // Headlight material (emissive for glow effect)
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffcc,
            emissiveIntensity: 1,
            metalness: 0.9,
            roughness: 0.1
        });
        
        // Taillight material (red glow)
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1,
            metalness: 0.5,
            roughness: 0.2
        });
        
        // Headlights
        const headlightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.05);
        
        // Left headlight
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.5, 0.1, -1.4);
        this.mesh.add(leftHeadlight);
        
        // Right headlight
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.5, 0.1, -1.4);
        this.mesh.add(rightHeadlight);
        
        // Taillights
        const taillightGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.05);
        
        // Left taillight
        const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        leftTaillight.position.set(-0.5, 0.1, 1.4);
        this.mesh.add(leftTaillight);
        
        // Right taillight
        const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        rightTaillight.position.set(0.5, 0.1, 1.4);
        this.mesh.add(rightTaillight);
    }
    
    createSpoiler() {
        // Spoiler material
        const spoilerMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Spoiler base
        const spoilerBaseGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.2);
        const spoilerBase = new THREE.Mesh(spoilerBaseGeometry, spoilerMaterial);
        spoilerBase.position.set(0, 0.3, 1.3);
        this.mesh.add(spoilerBase);
        
        // Spoiler fins
        const spoilerFinGeometry = new THREE.BoxGeometry(0.1, 0.25, 0.4);
        
        // Left fin
        const leftFin = new THREE.Mesh(spoilerFinGeometry, spoilerMaterial);
        leftFin.position.set(-0.55, 0.4, 1.3);
        this.mesh.add(leftFin);
        
        // Right fin
        const rightFin = new THREE.Mesh(spoilerFinGeometry, spoilerMaterial);
        rightFin.position.set(0.55, 0.4, 1.3);
        this.mesh.add(rightFin);
        
        // Spoiler wing
        const spoilerWingGeometry = new THREE.BoxGeometry(1.3, 0.08, 0.3);
        const spoilerWing = new THREE.Mesh(spoilerWingGeometry, spoilerMaterial);
        spoilerWing.position.set(0, 0.5, 1.3);
        this.mesh.add(spoilerWing);
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
    
    update(gameSpeed) {
        // Update turn amount based on input
        const turnRate = 0.08; // How quickly we turn
        
        if (this.keys.left) {
            // Smoothly increase turn amount when key is pressed
            this.turnAmount = Math.max(-this.maxTurnAmount, this.turnAmount - turnRate);
        } else if (this.keys.right) {
            // Smoothly increase turn amount when key is pressed
            this.turnAmount = Math.min(this.maxTurnAmount, this.turnAmount + turnRate);
        } else {
            // Gradually return to center when no keys are pressed
            this.turnAmount *= this.turnDamping;
            
            // Snap to zero if very small to avoid floating point issues
            if (Math.abs(this.turnAmount) < 0.001) this.turnAmount = 0;
        }
        
        // Update lateral position based on current turn amount
        this.lateralPosition = Math.max(-this.maxLateralPosition, 
                                Math.min(this.maxLateralPosition, 
                                this.lateralPosition + this.turnAmount * 0.03));
        
        // Update wheel rotations
        this.updateWheelRotations(gameSpeed);
        
        // Update trackTime based on speed and road length
        this.trackTime += 0.0005 * gameSpeed;
        
        // Loop back to the start when we reach the end
        if (this.trackTime >= 1) {
            this.trackTime = 0;
        }
        
        // Update player position on the track
        this.updatePositionOnTrack();
        
        // Update distance
        this.distance = this.trackTime * this.track.curve.getLength();
        
        return this.distance;
    }
    
    updateWheelRotations(gameSpeed) {
        // Calculate wheel rotation speed based on game speed
        const rotationSpeed = 0.2 * gameSpeed;
        
        // Rotate all wheels to simulate forward motion
        this.wheels.forEach(wheel => {
            wheel.rotation.x += rotationSpeed;
        });
        
        // Calculate steering angle based on turn amount
        this.steeringAngle = this.turnAmount * this.maxSteeringAngle;
        
        // Apply steering angle to front wheels only
        this.frontWheels.forEach(wheel => {
            wheel.rotation.y = -this.steeringAngle;
            wheel.rotation.x = this.steeringAngle;

        });
    }
    
    updatePositionOnTrack() {
        if (!this.track || !this.track.curve) return;
        
        // Get position along the curve
        const pointOnCurve = this.track.curve.getPointAt(this.trackTime);
        
        // Get the tangent (forward direction)
        const tangent = this.track.curve.getTangentAt(this.trackTime).normalize();
        
        // Calculate world up vector
        const worldUp = new THREE.Vector3(0, 1, 0);
        
        // Calculate right vector (perpendicular to tangent and world up)
        const right = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();
        
        // Handle special case where tangent is parallel to world up
        if (right.length() < 0.1) {
            // Choose an arbitrary perpendicular direction
            if (Math.abs(tangent.y) > 0.9) {
                right.set(1, 0, 0);
            } else {
                right.crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
            }
        }
        
        // Calculate up vector (perpendicular to tangent and right)
        const up = new THREE.Vector3().crossVectors(right, tangent).normalize();
        
        // Apply lateral offset
        const offsetPosition = pointOnCurve.clone()
            .add(right.clone().multiplyScalar(this.track.width * 0.5 * this.lateralPosition));
        
        // Position slightly above the road
        offsetPosition.add(up.clone().multiplyScalar(0.5));
        
        // Update player position - with subtle bounce effect
        const bounceHeight = Math.sin(this.distance * 0.5) * 0.05; // Subtle bounce based on distance
        this.mesh.position.copy(offsetPosition).add(new THREE.Vector3(0, bounceHeight, 0));
        
        // Create a rotation matrix from the calculated basis vectors
        // Car's coordinate system: Z forward, X right, Y up
        const matrix = new THREE.Matrix4();
        matrix.makeBasis(
            right,              // Car's X axis (right)
            up,                 // Car's Y axis (up)
            tangent.negate()    // Car's Z axis (forward)
        );
        
        // Apply rotation to player
        this.mesh.setRotationFromMatrix(matrix);
        
        // Add a gradual tilt based on turn amount (instead of instant tilt)
        // This smooths out the tilting effect
        this.mesh.rotateY(-this.turnAmount * 0.3);
    }
} 