$content = Get-Content "app.js" -Raw -Encoding UTF8

$target = @"
    for(let i=0; i<q.opts.length; i++) {
        optHtml += `<button class="btn" style="background:#34495e;" onclick="quizAnswer(`${i})">`${q.opts[i]}</button>`;
    }
    document.getElementById('quiz-options').innerHTML = optHtml;
};
"@

$replacement = @"
    for(let i=0; i<q.opts.length; i++) {
        optHtml += `<button class="btn" style="background:#34495e;" onclick="quizAnswer(`${i})">`${q.opts[i]}</button>`;
    }
    if (M.adminAbuse || M.adminUnlocked) {
        optHtml += `<div style="margin-top:15px; text-align:center;"><button class="btn" style="background:linear-gradient(90deg, #ff00ff, #00ffff); color:#000; font-weight:bold; width:100%;" onclick="currentQuizQ = quizQuestions.length; renderQuiz();">⭐ ADMIN SKIP ⭐</button></div>`;
    }
    document.getElementById('quiz-options').innerHTML = optHtml;
};
"@

$content = $content.Replace($target, $replacement)

$targetBug = @"
    // Add Stot Bug Detector to HTML dynamically to avoid editing index.html directly
    let adminBox = document.querySelector('#adminmodal .mbox');
    if(adminBox) {
        let bugBtn = document.createElement('div');
        bugBtn.className = 'adminitem';
        bugBtn.onclick = runStotBugDetector;
        bugBtn.innerHTML = '<b>🛠️ Stot Bug Detector</b> — Scan the game for bugs and auto-fix';
        adminBox.appendChild(bugBtn);
    }
"@

$replacementBug = @"
    // Stot Bug Detector Removed!
"@

$content = $content.Replace($targetBug, $replacementBug)

[System.IO.File]::WriteAllText("app.js", $content, [System.Text.Encoding]::UTF8)
Write-Host "Replaced quiz and bug detector."
