import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

describe('Three.js Scene Setup', () => {
    let scene, camera, renderer;

    beforeEach(() => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
    });

    test('Scene should be initialized', () => {
        expect(scene).toBeInstanceOf(THREE.Scene);
    });

    test('Camera should be positioned correctly', () => {
        camera.position.z = 5;
        expect(camera.position.z).toBe(5);
    });

    test('Renderer should have correct properties', () => {
        expect(renderer.antialias).toBe(true);
        expect(renderer.alpha).toBe(true);
    });

    test('OrbitControls should be initialized', () => {
        const controls = new OrbitControls(camera, renderer.domElement);
        expect(controls).toBeInstanceOf(OrbitControls);
        expect(controls.object).toBe(camera);
    });
}); 