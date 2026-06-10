$utf8 = [System.Text.Encoding]::UTF8

# 1. Update index.html
$html = [System.IO.File]::ReadAllText("index.html", $utf8)

$drawModal = @"
  <div class="modal hidden" id="drawmodal" style="z-index:99999;">
    <div class="mbox" style="width:500px; max-width:90vw;">
      <div class="mtitle">📐 Draw the Perfect Shape <button class="mclose" onclick="closeModal('drawmodal')">✖</button></div>
      <div style="padding:15px; text-align:center;">
        <p style="margin-bottom:10px;">Select a shape and draw it perfectly for rewards!</p>
        <select id="drawShapeSelect" style="padding:5px; margin-bottom:10px; width:100%;">
          <option value="square">Square</option>
          <option value="circle">Circle</option>
          <option value="triangle">Triangle</option>
          <option value="hexagon">Hexagon</option>
        </select>
        <canvas id="drawCanvas" width="400" height="400" style="border:2px dashed #444; background:#111; cursor:crosshair; touch-action:none;"></canvas>
        <div id="drawResult" style="font-size:24px; font-weight:bold; color:#0f0; margin-top:10px; height:30px;"></div>
        <button class="tbbtn" onclick="clearDrawCanvas()" style="margin-top:10px;">Clear</button>
      </div>
    </div>
  </div>
"@
if (-not $html.Contains("id=`"drawmodal`"")) {
    $html = $html.Replace('<script src="app.js?v=46"></script>', "$drawModal`r`n  <script src=`"app.js?v=46`"></script>")
}

$bugBtn = '<div class="adminitem" onclick="runStotBugDetector()"><b>🛠️ Stot Bug Detector</b> — Scan the game for bugs and auto-fix</div>'
if (-not $html.Contains("runStotBugDetector")) {
    $html = $html.Replace('<div class="adminitem" onclick="adminAnnounce()"><b>📢 Global announcement</b> — broadcast a message</div>', "<div class=`"adminitem`" onclick=`"adminAnnounce()`"><b>📢 Global announcement</b> — broadcast a message</div>`r`n      $bugBtn")
}

$drawBtn = '<button class="hs-btn" onclick="openModal(''drawmodal'')" style="background: linear-gradient(135deg, #00c6ff, #0072ff);">🎨 Draw Shapes Minigame</button>'
$quizBtn = '<button class="hs-btn" onclick="showLoadingScreen(() => { showGameView(); openModal(''quizmodal''); })" style="background: linear-gradient(135deg, #f1c40f, #e67e22);">❔ Impossible Quiz</button>'
if (-not $html.Contains("Draw Shapes Minigame")) {
    $html = $html.Replace($quizBtn, "$quizBtn`r`n        $drawBtn")
}

[System.IO.File]::WriteAllText("index.html", $html, $utf8)
Write-Host "Patched index.html"
