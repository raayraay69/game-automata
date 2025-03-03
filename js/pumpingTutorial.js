class PumpingTutorial {
    constructor(scene, camera, loadedFont) {
        this.scene = scene;
        this.camera = camera;
        this.loadedFont = loadedFont;
        this.currentStep = 0;
    }

    showNotationGuide() {
        const explanationPanel = document.getElementById("explanation-panel");
        explanationPanel.style.display = "block";
        explanationPanel.innerHTML = `
            <div class="explanation-header">
                <h3>Understanding Pumping Lemma Notation</h3>
                <span class="close-btn" onclick="hideExplanation()">×</span>
            </div>
            <div class="tutorial-content">
                <h4>What is the Pumping Lemma?</h4>
                <p>The Pumping Lemma is a powerful tool used to prove that a language is <strong>not regular</strong>. It works by contradiction: we assume the language is regular, then show this leads to a contradiction.</p>
                
                <h4>The Formal Statement</h4>
                <p>If a language L is regular, then there exists a pumping length p > 0 such that for any string s ∈ L where |s| ≥ p, s can be divided into three parts s = xyz, such that:</p>
                <ol>
                    <li>|xy| ≤ p (the first part of the string is no longer than p)</li>
                    <li>|y| > 0 (the middle part is not empty)</li>
                    <li>For all i ≥ 0, xy<sup>i</sup>z ∈ L (pumping y any number of times keeps the string in the language)</li>
                </ol>
                
                <h4>Basic Notation Guide</h4>
                <ul>
                    <li><strong>{a^n}</strong>: Means "a" repeated n times</li>
                    <li><strong>{b^m}</strong>: Means "b" repeated m times</li>
                    <li><strong>|</strong>: Means "such that" or "where"</li>
                    <li><strong>n > m</strong>: A condition (here, n must be greater than m)</li>
                    <li><strong>xy<sup>i</sup>z</strong>: Means x followed by y repeated i times, followed by z</li>
                </ul>
                
                <h4>Example: {a^n b^m | n > m}</h4>
                <p>This means: "Any string that has some number (n) of a's followed by some number (m) of b's, where the number of a's must be greater than the number of b's."</p>
                <div class="example-box">
                    <p>Valid strings: "aab", "aaab", "aaaab"</p>
                    <p>Invalid strings: "ab", "aabb", "b"</p>
                </div>
                
                <h4>How to Use the Pumping Lemma</h4>
                <p>To prove a language is not regular:</p>
                <ol>
                    <li>Assume the language is regular (so the pumping lemma applies)</li>
                    <li>Choose a string s in the language with length ≥ p</li>
                    <li>Show that for any way to divide s = xyz (following rules 1 and 2), there exists some i where xy<sup>i</sup>z is not in the language</li>
                    <li>This contradicts rule 3, proving the language is not regular</li>
                </ol>
                
                <button id="show-interactive" class="action-btn">Try Interactive Example</button>
                <button id="show-examples" class="action-btn">More Examples</button>
            </div>
        `;

        document.getElementById("show-interactive").onclick = () => this.showInteractiveExample();
        document.getElementById("show-examples").onclick = () => this.showMoreExamples();
    }

    showInteractiveExample() {
        const explanationPanel = document.getElementById("explanation-panel");
        explanationPanel.innerHTML = `
            <div class="explanation-header">
                <h3>Interactive Pumping Lemma Example</h3>
                <span class="close-btn" onclick="hideExplanation()">×</span>
            </div>
            <div class="tutorial-content">
                <h4>Let's prove {a^n b^n | n ≥ 0} is not regular</h4>
                <p class="example-description">This language contains strings with equal numbers of a's followed by b's.</p>
                
                <div class="step-box" id="step1">
                    <h5>Step 1: Assume it's regular</h5>
                    <p>If the language is regular, there must be a pumping length p > 0.</p>
                    <p>This means any string s in the language with |s| ≥ p can be written as s = xyz where:</p>
                    <ul>
                        <li>|xy| ≤ p (the first part is no longer than p)</li>
                        <li>|y| > 0 (the middle part is not empty)</li>
                        <li>For all i ≥ 0, xy<sup>i</sup>z ∈ L (pumping y any number of times keeps the string in the language)</li>
                    </ul>
                    <button onclick="pumpingTutorial.nextStep(1)" class="action-btn">Next</button>
                </div>
                
                <div class="step-box" id="step2" style="display: none;">
                    <h5>Step 2: Choose a string</h5>
                    <p>We need to pick a string s in the language with |s| ≥ p.</p>
                    <p>Let's choose s = a<sup>p</sup>b<sup>p</sup> (p a's followed by p b's)</p>
                    <p>Example: For p=3, s = "aaabbb"</p>
                    <p>This string is in the language since it has equal numbers of a's and b's.</p>
                    <div class="visual-example">
                        <span class="a-char">a</span><span class="a-char">a</span><span class="a-char">a</span>
                        <span class="b-char">b</span><span class="b-char">b</span><span class="b-char">b</span>
                    </div>
                    <button onclick="pumpingTutorial.nextStep(2)" class="action-btn">Next</button>
                </div>
                
                <div class="step-box" id="step3" style="display: none;">
                    <h5>Step 3: Split the string</h5>
                    <p>According to the pumping lemma, we can split s = xyz where:</p>
                    <ul>
                        <li>|xy| ≤ p (first p characters)</li>
                        <li>|y| > 0 (y can't be empty)</li>
                    </ul>
                    <p>Since |xy| ≤ p and our string starts with p a's, this means y must contain only a's!</p>
                    <div class="visual-example">
                        <span class="x-part">a</span><span class="y-part">a</span><span class="y-part">a</span>
                        <span class="z-part">b</span><span class="z-part">b</span><span class="z-part">b</span>
                    </div>
                    <p>In this example, x = "a", y = "aa", z = "bbb"</p>
                    <button onclick="pumpingTutorial.nextStep(3)" class="action-btn">Next</button>
                </div>
                
                <div class="step-box" id="step4" style="display: none;">
                    <h5>Step 4: Pump the string</h5>
                    <p>Now we need to show that there exists some i where xy<sup>i</sup>z is not in the language.</p>
                    <p>Let's try i = 2 (pumping y twice): xy<sup>2</sup>z = x + yy + z</p>
                    <div class="visual-example">
                        <span class="x-part">a</span><span class="y-part">a</span><span class="y-part">a</span><span class="y-part">a</span><span class="y-part">a</span>
                        <span class="z-part">b</span><span class="z-part">b</span><span class="z-part">b</span>
                    </div>
                    <p>Result: "aaaaabbb" - This has 5 a's and 3 b's!</p>
                    <p>We could also try i = 0 (removing y): xy<sup>0</sup>z = xz</p>
                    <div class="visual-example">
                        <span class="x-part">a</span>
                        <span class="z-part">b</span><span class="z-part">b</span><span class="z-part">b</span>
                    </div>
                    <p>Result: "abbb" - This has 1 a and 3 b's!</p>
                    <button onclick="pumpingTutorial.nextStep(4)" class="action-btn">Next</button>
                </div>
                
                <div class="step-box" id="step5" style="display: none;">
                    <h5>Step 5: Contradiction!</h5>
                    <p>We've shown that when we pump y (either by repeating it or removing it), we get strings with unequal numbers of a's and b's.</p>
                    <p>These pumped strings are not in the language {a<sup>n</sup>b<sup>n</sup> | n ≥ 0}.</p>
                    <p>This contradicts the pumping lemma's third condition, which states that xy<sup>i</sup>z must remain in the language for all i ≥ 0.</p>
                    <p>Therefore, our assumption that the language is regular must be false!</p>
                    <p><strong>Conclusion:</strong> The language {a<sup>n</sup>b<sup>n</sup> | n ≥ 0} is not regular.</p>
                    <div class="button-group">
                        <button onclick="pumpingTutorial.showNotationGuide()" class="action-btn">Back to Guide</button>
                        <button onclick="pumpingTutorial.showMoreExamples()" class="action-btn">More Examples</button>
                    </div>
                </div>
            </div>
        `;
    }

    nextStep(currentStep) {
        document.getElementById(`step${currentStep}`).style.display = "none";
        document.getElementById(`step${currentStep + 1}`).style.display = "block";
    }
    
    showMoreExamples() {
        const explanationPanel = document.getElementById("explanation-panel");
        explanationPanel.innerHTML = `
            <div class="explanation-header">
                <h3>More Pumping Lemma Examples</h3>
                <span class="close-btn" onclick="hideExplanation()">×</span>
            </div>
            <div class="tutorial-content">
                <h4>Example 1: {ww | w ∈ {a,b}*}</h4>
                <p>This language contains all strings that are a repetition of some pattern.</p>
                <p>For example: "abab" (w = "ab"), "aaaaaa" (w = "aaa"), "abcabc" (w = "abc")</p>
                <p>This language is not regular. We can prove this using the pumping lemma.</p>
                
                <h4>Example 2: {a^n b^m | n ≠ m}</h4>
                <p>This language contains strings with unequal numbers of a's and b's.</p>
                <p>For example: "aab", "abb", "aaaab"</p>
                <p>This language is not regular. We can prove this using the pumping lemma.</p>
                
                <h4>Example 3: {a^n | n is a prime number}</h4>
                <p>This language contains strings of a's where the length is a prime number.</p>
                <p>For example: "aa", "aaa", "aaaaa", "aaaaaaa"</p>
                <p>This language is not regular. We can prove this using the pumping lemma.</p>
                
                <button onclick="pumpingTutorial.showNotationGuide()" class="action-btn">Back to Guide</button>
            </div>
        `;
    }
}

export { PumpingTutorial };