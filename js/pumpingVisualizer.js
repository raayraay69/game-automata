import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class PumpingVisualizer {
    constructor(scene, camera, loadedFont) {
        this.scene = scene;
        this.camera = camera;
        this.loadedFont = loadedFont;
        this.currentStringGroup = null;
        this.currentStep = 0;
        this.pumpingLength = 3; // Default pumping length
        
        // Add orbit controls for interactive rotation
        this.controls = new OrbitControls(this.camera, document.getElementById('animation-container'));
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.enableZoom = true;
    }

    createStringVisualization(s, xLen, yLen, zLen, highlight = false) {
        if (this.currentStringGroup) {
            this.scene.remove(this.currentStringGroup);
        }

        const stringGroup = new THREE.Group();
        const radius = 3;
        const heightPerChar = 0.5;
        const rotationPerChar = Math.PI / 8;
        
        // 3Blue1Brown color palette
        const colors = {
            x: 0x3b1bb1,      // 3B1B signature blue for x
            y: 0xffd700,      // Gold/yellow for y (the pumping part)
            z: 0x77b05d,      // Green for z
            text: 0xffffff,    // White text
            line: 0x6b7db3     // Subtle blue for connecting lines
        };

        s.split("").forEach((char, index) => {
            // Calculate helix position with smoother curve
            const angle = index * rotationPerChar;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const y = index * heightPerChar;

            // Create enhanced glowing orb for character
            const geometry = new THREE.SphereGeometry(0.35, 32, 32);
            let color;
            if (index < xLen) color = colors.x;
            else if (index < xLen + yLen) color = colors.y;
            else color = colors.z;

            const material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.7,
                shininess: 70,
                transparent: true,
                opacity: 0.9
            });

            const orb = new THREE.Mesh(geometry, material);
            orb.position.set(x, y, z);
            
            // Add subtle animation to orbs
            const initialScale = { value: 0 };
            const targetScale = { value: 1 };
            new TWEEN.Tween(initialScale)
                .to(targetScale, 500 + index * 100)
                .easing(TWEEN.Easing.Back.Out)
                .onUpdate(() => {
                    orb.scale.set(
                        initialScale.value,
                        initialScale.value,
                        initialScale.value
                    );
                })
                .delay(index * 50)
                .start();
                
            stringGroup.add(orb);

            // Add character label
            if (this.loadedFont) {
                const textGeometry = new TextGeometry(char, {
                    font: this.loadedFont,
                    size: 0.2,
                    height: 0.05
                });
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.set(x + 0.4, y, z);
                textMesh.lookAt(new THREE.Vector3(0, y, 0));
                stringGroup.add(textMesh);
            }

            // Add connecting line to next character if not last
            if (index < s.length - 1) {
                const nextAngle = (index + 1) * rotationPerChar;
                const nextX = radius * Math.cos(nextAngle);
                const nextZ = radius * Math.sin(nextAngle);
                const nextY = (index + 1) * heightPerChar;

                const points = [];
                points.push(new THREE.Vector3(x, y, z));
                points.push(new THREE.Vector3(nextX, nextY, nextZ));

                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0x6b7db3, opacity: 0.7, transparent: true });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                stringGroup.add(line);
            }
        });

        this.scene.add(stringGroup);
        this.currentStringGroup = stringGroup;

        // Adjust camera position for better helix view
        this.camera.position.set(8, s.length * heightPerChar / 2, 8);
        this.camera.lookAt(0, s.length * heightPerChar / 2, 0);

        if (highlight) {
            this.highlightSections(xLen, yLen);
        }

        return stringGroup;
    }

    showPumpingDemonstration(question, isCorrect, isExplanation = false) {
        const { s, xLen, yLen, zLen, language } = question.pumpingData;
        let i = 1; // Initial pump count
        const stringGroup = this.createStringVisualization(s, xLen, yLen, zLen);

        document.getElementById("input-string-display").innerHTML = `
            <div class="language-definition">
                <h4>Language: ${this.getLanguageDefinition(language)}</h4>
                <p>Original string: ${s}</p>
                <p>Decomposition: x = "${s.slice(0, xLen)}", y = "${s.slice(xLen, xLen + yLen)}", z = "${s.slice(xLen + yLen)}"</p>
            </div>
        `;

        // Setup explanation panel
        const explanationPanel = document.getElementById("explanation-panel");
        explanationPanel.style.display = "block";
        explanationPanel.innerHTML = `
            <div class="explanation-header">
                <h3>Interactive Pumping Lemma Demonstration</h3>
                <span class="close-btn" onclick="hideExplanation()">×</span>
            </div>
            <div class="pumping-steps">
                <div class="step-indicator">Current Step: Pumping Demonstration</div>
                <div class="step-explanation">
                    <p>Red (x) = "${s.slice(0, xLen)}"</p>
                    <p>Green (y) = "${s.slice(xLen, xLen + yLen)}" (this part will be pumped)</p>
                    <p>Blue (z) = "${s.slice(xLen + yLen)}"</p>
                </div>
            </div>
            <div id="animation-container"></div>
            <div id="explanation-text" class="pumping-explanation">
                <p>Observe how pumping affects the string:</p>
                <ul>
                    <li>Current i = ${i}</li>
                    <li>|xy| = ${xLen + yLen} ≤ p (satisfying condition 1)</li>
                    <li>|y| = ${yLen} > 0 (satisfying condition 2)</li>
                </ul>
            </div>
        `;

        // Add pump controls
        const controlsDiv = document.createElement("div");
        controlsDiv.className = "pump-controls";
        
        // Add pump up button (i++)
        const pumpUpButton = document.createElement("button");
        pumpUpButton.innerText = "Pump y (i++)";
        pumpUpButton.className = "action-btn";
        pumpUpButton.onclick = () => {
            i++;
            this.updatePumpedString(s, xLen, yLen, zLen, i, language, stringGroup);
        };
        
        // Add pump down button (i--)
        const pumpDownButton = document.createElement("button");
        pumpDownButton.innerText = "Remove y (i--)";
        pumpDownButton.className = "action-btn";
        pumpDownButton.disabled = i <= 0;
        pumpDownButton.onclick = () => {
            if (i > 0) {
                i--;
                this.updatePumpedString(s, xLen, yLen, zLen, i, language, stringGroup);
                pumpDownButton.disabled = i <= 0;
            }
        };
        
        // Add reset button
        const resetButton = document.createElement("button");
        resetButton.innerText = "Reset (i=1)";
        resetButton.className = "action-btn";
        resetButton.onclick = () => {
            i = 1;
            this.updatePumpedString(s, xLen, yLen, zLen, i, language, stringGroup);
            pumpDownButton.disabled = i <= 0;
        };
        
        controlsDiv.appendChild(pumpUpButton);
        controlsDiv.appendChild(pumpDownButton);
        controlsDiv.appendChild(resetButton);
        explanationPanel.appendChild(controlsDiv);

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

    getLanguageDefinition(language) {
        switch (language) {
            case 'equal_a_b':
                return 'L = { w | w has equal number of as and bs }';
            case 'n_greater_m':
                return 'L = { a<sup>n</sup>b<sup>m</sup> | n > m }';
            case 'anbn':
                return 'L = { a<sup>n</sup>b<sup>n</sup> | n ≥ 0 }';
            case 'ww':
                return 'L = { ww | w ∈ {a,b}* }';
            default:
                return 'Unknown language';
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

    updatePumpedString(s, xLen, yLen, zLen, i, language, stringGroup) {
        const pumpedS = s.slice(0, xLen) + s.slice(xLen, xLen + yLen).repeat(i) + s.slice(xLen + yLen);
        this.scene.remove(stringGroup);
        this.createStringVisualization(pumpedS, xLen, yLen * i, zLen);

        const inLanguage = this.checkLanguageMembership(pumpedS, language);
        const aCount = pumpedS.split('a').length - 1;
        const bCount = pumpedS.split('b').length - 1;
        
        let explanation = '';
        switch(language) {
            case 'equal_a_b':
            case 'anbn':
                explanation = inLanguage ? 
                    `The string has ${aCount} a's and ${bCount} b's, which are equal.` : 
                    `The string has ${aCount} a's and ${bCount} b's, which are NOT equal.`;
                break;
            case 'n_greater_m':
                explanation = inLanguage ? 
                    `The string has ${aCount} a's and ${bCount} b's, so n > m.` : 
                    `The string has ${aCount} a's and ${bCount} b's, so n ≤ m.`;
                break;
            case 'ww':
                const half = pumpedS.length / 2;
                explanation = inLanguage ? 
                    `The string can be split into two equal halves: "${pumpedS.slice(0, half)}" and "${pumpedS.slice(half)}".` : 
                    `The string cannot be split into two equal halves.`;
                break;
        }

        document.getElementById("explanation-text").innerHTML = `
            <p>Pumped string (i = ${i}): <strong>${pumpedS}</strong></p>
            <p>Is this string in the language? <strong>${inLanguage ? 'YES' : 'NO'}</strong></p>
            <p>${explanation}</p>
            <p class="conclusion">${inLanguage ? 
                'If this were a regular language, all pumped strings would remain in the language.' : 
                'This contradicts the pumping lemma! Therefore, the language is NOT regular.'}</p>
        `;
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