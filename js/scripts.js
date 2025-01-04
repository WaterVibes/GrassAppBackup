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
        x: "0",
        y: "1000",
        z: "1000"
    },
    target: {
        x: "0",
        y: "0",
        z: "0"
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
        
        // Scale factor to adjust marker positions
        const scale = 0.5;  // Adjust this value to scale marker positions
        
        // Transform coordinates for camera positions
        if (data.camera) {
            const x = parseFloat(data.camera.x) * scale;
            const y = parseFloat(data.camera.z) * scale;  // Use z for height
            const z = parseFloat(data.camera.y) * scale;  // Use y for depth
            data.camera.x = x.toString();
            data.camera.y = y.toString();
            data.camera.z = z.toString();
        }
        
        // Transform coordinates for target positions
        if (data.target) {
            const x = parseFloat(data.target.x) * scale;
            const y = parseFloat(data.target.z) * scale;  // Use z for height
            const z = parseFloat(data.target.y) * scale;  // Use y for depth
            data.target.x = x.toString();
            data.target.y = y.toString();
            data.target.z = z.toString();
        }
        
        // Transform coordinates for subject positions
        if (data.subject) {
            const x = parseFloat(data.subject.x) * scale;
            const y = parseFloat(data.subject.z) * scale;  // Use z for height
            const z = parseFloat(data.subject.y) * scale;  // Use y for depth
            data.subject.x = x.toString();
            data.subject.y = y.toString();
            data.subject.z = z.toString();
        }
        
        return data;
    } catch (error) {
        console.error(`Error loading marker data from ${markerFile}:`, error);
        return null;
    }
}

// Function to create a marker and label
async function createMarker(data, color = 0x00ff00) {
    const markerData = await loadMarkerData(data.markerFile);
    if (!markerData) return;

    // Create marker geometry with smaller size
    const markerGeometry = new THREE.SphereGeometry(5, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
        color,
        transparent: true,
        opacity: 0.0  // Make markers invisible
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Set position from marker data
    marker.position.set(
        parseFloat(markerData.subject.x),
        parseFloat(markerData.subject.y),
        parseFloat(markerData.subject.z)
    );
    scene.add(marker);
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

    // Add CSS for panel animation with hover behavior
    const style = document.createElement('style');
    style.textContent = `
        .nav-panel {
            transition: transform 0.3s ease;
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            height: auto;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-left: 1px solid #00ff00;
            box-shadow: -5px 0 15px rgba(0, 255, 0, 0.1);
            width: 200px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .nav-panel.collapsed {
            transform: translate(calc(100% - 50px), -50%);
        }
        .nav-panel.collapsed:hover {
            transform: translate(0, -50%);
        }
        .nav-section {
            margin-bottom: 15px;
        }
        .nav-section h3 {
            color: #00ff00;
            text-align: center;
            margin: 10px 0;
            font-size: 18px;
            font-family: 'Poppins', sans-serif;
            text-transform: uppercase;
        }
        .nav-button {
            background: transparent;
            border: 1px solid #00ff00;
            color: #00ff00;
            width: 100%;
            padding: 8px 15px;
            margin: 4px 0;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
            font-family: 'Poppins', sans-serif;
        }
        .nav-button:hover {
            background: rgba(0, 255, 0, 0.1);
        }
        @media (max-width: 768px) {
            .nav-panel {
                width: 70%;
                padding: 10px;
                top: 50%;
                transform: translateY(-50%);
            }
            .nav-panel.collapsed {
                transform: translate(calc(100% - 60px), -50%);
            }
            .nav-panel.collapsed:hover,
            .nav-panel.collapsed.touch-hover {
                transform: translate(0, -50%);
            }
            .nav-panel.expanded {
                transform: translate(0, -50%);
            }
            .nav-button {
                padding: 10px;
                font-size: 14px;
            }
        }
    `;
    document.head.appendChild(style);

    // Add hover/touch behavior after first selection
    if (isMobileDevice()) {
        let touchTimeout;
        navPanel.addEventListener('touchstart', () => {
            if (hasFirstSelection && navPanel.classList.contains('collapsed')) {
                clearTimeout(touchTimeout);
                navPanel.classList.add('touch-hover');
            }
        });
        navPanel.addEventListener('touchend', () => {
            if (hasFirstSelection) {
                touchTimeout = setTimeout(() => {
                    navPanel.classList.remove('touch-hover');
                }, 2000);
            }
        });
    }
}

// Update toggleNavPanel function with correct class name
function toggleNavPanel() {
    const navPanel = document.querySelector('.nav-panel');
    if (!navPanel) return;
    
    if (isMobileDevice()) {
        if (navPanel.classList.contains('expanded')) {
            navPanel.classList.remove('expanded');
            navPanel.classList.add('collapsed');
        } else {
            navPanel.classList.remove('collapsed');
            navPanel.classList.add('expanded');
        }
    } else {
        navPanel.classList.toggle('collapsed');
    }
}

// Update button click handlers with correct class name
document.addEventListener('DOMContentLoaded', () => {
    // Initialize nav panel collapse functionality
    collapseNavPanel();

    // Handle district buttons
    const districtButtons = document.querySelectorAll('.nav-section .nav-button');
    districtButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Force nav panel collapse immediately
            const navPanel = document.querySelector('.nav-panel');
            if (navPanel) {
                navPanel.classList.add('collapsed');
                navPanel.classList.remove('expanded');
            }

            const buttonText = button.textContent.trim();
            const districtMap = {
                'Baltimore Inner Harbor': 'innerHarbor',
                'Canton': 'canton',
                'Fells Point': 'fellsPoint',
                'Federal Hill': 'federalHill',
                'Mount Vernon': 'mountVernon'
            };
            const districtName = districtMap[buttonText];
            if (districtName) {
                console.log('Moving to district:', districtName);
                window.selectDistrict(districtName);
            }
        });
    });

    // Handle page buttons with same collapse behavior
    const pageButtons = document.querySelectorAll('.pages-container button');
    pageButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Force nav panel collapse immediately
            const navPanel = document.querySelector('.nav-panel');
            if (navPanel) {
                navPanel.classList.add('collapsed');
                navPanel.classList.remove('expanded');
            }

            const buttonText = button.textContent.trim();
            const pageMap = {
                'About Us': 'aboutUs',
                'Medical Patient': 'medicalPatient',
                'Partner With Us': 'partnerWithUs',
                'Delivery Driver': 'deliveryDriver'
            };
            const pageName = pageMap[buttonText] || buttonText;
            window.showPage(pageName);
        });
    });
});

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