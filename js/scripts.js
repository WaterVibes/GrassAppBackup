<<<<<<< HEAD
// Import THREE.js and other dependencies
=======
>>>>>>> 1dc1a296984efffe979b61d62ce3eaa09d01c0e0
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as TWEEN from '@tweenjs/tween.js';

<<<<<<< HEAD
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
=======
// Get loading elements
const loadingDiv = document.getElementById('loading');
const loadingProgress = document.querySelector('.loading-progress');

try {
    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Initialize renderer with antialias and alpha
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: true,
        canvas: document.createElement('canvas')
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    // Initialize loaders
    const dracoLoader = new DRACOLoader();
    console.log('Setting Draco decoder path:', 'https://watervibes.github.io/GrassAppSitev2/draco-decoder/');
    dracoLoader.setDecoderPath('https://watervibes.github.io/GrassAppSitev2/draco-decoder/');
    dracoLoader.setDecoderConfig({ type: 'js' }); // Explicitly use JS decoder

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load the model
    console.log('Starting to load model from:', 'https://watervibes.github.io/GrassAppSitev2/models/baltimore_city_optimized_v2.glb');
    gltfLoader.load(
        'https://watervibes.github.io/GrassAppSitev2/models/baltimore_city_optimized_v2.glb',
        (gltf) => {
            console.log('Model loaded successfully');
            scene.add(gltf.scene);
            
            // Hide loading screen
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
        },
        (progress) => {
            if (loadingProgress) {
                const percent = (progress.loaded / progress.total) * 100;
                console.log('Loading progress:', percent + '%');
                loadingProgress.style.width = `${percent}%`;
            }
        },
        (error) => {
            console.error('Detailed error loading model:', {
                message: error.message,
                stack: error.stack,
                type: error.type,
                url: error.target?.responseURL || 'No URL available'
            });
            showError('Failed to load 3D model', error.message);
        }
    );

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        TWEEN.update();
        renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(onWindowResize, 100);
    });

} catch (error) {
    console.error('Initialization error:', error);
    const errorFallback = document.getElementById('error-fallback');
    if (errorFallback) {
        const errorMessage = errorFallback.querySelector('.error-message');
        const errorDetails = errorFallback.querySelector('.error-details');
        
        if (errorMessage) errorMessage.textContent = 'Failed to initialize the application';
        if (errorDetails) errorDetails.textContent = error.message;
        
        errorFallback.classList.remove('hidden');
    }
    if (loadingDiv) {
        loadingDiv.classList.add('hidden');
    }
}

// Error handling function
>>>>>>> 1dc1a296984efffe979b61d62ce3eaa09d01c0e0
function showError(message, details) {
    console.error(message, details);
    const errorFallback = document.getElementById('error-fallback');
    if (errorFallback) {
        const errorMessage = errorFallback.querySelector('.error-message');
        const errorDetails = errorFallback.querySelector('.error-details');
        
        if (errorMessage) errorMessage.textContent = message;
        if (errorDetails) errorDetails.textContent = details;
        
        errorFallback.classList.remove('hidden');
<<<<<<< HEAD
        
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
        const loader = new GLTFLoader();
        
        // Initialize and configure DRACOLoader
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://unpkg.com/three@0.157.0/examples/jsm/libs/draco/');
        dracoLoader.setDecoderConfig({ type: 'js' });
        loader.setDRACOLoader(dracoLoader);
        
        loader.load(
            `${BASE_URL}/models/baltimore_city_optimized_v2.glb`,
            (gltf) => {
                console.log('Model loaded successfully');
                scene.add(gltf.scene);
                setupLighting();
                resolve(gltf.scene);
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
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Force a single render after resize
    renderer.render(scene, camera);
}

// Add resize event listener
window.addEventListener('resize', onWindowResize);
// Add orientation change listener for mobile
window.addEventListener('orientationchange', () => {
    // Small delay to ensure new dimensions are available
    setTimeout(onWindowResize, 100);
});

// MarkerSystem class
class MarkerSystem {
    constructor() {
        this.markers = new Map();
        this.visibleMarkers = new Set();
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
        console.log(`Creating marker: ${name}, type: ${data.type}`);
        
        if (data.type === 'camera') {
            if (!data.position || !data.target) {
                console.error(`Invalid camera marker data for ${name}:`, data);
                return;
            }

            // Create camera position marker (invisible)
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(2, 16, 16),
                new THREE.MeshBasicMaterial({
                    color: 0x39FF14,
                    transparent: true,
                    opacity: 0
                })
            );
            marker.position.copy(data.position);
            marker.visible = false;
            scene.add(marker);

            // Create target marker (invisible)
            const targetMarker = new THREE.Mesh(
                new THREE.SphereGeometry(1, 16, 16),
                new THREE.MeshBasicMaterial({
                    color: 0xFF3939,
                    transparent: true,
                    opacity: 0
                })
            );
            targetMarker.position.copy(data.target);
            targetMarker.visible = false;
            scene.add(targetMarker);

            this.markers.set(name, {
                position: data.position,
                target: data.target,
                type: 'camera',
                meshes: {
                    camera: marker,
                    target: targetMarker
                }
            });

        } else if (data.type === 'subject') {
            if (!data.position) {
                console.error(`Invalid subject marker data for ${name}:`, data);
                return;
            }

            // Create subject marker (invisible)
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 16, 16),
                new THREE.MeshBasicMaterial({
                    color: 0x00FFFF,
                    transparent: true,
                    opacity: 0
                })
            );
            marker.position.copy(data.position);
            marker.visible = false;
            scene.add(marker);

            this.markers.set(name, {
                position: data.position,
                type: 'subject',
                meshes: {
                    marker: marker
                }
            });
        }
    }

    getMarkersByType(type) {
        return Array.from(this.markers.entries())
            .filter(([_, data]) => data.type === type)
            .map(([name, data]) => ({ name, ...data }));
    }

    getMarkerByName(name) {
        return this.markers.get(name);
    }
}

