// visualization.js

// Imports for Three.js and related libraries
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { PumpingVisualizer } from './pumpingVisualizer.js';

// Shared variables for visualization
let scene, camera, renderer, controls, automaton, loadedFont, pumpingVisualizer;

// States and transitions for the automaton
const states = [
    { name: 'q0', position: new THREE.Vector3(-5, 0, 0), isAccepting: false, color: 0xff0000, label: 'Start (Red Light)' },
    { name: 'q1', position: new THREE.Vector3(0, 0, 0), isAccepting: false, color: 0xffff00, label: 'Middle (Yellow Caution)' },
    { name: 'q2', position: new THREE.Vector3(5, 0, 0), isAccepting: true, color: 0x00ff00, label: 'Goal (Green Win)' }
];

const transitions = [
    { from: 'q0', to: 'q1', symbol: '0' },
    { from: 'q1', to: 'q2', symbol: '1' },
    { from: 'q0', to: 'q0', symbol: '1' },
    { from: 'q1', to: 'q1', symbol: '0' },
    { from: 'q2', to: 'q0', symbol: '0' },
    { from: 'q2', to: 'q0', symbol: '1' },
    { from: 'q0', to: 'q1', symbol: 'ε' }
];

// Initialize the 3D scene
function initVisualization() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('gameCanvas').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;

    scene.add(new THREE.AmbientLight(0x404040));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    createStarfield();
    createAutomaton();
    addStateLabels();

    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    animate();
}

// Create starfield background
function createStarfield() {
    const particles = new THREE.Group();
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 200; i++) {
        const star = new THREE.Mesh(geometry, material);
        star.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
        particles.add(star);
    }
    scene.add(particles);
    function animateStars() {
        particles.rotation.y += 0.0002;
        particles.rotation.x += 0.0001;
        requestAnimationFrame(animateStars);
    }
    animateStars();
}

// Create automaton and states
function createAutomaton() {
    states.forEach(state => {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: state.color, emissive: 0x000000 });
        state.mesh = new THREE.Mesh(geometry, material);
        state.mesh.position.copy(state.position);
        state.mesh.userData = { name: state.name, label: state.label, isAccepting: state.isAccepting };
        scene.add(state.mesh);
        if (state.isAccepting) {
            const outerGeometry = new THREE.SphereGeometry(1.2, 32, 32);
            const outerMaterial = new THREE.MeshBasicMaterial({ color: state.color, wireframe: true });
            const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
            outerMesh.position.copy(state.position);
            scene.add(outerMesh);
        }
    });

    transitions.forEach(trans => {
        const fromState = states.find(s => s.name === trans.from);
        const toState = states.find(s => s.name === trans.to);
        const direction = new THREE.Vector3().subVectors(toState.position, fromState.position).normalize();
        const color = trans.symbol === 'ε' ? 0x800080 : 0x0000ff;
        const arrow = new THREE.ArrowHelper(direction, fromState.position, toState.position.distanceTo(fromState.position) - 2, color);
        scene.add(arrow);
    });

    const automatonGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const automatonMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff });
    automaton = new THREE.Mesh(automatonGeometry, automatonMaterial);
    automaton.position.copy(states[0].position);
    scene.add(automaton);
}

// Add labels to states
function addStateLabels() {
    const loader = new FontLoader();
    loader.load(
        'https://unpkg.com/three@0.159.0/examples/fonts/helvetiker_regular.typeface.json',
        function(font) {
            loadedFont = font;
            states.forEach(state => {
                const textGeometry = new TextGeometry(state.name, { font, size: 0.5, height: 0.1 });
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.set(state.position.x - 0.3, state.position.y + 1.5, state.position.z);
                scene.add(textMesh);

                transitions.forEach(trans => {
                    if (loadedFont && trans.from === state.name) {
                        const toState = states.find(s => s.name === trans.to);
                        const midPoint = new THREE.Vector3().lerpVectors(state.position, toState.position, 0.5);
                        const textGeometry = new TextGeometry(trans.symbol, { font: loadedFont, size: 0.5, height: 0.1 });
                        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                        textMesh.position.set(midPoint.x, midPoint.y + 0.5, midPoint.z);
                        scene.add(textMesh);
                    }
                });

                const epsilonRing = new THREE.RingGeometry(1.2, 1.3, 32);
                const epsilonMaterial = new THREE.MeshBasicMaterial({ color: 0x800080, side: THREE.DoubleSide });
                const epsilonMesh = new THREE.Mesh(epsilonRing, epsilonMaterial);
                epsilonMesh.position.copy(state.position);
                epsilonMesh.rotation.x = Math.PI / 2;
                epsilonMesh.visible = false;
                scene.add(epsilonMesh);
                state.epsilonIndicator = epsilonMesh;
            });

            initPumpingVisualizer();
            document.getElementById('loading').style.display = 'none';
        },
        function() { document.getElementById('loading').innerText = 'Loading font...'; },
        function(error) {
            console.error('Font loading failed:', error);
            document.getElementById('loading').innerText = 'Font failed to load; using fallback.';
        }
    );
}

