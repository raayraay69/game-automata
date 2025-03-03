/**
 * Ambiguity Visualizer with 3Blue1Brown-style animations
 * 
 * This file provides a visualization system for grammar ambiguity,
 * showing different parse trees for the same string in an elegant,
 * educational style inspired by 3Blue1Brown.
 */

import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MathAnimation, MathNotation, VisualEffects } from './3b1bAnimations.js';
import { TWEEN } from 'three/addons/libs/tween.module.min.js';

export class AmbiguityVisualizer {
    constructor(scene, camera, loadedFont) {
        this.scene = scene;
        this.camera = camera;
        this.loadedFont = loadedFont;
        this.currentTree1 = null;
        this.currentTree2 = null;
        
        this.mathAnimation = new MathAnimation(scene, camera);
        this.mathNotation = new MathNotation();
        
        this.controls = new OrbitControls(this.camera, document.getElementById('animation-container'));
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.enableZoom = true;
        
        // 3Blue1Brown color palette
        this.colors = {
            node: 0x3b1bb1,      // Main blue color for nodes
            terminal: 0xffd700,   // Yellow for terminals
            edge: 0x77b05d,       // Green for edges
            highlight: 0xe07a5f,   // Red for highlighting
            text: 0xffffff        // White for text
        };
        
        this.animations = [];
        this.formulaObjects = [];
    }
    
    /**
     * Creates a node in the parse tree
     */
    createNode(label, position, isTerminal = false) {
        const nodeGroup = new THREE.Group();
        
        // Create sphere for node
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: isTerminal ? this.colors.terminal : this.colors.node,
            emissive: isTerminal ? this.colors.terminal : this.colors.node,
            emissiveIntensity: 0.5,
            shininess: 70
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        nodeGroup.add(sphere);
        
        // Add label
        if (this.loadedFont) {
            const textGeometry = new TextGeometry(label, {
                font: this.loadedFont,
                size: 0.2,
                height: 0.05
            });
            const textMaterial = new THREE.MeshBasicMaterial({ color: this.colors.text });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(0.4, 0, 0);
            nodeGroup.add(textMesh);
        }
        
        nodeGroup.position.copy(position);
        return nodeGroup;
    }
    
    /**
     * Creates an edge between two nodes
     */
    createEdge(startPos, endPos) {
        const points = [];
        points.push(startPos);
        points.push(endPos);
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.colors.edge,
            linewidth: 2
        });
        
        return new THREE.Line(geometry, material);
    }
    
    /**
     * Recursively builds a parse tree
     */
    buildParseTree(node, position, level = 0, horizontalSpacing = 2) {
        const treeGroup = new THREE.Group();
        
        // Create current node
        const nodeGroup = this.createNode(node.label, position, !node.children);
        treeGroup.add(nodeGroup);
        
        if (node.children) {
            const childSpacing = horizontalSpacing / Math.max(2, node.children.length);
            const childLevel = level + 1;
            
            node.children.forEach((child, index) => {
                const childX = position.x + (index - (node.children.length - 1) / 2) * childSpacing;
                const childY = position.y - 1;
                const childPos = new THREE.Vector3(childX, childY, position.z);
                
                const childTree = this.buildParseTree(child, childPos, childLevel, childSpacing);
                treeGroup.add(childTree);
                
                // Add edge from parent to child
                const edge = this.createEdge(position, childPos);
                treeGroup.add(edge);
            });
        }
        
        return treeGroup;
    }
    
    /**
     * Shows the ambiguity demonstration with two parse trees
     */
    showAmbiguityDemo(tree1, tree2) {
        // Clear previous trees
        if (this.currentTree1) this.scene.remove(this.currentTree1);
        if (this.currentTree2) this.scene.remove(this.currentTree2);
        
        // Build and position the trees
        const tree1Group = this.buildParseTree(tree1, new THREE.Vector3(-4, 4, 0));
        const tree2Group = this.buildParseTree(tree2, new THREE.Vector3(4, 4, 0));
        
        // Add trees to scene
        this.scene.add(tree1Group);
        this.scene.add(tree2Group);
        
        this.currentTree1 = tree1Group;
        this.currentTree2 = tree2Group;
        
        // Animate camera to view both trees
        this.mathAnimation.focusCamera(new THREE.Vector3(0, 2, 10));
        
        // Add derivation steps as text
        const derivation1 = this.mathAnimation.createMathFormula(
            "S → aSbS → aaSbS → aabb",
            new THREE.Vector3(-4, -2, 0)
        );
        
        const derivation2 = this.mathAnimation.createMathFormula(
            "S → aSbS → aSbbS → aabb",
            new THREE.Vector3(4, -2, 0)
        );
        
        this.formulaObjects.push(derivation1, derivation2);
    }
    
    /**
     * Cleans up animations and objects
     */
    dispose() {
        this.animations.forEach(animation => animation.stop());
        this.animations = [];
        this.formulaObjects.forEach(obj => this.scene.remove(obj));
        this.formulaObjects = [];
        
        if (this.currentTree1) this.scene.remove(this.currentTree1);
        if (this.currentTree2) this.scene.remove(this.currentTree2);
    }
}