// Load markers function
async function loadMarkers() {
    try {
        console.log('Starting to load markers...');
        const markerFiles = [
            `${BASE_URL}/markers/marker_intro_marker_1735192031525.json`,
            `${BASE_URL}/markers/marker_baltimore_inner_harbor__1735194251759.json`,
            `${BASE_URL}/markers/marker_baltimore_inner_harbor_subject_subject_marker_1735195982517.json`,
            `${BASE_URL}/markers/marker_federal_hill_marker_camera_marker_1735196516687.json`,
            `${BASE_URL}/markers/marker_federal_hill_subject__subject_marker_1735196627275.json`,
            `${BASE_URL}/markers/marker_canton_camera_camera_marker_1735196801332.json`,
            `${BASE_URL}/markers/marker_canton_subject_subject_marker_1735196858094.json`,
            `${BASE_URL}/markers/marker_fells_point_camera_camera_marker_1735197031057.json`,
            `${BASE_URL}/markers/marker_fells_point_subject__subject_marker_1735197073807.json`,
            `${BASE_URL}/markers/marker_mount_vernon_camera_camera_marker_1735197513333.json`,
            `${BASE_URL}/markers/marker_mount_vernon_subject__subject_marker_1735197588128.json`,
            `${BASE_URL}/markers/marker_about_us_camera_camera_marker_1735199541761.json`,
            `${BASE_URL}/markers/marker_about_us_subject__subject_marker_1735199597502.json`,
            `${BASE_URL}/markers/marker_partnership_camera_marker_1735198971796.json`,
            `${BASE_URL}/markers/marker_partnership_subject__subject_marker_1735199019215.json`,
            `${BASE_URL}/markers/marker_medical_patient_camera_camera_marker_1735199161321.json`,
            `${BASE_URL}/markers/marker_medical_patient_subject_marker_1735199228409.json`,
            `${BASE_URL}/markers/marker_deliverydrivers_camera_marker_1735200540288.json`,
            `${BASE_URL}/markers/marker_delivery_driver_subject_subject_marker_1735200573413.json`
        ];

        const markers = {};
        
        for (const file of markerFiles) {
            try {
                const response = await fetch(file);
                if (!response.ok) {
                    console.error(`Failed to load marker file ${file}: ${response.status} ${response.statusText}`);
                    continue;
                }
                const data = await response.json();
                
                // Extract marker name from filename
                const markerName = file.split('/').pop().replace('.json', '');
                
                // Handle both camera and subject markers
                if (data.camera && data.target) {
                    markers[markerName] = {
                        position: new THREE.Vector3(data.camera.x, data.camera.y, data.camera.z),
                        target: new THREE.Vector3(data.target.x, data.target.y, data.target.z),
                        type: 'camera'
                    };
                } else if (data.subject) {
                    markers[markerName] = {
                        position: new THREE.Vector3(data.subject.x, data.subject.y, data.subject.z),
                        type: 'subject'
                    };
                }
            } catch (error) {
                console.error(`Error loading marker file ${file}:`, error);
                showError('Failed to load marker', `Error loading ${file}: ${error.message}`);
            }
        }
        
        return markers;
    } catch (error) {
        console.error('Error loading markers:', error);
        showError('Failed to load markers', error.message);
        return {};
    }
}

