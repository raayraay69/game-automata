// Main JavaScript for Automata Galaxy: Exam Quest
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { PumpingVisualizer } from './pumpingVisualizer.js';

// Global Variables
let currentTopic = null;
let currentQuestionIndex = 0;
let score = 0;
let totalQuestions = 0;
let currentQuestion = null;
let energyCredits = 0;
let lives = 3;
let level = 1;
let unlockedLevels = ['DFA'];
let practiceMode = false;

// Three.js variables
let scene, camera, renderer, controls;
let automaton, loadedFont;
let pumpingVisualizer;

// Quiz data
const topics = ['DFA', 'NFA', 'Regex', 'Pumping', 'PDA', 'TM', 'Ambiguity', 'Assignment1', 'Assignment2'];
const quizData = {
    DFA: [
        { question: "Where does our robot start?", options: ["q0", "q1", "q2"], answer: 0, explanation: "q0 is the start state of our DFA!", visualizationType: 'DFA', demoString: "01", tutorial: "A DFA (Deterministic Finite Automaton) has one clear path for each input. Watch q0 start and move with '0' to q1, then '1' to q2." }
    ],
    NFA: [
        { question: "What's an ε-transition?", options: ["Teleport", "Input", "Stack"], answer: 0, explanation: "An ε-transition allows movement without consuming input!", visualizationType: 'NFA', demoString: "ε", tutorial: "An NFA (Non-deterministic Finite Automaton) can guess paths. See the ε-transition from q0 to q1—it's a free jump!" }
    ],
    Regex: [
        { question: "What does a* mean?", options: ["Zero or more a's", "Exactly one a", "One or more a's"], answer: 0, explanation: "a* means zero or more occurrences of 'a'!", tutorial: "Regular expressions define patterns. 'a*' means any number of 'a's, including none. Imagine a loop accepting 'a' repeatedly." }
    ],
    Pumping: [
        { question: "What is the purpose of the Pumping Lemma?", options: ["To prove a language is regular", "To prove a language is not regular", "To convert an NFA to a DFA", "To minimize a DFA"], answer: 1, explanation: "The Pumping Lemma is a tool used to prove that a language is not regular by showing it cannot satisfy the lemma's conditions.", tutorial: "The Pumping Lemma is a key concept for identifying non-regular languages. If a language is regular, there exists a pumping length p such that any string s in the language with length |s| ≥ p can be split into three parts: x, y, z, where |xy| ≤ p, |y| > 0, and for all i ≥ 0, xy^i z remains in the language. If this condition fails, the language is not regular." },
        { question: "Prove that {a^n b^n | n ≥ 0} is not regular using the Pumping Lemma.", options: ["Assume L is regular, choose s = a^p b^p, show that pumping y leads to strings not in L.", "Assume L is regular, choose s = a^p, show that pumping y adds more a's.", "Assume L is regular, choose s = b^p a^p, show that pumping y preserves the order.", "Assume L is regular, choose s = a^p b^{p+1}, show that pumping y balances the string."], answer: 0, explanation: "Assume the language is regular with pumping length p. Choose s = a^p b^p. Since |xy| ≤ p, y consists of a's only. Pumping y (e.g., xy^2 z) increases the number of a's, resulting in more a's than b's, which is not in {a^n b^n | n ≥ 0}. This contradiction shows the language is not regular.", visualizationType: "Pumping", pumpingData: { s: "aaaabbbb", xLen: 2, yLen: 2, zLen: 4, language: "equal_a_b" } },
        { question: "Which language is not regular?", options: ["{a^n | n ≥ 0}", "{a^n b^n | n ≥ 0}", "{a^n b^m | n, m ≥ 0}", "{a^* b^*}"], answer: 1, explanation: "{a^n b^n | n ≥ 0} is not regular because it requires matching counts of a's and b's, which a DFA cannot do due to its finite memory.", tutorial: "Non-regular languages often involve counting or matching that exceeds a DFA's finite states. {a^n b^n | n ≥ 0} is a classic example, as it needs to ensure the number of a's equals the number of b's." },
        { question: "For the language {a^n b^m | n > m}, why does pumping fail?", options: ["Pumping y increases a's, keeping n > m.", "Pumping y may make m ≥ n.", "Pumping y adds b's instead of a's.", "Pumping y keeps the string unchanged."], answer: 1, explanation: "Choose s = a^{p+1} b^p. If y is in the a's, pumping y (e.g., i = 0) reduces the number of a's, potentially making n ≤ m, violating n > m. This shows {a^n b^m | n > m} is not regular.", visualizationType: "Pumping", pumpingData: { s: "aaaaabbbb", xLen: 3, yLen: 2, zLen: 4, language: "n_greater_m" } }
    ],
    PDA: [
        { question: "What's a PDA?", options: ["DFA + stack", "Infinite tape", "ε-moves only"], answer: 0, explanation: "A PDA is a DFA with a stack for memory!", tutorial: "A PDA (Pushdown Automaton) uses a stack. Imagine stacking symbols to match 'a's and 'b's." }
    ],
    TM: [
        { question: "What's a TM?", options: ["Infinite tape", "Stack", "Multiple heads"], answer: 0, explanation: "A Turing Machine uses an infinite tape!", tutorial: "A Turing Machine has an infinite tape to read and write. It's the ultimate computational model!" }
    ],
    Ambiguity: [
        { question: "Is S -> aSbS | bSaS | λ ambiguous for 'aabb'?", options: ["Yes", "No", "Maybe"], answer: 0, explanation: "Yes—'aabb' has multiple parse trees!", visualizationType: 'Ambiguity', tree1: { label: 'S', children: [{ label: 'a' }, { label: 'S', children: [{ label: 'a' }, { label: 'b' }, { label: 'S' }] }, { label: 'b' }, { label: 'S' }] }, tree2: { label: 'S', children: [{ label: 'a' }, { label: 'S' }, { label: 'b' }, { label: 'S', children: [{ label: 'b' }, { label: 'a' }, { label: 'S' }] }] }, learnMore: "<h3>Ambiguity Explained</h3><p>A grammar is <strong>ambiguous</strong> if a string (like 'aabb') has multiple <strong>parse trees</strong>.</p><p><strong>Tree 1:</strong> S → aSbS → aaSbS → aabb</p><p><strong>Tree 2:</strong> S → aSbS → aSbbS → aabb</p><p>Click 'Explain with Animation' to see these trees!</p>", hints: ["Can 'aabb' be derived in two ways?", "Check grammar rules."], tutorial: "Ambiguity means multiple ways to build a string. For 'aabb', see how S can split differently." }
    ],
    Assignment1: [
        { question: "Find all strings in {a, b} of length ≤ 3.", options: ["λ, a, b, aa, ab, ba, bb, aaa, aab, aba, abb, baa, bab, bba, bbb", "a, b, aa, ab, ba, bb", "λ, a, b", "aa, ab, ba, bb"], answer: 0, explanation: "All strings of length 0 to 3 are: λ, a, b, aa, ab, ba, bb, aaa, aab, aba, abb, baa, bab, bba, bbb.", demoString: "λ, a, b, aa, ab, ba, bb, aaa, aab, aba, abb, baa, bab, bba, bbb", tutorial: "List all combinations of 'a' and 'b' up to length 3. Start with λ (empty), then single letters, and so on." },
        { question: "How many states in a DFA for L = L(wa) ∪ L((ab)*ba)?", options: ["3 states", "4 states", "5 states"], answer: 0, explanation: "Needs 3 states: one for 'wa', one for '(ab)*', and one for accepting 'ba'.", visualizationType: 'DFA', demoString: "ba", tutorial: "This DFA combines two languages. Watch how 'ba' travels from q0 to q2." }
    ],
    Assignment2: [
        { question: "Convert S -> aS | bS | λ to Chomsky Normal Form.", options: ["S -> AS | BS | λ, A -> a, B -> b", "S -> AS | BS, A -> a, B -> b", "S -> a | b | λ"], answer: 1, explanation: "CNF removes λ, splits into S -> AS | BS, A -> a, B -> b.", tutorial: "CNF simplifies grammars. Remove λ and split productions into pairs or terminals." },
        { question: "Is S -> aSbS | bSaS | λ ambiguous for 'aabb'?", options: ["Yes", "No", "Maybe"], answer: 0, explanation: "'aabb' has multiple parse trees (e.g., a(Sb)S, aS(bbS)).", visualizationType: 'Ambiguity', tree1: { label: 'S', children: [{ label: 'a' }, { label: 'S', children: [{ label: 'a' }, { label: 'b' }, { label: 'S' }] }, { label: 'b' }, { label: 'S' }] }, tree2: { label: 'S', children: [{ label: 'a' }, { label: 'S' }, { label: 'b' }, { label: 'S', children: [{ label: 'b' }, { label: 'a' }, { label: 'S' }] }] }, tutorial: "Check ambiguity by building 'aabb' in two ways. See the parse trees animate!" }
    ]
};

