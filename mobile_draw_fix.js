// Overwrite the draw minigame injection to fix mobile scrolling
window.injectDrawMinigame = function() {
    if(!document.getElementById('draw-minigame-container')) {
        let m = document.createElement('div');
        m.id = 'draw-minigame-container';
        m.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:999999;display:flex;flex-direction:column;align-items:center;padding-top:20px;color:#fff;overflow-y:auto;';
        m.innerHTML = `
        <div class="mbox" style="max-width:500px; display:flex; flex-direction:column; align-items:center;">
          <div class="mheader" style="width:100%; display:flex; justify-content:space-between;">
            <div class="mtitle">🎨 Draw Shapes Minigame</div>
            <button class="tbcross" onclick="document.getElementById('draw-minigame-container').remove()">×</button>
          </div>
          <div style="padding:20px; text-align:center; width:100%; display:flex; flex-direction:column; align-items:center;">
            <p style="margin-bottom:10px;">Select a shape and draw it! 95%+ accuracy grants rewards.</p>
            <div style="display:flex; gap:10px; margin-bottom:10px; align-items:center; flex-wrap:wrap; justify-content:center;">
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
            <button class="tbbtn" onclick="document.getElementById('draw-minigame-container').remove()" style="margin-top:20px; background:#e74c3c;">Close Minigame</button>
          </div>
        </div>`;
        document.body.appendChild(m);
        
        let cvs = document.getElementById('drawCanvas');
        if(cvs) {
            cvs.addEventListener('mousedown', (e) => { window.isDrawing = true; window.drawPts = []; clearDrawCanvas(); });
            cvs.addEventListener('touchstart', (e) => { window.isDrawing = true; window.drawPts = []; clearDrawCanvas(); });
            
            let moveHandler = (e) => {
                if(!window.isDrawing) return;
                let rect = cvs.getBoundingClientRect();
                let clientX = e.clientX;
                let clientY = e.clientY;
                if(e.touches && e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                    e.preventDefault(); // Prevent scrolling while drawing on mobile
                }
                let x = clientX - rect.left; let y = clientY - rect.top;
                window.drawPts.push({x,y});
                let ctx = cvs.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(x,y,2,2);
            };
            cvs.addEventListener('mousemove', moveHandler);
            cvs.addEventListener('touchmove', moveHandler, {passive: false});
            
            cvs.addEventListener('mouseup', window.endDrawShape);
            cvs.addEventListener('touchend', window.endDrawShape);
            cvs.addEventListener('mouseleave', () => { if(window.isDrawing) window.endDrawShape(); });
        }
    }
};
