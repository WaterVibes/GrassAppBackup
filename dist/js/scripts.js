import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Tween, Easing, update } from '@tweenjs/tween.js';

// Get loading elements
const loadingDiv = document.getElementById('loading');
const loadingProgress = document.querySelector('.loading-progress');

// District data
const districts = [
    { id: 1, name: "Inner Harbor", position: { x: 0, y: 0, z: 0 } },
    { id: 2, name: "Federal Hill", position: { x: 2, y: 0, z: 2 } },
    { id: 3, name: "Fells Point", position: { x: -2, y: 0, z: 2 } },
    { id: 4, name: "Canton", position: { x: -4, y: 0, z: 4 } },
    { id: 5, name: "Mount Vernon", position: { x: 0, y: 0, z: -2 } }
];

// Page controls
let currentPage = 1;
const itemsPerPage = 3;
const totalPages = Math.ceil(districts.length / itemsPerPage);

try {
    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Initialize loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco-decoder/');
    dracoLoader.preload();

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load the model
    gltfLoader.load(
        '/models/baltimore_city_optimized_v2.glb',
        (gltf) => {
            const model = gltf.scene;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(model);
            
            // Center the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            
            // Add markers for districts
            addDistrictMarkers();
            
            // Hide loading screen
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
        },
        (progress) => {
            if (loadingProgress) {
                const percent = (progress.loaded / progress.total) * 100;
                loadingProgress.style.width = `${percent}%`;
            }
        },
        (error) => {
            console.error('Error loading model:', error);
            showError('Failed to load 3D model', error.message);
        }
    );

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        update();
        renderer.render(scene, camera);
    }
    animate();

    // District Navigation Functions
    function moveCamera(position, target) {
        // Calculate camera position offset based on current position
        const currentOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
        const distance = currentOffset.length();
        
        // Calculate new offset maintaining relative height and distance
        const cameraOffset = new THREE.Vector3(
            distance * 0.5,
            distance * 0.3,
            distance * 0.5
        );
        
        const targetPosition = new THREE.Vector3(
            position.x + cameraOffset.x,
            position.y + cameraOffset.y,
            position.z + cameraOffset.z
        );

        // Create camera position tween
        new Tween(camera.position)
            .to({
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z
            }, 1500)
            .easing(Easing.Cubic.InOut)
            .start();

        // Create target tween
        new Tween(controls.target)
            .to({
                x: position.x,
                y: position.y,
                z: position.z
            }, 1500)
            .easing(Easing.Cubic.InOut)
            .start();
    }

    function addDistrictMarkers() {
        // Create SVG container for markers
        const markersSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        markersSvg.style.position = 'absolute';
        markersSvg.style.top = '0';
        markersSvg.style.left = '0';
        markersSvg.style.width = '100%';
        markersSvg.style.height = '100%';
        markersSvg.style.pointerEvents = 'none';
        markersSvg.style.zIndex = '100';
        document.body.appendChild(markersSvg);

        // Create markers
        districts.forEach(district => {
            // Create marker group
            const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            markerGroup.dataset.districtId = district.id;
            markerGroup.style.pointerEvents = 'all';
            markerGroup.style.cursor = 'pointer';

            // Create marker circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', '8');
            circle.setAttribute('fill', '#4CAF50');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            
            // Create pulse animation circle
            const pulseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            pulseCircle.setAttribute('r', '8');
            pulseCircle.setAttribute('fill', 'none');
            pulseCircle.setAttribute('stroke', '#4CAF50');
            pulseCircle.setAttribute('stroke-width', '2');
            pulseCircle.style.opacity = '0';

            // Create animations
            const animateRadius = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animateRadius.setAttribute('attributeName', 'r');
            animateRadius.setAttribute('from', '8');
            animateRadius.setAttribute('to', '20');
            animateRadius.setAttribute('dur', '1.5s');
            animateRadius.setAttribute('begin', '0s');
            animateRadius.setAttribute('repeatCount', 'indefinite');

            const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animateOpacity.setAttribute('attributeName', 'opacity');
            animateOpacity.setAttribute('from', '0.6');
            animateOpacity.setAttribute('to', '0');
            animateOpacity.setAttribute('dur', '1.5s');
            animateOpacity.setAttribute('begin', '0s');
            animateOpacity.setAttribute('repeatCount', 'indefinite');

            pulseCircle.appendChild(animateRadius);
            pulseCircle.appendChild(animateOpacity);

            // Add elements to group
            markerGroup.appendChild(pulseCircle);
            markerGroup.appendChild(circle);
            
            // Add click event
            markerGroup.addEventListener('click', () => selectDistrict(district));
            
            // Add to SVG container
            markersSvg.appendChild(markerGroup);
        });

        // Update marker positions on animation frame
        function updateMarkerPositions() {
            const tempVec = new THREE.Vector3();
            districts.forEach(district => {
                const markerGroup = markersSvg.querySelector(`g[data-district-id="${district.id}"]`);
                if (markerGroup) {
                    tempVec.set(district.position.x, district.position.y, district.position.z);
                    tempVec.project(camera);
                    
                    // Check if marker is in front of camera and within view bounds
                    if (tempVec.z < 1 && 
                        Math.abs(tempVec.x) <= 1 && 
                        Math.abs(tempVec.y) <= 1) {
                        const x = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
                        const y = (-tempVec.y * 0.5 + 0.5) * window.innerHeight;
                        
                        markerGroup.style.transform = `translate(${x}px, ${y}px)`;
                        markerGroup.style.display = 'block';
                    } else {
                        markerGroup.style.display = 'none';
                    }
                }
            });
            requestAnimationFrame(updateMarkerPositions);
        }
        updateMarkerPositions();
    }

    function selectDistrict(district) {
        // Remove active class from all markers and list items
        document.querySelectorAll('g[data-district-id], .district-item').forEach(el => el.classList.remove('active'));
        
        // Add active class to selected district
        document.querySelector(`g[data-district-id="${district.id}"]`)?.classList.add('active');
        document.querySelector(`.district-item[data-district-id="${district.id}"]`)?.classList.add('active');
        
        // Move camera to district
        moveCamera(district.position, district.position);
    }

    // Page Navigation
    function updatePageControls() {
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
        
        prevButton.classList.toggle('disabled', currentPage === 1);
        nextButton.classList.toggle('disabled', currentPage === totalPages);
    }

    function updateDistrictList() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const districtList = document.getElementById('districtList');
        
        districtList.innerHTML = '';
        districts.slice(startIndex, endIndex).forEach(district => {
            const li = document.createElement('li');
            li.className = 'district-item';
            li.dataset.districtId = district.id;
            li.textContent = district.name;
            li.addEventListener('click', () => selectDistrict(district));
            districtList.appendChild(li);
        });
    }

    // Initialize page controls
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateDistrictList();
            updatePageControls();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateDistrictList();
            updatePageControls();
        }
    });

    // Initial setup
    updateDistrictList();
    updatePageControls();

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
function showError(message, details) {
    console.error(message, details);
    const errorFallback = document.getElementById('error-fallback');
    if (errorFallback) {
        const errorMessage = errorFallback.querySelector('.error-message');
        const errorDetails = errorFallback.querySelector('.error-details');
        
        if (errorMessage) errorMessage.textContent = message;
        if (errorDetails) errorDetails.textContent = details;
        
        errorFallback.classList.remove('hidden');
    }
    if (loadingDiv) {
        loadingDiv.classList.add('hidden');
    }
} 