// Audio context and sounds
let audioContext;
let sounds = {
    correct: null,
    incorrect: null,
    transition: null,
    levelUp: null
};

// States and transitions for automata
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
function initScene() {
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

    loadSounds();
    animate();
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
                
                // Add transition labels
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
            
            // Initialize the PumpingVisualizer after font is loaded
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

// Load sound effects
function loadSounds() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    function createTone(frequency, duration, type = 'sine') {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        return {
            play: function() {
                oscillator.start();
                gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
                oscillator.stop(audioContext.currentTime + duration);
            }
        };
    }
    
    sounds.correct = () => createTone(880, 0.3).play();
    sounds.incorrect = () => createTone(220, 0.3, 'sawtooth').play();
    sounds.transition = () => createTone(440, 0.1).play();
    sounds.levelUp = () => {
        createTone(523.25, 0.1).play();
        setTimeout(() => createTone(659.25, 0.1).play(), 100);
        setTimeout(() => createTone(783.99, 0.3).play(), 200);
    };
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Topic selection
function selectTopic(topic) {
    if (!unlockedLevels.includes(topic)) {
        document.getElementById('feedback').innerText = 'Complete previous levels to unlock this topic!';
        return;
    }
    currentTopic = topic;
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('topic-menu').style.display = 'none';
    document.getElementById('tutorial-container').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('tutorial-title').innerText = `${currentTopic} System`;
    document.getElementById('tutorial-text').innerText = quizData[currentTopic][0].tutorial;
    
    if (currentTopic === "Pumping") {
        document.getElementById("tutorial-text").innerHTML += `
            <p><strong>Conditions:</strong></p>
            <ul>
                <li>|xy| ≤ p (y is within the first p characters)</li>
                <li>|y| > 0 (y cannot be empty)</li>
                <li>xy^i z ∈ L for all i ≥ 0 (pumping y keeps the string in the language)</li>
            </ul>
        `;
    }
    
    if (quizData[currentTopic][0].visualizationType === 'DFA' || quizData[currentTopic][0].visualizationType === 'NFA') {
        showVisualDemonstration(quizData[currentTopic][0], true, true);
    }
}

// Update HUD
function updateHUD() {
    document.getElementById('energy-credits').innerText = `Energy Credits: ${energyCredits}`;
    document.getElementById('lives').innerText = `Lives: ${lives}`;
    document.getElementById('level').innerText = `Level: ${level}`;
}

// Start practice mode
function startPracticeMode() {
    practiceMode = true;
    currentTopic = 'Practice';
    currentQuestionIndex = 0;
    score = 0;
    totalQuestions = 10;
    document.getElementById('topic-menu').style.display = 'none';
    showPracticeQuestion();
}

// Start quiz
function startQuiz() {
    document.getElementById('tutorial-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    showQuizQuestion();
}

// Start simulation
function startSimulation() {
    document.getElementById('tutorial-container').innerHTML = `
        <h2 id="tutorial-title">${currentTopic} System</h2>
        <p id="tutorial-text">${quizData[currentTopic][0].tutorial}</p>
        <button id="start-quiz-btn" class="action-btn" onclick="startQuiz()">Start Quiz</button>
        <button id="sim-btn" class="action-btn" onclick="startSimulation()">Try Simulation</button>
        <input id="sim-input" placeholder="Enter a string to simulate">
        <button class="action-btn" onclick="runSimulation()">Run</button>
    `;
}

// Run simulation
function runSimulation() {
    const input = document.getElementById('sim-input').value;
    let currentState = 'q0';
    let step = 0;
    automaton.position.copy(states[0].position);
    document.getElementById('input-string-display').innerHTML = input.split('').map((char, i) => `<span id="char${i}">${char}</span>`).join('');
    const interval = setInterval(() => {
        if (step < input.length) {
            const symbol = input[step];
            document.getElementById(`char${step}`).style.color = 'yellow';
            let nextTransitions = transitions.filter(t => t.from === currentState && (t.symbol === symbol || (currentTopic === 'NFA' && t.symbol === 'ε')));
            if (nextTransitions.length > 0) {
                const nextTransition = nextTransitions[0];
                currentState = nextTransition.to;
                const nextPosition = states.find(s => s.name === currentState).position;
                enhancedMoveAutomaton(nextPosition);
                if (nextTransition.symbol === 'ε') {
                    document.getElementById('feedback').innerText += "\nε-transition used!";
                }
            }
            step++;
        } else {
            clearInterval(interval);
            const finalState = states.find(s => s.name === currentState);
            document.getElementById('feedback').innerText = `Simulation ends at ${finalState.label}: ${finalState.isAccepting ? "Accepted!" : "Rejected!"}`;
            setTimeout(() => document.getElementById('input-string-display').innerHTML = '', 2000);
        }
    }, 1000);
}

// Enhanced automaton movement
function enhancedMoveAutomaton(targetPosition) {
    const startPosition = automaton.position.clone();
    const duration = 500; // ms
    const startTime = Date.now();
    
    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        automaton.position.lerpVectors(startPosition, targetPosition, progress);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            sounds.transition();
        }
    }
    
    animate();
}

