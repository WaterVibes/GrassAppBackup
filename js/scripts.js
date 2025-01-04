import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as TWEEN from '@tweenjs/tween.js';

// Global variables
let scene, camera, renderer, labelRenderer, controls;
let currentCardIndex = 0;

// Make functions available globally immediately
window.selectDistrict = selectDistrictImpl;
window.showPage = showPageImpl;

// Get loading elements
const loadingScreen = document.querySelector('.loading-screen');
const loadingProgress = document.querySelector('.loading-progress');

// Initialize scene and camera
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);

// Set initial camera position from intro marker
const introMarkerData = {
    camera: {
        x: "196.97",
        y: "156.96",
        z: "630.37"
    },
    target: {
        x: "191.44",
        y: "154.81",
        z: "622.32"
    }
};

// Set initial camera position with correct orientation
camera.position.set(
    parseFloat(introMarkerData.camera.x),
    parseFloat(introMarkerData.camera.y),
    parseFloat(introMarkerData.camera.z)
);

// Set initial camera target
const initialTarget = new THREE.Vector3(
    parseFloat(introMarkerData.target.x),
    parseFloat(introMarkerData.target.y),
    parseFloat(introMarkerData.target.z)
);
camera.lookAt(initialTarget);

// Update fog settings for better visibility
const fogColor = 0x000000;
const fogNear = 2000;  // Pushed back significantly from 800
const fogFar = 3000;   // Pushed back significantly from 1500
scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

// Enhanced fog update function with reduced intensity
function updateFog() {
    const distanceFromCenter = Math.sqrt(
        camera.position.x * camera.position.x + 
        camera.position.z * camera.position.z
    );
    
    // Calculate height-based fog with reduced intensity
    const heightFactor = Math.max(0, Math.min(1, camera.position.y / 2000));  // Increased from 1000
    
    // Calculate distance-based fog with reduced intensity
    const distanceFactor = Math.max(0, Math.min(1, distanceFromCenter / 2000));  // Increased from 1000
    
    // Combine both factors for dynamic fog
    const fogFactor = Math.max(heightFactor, distanceFactor);
    
    // Apply fog based on combined factors with increased distances
    if (fogFactor > 0.5) {  // Increased threshold from 0.3
        const intensity = (fogFactor - 0.5) / 0.5;  // Normalized to 0-1 range
        scene.fog.near = 2000 - (intensity * 500);   // Increased base distance
        scene.fog.far = 3000 - (intensity * 500);    // Increased base distance
    } else {
        scene.fog.near = 2500;  // Increased default fog distance
        scene.fog.far = 3500;   // Increased default fog distance
    }
}

// Initialize renderer
renderer = new THREE.WebGLRenderer({ 
    antialias: window.devicePixelRatio === 1,  // Only use antialiasing on non-mobile
    alpha: true,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: true,
    canvas: document.createElement('canvas')
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.shadowMap.enabled = false;  // Disable shadows for better performance
document.body.appendChild(renderer.domElement);

// Initialize CSS2D renderer for labels
labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'auto';
document.body.appendChild(labelRenderer.domElement);

// Add lights for better visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
scene.add(ambientLight);

// Add multiple directional lights for better coverage
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight1.position.set(1000, 1000, 1000);
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight2.position.set(-1000, 1000, -1000);
scene.add(directionalLight2);

const directionalLight3 = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight3.position.set(0, 1000, 0);
scene.add(directionalLight3);

// Add more directional lights for comprehensive coverage
const directionalLight4 = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight4.position.set(1000, 1000, -1000);
scene.add(directionalLight4);

const directionalLight5 = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight5.position.set(-1000, 1000, 1000);
scene.add(directionalLight5);

// Remove old point lights and add new ones at strategic positions with increased intensity
const pointLight1 = new THREE.PointLight(0xffffff, 1.2, 2500);
pointLight1.position.set(500, 1000, 500);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 1.2, 2500);
pointLight2.position.set(-500, 1000, -500);
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xffffff, 1.2, 2500);
pointLight3.position.set(0, 1000, 0);
scene.add(pointLight3);

// Add point lights at corners for better edge lighting
const pointLight4 = new THREE.PointLight(0xffffff, 1.0, 2500);
pointLight4.position.set(500, 1000, -500);
scene.add(pointLight4);

