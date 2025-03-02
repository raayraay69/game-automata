import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export class PumpingVisualizer {
    constructor(scene, camera, loadedFont) {
        this.scene = scene;
        this.camera = camera;
        this.loadedFont = loadedFont;
        this.currentStringGroup = null;
        this.currentStep = 0;
        this.pumpingLength = 3; // Default pumping length
    }

    createStringVisualization(s, xLen, yLen, zLen, highlight = false) {
        if (this.currentStringGroup) {
            this.scene.remove(this.currentStringGroup);
        }

        const stringGroup = new THREE.Group();
        let position = -s.length / 2;

        s.split("").forEach((char, index) => {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            let color;
            if (index < xLen) color = 0xff0000; // Red for x
            else if (index < xLen + yLen) color = 0x00ff00; // Green for y
            else color = 0x0000ff; // Blue for z

            const material = new THREE.MeshPhongMaterial({ color });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(position, 2, 0); // Position above the DFA states
            stringGroup.add(cube);

            if (this.loadedFont) {
                const textGeometry = new TextGeometry(char, { 
                    font: this.loadedFont, 
                    size: 0.5, 
                    height: 0.1 
                });
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.set(position - 0.25, 2.5, 0);
                stringGroup.add(textMesh);
            }
            position += 1.1;
        });

        this.scene.add(stringGroup);
        this.currentStringGroup = stringGroup;
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 2, 0);

        if (highlight) {
            this.highlightSections(xLen, yLen);
        }

        return stringGroup;
    }

    showPumpingDemonstration(question, isCorrect, isExplanation = false) {
        const { s, xLen, yLen, zLen, language } = question.pumpingData;
        let i = 1; // Initial pump count
        const stringGroup = this.createStringVisualization(s, xLen, yLen, zLen);

        document.getElementById("input-string-display").innerText = `Original: ${s}`;

        // Setup explanation panel
        const explanationPanel = document.getElementById("explanation-panel");
        explanationPanel.style.display = "block";
        explanationPanel.innerHTML = `
            <div class="explanation-header">
                <h3>Visual Explanation</h3>
                <span class="close-btn" onclick="hideExplanation()">×</span>
            </div>
            <div id="animation-container"></div>
            <div id="explanation-text">Red = x, Green = y, Blue = z<br>Pump y to see the effect.</div>
        `;

        // Add pump button
        const pumpButton = document.createElement("button");
        pumpButton.innerText = "Pump y";
        pumpButton.className = "action-btn";
        pumpButton.onclick = () => {
            i++;
            const pumpedS = s.slice(0, xLen) + s.slice(xLen, xLen + yLen).repeat(i) + s.slice(xLen + yLen);
            this.scene.remove(stringGroup);
            this.createStringVisualization(pumpedS, xLen, yLen * i, zLen);

            let inLanguage = this.checkLanguageMembership(pumpedS, language);
            document.getElementById("explanation-text").innerText = 
                `Pumped string: ${pumpedS}\nIn language: ${inLanguage}`;
        };
        explanationPanel.appendChild(pumpButton);

        // Initial feedback
        setTimeout(() => {
            document.getElementById("feedback").innerText = isCorrect
                ? "Correct! Pumping y changes the string—watch how."
                : "Incorrect. See how pumping y affects the language.";
        }, 1000);

        // Cleanup if not in explanation mode
        if (!isExplanation) {
            setTimeout(() => {
                this.scene.remove(stringGroup);
                document.getElementById("explanation-panel").style.display = "none";
                document.getElementById("input-string-display").innerText = "";
            }, 10000);
        }
    }

    checkLanguageMembership(str, language) {
        switch (language) {
            case 'equal_a_b': {
                const aCount = str.split('a').length - 1;
                const bCount = str.split('b').length - 1;
                return aCount === bCount;
            }
            case 'n_greater_m': {
                const aCount = str.split('a').length - 1;
                const bCount = str.split('b').length - 1;
                return aCount > bCount;
            }
            case 'anbn': {
                const half = str.length / 2;
                return str.slice(0, half) === 'a'.repeat(half) && str.slice(half) === 'b'.repeat(half);
            }
            case 'ww': {
                if (str.length % 2 !== 0) return false;
                const half = str.length / 2;
                return str.slice(0, half) === str.slice(half);
            }
            default:
                return false;
        }
    }

    startDemonstration(inputString, language) {
        this.currentStep = 0;
        const s = inputString;
        const p = this.pumpingLength;

        if (!this.checkLanguageMembership(s, language)) {
            document.getElementById('feedback').innerText = `String "${s}" is not in the language ${language}!`;
            return;
        }

        let xLen = 0;
        let yLen = Math.min(p, s.length);
        let zLen = s.length - yLen;

        const steps = [
            { text: `Step 1: Assume the language is regular with pumping length p = ${p}.` },
            { text: `Step 2: You chose s = "${s}" (|s| = ${s.length} ≥ p).` },
            { text: `Step 3: Split s into x = "${s.slice(0, xLen)}", y = "${s.slice(xLen, xLen + yLen)}", z = "${s.slice(xLen + yLen)}" (|xy| ≤ p, |y| > 0).` },
            { text: `Step 4: Pump y twice: "${s.slice(0, xLen) + s.slice(xLen, xLen + yLen).repeat(2) + s.slice(xLen + yLen)}".` },
            { text: this.getConclusion(s, xLen, yLen, zLen, language) }
        ];

        const explanationPanel = document.getElementById("explanation-panel");
        explanationPanel.style.display = "block";
        explanationPanel.innerHTML = `
            <div class="explanation-header">
                <h3>Pumping Lemma Adventure</h3>
                <span class="close-btn" onclick="hideExplanation()">×</span>
            </div>
            <div id="explanation-text"></div>
            <button id="next-step-btn" class="action-btn">Next Step</button>
        `;

        document.getElementById("next-step-btn").onclick = () => this.showStep(s, xLen, yLen, zLen, steps);
        this.showStep(s, xLen, yLen, zLen, steps);
    }

    showStep(s, xLen, yLen, zLen, steps) {
        if (this.currentStep >= steps.length) {
            document.getElementById("next-step-btn").style.display = "none";
            setTimeout(() => {
                this.scene.remove(this.currentStringGroup);
                document.getElementById("explanation-panel").style.display = "none";
            }, 5000);
            return;
        }

        document.getElementById("explanation-text").innerText = steps[this.currentStep].text;

        if (this.currentStep === 1) {
            this.createStringVisualization(s, xLen, yLen, zLen);
        } else if (this.currentStep === 2) {
            this.createStringVisualization(s, xLen, yLen, zLen, true);
        } else if (this.currentStep === 3) {
            const pumpedS = s.slice(0, xLen) + s.slice(xLen, xLen + yLen).repeat(2) + s.slice(xLen + yLen);
            this.createStringVisualization(pumpedS, xLen, yLen * 2, zLen);
        }

        this.currentStep++;
    }

    getConclusion(s, xLen, yLen, zLen, language) {
        const pumpedS = s.slice(0, xLen) + s.slice(xLen, xLen + yLen).repeat(2) + s.slice(xLen + yLen);
        const isRegular = this.checkLanguageMembership(pumpedS, language);
        return `Step 5: The pumped string "${pumpedS}" is ${isRegular ? "" : "not "}in the language. Thus, the language is ${isRegular ? "possibly regular (try more splits!)" : "not regular"}.`;
    }

    highlightSections(xLen, yLen) {
        this.currentStringGroup.children.forEach((child, index) => {
            if (child instanceof THREE.Mesh && child.geometry.type === "BoxGeometry") {
                const scale = index < xLen ? 1.2 : (index < xLen + yLen ? 1.5 : 1.2);
                child.scale.set(scale, 1.2, 1.2);
            }
        });
    }
}