// Initialize pumping visualizer
function initPumpingVisualizer() {
    pumpingVisualizer = new PumpingVisualizer(scene, camera, loadedFont);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Enhanced automaton movement
function enhancedMoveAutomaton(targetPosition) {
    const startPosition = automaton.position.clone();
    const duration = 500; // ms
    const startTime = Date.now();

    function move() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        automaton.position.lerpVectors(startPosition, targetPosition, progress);

        if (progress < 1) {
            requestAnimationFrame(move);
        } else {
            window.automataGalaxy.sounds.transition();
        }
    }

    move();
}

// Show DFA/NFA visualization
function showDFANFAVisualization(question, isCorrect, isTutorial = false) {
    automaton.position.copy(states[0].position);
    const demoString = question.demoString || '01';
    document.getElementById('input-string-display').innerHTML = demoString.split('').map((char, i) => `<span id="char${i}">${char}</span>`).join('');

    if (question.visualizationType === 'NFA') {
        states.forEach(state => {
            if (state.epsilonIndicator) state.epsilonIndicator.visible = true;
        });
    }

    let currentState = 'q0';
    let step = 0;

    const interval = setInterval(() => {
        if (step < demoString.length) {
            const symbol = demoString[step];
            document.getElementById(`char${step}`).style.color = 'yellow';
            let nextTransitions = transitions.filter(t => t.from === currentState && (t.symbol === symbol || (question.visualizationType === 'NFA' && t.symbol === 'ε')));
            if (nextTransitions.length > 0) {
                const nextTransition = nextTransitions[0];
                currentState = nextTransition.to;
                const nextPosition = states.find(s => s.name === currentState).position;
                enhancedMoveAutomaton(nextPosition);
            }
            step++;
        } else {
            clearInterval(interval);
            const finalState = states.find(s => s.name === currentState);
            if (!isTutorial) {
                document.getElementById('feedback').innerText += `\nEnded at ${finalState.label}: ${finalState.isAccepting ? "Accepted!" : "Rejected!"}`;
            }
            setTimeout(() => document.getElementById('input-string-display').innerHTML = '', 2000);
        }
    }, 1000);
}

// Show pumping visualization
function showPumpingVisualization(question, isCorrect) {
    if (pumpingVisualizer) {
        pumpingVisualizer.showPumpingDemonstration(question, isCorrect);
    }
}

// Click event listener for state interaction
window.addEventListener('click', function(event) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const state = intersects[0].object.userData;
        if (state && state.name) {
            document.getElementById('feedback').innerText = `${state.name}: ${state.label} (${state.isAccepting ? 'Accepting' : 'Non-accepting'})`;
        }
    }
});

// Expose functions and variables to global scope
window.automataGalaxy = window.automataGalaxy || {};
window.automataGalaxy.initVisualization = initVisualization;
window.automataGalaxy.enhancedMoveAutomaton = enhancedMoveAutomaton;
window.automataGalaxy.showDFANFAVisualization = showDFANFAVisualization;
window.automataGalaxy.showPumpingVisualization = showPumpingVisualization;
window.automataGalaxy.states = states;
window.automataGalaxy.transitions = transitions;
window.automataGalaxy.automaton = automaton; // Note: This will be undefined until initVisualization is called