const pointLight5 = new THREE.PointLight(0xffffff, 1.0, 2500);
pointLight5.position.set(-500, 1000, 500);
scene.add(pointLight5);

// Function to check if device is mobile
function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Function to constrain camera position
function constrainCamera() {
    const maxRadius = 1200;  // Reduced from 1500 to keep within fog boundaries
    const minHeight = 200;   // Increased minimum height to prevent clipping
    const maxHeight = 1000;  // Increased maximum height for better overview

    const pos = camera.position.clone();
    const horizontalDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    
    // Constrain horizontal movement
    if (horizontalDist > maxRadius) {
        const angle = Math.atan2(pos.z, pos.x);
        pos.x = maxRadius * Math.cos(angle);
        pos.z = maxRadius * Math.sin(angle);
    }
    
    // Constrain vertical movement with smooth transition near boundaries
    if (pos.y < minHeight + 100) {
        pos.y = minHeight + (pos.y - minHeight) * 0.5;  // Smooth transition near ground
    } else if (pos.y > maxHeight - 100) {
        pos.y = maxHeight - (maxHeight - pos.y) * 0.5;  // Smooth transition near ceiling
    }
    
    // Additional constraints for diagonal movement
    const minAngle = Math.PI / 6;  // 30 degrees
    const maxAngle = Math.PI / 2.1; // About 85 degrees
    
    const currentAngle = Math.atan2(pos.y, horizontalDist);
    if (currentAngle < minAngle) {
        const targetY = horizontalDist * Math.tan(minAngle);
        pos.y = pos.y * 0.8 + targetY * 0.2;  // Smooth transition
    } else if (currentAngle > maxAngle) {
        const targetY = horizontalDist * Math.tan(maxAngle);
        pos.y = pos.y * 0.8 + targetY * 0.2;  // Smooth transition
    }
    
    camera.position.copy(pos);
}

// Initialize controls with tighter constraints
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.enablePan = true;
controls.panSpeed = isMobileDevice() ? 0.3 : 0.5;
controls.minDistance = isMobileDevice() ? 200 : 300;  // Increased minimum distance
controls.maxDistance = isMobileDevice() ? 1000 : 1200;  // Reduced maximum distance
controls.maxPolarAngle = Math.PI / 2.1;
controls.minPolarAngle = Math.PI / 6;
controls.target.copy(initialTarget);

// Define districts and pages arrays at the top level
const districts = [
    {
        name: 'innerHarbor',
        markerFile: 'marker_baltimore_inner_harbor_subject_subject_marker_1735195982517.json',
        cameraFile: 'marker_baltimore_inner_harbor__1735194251759.json'
    },
    {
        name: 'canton',
        markerFile: 'marker_canton_subject_subject_marker_1735196858094.json',
        cameraFile: 'marker_canton_camera_camera_marker_1735196801332.json'
    },
    {
        name: 'fellsPoint',
        markerFile: 'marker_fells_point_subject__subject_marker_1735197073807.json',
        cameraFile: 'marker_fells_point_camera_camera_marker_1735197031057.json'
    },
    {
        name: 'federalHill',
        markerFile: 'marker_federal_hill_subject__subject_marker_1735196627275.json',
        cameraFile: 'marker_federal_hill_marker_camera_marker_1735196516687.json'
    },
    {
        name: 'mountVernon',
        markerFile: 'marker_mount_vernon_subject__subject_marker_1735197588128.json',
        cameraFile: 'marker_mount_vernon_camera_camera_marker_1735197513333.json'
    }
];

const pages = [
    {
        name: 'aboutUs',
        markerFile: 'marker_about_us_subject__subject_marker_1735199597502.json',
        cameraFile: 'marker_about_us_camera_camera_marker_1735199541761.json'
    },
    {
        name: 'medicalPatient',
        markerFile: 'marker_medical_patient_subject_marker_1735199228409.json',
        cameraFile: 'marker_medical_patient_camera_camera_marker_1735199161321.json'
    },
    {
        name: 'partnerWithUs',
        markerFile: 'marker_partnership_subject__subject_marker_1735199019215.json',
        cameraFile: 'marker_partnership_camera_marker_1735198971796.json'
    },
    {
        name: 'deliveryDriver',
        markerFile: 'marker_delivery_driver_subject_subject_marker_1735200573413.json',
        cameraFile: 'marker_deliverydrivers_camera_marker_1735200540288.json'
    }
];