// Initialize everything when the module loads
async function initializeApp() {
    try {
        console.log('Starting application initialization...');
        
        // Get loading elements
        loadingDiv = document.getElementById('loading');
        console.log('Loading div found:', loadingDiv);
        
        loadingProgress = document.querySelector('.loading-progress');
        console.log('Loading progress found:', loadingProgress);
        
        if (!loadingDiv) {
            throw new Error('Loading div not found in the DOM');
        }

        // Show loading screen
        loadingDiv.style.display = 'flex';
        if (loadingProgress) {
            loadingProgress.style.width = '0%';
        }

        // Initialize everything
        await init();
        
        // Add window resize handler after initialization
        window.addEventListener('resize', onWindowResize, false);
        
        // Start animation loop
        animate();
    } catch (error) {
        console.error('Error during initialization:', error);
        showError('Error initializing application', error.message);
    }
}

// Helper function to check if a marker name matches a page or district
function isMarkerMatch(markerName, searchId, type) {
    const nameLower = markerName.toLowerCase();
    const searchLower = searchId.toLowerCase();
    
    // Special cases for delivery drivers
    if (searchLower === 'deliverydrivers') {
        return (nameLower.includes('delivery') || nameLower.includes('deliverydrivers')) && 
               nameLower.includes(type);
    }
    
    // Special case for inner harbor camera
    if (type === 'camera' && searchLower === 'baltimore_inner_harbor') {
        return nameLower.includes(searchLower) || nameLower.endsWith('_1735194251759');
    }
    
    return nameLower.includes(searchLower) && nameLower.includes(type);
}

// Move camera function
function moveCamera(position, target) {
    if (!camera || !controls) {
        console.error('Camera or controls not initialized');
        return;
    }

    const duration = 2000; // Match the duration used in the click handler
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();

    // Create quaternions for smooth rotation
    const startRotation = camera.quaternion.clone();
    const endRotation = new THREE.Quaternion();
    const lookAt = new THREE.Matrix4();
    lookAt.lookAt(position, target, new THREE.Vector3(0, 1, 0));
    endRotation.setFromRotationMatrix(lookAt);

    // Disable controls during movement
    controls.enabled = false;

    const startTime = performance.now();

    function updateCamera(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);
        
        // Interpolate position
        camera.position.lerpVectors(startPosition, position, eased);
        
        // Interpolate rotation
        camera.quaternion.slerpQuaternions(startRotation, endRotation, eased);
        
        // Update target
        controls.target.lerpVectors(startTarget, target, eased);
        controls.update();

        if (progress < 1) {
            requestAnimationFrame(updateCamera);
        } else {
            // Re-enable controls after movement is complete
            controls.enabled = true;
        }
    }

    requestAnimationFrame(updateCamera);
}

