/**
 * 3Blue1Brown-style Animation Utilities for Pumping Lemma Visualizer
 * 
 * This file provides animation utilities and effects to create a 3Blue1Brown-style
 * visualization experience for the Pumping Lemma demonstration.
 */

import * as THREE from 'three';
import { TWEEN } from 'three/addons/libs/tween.module.min.js';

export class MathAnimation {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.animations = [];
        this.mathObjects = new THREE.Group();
        this.scene.add(this.mathObjects);
        
        // 3Blue1Brown color palette
        this.colors = {
            blue: 0x3b1bb1,      // Main blue color
            yellow: 0xffd700,    // Highlight color
            green: 0x77b05d,     // Secondary color
            red: 0xe07a5f,       // Accent color
            purple: 0x9b5de5,    // Another accent
            background: 0x1e1e2f, // Dark background
            text: 0xffffff       // Text color
        };
        
        // Initialize animation clock
        this.clock = new THREE.Clock();
    }
    
    /**
     * Creates a smooth camera transition to focus on a specific point
     */
    focusCamera(targetPosition, duration = 1000) {
        const startPosition = this.camera.position.clone();
        const startRotation = this.camera.rotation.clone();
        
        return new Promise(resolve => {
            new TWEEN.Tween(startPosition)
                .to(targetPosition, duration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(() => {
                    this.camera.position.copy(startPosition);
                    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
                })
                .onComplete(resolve)
                .start();  // Correctly placed inside Promise
        });
    }
    
    /**
     * Creates a mathematical formula with LaTeX-style rendering
     */
    createMathFormula(formula, position, scale = 1.0) {
        const textMaterial = new THREE.MeshBasicMaterial({ 
            color: this.colors.text 
        });
        
        // Placeholder for MathJax integration
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = '32px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(formula, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const geometry = new THREE.PlaneGeometry(4 * scale, 1 * scale);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        this.mathObjects.add(mesh);
        return mesh;
    }
    
    /**
     * Animates the appearance of a string with character-by-character reveal
     */
    animateStringAppearance(stringGroup, duration = 1500) {
        const children = stringGroup.children;
        const delay = duration / children.length;
        
        children.forEach((child, index) => {
            child.visible = false;
            
            setTimeout(() => {
                child.visible = true;
                
                const originalScale = child.scale.clone();
                child.scale.set(0, 0, 0);
                
                new TWEEN.Tween(child.scale)
                    .to(originalScale, 300)
                    .easing(TWEEN.Easing.Back.Out)
                    .start();
            }, index * delay);
        });
        
        return new Promise(resolve => setTimeout(resolve, duration + 300));
    }
    
    /**
     * Creates a highlight effect for the pumping section
     */
    highlightPumpingSection(stringGroup, xLen, yLen, zLen) {
        const yStartIndex = xLen;
        const yEndIndex = xLen + yLen - 1;
        
        const yChars = [];
        stringGroup.children.forEach((child, index) => {
            if (index >= yStartIndex * 2 && index <= yEndIndex * 2 && child instanceof THREE.Mesh) {
                yChars.push(child);
            }
        });
        
        yChars.forEach(char => {
            if (char.material && char.material.emissive) {
                const originalEmissive = char.material.emissiveIntensity;
                
                const pulseAnimation = new TWEEN.Tween(char.material)
                    .to({ emissiveIntensity: originalEmissive * 2 }, 800)
                    .easing(TWEEN.Easing.Quadratic.InOut)
                    .yoyo(true)
                    .repeat(Infinity);
                
                pulseAnimation.start();
                this.animations.push(pulseAnimation);
            }
        });
    }
    
    /**
     * Animates the pumping process with smooth transitions
     */
    animatePumping(originalString, pumpedString, xLen, yLen, zLen, i) {
        const originalGroup = this.createStringVisualization(originalString, xLen, yLen, zLen);
        const pumpedGroup = this.createStringVisualization(pumpedString, xLen, yLen * i, zLen);
        pumpedGroup.visible = false;
        
        return new Promise(resolve => {
            setTimeout(() => {
                this.highlightPumpingSection(originalGroup, xLen, yLen, zLen);
                
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
                    
                    new TWEEN.Tween(pumpedGroup.position)
                        .to({ y: pumpedGroup.position.y - 2 }, 800)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onComplete(resolve)
                        .start();
                }, 1500);
            }, 1000);
        });
    }
    
    /**
     * Creates a visual representation of a string with 3B1B styling
     */
    createStringVisualization(s, xLen, yLen, zLen) {
        const stringGroup = new THREE.Group();
        const radius = 3;
        const heightPerChar = 0.5;
        const rotationPerChar = Math.PI / 8;

        s.split("").forEach((char, index) => {
            const angle = index * rotationPerChar;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const y = index * heightPerChar;

            const geometry = new THREE.SphereGeometry(0.3, 32, 32);
            let color;
            if (index < xLen) color = this.colors.blue;
            else if (index < xLen + yLen) color = this.colors.yellow;
            else color = this.colors.green;

            const material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.7,
                shininess: 70
            });

            const orb = new THREE.Mesh(geometry, material);
            orb.position.set(x, y, z);
            stringGroup.add(orb);

            if (this.loadedFont) {
                const textGeometry = new THREE.TextGeometry(char, {
                    font: this.loadedFont,
                    size: 0.25,
                    height: 0.05,
                    curveSegments: 12
                });
                const textMaterial = new THREE.MeshBasicMaterial({ color: this.colors.text });
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
                    color: 0x6b7db3,
                    opacity: 0.7,
                    transparent: true,
                    linewidth: 2
                });
                
                const line = new THREE.Line(lineGeometry, lineMaterial);
                stringGroup.add(line);
            }
        });

        this.scene.add(stringGroup);
        return stringGroup;
    }
    
    /**
     * Updates all animations - should be called in the animation loop
     */
    update() {
        TWEEN.update();
    }
    
    /**
     * Cleans up all animations and objects
     */
    dispose() {
        this.animations.forEach(animation => animation.stop());
        this.scene.remove(this.mathObjects);
    }
}