// Show practice question
function showPracticeQuestion() {
    if (currentQuestionIndex >= totalQuestions) {
        document.getElementById('feedback').innerText = `Practice Complete! Score: ${score}/${totalQuestions}`;
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('topic-menu').style.display = 'block';
        practiceMode = false;
        return;
    }
    
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const question = quizData[topic][Math.floor(Math.random() * quizData[topic].length)];
    currentQuestion = { ...question, originalTopic: topic };
    
    document.getElementById('quiz-question').innerText = currentQuestion.question;
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    currentQuestion.options.forEach((opt, index) => {
        const option = document.createElement('div');
        option.className = 'option';
        option.innerHTML = opt;
        option.onclick = () => checkAnswer(index, currentQuestion);
        optionsDiv.appendChild(option);
    });
    
    document.getElementById('learn-more-btn').onclick = () => showLearnMore(currentQuestion);
    document.getElementById('hint-btn').onclick = () => showHint(currentQuestion);
    document.getElementById('quiz-container').style.display = 'block';
}

// Show quiz question
function showQuizQuestion() {
    if (currentQuestionIndex >= quizData[currentTopic].length) {
        document.getElementById('feedback').innerText = `System Repaired! Score: ${score}/${quizData[currentTopic].length}`;
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('topic-menu').style.display = 'block';
        
        if (score >= quizData[currentTopic].length * 0.7) {
            energyCredits += 100;
            level++;
            sounds.levelUp();
            const nextLevelIndex = topics.indexOf(currentTopic) + 1;
            if (nextLevelIndex < topics.length) {
                const nextLevel = topics[nextLevelIndex];
                if (!unlockedLevels.includes(nextLevel)) {
                    unlockedLevels.push(nextLevel);
                    document.getElementById(`${nextLevel.toLowerCase()}-btn`).disabled = false;
                    document.getElementById('feedback').innerText = `${nextLevel} system unlocked!`;
                }
            }
            updateHUD();
        }
        return;
    }

    currentQuestion = quizData[currentTopic][currentQuestionIndex];
    document.getElementById('quiz-question').innerText = currentQuestion.question;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    currentQuestion.options.forEach((opt, index) => {
        const option = document.createElement('div');
        option.className = 'option';
        option.innerHTML = opt;
        option.onclick = () => checkAnswer(index, currentQuestion);
        optionsDiv.appendChild(option);
    });
    
    document.getElementById('learn-more-btn').onclick = () => showLearnMore(currentQuestion);
    document.getElementById('hint-btn').onclick = () => showHint(currentQuestion);
}