// Function to load marker data
async function loadMarkerData(markerFile) {
    try {
        const response = await fetch(`markers/${markerFile}`);
        const data = await response.json();
        
        // No need to scale or transform coordinates - use them directly
        return {
            camera: {
                x: data.camera.x,
                y: data.camera.y,
                z: data.camera.z
            },
            target: data.target ? {
                x: data.target.x,
                y: data.target.y,
                z: data.target.z
            } : null,
            subject: data.subject ? {
                x: data.subject.x,
                y: data.subject.y,
                z: data.subject.z
            } : null
        };
    } catch (error) {
        console.error(`Error loading marker data from ${markerFile}:`, error);
        return null;
    }
}

// Function to create a debug sphere
function createDebugSphere(position, color = 0xff0000, size = 10) {
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(
        parseFloat(position.x),
        parseFloat(position.y),
        parseFloat(position.z)
    );
    scene.add(sphere);
    
    // Add a line from camera to target if both positions are provided
    if (position.targetPos) {
        const points = [
            new THREE.Vector3(
                parseFloat(position.x),
                parseFloat(position.y),
                parseFloat(position.z)
            ),
            new THREE.Vector3(
                parseFloat(position.targetPos.x),
                parseFloat(position.targetPos.y),
                parseFloat(position.targetPos.z)
            )
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: color });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
    }
}

// Function to create a marker and label
async function createMarker(data, color = 0x00ff00) {
    try {
        const markerData = await loadMarkerData(data.markerFile);
        if (!markerData) return;

        // Create camera position marker (red sphere)
        if (markerData.camera) {
            createDebugSphere(markerData.camera, 0xff0000, 5);
        }

        // Create target position marker (blue sphere)
        if (markerData.target) {
            createDebugSphere(markerData.target, 0x0000ff, 5);
        }

        // Create subject position marker (green sphere)
        if (markerData.subject) {
            createDebugSphere(markerData.subject, 0x00ff00, 5);
        }

        // Draw line from camera to target
        if (markerData.camera && markerData.target) {
            markerData.camera.targetPos = markerData.target;
            createDebugSphere(markerData.camera, 0xff0000, 5);
        }
    } catch (error) {
        console.error('Error creating debug marker:', error);
    }
}

// Function to create all markers
async function createAllMarkers() {
    // Create district markers (green)
    for (const district of districts) {
        await createMarker(district, 0x00ff00);
    }
    
    // Create page markers (blue)
    for (const page of pages) {
        await createMarker(page, 0x0000ff);
    }
}

// Function to handle district selection with camera movement
async function selectDistrictImpl(districtName) {
    // Remove any existing info cards when selecting a district
    removeExistingInfoCard();
    
    console.log('Looking for district:', districtName);
    const district = districts.find(d => d.name === districtName);
    if (!district) {
        console.error('District not found:', districtName);
        return;
    }

    try {
        const cameraData = await loadMarkerData(district.cameraFile);
        if (!cameraData) {
            console.error('Camera data not found for district:', districtName);
            return;
        }

        // Create camera position and target vectors
        const targetPos = new THREE.Vector3(
            parseFloat(cameraData.target.x),
            parseFloat(cameraData.target.y),
            parseFloat(cameraData.target.z)
        );
        const cameraPos = new THREE.Vector3(
            parseFloat(cameraData.camera.x),
            parseFloat(cameraData.camera.y),
            parseFloat(cameraData.camera.z)
        );

        // Smooth transition for districts (same as pages)
        new TWEEN.Tween(camera.position)
            .to(cameraPos, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        new TWEEN.Tween(controls.target)
            .to(targetPos, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        // Add a slight fade effect during transition
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 1.5s';
        overlay.style.opacity = '0';
        document.body.appendChild(overlay);

        // Fade in
        setTimeout(() => { overlay.style.opacity = '1'; }, 0);
        // Fade out and remove
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 1500);
        }, 750);

    } catch (error) {
        console.error('Error moving camera to district:', districtName, error);
    }
}

