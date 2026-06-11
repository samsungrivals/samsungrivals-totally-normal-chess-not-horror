$content = Get-Content "app.js" -Raw -Encoding UTF8

$target = @"
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

$replacement = ""

$content = $content.Replace($target, $replacement)
[System.IO.File]::WriteAllText("app.js", $content, [System.Text.Encoding]::UTF8)
Write-Host "Removed Bug Detector Button"