// Check answer
function checkAnswer(selectedIndex, question) {
    const isCorrect = selectedIndex === question.answer;
    if (isCorrect) {
        score++;
        energyCredits += 10;
        document.getElementById('feedback').innerText = 'Correct! ' + question.explanation;
        sounds.correct();
    } else {
        lives--;
        document.getElementById('feedback').innerText = 'Incorrect. ' + question.explanation;
        sounds.incorrect();
    }
    
    updateHUD();
    currentQuestionIndex++;
    
    if (question.visualizationType) {
        showVisualDemonstration(question, isCorrect);
    }
    
    setTimeout(() => {
        if (practiceMode) {
            showPracticeQuestion();
        } else {
            showQuizQuestion();
        }
    }, 3000);
}

// Show visual demonstration
function showVisualDemonstration(question, isCorrect, isTutorial = false) {
    if (question.visualizationType === 'DFA' || question.visualizationType === 'NFA') {
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
    } else if (question.visualizationType === 'Pumping' && pumpingVisualizer) {
        pumpingVisualizer.showPumpingDemonstration(question, isCorrect);
    } else if (question.visualizationType === 'Ambiguity') {
        showAmbiguityDemo(question, isCorrect);
    }
}

// Show ambiguity demonstration
function showAmbiguityDemo(question, isCorrect) {
    const explanationPanel = document.getElementById("explanation-panel");
    explanationPanel.style.display = "block";
    explanationPanel.innerHTML = `
        <div class="explanation-header">
            <h3>Parse Tree Visualization</h3>
            <span class="close-btn" onclick="hideExplanation()">×</span>
        </div>
        <div id="animation-container"></div>
        <div id="explanation-text">
            <p>Grammar: S -> aSbS | bSaS | λ</p>
            <p>String: 'aabb'</p>
            <p>This grammar is ambiguous because the same string can be derived in multiple ways.</p>
        </div>
    `;
}

// Show explanation
function showExplanation() {
    if (currentQuestion && currentQuestion.visualizationType) {
        showVisualDemonstration(currentQuestion, true, false);
    }
}

// Hide explanation
function hideExplanation() {
    document.getElementById('explanation-panel').style.display = 'none';
}

// Show learn more
function showLearnMore(question) {
    if (question.learnMore) {
        const explanationPanel = document.getElementById("explanation-panel");
        explanationPanel.style.display = "block";
        explanationPanel.innerHTML = `
            <div class="explanation-header">
                <h3>Learn More</h3>
                <span class="close-btn" onclick="hideExplanation()">×</span>
            </div>
            <div id="explanation-text">${question.learnMore}</div>
        `;
    } else {
        document.getElementById('feedback').innerText = question.explanation;
    }
}

// Show hint
function showHint(question) {
    if (question.hints && question.hints.length > 0) {
        const hint = question.hints[Math.floor(Math.random() * question.hints.length)];
        document.getElementById('feedback').innerText = `Hint: ${hint}`;
    } else {
        document.getElementById('feedback').innerText = "No hints available for this question.";
    }
}

// Close modal
function closeModal() {
    document.getElementById('explanation-panel').style.display = 'none';
}

// Initialize the application
function init() {
    initScene();
    updateHUD();
    
    // Expose functions to global scope for HTML buttons
    window.selectTopic = selectTopic;
    window.startPracticeMode = startPracticeMode;
    window.startQuiz = startQuiz;
    window.startSimulation = startSimulation;
    window.runSimulation = runSimulation;
    window.showExplanation = showExplanation;
    window.hideExplanation = hideExplanation;
    window.closeModal = closeModal;
}

// Add click event listener for state interaction
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

