import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as TWEEN from '@tweenjs/tween.js';

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const labelRenderer = new CSS2DRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

// Setup scene
scene.fog = new THREE.Fog(0x000000, 2500, 3500);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Setup label renderer
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

// Setup controls
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 200;
controls.maxDistance = 1000;
controls.maxPolarAngle = Math.PI / 2;

// Camera movement functions
function moveCamera(targetPosition, targetLookAt, duration = 2000) {
    const startPosition = camera.position.clone();
    const startRotation = camera.quaternion.clone();

    // Create a temporary camera to calculate the target rotation
    const tempCamera = camera.clone();
    tempCamera.position.copy(targetPosition);
    tempCamera.lookAt(targetLookAt);
    const targetRotation = tempCamera.quaternion.clone();

    // Position tween
    new TWEEN.Tween(startPosition)
        .to(targetPosition, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => camera.position.copy(startPosition))
        .start();

    // Rotation tween
    new TWEEN.Tween(startRotation)
        .to(targetRotation, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => camera.quaternion.copy(startRotation))
        .start();

    // Update controls target
    new TWEEN.Tween(controls.target)
        .to(targetLookAt, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
}

// Function to load and move to optimized marker position
async function goToOptimizedMarker(markerName) {
    try {
        const response = await fetch(`optimized_markers/${markerName}.json`);
        if (!response.ok) throw new Error('Failed to load marker data');
        
        const markerData = await response.json();
        const targetPosition = new THREE.Vector3(
            parseFloat(markerData.camera.x),
            parseFloat(markerData.camera.y),
            parseFloat(markerData.camera.z)
        );
        const targetLookAt = new THREE.Vector3(
            parseFloat(markerData.target.x),
            parseFloat(markerData.target.y),
            parseFloat(markerData.target.z)
        );

        moveCamera(targetPosition, targetLookAt);
    } catch (error) {
        console.error('Error loading marker:', error);
    }
}

// District selection handler
window.selectDistrict = (district) => {
    const markerMap = {
        'innerHarbor': 'marker_baltimore_inner_harbor_1735995279779',
        'canton': 'marker_canton_1735995578767',
        'fellsPoint': 'marker_fells_point_1735995790884',
        'federalHill': 'marker_federal_hill_1735995980501',
        'mountVernon': 'marker_mount_vernon_1735996124326'
    };

    const markerName = markerMap[district];
    if (markerName) {
        goToOptimizedMarker(markerName);
    }
};

// Page selection handler
window.showPage = (page) => {
    const markerMap = {
        'aboutUs': 'marker_about_us_1735994495867',
        'medicalPatient': 'marker_medical_patient_1735994718056',
        'partnerWithUs': 'marker_partner_with_us_1735994991665',
        'deliveryDriver': 'marker_delivery_driver_1735995071394'
    };

    const markerName = markerMap[page];
    if (markerName) {
        goToOptimizedMarker(markerName);
    }
};

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    TWEEN.update();
    constrainCamera();
    updateFog();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Update fog based on camera position
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

// Constrain camera movement
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

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation loop
animate(); 