// Add page content data with multiple cards per page
const pageContent = {
    aboutUs: {
        cards: [
            {
                title: "Who We Are",
                content: "GrassApp is more than a delivery service; we're a bridge connecting people to trusted, local dispensaries in a way that's safe, seamless, and culturally relevant.\nFounded in Baltimore, our mission is rooted in uplifting communities, providing access to cannabis responsibly, and celebrating the unique spirit of the people we serve.\nWhether you're a medical cannabis patient or a business partner, GrassApp delivers more than products—we deliver trust.",
                icon: '🌿'
            },
            {
                title: "Our Commitment to the Community",
                content: "GrassApp isn't just about convenience; it's about connection.\nSupporting local businesses and artists to ensure the community thrives.\nCollaborating with dispensaries to provide personalized service.\nInnovating for sustainability by prioritizing eco-friendly practices, such as plantable packaging and waste reduction initiatives.",
                icon: '🤝'
            },
            {
                title: "Why Choose GrassApp?",
                content: "Fully digital and easy-to-use platform designed for today's tech-savvy customers.\nCommitted to transparency, efficiency, and fostering relationships with the people and businesses that make Baltimore special.\nInspired by the culture and dedicated to setting a new standard for cannabis delivery.",
                icon: '✨'
            }
        ]
    },
    medicalPatient: {
        cards: [
            {
                title: "How GrassApp Supports Patients",
                content: "We understand the importance of reliable access to your medical cannabis products. GrassApp is here to simplify the process, ensuring every delivery is discreet, secure, and timely.\nBrowse licensed dispensaries, compare product options, and track your delivery in real-time—all from the comfort of your home.",
                icon: '💊'
            },
            {
                title: "Steps to Register as a Patient",
                content: "Becoming a registered medical cannabis patient in Maryland is simple. Follow these steps to get started:\nVisit the Maryland Patient Registration Page.\nProvide your personal information and upload the required documentation.\nOnce approved, browse GrassApp to find dispensaries tailored to your medical needs.",
                icon: '📝',
                link: "https://onestop.md.gov/public_profiles/adult-patient-registration-601c0fd9f9d7557af267e1e1"
            },
            {
                title: "Your Privacy Matters",
                content: "GrassApp is committed to protecting your medical and personal information. We comply with HIPAA regulations and use advanced encryption to keep your data secure.",
                icon: '🔒'
            }
        ]
    },
    partnerWithUs: {
        cards: [
            {
                title: "Why Partner with GrassApp?",
                content: "Partnering with GrassApp connects your dispensary with a growing network of medical cannabis patients seeking reliable delivery services.\nOur platform integrates seamlessly with your existing operations, allowing you to focus on serving your customers while we handle the logistics.",
                icon: '🤝'
            },
            {
                title: "How We Work Together",
                content: "GrassApp uses live API integration to keep your inventory updated in real time, ensuring accurate product availability for customers.\nOur delivery system is designed to reflect your dispensary's professionalism, offering a service that mirrors the quality you provide in-store.",
                icon: '⚡'
            },
            {
                title: "Steps to Join",
                content: "Becoming a GrassApp partner is straightforward:\nReach out to our team to discuss your dispensary's unique needs.\nSet up API keys and configure real-time inventory tracking.\nSit back as GrassApp connects you with a wider audience of patients and customers.",
                icon: '🚀',
                contact: "contact@thegrassapp.com"
            }
        ]
    },
    deliveryDriver: {
        cards: [
            {
                title: "Be Part of Something Bigger",
                content: "Driving with GrassApp isn't just about making deliveries; it's about being part of a movement to redefine cannabis delivery in Baltimore.\nAs a caregiver-certified driver, you'll play a vital role in ensuring patients and customers get their orders on time and with care.",
                icon: '🚗'
            },
            {
                title: "What You Need to Get Started",
                content: "To join the GrassApp team, you'll need:\nMMCC Caregiver Certification: Learn how to register at the Maryland Caregiver Registration Page.\nA reliable vehicle for deliveries.\nA dedication to professionalism and excellent customer service.",
                icon: '📋',
                link: "https://onestop.md.gov/public_profiles/caregiver-registration-601c0fd5f9d7557af267cee1"
            },
            {
                title: "Your Journey Begins Here",
                content: "Joining GrassApp means flexible opportunities, access to a growing community of cannabis professionals, and the chance to make a difference in patients' lives.\nReady to start? Let GrassApp guide you every step of the way, from registration to your first delivery.",
                icon: '🌟'
            }
        ]
    }
};