// Easing function
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Add district controls
function addDistrictControls() {
    const districtButtons = document.getElementById('districtButtons');
    const pageButtons = document.getElementById('pageButtons');
    const navPanel = document.querySelector('.nav-panel');
    const infoOverlay = document.getElementById('info-overlay');
    const closeButtons = document.querySelectorAll('.close-button');
    let hasBeenClicked = false;

    if (!districtButtons || !pageButtons || !navPanel) {
        console.error('Required DOM elements not found');
        return;
    }

    // Add district buttons
    const districts = [
        { name: 'Inner Harbor', id: 'baltimore_inner_harbor' },
        { name: 'Federal Hill', id: 'federal_hill' },
        { name: 'Canton', id: 'canton' },
        { name: 'Fells Point', id: 'fells_point' },
        { name: 'Mount Vernon', id: 'mount_vernon' }
    ];

    districts.forEach(district => {
        const button = document.createElement('button');
        button.className = 'nav-button';
        button.textContent = district.name;
        button.onclick = () => {
            moveToDistrict(district.id);
            if (!hasBeenClicked) {
                navPanel.classList.add('collapsed');
                hasBeenClicked = true;
            }
        };
        districtButtons.appendChild(button);
    });

    // Add page buttons with info card functionality
    const pages = [
        { name: 'About Us', id: 'about_us', cardId: 'about-us-cards' },
        { name: 'Partner With Us', id: 'partnership', cardId: 'partnership-cards' },
        { name: 'Medical Patients', id: 'medical_patient', cardId: 'medical-patient-cards' },
        { name: 'Delivery Drivers', id: 'deliverydrivers', cardId: 'delivery-drivers-cards' }
    ];

    pages.forEach(page => {
        const button = document.createElement('button');
        button.className = 'nav-button';
        button.textContent = page.name;
        button.onclick = () => {
            // Hide any currently visible cards
            const infoOverlay = document.getElementById('info-overlay');
            const allCards = document.querySelectorAll('.info-cards');
            allCards.forEach(card => {
                card.classList.add('hidden');
                card.classList.remove('fade-in');
            });

            // Find camera and subject markers
            const cameraMarker = Array.from(markerSystem.markers.entries()).find(([name]) => 
                isMarkerMatch(name, page.id, 'camera')
            );

            const subjectMarker = Array.from(markerSystem.markers.entries()).find(([name]) => 
                isMarkerMatch(name, page.id, 'subject')
            );

            if (cameraMarker && subjectMarker) {
                const [_, camera] = cameraMarker;
                const [__, subject] = subjectMarker;
                
                // Move camera first
                const duration = 2000; // Camera movement duration
                moveCamera(camera.position, subject.position);

                // Show cards after camera movement completes
                if (page.cardId) {
                    setTimeout(() => {
                        const cards = document.getElementById(page.cardId);
                        if (infoOverlay && cards) {
                            infoOverlay.classList.remove('hidden');
                            cards.classList.remove('hidden');
                            setTimeout(() => {
                                cards.classList.add('fade-in');
                            }, 50);
                        }
                    }, duration + 100); // Wait for camera movement plus a small buffer
                }
            }
            
            if (!hasBeenClicked) {
                navPanel.classList.add('collapsed');
                hasBeenClicked = true;
            }
        };
        pageButtons.appendChild(button);
    });

    // Add hover behavior
    navPanel.addEventListener('mouseenter', () => {
        if (hasBeenClicked) {
            navPanel.classList.remove('collapsed');
        }
    });

    navPanel.addEventListener('mouseleave', () => {
        if (hasBeenClicked) {
            navPanel.classList.add('collapsed');
        }
    });

    // Add close button functionality
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            infoOverlay.classList.add('hidden');
            document.querySelectorAll('.info-cards').forEach(card => {
                card.classList.add('hidden');
            });
        });
    });

    // Close overlay when clicking outside cards
    infoOverlay.addEventListener('click', (e) => {
        if (e.target === infoOverlay) {
            infoOverlay.classList.add('hidden');
            document.querySelectorAll('.info-cards').forEach(card => {
                card.classList.add('hidden');
            });
        }
    });
}

// Move to district function
function moveToDistrict(districtId) {
    if (!markerSystem || !markerSystem.markers) {
        console.error('Marker system not initialized');
        return;
    }

    console.log('Moving to district:', districtId);

    // Find camera marker for this district
    const cameraMarker = Array.from(markerSystem.markers.entries()).find(([name]) => 
        isMarkerMatch(name, districtId, 'camera')
    );

    // Find subject marker for this district
    const subjectMarker = Array.from(markerSystem.markers.entries()).find(([name]) => 
        isMarkerMatch(name, districtId, 'subject')
    );

    if (cameraMarker && subjectMarker) {
        const [_, camera] = cameraMarker;
        const [__, subject] = subjectMarker;
        moveCamera(camera.position, subject.position);
    } else {
        console.error('Could not find markers for district:', districtId);
    }
}

// Move to page function
function moveToPage(pageId) {
    if (!markerSystem || !markerSystem.markers) {
        console.error('Marker system not initialized');
        return;
    }

    console.log('Moving to page:', pageId);

    // Find camera marker for this page
    const cameraMarker = Array.from(markerSystem.markers.entries()).find(([name]) => 
        isMarkerMatch(name, pageId, 'camera')
    );

    // Find subject marker for this page
    const subjectMarker = Array.from(markerSystem.markers.entries()).find(([name]) => 
        isMarkerMatch(name, pageId, 'subject')
    );

    if (cameraMarker && subjectMarker) {
        const [_, camera] = cameraMarker;
        const [__, subject] = subjectMarker;
        
        // Move camera first
        moveCamera(camera.position, subject.position);
        
        // Show cards after a short delay for all pages with cards
        const cardId = pages.find(page => page.id === pageId)?.cardId;
        if (cardId) {
            setTimeout(() => {
                const infoOverlay = document.getElementById('info-overlay');
                const cards = document.getElementById(cardId);
                if (infoOverlay && cards) {
                    infoOverlay.classList.remove('hidden');
                    cards.classList.remove('hidden');
                    cards.classList.add('fade-in');
                }
            }, 1500); // Reduced from 2500ms to 1500ms
        }
    } else {
        console.error('Could not find markers for page:', pageId);
    }
}

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // If DOMContentLoaded has already fired, wait a frame to ensure all scripts are loaded
    requestAnimationFrame(initializeApp);
=======
    }
    if (loadingDiv) {
        loadingDiv.classList.add('hidden');
    }
>>>>>>> 1dc1a296984efffe979b61d62ce3eaa09d01c0e0
} 