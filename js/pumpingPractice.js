import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export class PumpingPractice {
    constructor(scene, camera, loadedFont) {
        this.scene = scene;
        this.camera = camera;
        this.loadedFont = loadedFont;
        this.currentQuestion = null;
        this.score = 0;
        this.totalQuestions = 0;
    }

    generateQuestion() {
        const languages = ['equal_a_b', 'n_greater_m', 'anbn', 'ww'];
        const language = languages[Math.floor(Math.random() * languages.length)];
        let s, xLen, yLen, zLen;

        switch (language) {
            case 'equal_a_b':
                s = 'aabb';
                xLen = 1;
                yLen = 1;
                zLen = 2;
                break;
            case 'n_greater_m':
                s = 'aaab';
                xLen = 2;
                yLen = 1;
                zLen = 1;
                break;
            case 'anbn':
                s = 'aaabbb';
                xLen = 1;
                yLen = 2;
                zLen = 3;
                break;
            case 'ww':
                s = 'abab';
                xLen = 1;
                yLen = 1;
                zLen = 2;
                break;
        }

        this.currentQuestion = {
            pumpingData: { s, xLen, yLen, zLen, language },
            isRegular: false
        };

        return this.currentQuestion;
    }

    showPracticeQuestion() {
        const question = this.generateQuestion();
        const explanationPanel = document.getElementById('explanation-panel');
        explanationPanel.style.display = 'block';
        explanationPanel.innerHTML = `
            <div class="explanation-header">
                <h3>Practice Question</h3>
                <span class="close-btn" onclick="hideExplanation()">×</span>
            </div>
            <div class="practice-content">
                <h4>Is this language regular?</h4>
                <p>Consider the language: ${this.getLanguageDefinition(question.pumpingData.language)}</p>
                <p>Given string s = "${question.pumpingData.s}"</p>
                <div class="practice-buttons">
                    <button onclick="window.pumpingPractice.checkAnswer(true)" class="action-btn">Yes, it's regular</button>
                    <button onclick="window.pumpingPractice.checkAnswer(false)" class="action-btn">No, it's not regular</button>
                </div>
                <div class="score-display">
                    Score: ${this.score}/${this.totalQuestions}
                </div>
            </div>
        `;
    }

    checkAnswer(userAnswer) {
        this.totalQuestions++;
        const isCorrect = userAnswer === this.currentQuestion.isRegular;
        if (isCorrect) this.score++;

        // Show the demonstration with the result
        if (window.pumpingVisualizer) {
            window.pumpingVisualizer.showPumpingDemonstration(
                this.currentQuestion,
                isCorrect,
                true
            );
        }

        // Update score display
        const scoreDisplay = document.querySelector('.score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${this.score}/${this.totalQuestions}`;
        }

        // Show next question button
        const practiceContent = document.querySelector('.practice-content');
        if (practiceContent) {
            practiceContent.innerHTML += `
                <div class="next-question">
                    <button onclick="window.pumpingPractice.showPracticeQuestion()" class="action-btn">
                        Next Question
                    </button>
                </div>
            `;
        }
    }

    getLanguageDefinition(language) {
        switch (language) {
            case 'equal_a_b':
                return 'L = { w | w has equal number of a\'s and b\'s }';
            case 'n_greater_m':
                return 'L = { a^n b^m | n > m }';
            case 'anbn':
                return 'L = { a^n b^n | n ≥ 0 }';
            case 'ww':
                return 'L = { ww | w ∈ {a,b}* }';
            default:
                return 'Unknown language';
        }
    }
}