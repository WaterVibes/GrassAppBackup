// Core Three.js setup and animation
// ... existing code ...

// MarkerSystem class - core functionality only
class MarkerSystem {
    constructor() {
        this.markers = new Map();
        console.log('MarkerSystem initialized');
    }

    async initialize(markerData) {
        console.log('Initializing MarkerSystem with data:', Object.keys(markerData));
        for (const [name, data] of Object.entries(markerData)) {
            try {
                this.createMarker(name, data);
            } catch (error) {
                console.error(`Error creating marker ${name}:`, error);
            }
        }
        console.log('MarkerSystem initialization complete. Total markers:', this.markers.size);
    }

    createMarker(name, data) {
        if (data.type === 'camera') {
            if (!data.position || !data.target) {
                console.error(`Invalid camera marker data for ${name}:`, data);
                return;
            }

            this.markers.set(name, {
                position: data.position,
                target: data.target,
                type: 'camera'
            });
        }
    }
}

// Core movement function
function moveToDistrict(districtId) {
    if (!markerSystem || !markerSystem.markers) {
        console.error('Marker system not initialized');
        return;
    }

    // Find camera marker for this district
    const cameraMarker = Array.from(markerSystem.markers.entries()).find(([name]) => 
        name.includes(districtId) && name.includes('camera')
    );

    // Find subject marker for this district
    const subjectMarker = Array.from(markerSystem.markers.entries()).find(([name]) => 
        name.includes(districtId) && name.includes('subject')
    );

    if (cameraMarker && subjectMarker) {
        const [_, camera] = cameraMarker;
        const [__, subject] = subjectMarker;
        moveCamera(camera.position, subject.position);
    } else {
        console.error('Could not find markers for district:', districtId);
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    TWEEN.update();
    constrainCamera();
    updateFog();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function updateFog() {
    const distanceFromCenter = Math.sqrt(
        camera.position.x * camera.position.x + 
        camera.position.z * camera.position.z
    );
    
    const heightFactor = Math.max(0, Math.min(1, camera.position.y / 2000));
    const distanceFactor = Math.max(0, Math.min(1, distanceFromCenter / 2000));
    const fogFactor = Math.max(heightFactor, distanceFactor);
    
    if (fogFactor > 0.5) {
        const intensity = (fogFactor - 0.5) / 0.5;
        scene.fog.near = 2000 - (intensity * 500);
        scene.fog.far = 3000 - (intensity * 500);
    } else {
        scene.fog.near = 2500;
        scene.fog.far = 3500;
    }
}

function constrainCamera() {
    const maxRadius = 1200;
    const minHeight = 200;
    const maxHeight = 1000;

    const pos = camera.position.clone();
    const horizontalDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    
    if (horizontalDist > maxRadius) {
        const angle = Math.atan2(pos.z, pos.x);
        pos.x = maxRadius * Math.cos(angle);
        pos.z = maxRadius * Math.sin(angle);
    }
    
    if (pos.y < minHeight + 100) {
        pos.y = minHeight + (pos.y - minHeight) * 0.5;
    } else if (pos.y > maxHeight - 100) {
        pos.y = maxHeight - (maxHeight - pos.y) * 0.5;
    }
    
    const minAngle = Math.PI / 6;
    const maxAngle = Math.PI / 2.1;
    
    const currentAngle = Math.atan2(pos.y, horizontalDist);
    if (currentAngle < minAngle) {
        const targetY = horizontalDist * Math.tan(minAngle);
        pos.y = pos.y * 0.8 + targetY * 0.2;
    } else if (currentAngle > maxAngle) {
        const targetY = horizontalDist * Math.tan(maxAngle);
        pos.y = pos.y * 0.8 + targetY * 0.2;
    }
    
    camera.position.copy(pos);
}

// Start animation loop
animate(); 