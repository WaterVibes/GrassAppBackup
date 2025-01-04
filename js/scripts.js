import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as TWEEN from '@tweenjs/tween.js';

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 2500, 3500);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 500, 1000);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Label renderer setup
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

// Controls setup
const controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 100;
controls.maxDistance = 2000;
controls.maxPolarAngle = Math.PI / 2;

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1000, 1000, 1000);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 3500;
directionalLight.shadow.camera.left = -1000;
directionalLight.shadow.camera.right = 1000;
directionalLight.shadow.camera.top = 1000;
directionalLight.shadow.camera.bottom = -1000;
scene.add(directionalLight);

// Loading manager
const loadingManager = new THREE.LoadingManager();
const loadingScreen = document.querySelector('.loading-screen');
const progressBar = document.querySelector('.loading-progress');

loadingManager.onProgress = (url, loaded, total) => {
    const progress = (loaded / total) * 100;
    progressBar.style.width = progress + '%';
};

loadingManager.onLoad = () => {
    loadingScreen.classList.add('hidden');
    document.querySelector('.top-logo').classList.add('visible');
};

// Model loader setup
const dracoLoader = new DRACOLoader(loadingManager);
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

// Load city model
gltfLoader.load('models/baltimore.glb', (gltf) => {
    const model = gltf.scene;
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(model);
}, undefined, (error) => {
    console.error('Error loading model:', error);
    showError('Failed to load the city model', error);
});

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

// Camera movement function
function moveCamera(cameraPosition, targetPosition) {
    new TWEEN.Tween(camera.position)
        .to(cameraPosition, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();

    new TWEEN.Tween(controls.target)
        .to(targetPosition, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
}

// Error handling
function showError(message, details) {
    const errorScreen = document.querySelector('.error-screen');
    const errorMessage = document.querySelector('.error-message');
    const errorDetails = document.querySelector('.error-details');
    
    errorMessage.textContent = message;
    errorDetails.textContent = details;
    errorScreen.classList.remove('hidden');
}

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

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

// Initialize marker system
const markerSystem = new MarkerSystem();

// Start animation loop
animate(); 