// Initialize the application when the page loads
init();// Create starfield background
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
function initScene() {
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

    loadSounds();
    animate();
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
                
                // Add transition labels
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
            
            // Initialize the PumpingVisualizer after font is loaded
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

// Load sound effects
function loadSounds() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    function createTone(frequency, duration, type = 'sine') {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        return {
            play: function() {
                oscillator.start();
                gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
                oscillator.stop(audioContext.currentTime + duration);
            }
        };
    }
    
    sounds.correct = () => createTone(880, 0.3).play();
    sounds.incorrect = () => createTone(220, 0.3, 'sawtooth').play();
    sounds.transition = () => createTone(440, 0.1).play();
    sounds.levelUp = () => {
        createTone(523.25, 0.1).play();
        setTimeout(() => createTone(659.25, 0.1).play(), 100);
        setTimeout(() => createTone(783.99, 0.3).play(), 200);
    };
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Topic selection
function selectTopic(topic) {
    if (!unlockedLevels.includes(topic)) {
        document.getElementById('feedback').innerText = 'Complete previous levels to unlock this topic!';
        return;
    }
    currentTopic = topic;
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('topic-menu').style.display = 'none';
    document.getElementById('tutorial-container').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('tutorial-title').innerText = `${currentTopic} System`;
    document.getElementById('tutorial-text').innerText = quizData[currentTopic][0].tutorial;
    
    if (currentTopic === "Pumping") {
        document.getElementById("tutorial-text").innerHTML += `
            <p><strong>Conditions:</strong></p>
            <ul>
                <li>|xy| ≤ p (y is within the first p characters)</li>
                <li>|y| > 0 (y cannot be empty)</li>
                <li>xy^i z ∈ L for all i ≥ 0 (pumping y keeps the string in the language)</li>
            </ul>
        `;
    }
    
    if (quizData[currentTopic][0].visualizationType === 'DFA' || quizData[currentTopic][0].visualizationType === 'NFA') {
        showVisualDemonstration(quizData[currentTopic][0], true, true);
    }
}

// Update HUD
function updateHUD() {
    document.getElementById('energy-credits').innerText = `Energy Credits: ${energyCredits}`;
    document.getElementById('lives').innerText = `Lives: ${lives}`;
    document.getElementById('level').innerText = `Level: ${level}`;
}

// Start practice mode
function startPracticeMode() {
    practiceMode = true;
    currentTopic = 'Practice';
    currentQuestionIndex = 0;
    score = 0;
    totalQuestions = 10;
    document.getElementById('topic-menu').style.display = 'none';
    showPracticeQuestion();
}

// Start quiz
function startQuiz() {
    document.getElementById('tutorial-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    showQuizQuestion();
}

// Start simulation
function startSimulation() {
    document.getElementById('tutorial-container').innerHTML = `
        <h2 id="tutorial-title">${currentTopic} System</h2>
        <p id="tutorial-text">${quizData[currentTopic][0].tutorial}</p>
        <button id="start-quiz-btn" class="action-btn" onclick="startQuiz()">Start Quiz</button>
        <button id="sim-btn" class="action-btn" onclick="startSimulation()">Try Simulation</button>
        <input id="sim-input" placeholder="Enter a string to simulate">
        <button class="action-btn" onclick="runSimulation()">Run</button>
    `;
}

// Run simulation
function runSimulation() {
    const input = document.getElementById('sim-input').value;
    let currentState = 'q0';
    let step = 0;
    automaton.position.copy(states[0].position);
    document.getElementById('input-string-display').innerHTML = input.split('').map((char, i) => `<span id="char${i}">${char}</span>`).join('');
    const interval = setInterval(() => {
        if (step < input.length) {
            const symbol = input[step];
            document.getElementById(`char${step}`).style.color = 'yellow';
            let nextTransitions = transitions.filter(t => t.from === currentState && (t.symbol === symbol || (currentTopic === 'NFA' && t.symbol === 'ε')));
            if (nextTransitions.length > 0) {
                const nextTransition = nextTransitions[0];
                currentState = nextTransition.to;
                const nextPosition = states.find(s => s.name === currentState).position;
                enhancedMoveAutomaton(nextPosition);
                if (nextTransition.symbol === 'ε') {
                    document.getElementById('feedback').innerText += "\nε-transition used!";
                }
            }
            step++;
        } else {
            clearInterval(interval);
            const finalState = states.find(s => s.name === currentState);
            document.getElementById('feedback').innerText = `Simulation ends at ${finalState.label}: ${finalState.isAccepting ? "Accepted!" : "Rejected!"}`;
            setTimeout(() => document.getElementById('input-string-display').innerHTML = '', 2000);
        }
    }, 1000);
}

// Enhanced automaton movement
function enhancedMoveAutomaton(targetPosition) {
    const startPosition = automaton.position.clone();
    const duration = 500; // ms
    const startTime = Date.now();
    
    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        automaton.position.lerpVectors(startPosition, targetPosition, progress);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            sounds.transition();
        }
    }
    
    animate();
}

// Show practice question
function showPracticeQuestion() {
    if (currentQuestionIndex >= totalQuestions) {
        document.getElementById('feedback').innerText = `Practice Complete! Score: ${score}/${totalQuestions}`;
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('topic-menu').style.display = 'block';
        practiceMode = false;
        return;
    }
    
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const question = quizData[topic][Math.floor(Math.random() * quizData[topic].length)];
    currentQuestion = { ...question, originalTopic: topic };
    
    document.getElementById('quiz-question').innerText = currentQuestion.question;
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    currentQuestion.options.forEach((opt, index) => {
        const option = document.createElement('div');
        option.className = 'option';
        option.innerHTML = opt;
        option.onclick = () => checkAnswer(index, currentQuestion);
        optionsDiv.appendChild(option);
    });
    
    document.getElementById('learn-more-btn').onclick = () => showLearnMore(currentQuestion);
    document.getElementById('hint-btn').onclick = () => showHint(currentQuestion);
    document.getElementById('quiz-container').style.display = 'block';
}

