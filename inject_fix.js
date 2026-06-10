// Force Draw Minigame Button Injection Robustly
setTimeout(() => {
    // Locate using onclick attribute instead of innerText to bypass any mojibake
    const quizBtn = document.querySelector('button[onclick*="quizmodal"]');
    if(quizBtn && !document.querySelector('#draw-minigame-btn-robust')) {
        let drawBtn = document.createElement('button');
        drawBtn.id = 'draw-minigame-btn-robust';
        drawBtn.className = 'hs-btn';
        drawBtn.style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
        drawBtn.onclick = () => { showGameView(); openModal('drawmodal'); };
        drawBtn.innerText = '🎨 Draw Shapes Minigame';
        
        // Ensure margin-top matches existing buttons if needed
        drawBtn.style.marginTop = '10px';
        
        quizBtn.parentNode.insertBefore(drawBtn, quizBtn.nextSibling);
    }
    
    // Ensure modal is present
    if(!document.getElementById('drawmodal')) {
        let m = document.createElement('div');
        m.className = 'modal hidden';
        m.id = 'drawmodal';
        m.style.zIndex = '99999';
        m.innerHTML = `<div class="mbox" style="width:500px; max-width:90vw;">
          <div class="mtitle">📐 Draw the Perfect Shape <button class="mclose" onclick="closeModal('drawmodal')">✖</button></div>
          <div style="padding:15px; text-align:center;">
            <p style="margin-bottom:10px;">Select a shape and draw it perfectly for rewards!</p>
            <select id="drawShapeSelect" style="padding:5px; margin-bottom:10px; width:100%; color:#000;">
              <option value="square">Square</option>
              <option value="circle">Circle</option>
              <option value="triangle">Triangle</option>
              <option value="hexagon">Hexagon</option>
            </select>
            <canvas id="drawCanvas" width="400" height="400" style="border:2px dashed #444; background:#111; cursor:crosshair; touch-action:none;"></canvas>
            <div id="drawResult" style="font-size:24px; font-weight:bold; color:#0f0; margin-top:10px; height:30px;"></div>
            <button class="tbbtn" onclick="clearDrawCanvas()" style="margin-top:10px;">Clear</button>
          </div>
        </div>`;
        document.body.appendChild(m);
        
        let cvs = document.getElementById('drawCanvas');
        if(cvs) {
            cvs.addEventListener('mousedown', (e) => { isDrawing = true; drawPts = []; clearDrawCanvas(); });
            cvs.addEventListener('mousemove', (e) => {
                if(!isDrawing) return;
                let rect = cvs.getBoundingClientRect();
                let x = e.clientX - rect.left; let y = e.clientY - rect.top;
                drawPts.push({x,y});
                let ctx = cvs.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(x,y,2,2);
            });
            cvs.addEventListener('mouseup', endDrawShape);
            cvs.addEventListener('mouseleave', () => { if(isDrawing) endDrawShape(); });
        }
    }
}, 2500); // Increased timeout to ensure DOM is fully ready