// Update showInfoCard function with better layout and content formatting
function showInfoCard(pageName) {
    removeExistingInfoCard();

    const pageInfo = pageContent[pageName];
    if (!pageInfo || !pageInfo.cards || !pageInfo.cards.length) return;

    const cardInfo = pageInfo.cards[currentCardIndex];
    const isMobile = isMobileDevice();

    const card = document.createElement('div');
    card.className = 'info-card';
    
    card.style.cssText = `
        position: fixed;
        ${isMobile ? 'bottom: -100%;' : 'top: 50%'};
        left: 50%;
        width: ${isMobile ? '90%' : '700px'};
        transform: ${isMobile ? 'translateX(-50%)' : 'translate(-50%, -50%)'};
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(10px);
        border-radius: ${isMobile ? '20px 20px 0 0' : '20px'};
        padding: ${isMobile ? '20px' : '30px'};
        color: white;
        box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
        border: 1px solid rgba(0, 255, 0, 0.2);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        opacity: 0;
        max-height: ${isMobile ? '85vh' : '80vh'};
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 255, 0, 0.5) rgba(0, 0, 0, 0.1);
    `;

    // Add custom scrollbar styles
    const scrollbarStyles = document.createElement('style');
    scrollbarStyles.textContent = `
        .info-card::-webkit-scrollbar {
            width: 6px;
        }
        .info-card::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
        }
        .info-card::-webkit-scrollbar-thumb {
            background: rgba(0, 255, 0, 0.5);
            border-radius: 3px;
        }
    `;
    document.head.appendChild(scrollbarStyles);

    // Create icon
    const icon = document.createElement('div');
    icon.className = 'card-icon';
    icon.textContent = cardInfo.icon;
    icon.style.cssText = `
        font-size: ${isMobile ? '48px' : '56px'};
        margin-bottom: 20px;
        text-align: center;
        animation: floatIcon 3s ease-in-out infinite;
    `;

    // Create title
    const title = document.createElement('h2');
    title.textContent = cardInfo.title;
    title.style.cssText = `
        font-size: ${isMobile ? '24px' : '28px'};
        margin-bottom: 20px;
        color: #00ff00;
        font-weight: bold;
        text-align: center;
        text-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        padding: 0 20px;
    `;

    // Create content with proper formatting
    const content = document.createElement('div');
    content.style.cssText = `
        font-size: ${isMobile ? '16px' : '18px'};
        line-height: 1.8;
        margin-bottom: 25px;
        color: rgba(255, 255, 255, 0.95);
        text-align: left;
        padding: 0 ${isMobile ? '15px' : '25px'};
    `;

    // Split content by newlines and create paragraphs
    cardInfo.content.split('\n').forEach(paragraph => {
        if (paragraph.trim()) {
            const p = document.createElement('p');
            p.textContent = paragraph;
            p.style.marginBottom = '15px';
            content.appendChild(p);
        }
    });

    // Add link or contact if available
    if (cardInfo.link || cardInfo.contact) {
        const link = document.createElement('a');
        link.href = cardInfo.link || `mailto:${cardInfo.contact}`;
        link.textContent = cardInfo.link ? 'Register Now' : 'Contact Us';
        link.target = '_blank';
        link.style.cssText = `
            display: block;
            width: ${isMobile ? '85%' : '200px'};
            margin: 30px auto;
            padding: 15px 0;
            background: linear-gradient(45deg, #00ff00, #00cc00);
            color: black;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            text-align: center;
            font-size: ${isMobile ? '16px' : '18px'};
            transition: all 0.3s ease;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
        `;
        link.onmouseover = () => {
            link.style.transform = 'scale(1.05)';
            link.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
        };
        link.onmouseout = () => {
            link.style.transform = 'scale(1)';
            link.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
        };
        content.appendChild(link);
    }

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        color: #00ff00;
        font-size: 28px;
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 2;
    `;
    closeBtn.onmouseover = () => closeBtn.style.transform = 'scale(1.1) rotate(90deg)';
    closeBtn.onmouseout = () => closeBtn.style.transform = 'scale(1) rotate(0)';
    closeBtn.onclick = () => {
        card.style.opacity = '0';
        if (isMobile) {
            card.style.bottom = '-100%';
        }
        setTimeout(() => card.remove(), 500);
    };

    // Add navigation dots
    if (pageInfo.cards.length > 1) {
        const dotsContainer = document.createElement('div');
        dotsContainer.style.cssText = `
            position: absolute;
            bottom: ${isMobile ? '25px' : '20px'};
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            justify-content: center;
            padding: 10px;
        `;

        pageInfo.cards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.style.cssText = `
                width: ${isMobile ? '10px' : '8px'};
                height: ${isMobile ? '10px' : '8px'};
                border-radius: 50%;
                background: ${index === currentCardIndex ? '#00ff00' : 'rgba(0, 255, 0, 0.3)'};
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            dot.onclick = () => {
                currentCardIndex = index;
                showInfoCard(pageName);
            };
            dotsContainer.appendChild(dot);
        });
        card.appendChild(dotsContainer);
    }

    // Assemble card
    card.appendChild(closeBtn);
    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(content);

    // Add to document and animate
    document.body.appendChild(card);
    requestAnimationFrame(() => {
        card.style.opacity = '1';
        if (isMobile) {
            card.style.bottom = '0';
        }
    });

    // Add swipe handling for mobile
    if (isMobile) {
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false;

        card.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = false;
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
            if (!isSwiping) {
                const touchMoveX = e.touches[0].clientX;
                const touchMoveY = e.touches[0].clientY;
                const deltaX = Math.abs(touchMoveX - touchStartX);
                const deltaY = Math.abs(touchMoveY - touchStartY);

                if (deltaX > deltaY && deltaX > 30) {
                    isSwiping = true;
                    e.preventDefault();
                }
            }
        }, { passive: false });

        card.addEventListener('touchend', (e) => {
            if (!isSwiping) return;

            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            const swipeThreshold = 50;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0 && currentCardIndex < pageInfo.cards.length - 1) {
                    currentCardIndex++;
                    showInfoCard(pageName);
                } else if (diff < 0 && currentCardIndex > 0) {
                    currentCardIndex--;
                    showInfoCard(pageName);
                }
            }
        }, { passive: true });
    }
}

