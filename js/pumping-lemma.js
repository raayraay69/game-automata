import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { PumpingVisualizer } from './pumpingVisualizer.js';
import { MathAnimation, MathNotation, VisualEffects } from './3b1bAnimations.js';

let scene, camera, renderer, loadedFont, pumpingVisualizer, mathAnimation, visualEffects;

// Initialize the 3D scene
function initialize() {
    // Create scene with 3Blue1Brown style
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e2f); // Dark background characteristic of 3B1B
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('animation-container').appendChild(renderer.domElement);
    
    // Initialize 3Blue1Brown style effects
    mathAnimation = new MathAnimation(scene, camera);
    visualEffects = new VisualEffects(scene, renderer);
    
    // Add enhanced lighting for 3B1B style
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);
    
    // Add subtle colored lighting for depth
    const blueLight = new THREE.PointLight(0x3b1bb1, 0.3);
    blueLight.position.set(-10, 5, 5);
    scene.add(blueLight);
    
    const yellowLight = new THREE.PointLight(0xffd700, 0.2);
    yellowLight.position.set(10, -5, -5);
    scene.add(yellowLight);
    
    // Add grid for 3B1B style background
    visualEffects.createGrid();
    
    // Load font for text
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        loadedFont = font;
        pumpingVisualizer = new PumpingVisualizer(scene, camera, loadedFont);
        window.initializeTutorial(scene, camera, loadedFont);
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    animate();
}

// Animation loop with enhanced performance
function animate() {
    requestAnimationFrame(animate);
    
    // Update orbit controls if they exist
    if (pumpingVisualizer && pumpingVisualizer.controls) {
        pumpingVisualizer.controls.update();
    }
    
    // Update 3B1B style animations
    if (mathAnimation) {
        mathAnimation.update();
    }
    
    renderer.render(scene, camera);
}

// Start the visualization when the button is clicked
document.getElementById('start-btn').addEventListener('click', () => {
    const inputString = document.getElementById('input-string').value;
    const language = document.getElementById('language-select').value;
    
    if (!inputString) {
        alert('Please enter a string!');
        return;
    }
    
    if (pumpingVisualizer) {
        pumpingVisualizer.pumpingLength = Math.min(3, Math.floor(inputString.length / 2));
        pumpingVisualizer.startDemonstration(inputString, language);
    } else {
        document.getElementById('feedback').innerText = "Loading visualizer... Please try again in a moment.";
    }
});

// Hide explanation panel
window.hideExplanation = function() {
    document.getElementById('explanation-panel').style.display = 'none';
};

// Initialize when the page loads
window.addEventListener('load', initialize);