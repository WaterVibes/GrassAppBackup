import * as THREE from '/js/three/three.core.js';
import { OrbitControls } from '/js/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '/js/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '/js/three/examples/jsm/loaders/DRACOLoader.js';

// Debug flag
const DEBUG = true;

function debug(...args) {
    if (DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

// Global variables
let scene, camera, renderer, controls;
let loadingDiv, errorFallbackDiv, cornerLogo;
let lastTime = 0;
const frameInterval = 1000 / 60;
let map = null;
let districts = new Map();

// District colors with better contrast
const districtColors = {
    district1: 0x00ff00,  // Bright Green
    district2: 0x0088ff,  // Bright Blue
    district3: 0xff0000,  // Bright Red
    district4: 0xffff00,  // Bright Yellow
    district5: 0xff00ff,  // Bright Purple
    district6: 0xff8800,  // Bright Orange
    district7: 0x00ffff,  // Bright Cyan
    district8: 0xff4400,  // Bright Orange-Red
    district9: 0x88ff00,  // Bright Yellow-Green
    default: 0xcccccc    // Light Gray
};

// Update loading progress with error handling
function updateLoadingProgress(progress) {
    try {
        const progressBar = document.querySelector('.loading-progress');
        if (progressBar) {
            const percentage = Math.min(Math.max((progress.loaded / progress.total) * 100, 0), 100);
            progressBar.style.width = `${percentage}%`;
            console.log(`Loading progress: ${percentage.toFixed(1)}%`);
        }
    } catch (error) {
        console.error('Error updating progress:', error);
    }
}

// Show success state
function showSuccess() {
    if (loadingDiv) loadingDiv.classList.add('hidden');
    if (cornerLogo) cornerLogo.classList.remove('hidden');
}

// Error handling function with more details
function showError(message, details = '') {
    console.error('Application Error:', message, details);
    
    if (loadingDiv) loadingDiv.classList.add('hidden');

    const errorFallback = document.getElementById('error-fallback');
    if (errorFallback) {
        const errorMessage = errorFallback.querySelector('.error-message');
        const errorDetails = errorFallback.querySelector('.error-details');

        if (errorMessage) errorMessage.textContent = message;
        if (errorDetails) {
            errorDetails.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
        }
        errorFallback.classList.remove('hidden');
    }

    // Clean up THREE.js resources
    cleanup();
}

// Cleanup function
function cleanup() {
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
    }
    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}

// Setup district materials with better visual properties
function setupDistrictMaterials() {
    const materials = {};
    for (const [district, color] of Object.entries(districtColors)) {
        materials[district] = new THREE.MeshPhysicalMaterial({
            color: color,
            metalness: 0.2,
            roughness: 0.5,
            transparent: true,
            opacity: 0.95,
            clearcoat: 0.3,
            clearcoatRoughness: 0.25,
            side: THREE.DoubleSide
        });
    }
    return materials;
}

// Load the optimized map model
async function loadMap() {
    debug('Setting up loaders...');
    
    // Initialize DRACO loader with proper path
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/js/three/examples/jsm/libs/draco/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    debug('DRACO loader initialized');

    // Initialize GLTF loader
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    debug('GLTF loader initialized');

    try {
        debug('Starting map load...');
        const gltf = await new Promise((resolve, reject) => {
            const modelPath = '/models/baltimore_city_optimized_v2.glb';
            debug('Loading model from:', modelPath);
            
            loader.load(
                modelPath,
                (result) => {
                    debug('Model loaded successfully');
                    resolve(result);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100).toFixed(2);
                    debug(`Loading progress: ${percent}%`);
                    updateLoadingProgress(progress);
                },
                (error) => {
                    debug('Error loading model:', error);
                    reject(new Error(`Failed to load map: ${error.message}`));
                }
            );
        });

        debug('Processing loaded model...');
        map = gltf.scene;
        
        // Setup materials
        const districtMaterials = setupDistrictMaterials();
        debug('District materials created');
        
        // Process the map
        let meshCount = 0;
        let districtCount = 0;
        
        map.traverse((node) => {
            if (node.isMesh) {
                meshCount++;
                debug('Processing mesh:', node.name);
                
                node.castShadow = true;
                node.receiveShadow = true;
                
                const districtMatch = node.name.match(/district(\d+)/i);
                if (districtMatch) {
                    districtCount++;
                    const districtNum = districtMatch[1];
                    const materialKey = `district${districtNum}`;
                    debug(`Found district ${districtNum}`);
                    
                    node.material = districtMaterials[materialKey] || districtMaterials.default;
                    districts.set(materialKey, node);
                    node.userData.originalColor = node.material.color.clone();
                }
                
                if (node.material) {
                    node.material.needsUpdate = true;
                }
                
                if (node.geometry) {
                    node.geometry.computeBoundingSphere();
                    node.geometry.computeBoundingBox();
                }
            }
        });
        
        debug(`Processed ${meshCount} meshes, found ${districtCount} districts`);

        // Position the map
        const boundingBox = new THREE.Box3().setFromObject(map);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        
        // Center the map at origin
        map.position.set(-center.x, -center.y, -center.z);
        scene.add(map);
        debug('Map positioned and added to scene');

        // Calculate camera position for better fit
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2) / 2.5); // Reduced distance factor
        
        // Position camera at an angle for better view
        camera.position.set(cameraDistance * 0.5, cameraDistance * 0.4, cameraDistance * 0.5);
        camera.lookAt(0, 0, 0);
        
        // Adjust controls
        controls.target.set(0, 0, 0);
        controls.minDistance = cameraDistance * 0.2; // Allow closer zoom
        controls.maxDistance = cameraDistance * 1.5; // Limit max zoom out
        controls.update();
        debug('Camera and controls configured');

        showSuccess();
        debug('Map loading complete');
        return true;
    } catch (error) {
        debug('Error in loadMap:', error);
        showError('Failed to load map model', error.message);
        return false;
    } finally {
        dracoLoader.dispose();
    }
}

// Initialize everything when the module loads
async function initializeApp() {
    try {
        console.log('Initializing application...');
        
        // Wait for DOM
        if (document.readyState !== 'complete') {
            await new Promise(resolve => window.addEventListener('load', resolve));
        }

        // Get UI elements
        loadingDiv = document.getElementById('loading');
        errorFallbackDiv = document.getElementById('error-fallback');
        cornerLogo = document.getElementById('corner-logo');
        
        if (!loadingDiv || !errorFallbackDiv || !cornerLogo) {
            throw new Error('Required DOM elements not found');
        }

        // Setup scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);
        
        // Setup camera with wider FOV
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
        
        // Setup renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);

        // Setup controls with adjusted constraints
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 1.5; // Allow more vertical rotation
        controls.enableZoom = true;
        controls.zoomSpeed = 1.2;

        // Setup lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.bias = -0.0001;
        scene.add(directionalLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        scene.add(hemiLight);

        // Load map
        await loadMap();

        // Start animation
        animate();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showError(
            'Failed to initialize the application',
            error.message || 'An unexpected error occurred'
        );
    }
}

// Animation loop
function animate(currentTime = 0) {
    requestAnimationFrame(animate);
    
    const deltaTime = currentTime - lastTime;
    if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);
        
        if (controls) controls.update();
        
        if (scene && camera && renderer) {
            renderer.render(scene, camera);
        }
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Start initialization
console.log('Starting application...');
initializeApp(); 