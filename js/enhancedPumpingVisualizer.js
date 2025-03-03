/**
 * Enhanced Pumping Lemma Visualizer with 3Blue1Brown-style animations
 * 
 * This file integrates the PumpingVisualizer with the MathAnimation utilities
 * to create a more elegant and educational visualization experience.
 */

import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MathAnimation, MathNotation, VisualEffects } from './3b1bAnimations.js';
import { TWEEN } from 'three/addons/libs/tween.module.min.js';

export class EnhancedPumpingVisualizer {
    constructor(scene, camera, loadedFont) {
        this.scene = scene;
        this.camera = camera;
        this.loadedFont = loadedFont;
        this.currentStringGroup = null;
        this.currentStep = 0;
        this.pumpingLength = 3;
        
        this.mathAnimation = new MathAnimation(scene, camera);
        this.mathNotation = new MathNotation();
        
        this.controls = new OrbitControls(this.camera, document.getElementById('animation-container'));
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.enableZoom = true;
        
        this.colors = {
            x: 0x3b1bb1,
            y: 0xffd700,
            z: 0x77b05d,
            text: 0xffffff,
            line: 0x6b7db3
        };
        
        this.animations = [];
        this.formulaObjects = [];
    }
    
    /**
     * Creates an enhanced 3D visualization of a string with xyz decomposition
     */
    createStringVisualization(s, xLen, yLen, zLen, highlight = false) {
        if (this.currentStringGroup) {
            this.scene.remove(this.currentStringGroup);
        }

        const stringGroup = new THREE.Group();
        const radius = 3;
        const heightPerChar = 0.5;
        const rotationPerChar = Math.PI / 8;

        s.split("").forEach((char, index) => {
            const angle = index * rotationPerChar;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const y = index * heightPerChar;

            const geometry = new THREE.SphereGeometry(0.35, 32, 32);
            let color;
            if (index < xLen) color = this.colors.x;
            else if (index < xLen + yLen) color = this.colors.y;
            else color = this.colors.z;

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
            
            const initialScale = { value: 0 };
            const targetScale = { value: 1 };
            const tweenAnimation = new TWEEN.Tween(initialScale)
                .to(targetScale, 500 + index * 100)
                .easing(TWEEN.Easing.Back.Out)
                .onUpdate(() => {
                    orb.scale.set(initialScale.value, initialScale.value, initialScale.value);
                })
                .delay(index * 50)
                .start();
            
            this.animations.push(tweenAnimation);
            stringGroup.add(orb);

            if (this.loadedFont) {
                const textGeometry = new TextGeometry(char, {
                    font: this.loadedFont,
                    size: 0.2,
                    height: 0.05,
                    curveSegments: 12
                });
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.set(x + 0.4, y, z);
                textMesh.lookAt(new THREE.Vector3(0, y, 0));
                stringGroup.add(textMesh);
            }

            if (index < s.length - 1) {
                const nextAngle = (index + 1) * rotationPerChar;
                const nextX = radius * Math.cos(nextAngle);
                const nextZ = radius * Math.sin(nextAngle);
                const nextY = (index + 1) * heightPerChar;

                const points = [];
                points.push(new THREE.Vector3(x, y, z));
                points.push(new THREE.Vector3(nextX, nextY, nextZ));

                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const lineMaterial = new THREE.LineBasicMaterial({ 
                    color: this.colors.line,
                    opacity: 0.7,
                    transparent: true
                });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                stringGroup.add(line);
            }
        });

        this.scene.add(stringGroup);
        this.currentStringGroup = stringGroup;

        this.camera.position.set(8, s.length * heightPerChar / 2, 8);
        this.camera.lookAt(0, s.length * heightPerChar / 2, 0);

        if (highlight) {
            this.highlightSections(xLen, yLen);
        }

        return stringGroup;
    }
    
    /**
     * Creates a smooth transition between original and pumped strings
     */
    animatePumpingTransition(s, xLen, yLen, zLen, i, language) {
        const originalString = s;
        const pumpedString = s.slice(0, xLen) + s.slice(xLen, xLen + yLen).repeat(i) + s.slice(xLen + yLen);
        
        const originalGroup = this.createStringVisualization(originalString, xLen, yLen, zLen);
        
        const formulaPosition = new THREE.Vector3(0, -2, 0);
        const formula = `s = ${s.slice(0, xLen)}·${s.slice(xLen, xLen + yLen)}·${s.slice(xLen + yLen)}`;
        const formulaMesh = this.mathAnimation.createMathFormula(formula, formulaPosition);
        this.formulaObjects.push(formulaMesh);
        
        this.highlightPumpingSection(xLen, yLen);
        
        setTimeout(() => {
            const pumpedGroup = this.createStringVisualization(pumpedString, xLen, yLen * i, zLen);
            pumpedGroup.visible = false;
            
            const pumpedFormulaPosition = new THREE.Vector3(0, -3, 0);
            const pumpedFormula = `xy^${i}z = ${s.slice(0, xLen)}·${s.slice(xLen, xLen + yLen).repeat(i)}·${s.slice(xLen + yLen)}`;
            const pumpedFormulaMesh = this.mathAnimation.createMathFormula(pumpedFormula, pumpedFormulaPosition);
            pumpedFormulaMesh.visible = false;
            this.formulaObjects.push(pumpedFormulaMesh);
            
            setTimeout(() => {
                new TWEEN.Tween(originalGroup.position)
                    .to({ y: originalGroup.position.y - 2 }, 800)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .onComplete(() => {
                        this.scene.remove(originalGroup);
                    })
                    .start();
                
                pumpedGroup.visible = true;
                pumpedGroup.position.y += 2;
                pumpedFormulaMesh.visible = true;
                
                new TWEEN.Tween(pumpedGroup.position)
                    .to({ y: pumpedGroup.position.y - 2 }, 800)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .start();
                
                this.updateExplanationText(pumpedString, i, language);
            }, 1500);
        }, 1000);
    }
    
