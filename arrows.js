// --- ARROW DRAWING ---
let _arrowStart = null;
let _arrows = [];
const _origRenderB = typeof renderBoard === "function" ? renderBoard : null;
if(_origRenderB) {
  renderBoard = function() {
    _origRenderB();
    const b = document.getElementById("board");
    if(b) {
      b.style.position = "relative";
      let svg = document.getElementById("arrow-layer");
      if(!svg) {
        b.insertAdjacentHTML("beforeend", '<svg id="arrow-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:100;"><defs><marker id="arrowhead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><polygon points="0 0, 4 2, 0 4" fill="rgba(255, 170, 0, 0.8)"/></marker></defs></svg>');
      }
      drawArrows();
    }
  };
}
function drawArrows() {
  const svg = document.getElementById("arrow-layer");
  if(!svg) return;
  svg.innerHTML = '<defs><marker id="arrowhead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><polygon points="0 0, 4 2, 0 4" fill="rgba(255, 170, 0, 0.8)"/></marker></defs>';
  _arrows.forEach(a => {
    const sqW = 100 / 8;
    const x1 = a.c1 * sqW + sqW/2, y1 = a.r1 * sqW + sqW/2;
    const x2 = a.c2 * sqW + sqW/2, y2 = a.r2 * sqW + sqW/2;
    svg.innerHTML += `<line x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%" stroke="rgba(255, 170, 0, 0.8)" stroke-width="2%" marker-end="url(#arrowhead)" />`;
  });
}
document.addEventListener("contextmenu", e => {
  if(e.target.closest && e.target.closest("#board")) e.preventDefault();
});
document.addEventListener("mousedown", e => {
  if(e.button === 2 && e.target.closest && e.target.closest(".sq")) {
    const sq = e.target.closest(".sq");
    _arrowStart = { r: parseInt(sq.dataset.r), c: parseInt(sq.dataset.c) };
  } else if(e.button === 0) {
    _arrows = [];
    drawArrows();
  }
});
document.addEventListener("mouseup", e => {
  if(e.button === 2 && _arrowStart && e.target.closest && e.target.closest(".sq")) {
    const sq = e.target.closest(".sq");
    const r2 = parseInt(sq.dataset.r), c2 = parseInt(sq.dataset.c);
    if(_arrowStart.r !== r2 || _arrowStart.c !== c2) {
      const idx = _arrows.findIndex(a => a.r1===_arrowStart.r && a.c1===_arrowStart.c && a.r2===r2 && a.c2===c2);
      if(idx > -1) _arrows.splice(idx, 1);
      else _arrows.push({r1:_arrowStart.r, c1:_arrowStart.c, r2, c2});
      drawArrows();
    } else {
      _arrows = [];
      drawArrows();
    }
  }
  _arrowStart = null;
});