// Show quiz question
function showQuizQuestion() {
    if (currentQuestionIndex >= quizData[currentTopic].length) {
        document.getElementById('feedback').innerText = `System Repaired! Score: ${score}/${quizData[currentTopic].length}`;
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('topic-menu').style.display = 'block';
        
        if (score >= quizData[currentTopic].length * 0.7) {
            energyCredits += 100;
            level++;
            sounds.levelUp();
            const nextLevelIndex = topics.indexOf(currentTopic) + 1;
            if (nextLevelIndex < topics.length) {
                const nextLevel = topics[nextLevelIndex];
                if (!unlockedLevels.includes(nextLevel)) {
                    unlockedLevels.push(nextLevel);
                    document.getElementById(`${nextLevel.toLowerCase()}-btn`).disabled = false;
                    document.getElementById('feedback').innerText = `${nextLevel} system unlocked!`;
                }
            }
            updateHUD();
        }
        return;
    }

    currentQuestion = quizData[currentTopic][currentQuestionIndex];
    document.getElementById('quiz-question').innerText = currentQuestion.question;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    currentQuestion.options.forEach((opt, index) => {
        const option = document.createElement('div');
        option.className = 'option';
        option.innerHTML = opt;
        option.onclick = () => checkAnswer(index, currentQuestion);
        optionsDiv.appendChild(option);
    });
    
    document.getElementById('learn-more-btn').onclick = () => showLearnMore(currentQuestion);
    document.getElementById('hint-btn').onclick = () => showHint(currentQuestion);
}

// Check answer
function checkAnswer(selectedIndex, question) {
    const isCorrect = selectedIndex === question.answer;
    if (isCorrect) {
        score++;
        energyCredits += 10;
        document.getElementById('feedback').innerText = 'Correct! ' + question.explanation;
        sounds.correct();
    } else {
        lives--;
        document.getElementById('feedback').innerText = 'Incorrect. ' + question.explanation;
        sounds.incorrect();
    }
    
    updateHUD();
    currentQuestionIndex++;
    
    if (question.visualizationType) {
        showVisualDemonstration(question, isCorrect);
    }
    
    setTimeout(() => {
        if (practiceMode) {
            showPracticeQuestion();
        } else {
            showQuizQuestion();
        }
    }, 3000);
}

// Show visual demonstration
function showVisualDemonstration(question, isCorrect, isTutorial = false) {
    if (question.visualizationType === 'DFA' || question.visualizationType === 'NFA') {
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
    } else if (question.visualizationType === 'Pumping' && pumpingVisualizer) {
        pumpingVisualizer.showPumpingDemonstration(question, isCorrect);
    } else if (question.visualizationType === 'Ambiguity') {
        showAmbiguityDemo(question, isCorrect);
    }
}

// Show ambiguity demonstration
function showAmbiguityDemo(question, isCorrect) {
    const explanationPanel = document.getElementById("explanation-panel");
    explanationPanel.style.display = "block";
    explanationPanel.innerHTML = `
        <div class="explanation-header">
            <h3>Parse Tree Visualization</h3>
            <span class="close-btn" onclick="hideExplanation()">×</span>
        </div>
        <div id="animation-container"></div>
        <div id="explanation-text">
            <p>Grammar: S -> aSbS | bSaS | λ</p>
            <p>String: 'aabb'</p>
            <p>This grammar is ambiguous because the same string can be derived in multiple ways.</p>
        </div>
    `;
}

// Show explanation
function showExplanation() {
    if (currentQuestion && currentQuestion.visualizationType) {
        showVisualDemonstration(currentQuestion, true, false);
    }
}

// Hide explanation
function hideExplanation() {
    document.getElementById('explanation-panel').style.display = 'none';
}

// Show learn more
function showLearnMore(question) {
    if (question.learnMore) {
        const explanationPanel = document.getElementById("explanation-panel");
        explanationPanel.style.display = "block";
        explanationPanel.innerHTML = `
            <div class="explanation-header">
                <h3>Learn More</h3>
                <span class="close-btn" onclick="hideExplanation()">×</span>
            </div>
            <div id="explanation-text">${question.learnMore}</div>
        `;
    } else {
        document.getElementById('feedback').innerText = question.explanation;
    }
}

// Show hint
function showHint(question) {
    if (question.hints && question.hints.length > 0) {
        const hint = question.hints[Math.floor(Math.random() * question.hints.length)];
        document.getElementById('feedback').innerText = `Hint: ${hint}`;
    } else {
        document.getElementById('feedback').innerText = "No hints available for this question.";
    }
}

// Close modal
function closeModal() {
    document.getElementById('explanation-panel').style.display = 'none';
}

// Initialize the application
function init() {
    initScene();
    updateHUD();
    
    // Expose functions to global scope for HTML buttons
    window.selectTopic = selectTopic;
    window.startPracticeMode = startPracticeMode;
    window.startQuiz = startQuiz;
    window.startSimulation = startSimulation;
    window.runSimulation = runSimulation;
    window.showExplanation = showExplanation;
    window.hideExplanation = hideExplanation;
    window.closeModal = closeModal;
}

// Add click event listener for state interaction
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

// Initialize the application when the page loads
init();add(directionalLight);

    createStarfield();
    createAutomaton();
    addStateLabels();

    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    loadSounds();
    animate();