    /**
     * Highlights the pumping section (y) with a pulsing effect
     */
    highlightPumpingSection(xLen, yLen) {
        const yStartIndex = xLen;
        const yEndIndex = xLen + yLen - 1;
        
        this.currentStringGroup.children.forEach((child, index) => {
            if (index >= yStartIndex * 2 && index <= yEndIndex * 2 && child instanceof THREE.Mesh) {
                if (child.material && child.material.emissive) {
                    const originalEmissive = child.material.emissiveIntensity;
                    
                    const pulseAnimation = new TWEEN.Tween(child.material)
                        .to({ emissiveIntensity: originalEmissive * 2 }, 800)
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .yoyo(true)
                        .repeat(Infinity);
                    
                    pulseAnimation.start();
                    this.animations.push(pulseAnimation);
                }
            }
        });
    }
    
    /**
     * Updates explanation text during pumping animation
     */
    updateExplanationText(pumpedString, i, language) {
        const explanationText = document.getElementById('explanation-text');
        if (explanationText) {
            explanationText.innerHTML = `
                <p>Observe how pumping affects the string:</p>
                <ul>
                    <li>Current i = ${i}</li>
                    <li>Pumped string: ${pumpedString}</li>
                    <li>Language: ${this.getLanguageDefinition(language)}</li>
                </ul>
            `;
        }
    }
    
    /**
     * Placeholder for language definition
     */
    getLanguageDefinition(language) {
        return language || 'Not specified';
    }
    
    /**
     * Clears all animations
     */
    clearAnimations() {
        this.animations.forEach(animation => animation.stop());
        this.animations = [];
        this.formulaObjects.forEach(obj => this.scene.remove(obj));
        this.formulaObjects = [];
    }
    
    /**
     * Shows an enhanced pumping demonstration with elegant transitions
     */
    showPumpingDemonstration(question, isCorrect, isExplanation = false) {
        const { s, xLen, yLen, zLen, language } = question.pumpingData;
        let i = 1;
        
        this.clearAnimations();
        
        document.getElementById("input-string-display").innerHTML = `
            <div class="language-definition">
                <h4>Language: ${this.getLanguageDefinition(language)}</h4>
                <p>Original string: ${s}</p>
                <p>Decomposition: x = "${s.slice(0, xLen)}", y = "${s.slice(xLen, xLen + yLen)}", z = "${s.slice(xLen + yLen)}"</p>
            </div>
        `;

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
                    <p>Blue (x) = "${s.slice(0, xLen)}"</p>
                    <p>Yellow (y) = "${s.slice(xLen, xLen + yLen)}" (this part will be pumped)</p>
                    <p>Green (z) = "${s.slice(xLen + yLen)}"</p>
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

        const stringGroup = this.createStringVisualization(s, xLen, yLen, zLen);

        const controlsDiv = document.createElement("div");
        controlsDiv.className = "pump-controls";
        
        const pumpUpButton = document.createElement("button");
        pumpUpButton.innerText = "Pump y (i++)";
        pumpUpButton.className = "action-btn";
        pumpUpButton.onclick = () => {
            i++;
            this.animatePumpingTransition(s, xLen, yLen, zLen, i, language);
        };
        
        const pumpDownButton = document.createElement("button");
        pumpDownButton.innerText = "Remove y (i--)";
        pumpDownButton.className = "action-btn";
        pumpDownButton.disabled = i <= 0;
        pumpDownButton.onclick = () => {
            if (i > 0) {
                i--;
                this.animatePumpingTransition(s, xLen, yLen, zLen, i, language);
                pumpDownButton.disabled = i <= 0;
            }
        };
        
        const resetButton = document.createElement("button");
        resetButton.innerText = "Reset (i=1)";
        resetButton.className = "action-btn";
        resetButton.onclick = () => {
            i = 1;
            this.animatePumpingTransition(s, xLen, yLen, zLen, i, language);
            pumpDownButton.disabled = i <= 0;
        };

        controlsDiv.appendChild(pumpUpButton);
        controlsDiv.appendChild(pumpDownButton);
        controlsDiv.appendChild(resetButton);
        explanationPanel.appendChild(controlsDiv);
    }
}