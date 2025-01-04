import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as TWEEN from '@tweenjs/tween.js';

// Global variables
let scene, camera, renderer, controls;
let markerSystem;
let loadingDiv, loadingProgress;

// Constants for production
const BASE_URL = 'https://thegrassapp.com';

// Initialize Three.js scene
async function init() {
    console.log('Initializing Three.js scene...');
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Add fog to the scene
    const fogColor = new THREE.Color(0x000000);
    // Using a much lighter density for subtle edge fading
    const fogDensity = 0.0004; // Much lighter density that only affects distant edges
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    // Create camera with adjusted near and far planes
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 5, 10);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    // Make renderer canvas responsive
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.outline = 'none';

    // Create controls with adjusted settings
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 1000;
    controls.maxPolarAngle = Math.PI / 2.1; // Slightly above horizontal to prevent clipping
    controls.minPolarAngle = 0.1; // Prevent camera from going below the ground
    controls.enablePan = true;
    controls.panSpeed = 0.5;
    controls.rotateSpeed = 0.5;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Initialize marker system
    markerSystem = new MarkerSystem();

    // Load the model and markers
    try {
        await loadModel();
        console.log('Model loaded successfully');
        const markers = await loadMarkers();
        await markerSystem.initialize(markers);
        
        // Move to intro marker if available
        const introMarker = Array.from(markerSystem.markers.entries()).find(([name]) => 
            name.toLowerCase().includes('intro_marker')
        );
        
        if (introMarker) {
            const [_, data] = introMarker;
            moveCamera(data.position, data.target);
        }

        // Add district controls
        addDistrictControls();

        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        throw error;
    }
}

// Show error function
function showError(message, details) {
    console.error(message, details);
    const errorFallback = document.getElementById('error-fallback');
    if (errorFallback) {
        const errorMessage = errorFallback.querySelector('.error-message');
        const errorDetails = errorFallback.querySelector('.error-details');
        
        if (errorMessage) errorMessage.textContent = message;
        if (errorDetails) errorDetails.textContent = details;
        
        errorFallback.classList.remove('hidden');
        
        // Log error for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'error', {
                'event_category': 'Application',
                'event_label': message,
                'value': details
            });
        }
    }
    if (loadingDiv) loadingDiv.classList.add('hidden');
}

// Update loading progress
function updateLoadingProgress(progress) {
    if (loadingProgress && progress.lengthComputable) {
        const percent = (progress.loaded / progress.total) * 100;
        loadingProgress.style.width = `${percent}%`;
        console.log(`Loading progress: ${percent.toFixed(1)}%`);
    }
}

// Load model function
function loadModel() {
    return new Promise((resolve, reject) => {
        console.log('Starting model load...');
        const gltfLoader = new GLTFLoader();
        
        // Initialize and configure DRACOLoader
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://unpkg.com/three@0.157.0/examples/jsm/libs/draco/');
        dracoLoader.setDecoderConfig({ type: 'js' });
        gltfLoader.setDRACOLoader(dracoLoader);
        
        // Load the model with full URL
        const modelPath = 'https://watervibes.github.io/GrassAppSitev2/models/baltimore_city_optimized_v2.glb';
        console.log('Starting to load model from:', modelPath);
        gltfLoader.load(
            modelPath,
            (gltf) => {
                console.log('Model loaded successfully');
                const model = gltf.scene;
                
                // Set model orientation to match the top-down view
                model.scale.set(1, 1, 1);
                model.rotation.y = Math.PI;
                
                // Center the model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);
                
                scene.add(model);
                
                // Hide loading screen first
                if (loadingScreen) {
                    loadingScreen.classList.add('hidden');
                    
                    // Show UI elements after loading screen starts fading
                    setTimeout(() => {
                        const navPanel = document.querySelector('.nav-panel');
                        const topLogo = document.querySelector('.top-left-logo');
                        
                        if (navPanel) {
                            requestAnimationFrame(() => {
                                navPanel.classList.add('visible');
                            });
                        }
                        if (topLogo) {
                            requestAnimationFrame(() => {
                                topLogo.classList.add('visible');
                            });
                        }
                    }, 1000);
                }
            },
            (progress) => {
                console.log('Loading progress:', progress);
                updateLoadingProgress(progress);
            },
            (error) => {
                console.error('Error loading model:', error);
                showError('Failed to load 3D model', error.message);
                reject(new Error(`Failed to load model: ${error.message}`));
            }
        );
    });
}

// Setup lighting
function setupLighting() {
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Add hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
}

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
