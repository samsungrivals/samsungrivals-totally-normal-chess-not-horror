function generate_b64() {
    // Generate Base64 for replacement string
    const htmlSnippet = `<button class="hs-btn" onclick="showLoadingScreen(() => { showGameView(); openModal('quizmodal'); })" style="background: linear-gradient(135deg, #f1c40f, #e67e22);">❓ Impossible Quiz</button>
        <button class="hs-btn" onclick="showLoadingScreen(() => { showGameView(); openModal('drawmodal'); })" style="background: linear-gradient(135deg, #00c6ff, #0072ff);">🎨 Draw Shapes Minigame</button>`;
    
    // ... we don't have Node so we can't run this to get base64.
}