// Add function to remove existing info card
function removeExistingInfoCard() {
    const existingCard = document.querySelector('.info-card');
    if (existingCard) {
        existingCard.style.opacity = '0';
        if (isMobileDevice()) {
            existingCard.style.bottom = '-100%';
        }
        setTimeout(() => existingCard.remove(), 500);
    }
}

// Add state tracking for first selection
let hasFirstSelection = false;

// Update collapseNavPanel function with correct styling to match image
function collapseNavPanel() {
    const navPanel = document.querySelector('.nav-panel');
    if (!navPanel) return;

    // Add CSS for panel animation with click behavior
    const style = document.createElement('style');
    style.textContent = `
        .nav-panel {
            transition: transform 0.3s ease;
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            height: auto;
            margin: 20px 0;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-left: 1px solid #00ff00;
            box-shadow: -5px 0 15px rgba(0, 255, 0, 0.1);
            width: 180px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: visible;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
        }
        .nav-panel.collapsed {
            transform: translate(calc(100% - 40px), -50%);
            pointer-events: none;
            touch-action: none;
        }
        .nav-panel.collapsed * {
            pointer-events: none;
            touch-action: none;
        }
        .nav-panel.collapsed .nav-button {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            touch-action: none;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .nav-panel.collapsed .nav-section h3 {
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .nav-panel.collapsed .nav-panel-clickable {
            position: absolute;
            left: 0;
            top: 0;
            width: 40px;
            height: 100%;
            pointer-events: auto;
            cursor: pointer;
            touch-action: manipulation;
            z-index: 1001;
            background: rgba(0, 0, 0, 0.8);
            border-left: 1px solid #00ff00;
        }
        .nav-section {
            margin-bottom: 15px;
            pointer-events: auto;
            touch-action: manipulation;
        }
        .nav-section:last-child {
            margin-bottom: 0;
        }
        .nav-section h3 {
            color: #00ff00;
            text-align: center;
            margin: 8px 0;
            font-size: 16px;
            font-family: 'Poppins', sans-serif;
            text-transform: uppercase;
            pointer-events: none;
        }
        .nav-button {
            background: transparent;
            border: 1px solid #00ff00;
            color: #00ff00;
            width: 100%;
            padding: 6px 12px;
            margin: 3px 0;
            border-radius: 5px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.3s ease;
            font-family: 'Poppins', sans-serif;
            pointer-events: auto;
            touch-action: manipulation;
        }
        .nav-button:hover {
            background: rgba(0, 255, 0, 0.1);
        }
        @media (max-width: 768px) {
            .nav-panel {
                width: 55%;
                padding: 10px;
                margin: 10px 0;
                max-height: 85vh;
            }
            .nav-panel.collapsed {
                transform: translate(calc(100% - 35px), -50%);
            }
            .nav-panel.collapsed .nav-button,
            .nav-panel.collapsed .nav-section h3 {
                display: none;
            }
            .nav-panel.collapsed .nav-panel-clickable {
                width: 35px;
            }
            .nav-panel.expanded {
                transform: translate(0, -50%);
                pointer-events: auto;
                touch-action: manipulation;
            }
            .nav-section {
                margin-bottom: 10px;
            }
            .nav-section h3 {
                font-size: 14px;
                margin: 5px 0;
            }
            .nav-button {
                padding: 7px;
                margin: 2px 0;
                font-size: 12px;
            }
        }
    `;
    document.head.appendChild(style);

    // Add clickable area for collapsed panel
    const clickableArea = document.createElement('div');
    clickableArea.className = 'nav-panel-clickable';
    navPanel.appendChild(clickableArea);

    // Add touch/click behavior for panel expansion
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    clickableArea.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        e.stopPropagation();
    }, { passive: false });

    clickableArea.addEventListener('touchmove', (e) => {
        if (navPanel.classList.contains('collapsed')) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, { passive: false });

    clickableArea.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        const touchDistance = Math.sqrt(
            Math.pow(touchEndX - touchStartX, 2) + 
            Math.pow(touchEndY - touchStartY, 2)
        );

        // If it's a quick tap (less than 200ms) and minimal movement (less than 10px)
        if (touchDuration < 200 && touchDistance < 10) {
            if (navPanel.classList.contains('collapsed')) {
                navPanel.classList.remove('collapsed');
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }, { passive: false });

    // Add click handler for desktop
    clickableArea.addEventListener('click', (e) => {
        if (navPanel.classList.contains('collapsed')) {
            navPanel.classList.remove('collapsed');
            e.preventDefault();
            e.stopPropagation();
        }
    });

    // Add click/touch handler to collapse panel when clicking/touching outside
    document.addEventListener('click', (e) => {
        const navPanel = document.querySelector('.nav-panel');
        if (navPanel && !navPanel.contains(e.target)) {
            navPanel.classList.add('collapsed');
        }
    });

    document.addEventListener('touchstart', (e) => {
        const navPanel = document.querySelector('.nav-panel');
        if (navPanel && !navPanel.contains(e.target)) {
            navPanel.classList.add('collapsed');
        }
    }, { passive: true });
}