function initScene() {
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

    loadSounds();
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
                
                // Add transition labels
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
            
            // Initialize the PumpingVisualizer after font is loaded
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

// Load sound effects
function loadSounds() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    function createTone(frequency, duration, type = 'sine') {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        return {
            play: function() {
                oscillator.start();
                gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
                oscillator.stop(audioContext.currentTime + duration);
            }
        };
    }
    
    sounds.correct = () => createTone(880, 0.3).play();
    sounds.incorrect = () => createTone(220, 0.3, 'sawtooth').play();
    sounds.transition = () => createTone(440, 0.1).play();
    sounds.levelUp = () => {
        createTone(523.25, 0.1).play();
        setTimeout(() => createTone(659.25, 0.1).play(), 100);
        setTimeout(() => createTone(783.99, 0.3).play(), 200);
    };
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Topic selection
function selectTopic(topic) {
    if (!unlockedLevels.includes(topic)) {
        document.getElementById('feedback').innerText = 'Complete previous levels to unlock this topic!';
        return;
    }
    currentTopic = topic;
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('topic-menu').style.display = 'none';
    document.getElementById('tutorial-container').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('tutorial-title').innerText = `${currentTopic} System`;
    document.getElementById('tutorial-text').innerText = quizData[currentTopic][0].tutorial;
    
    if (currentTopic === "Pumping") {
        document.getElementById("tutorial-text").innerHTML += `
            <p><strong>Conditions:</strong></p>
            <ul>
                <li>|xy| ≤ p (y is within the first p characters)</li>
                <li>|y| > 0 (y cannot be empty)</li>
                <li>xy^i z ∈ L for all i ≥ 0 (pumping y keeps the string in the language)</li>
            </ul>
        `;
    }
    
    if (quizData[currentTopic][0].visualizationType === 'DFA' || quizData[currentTopic][0].visualizationType === 'NFA') {
        showVisualDemonstration(quizData[currentTopic][0], true, true);
    }
}

// Update HUD
function updateHUD() {
    document.getElementById('energy-credits').innerText = `Energy Credits: ${energyCredits}`;
    document.getElementById('lives').innerText = `Lives: ${lives}`;
    document.getElementById('level').innerText = `Level: ${level}`;
}

// Start practice mode
function startPracticeMode() {
    practiceMode = true;
    currentTopic = 'Practice';
    currentQuestionIndex = 0;
    score = 0;
    totalQuestions = 10;
    document.getElementById('topic-menu').style.display = 'none';
    showPracticeQuestion();
}

// Start quiz
function startQuiz() {
    document.getElementById('tutorial-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    showQuizQuestion();
}

// Start simulation
function startSimulation() {
    document.getElementById('tutorial-container').innerHTML = `
        <h2 id="tutorial-title">${currentTopic} System</h2>
        <p id="tutorial-text">${quizData[currentTopic][0].tutorial}</p>
        <button id="start-quiz-btn" class="action-btn" onclick="startQuiz()">Start Quiz</button>
        <button id="sim-btn" class="action-btn" onclick="startSimulation()">Try Simulation</button>
        <input id="sim-input" placeholder="Enter a string to simulate">
        <button class="action-btn" onclick="runSimulation()">Run</button>
    `;
}

// Run simulation
function runSimulation() {
    const input = document.getElementById('sim-input').value;
    let currentState = 'q0';
    let step = 0;
    automaton.position.copy(states[0].position);
    document.getElementById('input-string-display').innerHTML = input.split('').map((char, i) => `<span id="char${i}">${char}</span>`).join('');
    const interval = setInterval(() => {
        if (step < input.length) {
            const symbol = input[step];
            document.getElementById(`char${step}`).style.color = 'yellow';
            let nextTransitions = transitions.filter(t => t.from === currentState && (t.symbol === symbol || (currentTopic === 'NFA' && t.symbol === 'ε')));
            if (nextTransitions.length > 0) {
                const nextTransition = nextTransitions[0];
                currentState = nextTransition.to;
                const nextPosition = states.find(s => s.name === currentState).position;
                enhancedMoveAutomaton(nextPosition);
                if (nextTransition.symbol === 'ε') {
                    document.getElementById('feedback').innerText += "\nε-transition used!";
                }
            }
            step++;
        } else {
            clearInterval(interval);
            const finalState = states.find(s => s.name === currentState);
            document.getElementById('feedback').innerText = `Simulation ends at ${finalState.label}: ${finalState.isAccepting ? "Accepted!" : "Rejected!"}`;
            setTimeout(() => document.getElementById('input-string-display').innerHTML = '', 2000);
        }
    }, 1000);
}

// Enhanced automaton movement
function enhancedMoveAutomaton(targetPosition) {
    const startPosition = automaton.position.clone();
    const duration = 500; // ms
    const startTime = Date.now();
    
    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        automaton.position.lerpVectors(startPosition, targetPosition, progress);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            sounds.transition();
        }
    }
    
    animate();
}

// Show practice question
function showPracticeQuestion() {
    if (currentQuestionIndex >= totalQuestions) {
        document.getElementById('feedback').innerText = `Practice Complete! Score: ${score}/${totalQuestions}`;
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('topic-menu').style.display = 'block';
        practiceMode = false;
        return;
    }
    
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const question = quizData[topic][Math.floor(Math.random() * quizData[topic].length)];
    currentQuestion = { ...question, originalTopic: topic };
    
    document.getElementById('quiz-question').innerText = currentQuestion.question;
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    currentQuestion.options.forEach((opt, index) => {
        const option = document.createElement('div');
        option.className = 'option';
        option.innerHTML = opt;
        option.onclick = () => checkAnswer(index, currentQuestion);
        optionsDiv.appendChild(option);
    });
    
    document.getElementById('learn-more-btn').onclick = () => showLearnMore(currentQuestion);
    document.getElementById('hint-btn').onclick = () => showHint(currentQuestion);
    document.getElementById('quiz-container').style.display = 'block';
}