export class MathNotation {
    constructor() {
        // Initialize MathJax configuration if needed
    }
    
    /**
     * Renders a LaTeX formula to a canvas
     */
    renderFormula(formula, width = 512, height = 128) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, width, height);
        
        context.font = '32px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(formula, width / 2, height / 2);
        
        return canvas;
    }
    
    /**
     * Creates a THREE.js texture from a LaTeX formula
     */
    createFormulaTexture(formula, width = 512, height = 128) {
        const canvas = this.renderFormula(formula, width, height);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
}

export class VisualEffects {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.effects = new THREE.Group();
        this.scene.add(this.effects);
    }
    
    createGrid() {
        const size = 100;
        const divisions = 50;
        const gridHelper = new THREE.GridHelper(size, divisions, 0x3b1bb1, 0x1e1e2f);
        gridHelper.position.y = -10;
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.effects.add(gridHelper);
        
        // Add subtle glow effect
        const gridGeometry = new THREE.PlaneGeometry(size, size);
        const gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x3b1bb1,
            transparent: true,
            opacity: 0.05,
            side: THREE.DoubleSide
        });
        const gridPlane = new THREE.Mesh(gridGeometry, gridMaterial);
        gridPlane.rotation.x = Math.PI / 2;
        gridPlane.position.y = -10;
        this.effects.add(gridPlane);
    }
}

export class VisualEffects {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
    }
    
    /**
     * Adds a subtle bloom effect to the scene
     */
    addBloomEffect() {
        console.log('Bloom effect would be added here');
    }
    
    /**
     * Creates a grid background similar to 3Blue1Brown videos
     */
    createGrid(size = 20, divisions = 20, color = 0x444444) {
        const grid = new THREE.GridHelper(size, divisions, color, color);
        grid.position.y = -5;
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);
        return grid;
    }
    
    /**
     * Creates a spotlight effect to highlight important elements
     */
    createSpotlight(position, target, color = 0xffffff, intensity = 1) {
        const spotlight = new THREE.SpotLight(color, intensity);
        spotlight.position.copy(position);
        spotlight.target.position.copy(target);
        spotlight.castShadow = true;
        this.scene.add(spotlight);
        return spotlight;
    }
}