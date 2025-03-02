import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { PumpingVisualizer } from './pumpingVisualizer.js';

let scene, camera, renderer, loadedFont, pumpingVisualizer;

// Initialize the 3D scene
function initialize() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e2f);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
    
    // Load font for text
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        loadedFont = font;
        pumpingVisualizer = new PumpingVisualizer(scene, camera, loadedFont);
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    animate();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
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
    
    // Use the new step-by-step demonstration method
    if (pumpingVisualizer) {
        // Set the pumping length to a reasonable value based on the string length
        pumpingVisualizer.pumpingLength = Math.min(3, Math.floor(inputString.length / 2));
        
        // Start the step-by-step demonstration
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