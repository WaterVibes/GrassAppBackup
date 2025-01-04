// Three.js core
const THREE = window.THREE;

// Initialize Three.js scene
async function init() {
    console.log('Initializing Three.js scene...');
    
    try {
        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        
        // Add fog to the scene
        const fogColor = new THREE.Color(0x000000);
        const fogDensity = 0.0004;
        scene.fog = new THREE.FogExp2(fogColor, fogDensity);

        // Create camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(0, 5, 10);

        // Create renderer
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
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

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }

        // Start animation
        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize the application', error.message);
        throw error;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 