// Update button click handlers
document.addEventListener('DOMContentLoaded', () => {
    const navPanel = document.querySelector('.nav-panel');
    if (navPanel) {
        // Get the sections
        const sections = Array.from(navPanel.children);
        
        // Find the Pages and Districts sections
        const pagesSection = sections.find(section => 
            section.querySelector('h3')?.textContent.trim() === 'PAGES'
        );
        const districtsSection = sections.find(section => 
            section.querySelector('h3')?.textContent.trim() === 'DISTRICTS'
        );

        // If both sections exist, reorder them
        if (pagesSection && districtsSection) {
            navPanel.innerHTML = '';
            navPanel.appendChild(pagesSection);
            navPanel.appendChild(districtsSection);
        }
    }
    
    // Initialize nav panel collapse functionality
    collapseNavPanel();
    
    // Handle all navigation buttons
    const allButtons = document.querySelectorAll('.nav-button');
    allButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const navPanel = document.querySelector('.nav-panel');
            if (navPanel && !navPanel.classList.contains('collapsed')) {
                // Force immediate collapse
                requestAnimationFrame(() => {
                    navPanel.classList.add('collapsed');
                });
            }
        });
    });

    // Start with panel collapsed
    if (navPanel) {
        navPanel.classList.add('collapsed');
    }
});

// Remove any hover-based expansion
function toggleNavPanel() {
    const navPanel = document.querySelector('.nav-panel');
    if (!navPanel) return;
    
    if (navPanel.classList.contains('collapsed')) {
        navPanel.classList.remove('collapsed');
    } else {
        navPanel.classList.add('collapsed');
    }
}