// Show quiz question
function showQuizQuestion() {
    if (currentQuestionIndex >= quizData[currentTopic].length) {
        document.getElementById('feedback').innerText = `System Repaired! Score: ${score}/${quizData[currentTopic].length}`;
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('topic-menu').style.display = 'block';
        
        if (score >= quizData[currentTopic].length * 0.7) {
            energyCredits += 100;
            level++;
            sounds.levelUp();
            const nextLevelIndex = topics.indexOf(currentTopic) + 1;
            if (nextLevelIndex < topics.length) {
                const nextLevel = topics[nextLevelIndex];
                if (!unlockedLevels.includes(nextLevel)) {
                    unlockedLevels.push(nextLevel);
                    document.getElementById(`${nextLevel.toLowerCase()}-btn`).disabled = false;
                    document.getElementById('feedback').innerText = `${nextLevel} system unlocked!`;
                }
            }
            updateHUD();
        }
        return;
    }

    currentQuestion = quizData[currentTopic][currentQuestionIndex];
    document.getElementById('quiz-question').innerText = currentQuestion.question;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    currentQuestion.options.forEach((opt, index) => {
        const option = document.createElement('div');
        option.className = 'option';
        option.innerHTML = opt;
        option.onclick = () => checkAnswer(index, currentQuestion);
        optionsDiv.appendChild(option);
    });
    
    document.getElementById('learn-more-btn').onclick = () => showLearnMore(currentQuestion);
    document.getElementById('hint-btn').onclick = () => showHint(currentQuestion);
}

// Check answer
function checkAnswer(selectedIndex, question) {
    const isCorrect = selectedIndex === question.answer;
    if (isCorrect) {
        score++;
        energyCredits += 10;
        document.getElementById('feedback').innerText = 'Correct! ' + question.explanation;
        sounds.correct();
    } else {
        lives--;
        document.getElementById('feedback').innerText = 'Incorrect. ' + question.explanation;
        sounds.incorrect();
    }
    
    updateHUD();
    currentQuestionIndex++;
    
    if (question.visualizationType) {
        showVisualDemonstration(question, isCorrect);
    }
    
    setTimeout(() => {
        if (practiceMode) {
            showPracticeQuestion();
        } else {
            showQuizQuestion();
        }
    }, 3000);
}

// Show visual demonstration
function showVisualDemonstration(question, isCorrect, isTutorial = false) {
    if (question.visualizationType === 'DFA' || question.visualizationType === 'NFA') {
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
    } else if (question.visualizationType === 'Pumping' && pumpingVisualizer) {
        pumpingVisualizer.showPumpingDemonstration(question, isCorrect);
    } else if (question.visualizationType === 'Ambiguity') {
        showAmbiguityDemo(question, isCorrect);
    }
}

// Show ambiguity demonstration
function showAmbiguityDemo(question, isCorrect) {
    const explanationPanel = document.getElementById("explanation-panel");
    explanationPanel.style.display = "block";
    explanationPanel.innerHTML = `
        <div class="explanation-header">
            <h3>Parse Tree Visualization</h3>
            <span class="close-btn" onclick="hideExplanation()">×</span>
        </div>
        <div id="animation-container"></div>
        <div id="explanation-text">
            <p>Grammar: S -> aSbS | bSaS | λ</p>
            <p>String: 'aabb'</p>
            <p>This grammar is ambiguous because the same string can be derived in multiple ways.</p>
        </div>
    `;
}

// Show explanation
function showExplanation() {
    if (currentQuestion && currentQuestion.visualizationType) {
        showVisualDemonstration(currentQuestion, true, false);
    }
}

// Hide explanation
function hideExplanation() {
    document.getElementById('explanation-panel').style.display = 'none';
}

// Show learn more
function showLearnMore(question) {
    if (question.learnMore) {
        const explanationPanel = document.getElementById("explanation-panel");
        explanationPanel.style.display = "block";
        explanationPanel.innerHTML = `
            <div class="explanation-header">
                <h3>Learn More</h3>
                <span class="close-btn" onclick="hideExplanation()">×</span>
            </div>
            <div id="explanation-text">${question.learnMore}</div>
        `;
    } else {
        document.getElementById('feedback').innerText = question.explanation;
    }
}

// Show hint
function showHint(question) {
    if (question.hints && question.hints.length > 0) {
        const hint = question.hints[Math.floor(Math.random() * question.hints.length)];
        document.getElementById('feedback').innerText = `Hint: ${hint}`;
    } else {
        document.getElementById('feedback').innerText = "No hints available for this question.";
    }
}

// Close modal
function closeModal() {
    document.getElementById('explanation-panel').style.display = 'none';
}

// Initialize the application
function init() {
    initScene();
    updateHUD();
    
    // Expose functions to global scope for HTML buttons
    window.selectTopic = selectTopic;
    window.startPracticeMode = startPracticeMode;
    window.startQuiz = startQuiz;
    window.startSimulation = startSimulation;
    window.runSimulation = runSimulation;
    window.showExplanation = showExplanation;
    window.hideExplanation = hideExplanation;
    window.closeModal = closeModal;
}

// Add click event listener for state interaction
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

// Initialize the application when the page loads
init();