$content = Get-Content "app.js" -Raw -Encoding UTF8

$target = @"
        <div class="mbox" style="max-width:500px;">
          <div class="mheader">
            <div class="mtitle">🎨 Draw Shapes Minigame</div>
            <button class="tbcross" onclick="document.getElementById('draw-minigame-container').remove()">×</button>
          </div>
          <div style="padding:20px; text-align:center;">
            <p style="margin-bottom:10px;">Select a shape and draw it! 95%+ accuracy grants rewards.</p>
            <select id="drawShapeSelect" class="tbselect" style="margin-bottom:10px; padding:5px;">
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
"@

$replacement = @"
        <div class="mbox" style="max-width:500px; display:flex; flex-direction:column; align-items:center;">
          <div class="mheader" style="width:100%; display:flex; justify-content:space-between;">
            <div class="mtitle">🎨 Draw Shapes Minigame</div>
            <button class="tbcross" onclick="document.getElementById('draw-minigame-container').remove()">×</button>
          </div>
          <div style="padding:20px; text-align:center; width:100%; display:flex; flex-direction:column; align-items:center;">
            <p style="margin-bottom:10px;">Select a shape and draw it! 95%+ accuracy grants rewards.</p>
            <div style="display:flex; gap:10px; margin-bottom:10px; align-items:center;">
              <select id="drawShapeSelect" class="tbselect" style="padding:5px;">
                <option value="square">Square</option>
                <option value="circle">Circle</option>
                <option value="triangle">Triangle</option>
                <option value="hexagon">Hexagon</option>
              </select>
              <button class="tbbtn" onclick="clearDrawCanvas()">Clear Canvas</button>
            </div>
            <div id="drawResult" style="font-size:24px; font-weight:bold; color:#0f0; margin-bottom:10px; height:30px;"></div>
            <canvas id="drawCanvas" width="400" height="400" style="border:2px dashed #444; background:#111; cursor:crosshair; touch-action:none; max-width:90vw; max-height:50vh;"></canvas>
          </div>
        </div>
"@

$content = $content.Replace($target, $replacement)
[System.IO.File]::WriteAllText("app.js", $content, [System.Text.Encoding]::UTF8)
Write-Host "Moved buttons"