try {
    // Initialize loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.158.0/examples/jsm/libs/draco/');
    dracoLoader.preload();
    dracoLoader.setDecoderConfig({ type: 'js' });

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load the model
    const modelPath = 'models/baltimore_city_optimized_v2.glb';
    console.log('Starting to load model from:', modelPath);
    gltfLoader.load(
        modelPath,
        (gltf) => {
            console.log('Model loaded successfully');
            const model = gltf.scene;
            
            // Set model orientation to match the top-down view
            model.scale.set(1, 1, 1);
            model.rotation.x = 0; // Remove the -Math.PI/2 rotation that was causing the issue
            model.rotation.y = Math.PI; // Rotate 180 degrees around Y axis to face correct direction
            
            // Center the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            
            scene.add(model);
            createAllMarkers();
            
            // Remove collapsed class after loading
            setTimeout(() => {
                const navPanel = document.querySelector('.nav-panel');
                if (navPanel) {
                    navPanel.classList.remove('collapsed');
                }
            }, 500); // Small delay to ensure smooth transition
            
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
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

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        TWEEN.update();
        
        // Apply constraints
        constrainCamera();
        updateFog();
        
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }
    animate();

    // Handle window resize with mobile optimizations
    function onWindowResize() {
        const isMobile = isMobileDevice();
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Update controls for mobile
        controls.panSpeed = isMobile ? 0.3 : 0.5;
        controls.minDistance = isMobile ? 50 : 100;
        controls.maxDistance = isMobile ? 1000 : 1500;

        // Adjust any existing info cards
        const existingCard = document.querySelector('.info-card');
        if (existingCard) {
            if (isMobile) {
                existingCard.style.right = '';
                existingCard.style.top = '';
                existingCard.style.transform = 'none';
                existingCard.style.width = '100%';
                existingCard.style.bottom = '0';
                existingCard.style.borderRadius = '20px 20px 0 0';
            } else {
                existingCard.style.bottom = '';
                existingCard.style.right = '20px';
                existingCard.style.top = '50%';
                existingCard.style.transform = 'translateY(-50%)';
                existingCard.style.width = '350px';
                existingCard.style.borderRadius = '20px';
            }
        }
    }

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(onWindowResize, 100);
    });

} catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize the application', error.message);
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
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

// Update showPageImpl to handle card timing better
async function showPageImpl(pageName) {
    // Remove any existing card immediately
    removeExistingInfoCard();

    // Handle first selection and panel collapse
    if (!hasFirstSelection) {
        hasFirstSelection = true;
        const navPanel = document.querySelector('.nav-panel');
        if (navPanel) {
            navPanel.classList.add('collapsed');
            navPanel.classList.remove('expanded');
        }
    }

    console.log('Looking for page:', pageName);
    const page = pages.find(p => p.name === pageName);
    if (!page) {
        console.error('Page not found:', pageName);
        return;
    }

    try {
        const cameraData = await loadMarkerData(page.cameraFile);
        if (!cameraData) {
            console.error('Camera data not found for page:', pageName);
            return;
        }

        const targetPos = new THREE.Vector3(
            parseFloat(cameraData.target.x),
            parseFloat(cameraData.target.y),
            parseFloat(cameraData.target.z)
        );
        const cameraPos = new THREE.Vector3(
            parseFloat(cameraData.camera.x),
            parseFloat(cameraData.camera.y),
            parseFloat(cameraData.camera.z)
        );

        // Track camera movement completion
        let cameraMovementComplete = false;
        let targetMovementComplete = false;

        // Camera position tween
        new TWEEN.Tween(camera.position)
            .to(cameraPos, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onComplete(() => {
                cameraMovementComplete = true;
                if (targetMovementComplete) {
                    showInfoCard(pageName);
                }
            })
            .start();

        // Target position tween
        new TWEEN.Tween(controls.target)
            .to(targetPos, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onComplete(() => {
                targetMovementComplete = true;
                if (cameraMovementComplete) {
                    showInfoCard(pageName);
                }
            })
            .start();

        // Handle first selection
        if (!hasFirstSelection) {
            hasFirstSelection = true;
            const navPanel = document.querySelector('.nav-panel');
            if (navPanel) {
                navPanel.classList.add('collapsed');
            }
        }

    } catch (error) {
        console.error('Error moving camera to page:', pageName, error);
    }
} 