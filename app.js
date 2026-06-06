function formatNumber(n) { return (Number(n)||0).toLocaleString(); }

const SYM={'K':'♔','Q':'♕','R':'♖','B':'♗','N':'♘','P':'♙','k':'♚','q':'♛','r':'♜','b':'♝','n':'♞','p':'♟'};
const VAL={'p':1,'n':3,'b':3,'r':5,'q':9,'k':0};
const OPENINGS = {
  "e4 c5": "Sicilian Defense",
  "e4 e5": "Open Game",
  "e4 e5 Nf3 Nc6 Bb5": "Ruy Lopez",
  "e4 e5 Nf3 Nc6 Bc4": "Italian Game",
  "d4 d5 c4": "Queen's Gambit",
  "e4 c6": "Caro-Kann Defense",
  "e4 e6": "French Defense",
  "e4 e5 Nf3 Nc6 d4": "Scotch Game",
  "d4 Nf6 c4 g6 Nc3 Bg7": "King's Indian Defense",
  "e4 d5": "Scandinavian Defense",
  "f4": "Bird's Opening",
  "b3": "Larsen's Opening",
  "g3": "King's Fianchetto",
  "c4": "English Opening",
  "d4 Nf6": "Indian Defense",
  "e4 e5 f4": "King's Gambit"
};
const PALETTES=[
  {wn:'White',bn:'Black',w:'#ffffff',wo:'#000000',b:'#111111',bo:'#ffffff'},
  {wn:'Gold',bn:'Purple',w:'#ffd54a',wo:'#3a2600',b:'#6a1b9a',bo:'#ffffff'},
  {wn:'Red',bn:'Blue',w:'#ff6b6b',wo:'#3a0000',b:'#1976d2',bo:'#ffffff'},
  {wn:'Cyan',bn:'Magenta',w:'#26c6da',wo:'#002a30',b:'#d81b60',bo:'#ffffff'},
  {wn:'Green',bn:'Crimson',w:'#aed581',wo:'#1a3000',b:'#c62828',bo:'#ffffff'},
  {wn:'Orange',bn:'Navy',w:'#ffa726',wo:'#3a1f00',b:'#1a237e',bo:'#ffffff'},
  {wn:'Pink',bn:'Teal',w:'#f48fb1',wo:'#3a0010',b:'#00695c',bo:'#ffffff'},
  {wn:'Silver',bn:'Brown',w:'#e0e0e0',wo:'#1a1a1a',b:'#5d4037',bo:'#ffe0b2'},
  {wn:'Aqua',bn:'Violet',w:'#80deea',wo:'#003a40',b:'#4a148c',bo:'#e1bee7'},
  {wn:'Yellow',bn:'Charcoal',w:'#fff176',wo:'#3a2a00',b:'#212121',bo:'#fdd835'}
];

function applyRandomColors(){
  let p;
  if(typeof M!=='undefined'&&M&&M.pieceSkin&&M.pieceSkin!=='random'&&typeof PIECE_SKINS!=='undefined'&&PIECE_SKINS[M.pieceSkin]&&PIECE_SKINS[M.pieceSkin].palette){
    p=PIECE_SKINS[M.pieceSkin].palette;
  }else{
    p=PALETTES[Math.floor(Math.random()*PALETTES.length)];
  }
  if(typeof M!=='undefined' && M && M.pieceSkin === 'inverted') { document.body.classList.add('inverted-pieces'); }
  else { document.body.classList.remove('inverted-pieces'); }
  const r=document.documentElement.style;
  r.setProperty('--pc-w',p.w);r.setProperty('--pc-wo',p.wo);
  r.setProperty('--pc-b',p.b);r.setProperty('--pc-bo',p.bo);
  return p;
}

let G; // game state

function showHomeScreen() {
  document.getElementById('home-screen').classList.remove('hidden');
  document.getElementById('main-game-container').classList.add('hidden');
}
function showGameView() {
  document.getElementById('home-screen').classList.add('hidden');
  document.getElementById('main-game-container').classList.remove('hidden');
}

function generateChess960() {
    let br = new Array(8).fill('');
    br[[1,3,5,7][Math.floor(Math.random()*4)]] = 'B';
    br[[0,2,4,6][Math.floor(Math.random()*4)]] = 'B';
    let empty = () => { let a=[]; for(let i=0;i<8;i++) if(!br[i]) a.push(i); return a; };
    br[empty()[Math.floor(Math.random()*empty().length)]] = 'Q';
    br[empty()[Math.floor(Math.random()*empty().length)]] = 'N';
    br[empty()[Math.floor(Math.random()*empty().length)]] = 'N';
    let rem = empty();
    br[rem[0]] = 'R'; br[rem[1]] = 'K'; br[rem[2]] = 'R';
    return br;
}

function newGame(){
  if(typeof stopClocks==='function')stopClocks(); // don't auto-run timers (was causing spurious "defeat on time")
  const pal=applyRandomColors();
  let br = ['R','N','B','Q','K','B','N','R'];
  if(typeof M !== 'undefined' && M && M.currentVariant && M.currentVariant.chess960) {
      br = generateChess960();
  }
  let brB = br.map(p => p.toLowerCase());
  G={
    palette:pal,
    board:[
      brB,
      ['p','p','p','p','p','p','p','p'],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['P','P','P','P','P','P','P','P'],
      br,
    ],
    turn:'white',
    cr:{w:{k:true,q:true},b:{k:true,q:true}},
    ep:null,
    sel:null,
    last:null,
    status:'playing',
    capW:[],capB:[],
    hist:[],
    promo:null,
    checksW:0,
    checksB:0
  };
  buildLabels();
  render();
}

function isU(p){return p&&p===p.toUpperCase()}
function isL(p){return p&&p!==p.toUpperCase()}
function own(p,t){return t==='white'?isU(p):isL(p)}
function opp(p,t){return t==='white'?isL(p):isU(p)}
function inB(r,c){return r>=0&&r<8&&c>=0&&c<8}
function flip(t){return t==='white'?'black':'white'}
function fc(c){return String.fromCharCode(97+c)}
function fr(r){return String(8-r)}

function pseudo(b,r,c,ep,cr,atk=false){
  const p=b[r][c];if(!p)return[];
  const w=isU(p),t=w?'white':'black',ms=[];
  const type=p.toLowerCase();

  function slide(dirs){
    for(const[dr,dc]of dirs){
      for(let n=1;n<8;n++){
        const nr=r+dr*n,nc=c+dc*n;
        if(!inB(nr,nc))break;
        const tg=b[nr][nc];
        if(!tg){ms.push([nr,nc])}else{if(opp(tg,t))ms.push([nr,nc]);break}
      }
    }
  }

  if(type==='p'){
    const dir=w?-1:1,sr=w?6:1;
    for(const dc of[-1,1]){
      const nr=r+dir,nc=c+dc;
      if(inB(nr,nc)){
        if(atk)ms.push([nr,nc]);
        else if(opp(b[nr][nc],t))ms.push([nr,nc]);
        else if(ep&&nr===ep[0]&&nc===ep[1])ms.push([nr,nc]);
      }
    }
    if(!atk&&inB(r+dir,c)&&!b[r+dir][c]){
      ms.push([r+dir,c]);
      if(r===sr&&!b[r+2*dir][c])ms.push([r+2*dir,c]);
    }
  }else if(type==='n'){
    for(const[dr,dc]of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){
      const nr=r+dr,nc=c+dc;
      if(inB(nr,nc)&&!own(b[nr][nc],t))ms.push([nr,nc]);
    }
  }else if(type==='b'){slide([[-1,-1],[-1,1],[1,-1],[1,1]])}
  else if(type==='r'){slide([[-1,0],[1,0],[0,-1],[0,1]])}
  else if(type==='q'){slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]])}
  else if(type==='k'){
    for(const[dr,dc]of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
      const nr=r+dr,nc=c+dc;
      if(inB(nr,nc)){
          const target = b[nr][nc];
          if(!own(target,t)) {
              if (target && typeof M !== 'undefined' && M && M.currentVariant && M.currentVariant.atomic) {
                  continue; // Kings cannot capture in atomic chess
              }
              ms.push([nr,nc]);
          }
      }
    }
    if(!atk&&cr&&c===4 && (!M || !M.currentVariant || !M.currentVariant.noCastling)){
      const row=w?7:0,rts=w?cr.w:cr.b;
      if(r===row){
        if(rts.k&&!b[row][5]&&!b[row][6]&&b[row][7]?.toLowerCase()==='r')ms.push([row,6]);
        if(rts.q&&!b[row][3]&&!b[row][2]&&!b[row][1]&&b[row][0]?.toLowerCase()==='r')ms.push([row,2]);
      }
    }
  }
  return ms;
}

function attacked(b,r,c,byW){
  for(let rr=0;rr<8;rr++)for(let cc=0;cc<8;cc++){
    const p=b[rr][cc];
    if(!p||isU(p)!==byW)continue;
    if(pseudo(b,rr,cc,null,null,true).some(([mr,mc])=>mr===r&&mc===c))return true;
  }
  return false;
}

function kingPos(b,w){
  const k=w?'K':'k';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(b[r][c]===k)return[r,c];
  return null;
}

function inCheck(b,w){
  const kp=kingPos(b,w);
  return kp?attacked(b,kp[0],kp[1],!w):false;
}

function apply(b,from,to,ep,cr,promo){
  const nb=b.map(row=>[...row]);
  const ncr={w:{...cr.w},b:{...cr.b}};
  let nep=null;
  const[fr2,fc2]=from,[tr,tc]=to;
  const p=nb[fr2][fc2],w=isU(p),type=p.toLowerCase();
  const cap=nb[tr][tc];

  // Captured rook removes castling rights
  if(cap==='R'){if(tr===7&&tc===7)ncr.w.k=false;if(tr===7&&tc===0)ncr.w.q=false}
  if(cap==='r'){if(tr===0&&tc===7)ncr.b.k=false;if(tr===0&&tc===0)ncr.b.q=false}

  if(type==='p'){
    if(ep&&tr===ep[0]&&tc===ep[1])nb[fr2][tc]=''; // en passant: remove captured pawn
    if(Math.abs(tr-fr2)===2)nep=[(fr2+tr)/2,fc2];
    if(tr===0||tr===7)nb[fr2][fc2]=promo||(w?'Q':'q');
  }
  if(type==='k'){
    if(Math.abs(tc-fc2)===2){
      if(tc===6){nb[fr2][5]=nb[fr2][7];nb[fr2][7]=''}
      else{nb[fr2][3]=nb[fr2][0];nb[fr2][0]=''}
    }
    if(w){ncr.w.k=false;ncr.w.q=false}else{ncr.b.k=false;ncr.b.q=false}
  }
  if(type==='r'){
    if(w){if(fc2===7)ncr.w.k=false;if(fc2===0)ncr.w.q=false}
    else{if(fc2===7)ncr.b.k=false;if(fc2===0)ncr.b.q=false}
  }
  nb[tr][tc]=nb[fr2][fc2];nb[fr2][fc2]='';
  
  if(typeof M !== 'undefined' && M && M.currentVariant && M.currentVariant.atomic && (cap || (type==='p' && ep && tr===ep[0] && tc===ep[1]))) {
      for(let i = -1; i <= 1; i++) {
          for(let j = -1; j <= 1; j++) {
              let rr = tr + i, cc = tc + j;
              if(rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
                  let pp = nb[rr][cc];
                  if(pp && pp.toLowerCase() !== 'p') {
                      nb[rr][cc] = '';
                  }
              }
          }
      }
      nb[tr][tc] = ''; // Capturing piece is also destroyed
  }
  return{board:nb,ep:nep,cr:ncr};
}

function legal(b,r,c,ep,cr,t){
  const p=b[r][c];if(!p||!own(p,t))return[];
  const w=isU(p),type=p.toLowerCase();
  return pseudo(b,r,c,ep,cr).filter(([tr,tc])=>{
    if(type==='k'&&Math.abs(tc-c)===2){
      if(inCheck(b,w))return false;
      if(tc===6&&attacked(b,r,5,!w))return false;
      if(tc===2&&attacked(b,r,3,!w))return false;
    }
    const res=apply(b,[r,c],[tr,tc],ep,cr);
    if(typeof M !== 'undefined' && M && M.currentVariant && M.currentVariant.atomic) {
        if(!kingPos(res.board, w)) return false; // exploding own king is illegal
        if(!kingPos(res.board, !w)) return true; // exploding opponent king ignores check!
    }
    return !inCheck(res.board,w);
  });
}

function allLegal(b,ep,cr,t){
  const all=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=b[r][c];
    if(p&&own(p,t))for(const mv of legal(b,r,c,ep,cr,t))all.push({from:[r,c],to:mv});
  }
  return all;
}

function gameStatus(b,ep,cr,t){
  if(typeof M !== 'undefined' && M && M.currentVariant && M.currentVariant.koth) {
    const center = [b[3][3], b[3][4], b[4][3], b[4][4]];
    if(center.includes('K') || center.includes('k')) return 'checkmate';
  }
  if(!kingPos(b, true) || !kingPos(b, false)) return 'checkmate';
  
  const w=t==='white',chk=inCheck(b,w),has=allLegal(b,ep,cr,t).length>0;
  if(typeof M !== 'undefined' && M && M.currentVariant) {
    if(M.currentVariant.firstCheck && chk) return 'checkmate';
    if(M.currentVariant.threeCheck && typeof G !== 'undefined' && G) {
        let cw = G.checksW + (chk && !w ? 1 : 0);
        let cb = G.checksB + (chk && w ? 1 : 0);
        if(cw >= 3 || cb >= 3) return 'checkmate';
    }
  }
  if(!has)return chk?'checkmate':'stalemate';
  return chk?'check':'playing';
}

function alg(b,from,to,ep,cr,t,promo){
  const[fr2,fc2]=from,[tr,tc]=to;
  const p=b[fr2][fc2],type=p.toLowerCase(),w=isU(p);
  const cap=b[tr][tc];
  const isEp=type==='p'&&ep&&tr===ep[0]&&tc===ep[1];
  const isCastle=type==='k'&&Math.abs(tc-fc2)===2;
  const isPromo=type==='p'&&(tr===0||tr===7);
  const tf=fc(tc),tr2=fr(tr);

  if(isCastle)return tc===6?'O-O':'O-O-O';
  if(type==='p'){
    let n=(cap||isEp)?`${fc(fc2)}x${tf}${tr2}`:`${tf}${tr2}`;
    if(isPromo)n+=`=${(promo||'Q').toUpperCase()}`;
    return n;
  }
  const letter=type.toUpperCase();
  let df='',dr2='';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    if(r===fr2&&c===fc2)continue;
    const pp=b[r][c];
    if(!pp||pp.toLowerCase()!==type||!own(pp,t))continue;
    if(legal(b,r,c,ep,cr,t).some(([mr,mc])=>mr===tr&&mc===tc)){
      if(c!==fc2)df=fc(fc2);else dr2=fr(fr2);
    }
  }
  return`${letter}${df}${dr2}${(cap||isEp)?'x':''}${tf}${tr2}`;
}

function buildLabels(){
  const rl=document.getElementById('rlabels');
  rl.innerHTML='';
  for(let r=0;r<8;r++){const d=document.createElement('div');d.className='rlabel';d.textContent=8-r;rl.appendChild(d)}
  const fl=document.getElementById('flabels');
  fl.innerHTML='';
  for(const l of['a','b','c','d','e','f','g','h']){const d=document.createElement('div');d.className='flabel';d.textContent=l;fl.appendChild(d)}
}

function evalBoard(b){
  let score = 0;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p = b[r][c];
    if(!p) continue;
    const v = VAL[p.toLowerCase()];
    if(isU(p)) score += v; else score -= v;
  }
  return score * 100;
}

function render(){
  renderBoard();updateStatus();updateCap();updateHistory();
  if(typeof renderModeBadge==='function')renderModeBadge();
  
  // OPENING AND EVAL BAR LOGIC
  const ob = document.getElementById('opening-board');
  const eb = document.getElementById('eval-bar-fill');
  const es = document.getElementById('eval-score');
  
  if(G && ob && eb && es) {
    let histStr = "";
    for(const h of G.hist){
      if(h.w) histStr += h.w.replace(/[+#]/g,'') + " ";
      if(h.b) histStr += h.b.replace(/[+#]/g,'') + " ";
    }
    histStr = histStr.trim();
    
    let opName = "Starting Position";
    if(G.status === 'checkmate') opName = "Checkmate!";
    else if(G.status === 'stalemate') opName = "Stalemate";
    else if(histStr.length > 0) {
      let bestMatch = "";
      for(let k in OPENINGS) {
        if(histStr.startsWith(k) && k.length > bestMatch.length) {
          bestMatch = k;
        }
      }
      if(bestMatch) opName = OPENINGS[bestMatch];
      else opName = "Custom Variation";
    }
    
    ob.textContent = opName;
    ob.style.opacity = '1';
    
    const ev = evalBoard(G.board);
    // Score format: 1 pawn = 100.
    const pawns = ev / 100;
    es.textContent = (pawns > 0 ? "+" : "") + pawns.toFixed(1);
    
    // Eval bar height: 50% is 0. 100% is +500 (5 pawns).
    const pct = Math.max(0, Math.min(100, 50 + (ev / 10)));
    eb.style.height = pct + '%';
    eb.style.background = (pct > 50) ? '#fff' : '#444';
  }
}

function renderBoard(){
  const el=document.getElementById('board');
  el.innerHTML='';
  const s=G;
  const over=s.status==='checkmate'||s.status==='stalemate';
  const w=s.turn==='white';
  const ckp=(s.status==='check'||s.status==='checkmate')?kingPos(s.board,w):null;
  const selMoves=s.sel?new Set(legal(s.board,s.sel[0],s.sel[1],s.ep,s.cr,s.turn).map(([r,c])=>`${r},${c}`)):new Set();

  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const sq=document.createElement('div');
    sq.id=`sq-${r}-${c}`;
    sq.className=`sq ${(r+c)%2===0?'light':'dark'}`;
    sq.style.position = 'relative';
    sq.dataset.r=r;sq.dataset.c=c;
    
    const isSel=s.sel&&s.sel[0]===r&&s.sel[1]===c;
    const isLF=s.last&&s.last.from[0]===r&&s.last.from[1]===c;
    const isLT=s.last&&s.last.to[0]===r&&s.last.to[1]===c;
    const isChk=ckp&&ckp[0]===r&&ckp[1]===c;
    if(isSel)sq.classList.add('selected');
    else if(isLF)sq.classList.add('lf');
    else if(isLT)sq.classList.add('lt');
    if(isChk)sq.classList.add('incheck');

    const piece=s.board[r][c];
    if(piece){const sp=document.createElement('span');sp.className='pc '+(isU(piece)?'w':'b');sp.textContent=SYM[piece];sq.appendChild(sp)}

    if(!over&&selMoves.has(`${r},${c}`)){
      const m=document.createElement('div');m.className=piece?'ring':'dot';sq.appendChild(m);
    }
    if(!over)sq.addEventListener('click',()=>click(r,c));
    el.appendChild(sq);
  }

  // Draw arrow for last move
  if(s.last) {
     const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
     svg.style.position="absolute";
     svg.style.top="0"; svg.style.left="0";
     svg.style.width="100%"; svg.style.height="100%";
     svg.style.pointerEvents="none";
     svg.style.zIndex="10";
     
     const arrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
     const size = el.clientWidth/8 || 50; 
     const y1 = s.last.from[0]*size + size/2;
     const x1 = s.last.from[1]*size + size/2;
     const y2 = s.last.to[0]*size + size/2;
     const x2 = s.last.to[1]*size + size/2;
     const mqColors = ['#ff4444', '#ff8844', '#ffcc00', '#aaaaaa', '#88cc88', '#44ff44', '#00ffff', '#cc88ff'];
     const arrowCol = typeof s.last.mqIndex !== 'undefined' ? mqColors[s.last.mqIndex] : "#ffaa00";

     arrow.setAttribute("x1", x1);
     arrow.setAttribute("y1", y1);
     arrow.setAttribute("x2", x2);
     arrow.setAttribute("y2", y2);
     arrow.setAttribute("stroke", arrowCol);
     arrow.setAttribute("stroke-width", "3");
     arrow.setAttribute("marker-end", "url(#arrowhead)");
     
     const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
     defs.innerHTML = `<marker id="arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><polygon points="0 0, 6 2.5, 0 5" fill="${arrowCol}"/></marker>`;
     svg.appendChild(defs);
     svg.appendChild(arrow);
     el.appendChild(svg);
  }

  applySkinToBoard();
}

function click(r,c){
  const s=G;
  if(s.promo)return;
  if(s.opponent&&s.opponent.type==='ai'&&s.turn===s.opponent.side)return;
  const piece=s.board[r][c];
  if(s.sel){
    const lms=legal(s.board,s.sel[0],s.sel[1],s.ep,s.cr,s.turn);
    if(lms.some(([tr,tc])=>tr===r&&tc===c)){doMove(s.sel,[r,c]);return}
  }
  s.sel=piece&&own(piece,s.turn)?[r,c]:null;
  renderBoard();
}

function doMove(from,to,promo){
  const s=G;
  const[fr2,fc2]=from,[tr,tc]=to;
  const p=s.board[fr2][fc2],type=p.toLowerCase(),w=isU(p);
  const cap=s.board[tr][tc];
  const isEp=type==='p'&&s.ep&&tr===s.ep[0]&&tc===s.ep[1];
  const isPromo=type==='p'&&(tr===0||tr===7);

  if(isPromo&&!promo){
    s.promo={from,to};
    showPromo(w);return;
  }

  const notation=alg(s.board,from,to,s.ep,s.cr,s.turn,promo);
  
  if(s.type === 'puzzle' && s.turn === s.puzzleSide) {
     const files='abcdefgh', ranks='87654321';
     const moveStr = files[fc2]+ranks[fr2]+files[tc]+ranks[tr]+(promo||'');
     if(moveStr !== s.puzzleMoves[s.puzzleStep]){
         showAnnouncement('❌ Incorrect Move! Puzzle Failed. -15 ELO');
         s.status='failed';
         M.puzzleElo = Math.max(100, (M.puzzleElo||1000) - 15);
         saveMeta(); refreshUI();
         s.sel=null;
         render();
         return;
     }
     s.puzzleStep++;
     if(s.puzzleStep >= s.puzzleMoves.length){
        showAnnouncement('✅ Puzzle Solved! +15 ELO');
        s.status='solved';
        M.puzzleElo = (M.puzzleElo||1000) + (window.hasGlobalAbuse ? 30 : 15);
        saveMeta(); refreshUI();
     }
  }
  // Real Move Quality Evaluation using evalBoard
  const qualities = ['Blunder', 'Bad Move', 'Inaccuracy', 'Decent', 'Good', 'Great', 'Brilliant', 'Only Move'];
  const colors = ['#ff4444', '#ff8844', '#ffcc00', '#aaaaaa', '#88cc88', '#44ff44', '#00ffff', '#cc88ff'];
  const symbols = ['??', '?', '?!', '', '!', '!!', '!!!', '★'];
  
  let preEval = typeof evalBoard === 'function' ? evalBoard(s.board) : 0;
  const res=apply(s.board,from,to,s.ep,s.cr,promo);
  s.board=res.board;s.ep=res.ep;s.cr=res.cr;
  let postEval = typeof negamax === 'function' ? -negamax(s.board, s.ep, s.cr, flip(s.turn), 1, -Infinity, Infinity) * (w ? 1 : -1) : (typeof evalBoard === 'function' ? evalBoard(s.board) : 0);
  
  let diff = w ? postEval - preEval : preEval - postEval;
  let mqIndex = 3; // Decent by default
  
  if (diff < -300) mqIndex = 0; // Blunder
  else if (diff < -150) mqIndex = 1; // Bad Move
  else if (diff < -50) mqIndex = 2; // Inaccuracy
  else if (diff > 300 && cap && VAL[cap.toLowerCase()] > VAL[type]) mqIndex = 6; // Brilliant
  else if (diff > 150) mqIndex = 5; // Great
  else if (diff > 50) mqIndex = 4; // Good
  
  s.last={from,to,mqIndex};s.sel=null;

  if(cap){if(w)s.capW.push(cap);else s.capB.push(cap)}
  if(isEp){if(w)s.capW.push('p');else s.capB.push('P')}

  s.turn=flip(s.turn);
  s.promo=null;
  const nowChk = inCheck(s.board, s.turn==='white');
  if(nowChk) {
      if(s.turn==='white') s.checksB++; else s.checksW++;
  }
  s.status=gameStatus(s.board,s.ep,s.cr,s.turn);

  if(s.status==='checkmate') mqIndex = 6; // Brilliant checkmate
  s.last.mqIndex = mqIndex;

  const sfx=s.status==='checkmate'?'#':s.status==='check'?'+':'';
  const note=notation+sfx + `<span style="color:${colors[mqIndex]};font-size:11px;margin-left:4px" title="${qualities[mqIndex]}">${symbols[mqIndex]}</span>`;

  if(w){s.hist.push({w:note,b:''})}
  else{
    if(s.hist.length&&s.hist[s.hist.length-1].b==='')s.hist[s.hist.length-1].b=note;
    else s.hist.push({w:'...',b:note});
  }

  document.getElementById('promo').classList.add('hidden');
  render();
  if(typeof M!=='undefined'&&M){M.totalMoves++;saveMeta();checkAdminUnlock();refreshUI()}
  if(typeof maybeApplyElo==='function')maybeApplyElo();
  if(typeof maybeAIMove==='function')maybeAIMove();
}

function showPromo(w){
  const pieces=w?['Q','R','B','N']:['q','r','b','n'];
  const el=document.getElementById('promochoices');
  el.innerHTML='';
  for(const pp of pieces){
    const btn=document.createElement('div');btn.className='pchoice';btn.textContent=SYM[pp];
    btn.onclick=()=>{const{from,to}=G.promo;doMove(from,to,pp)};
    el.appendChild(btn);
  }
  document.getElementById('promo').classList.remove('hidden');
}

function updateStatus(){
  const s=G,w=s.turn==='white';
  const tn=w?s.palette.wn:s.palette.bn;
  const st=document.getElementById('stxt');
  const tpc=document.getElementById('tpc');
  const tlbl=document.getElementById('tlbl');
  st.className='stxt';
  tpc.className='tpc pc';
  if(s.status==='checkmate'){
    const winner=flip(s.turn);
    const wn=winner==='white'?s.palette.wn:s.palette.bn;
    st.textContent=`${wn} wins!`;
    st.classList.add('mate');
    tpc.textContent='♚';tpc.classList.add(winner==='white'?'w':'b');
    tlbl.textContent='Checkmate!';
    if(!s.reviewShown) {
      s.reviewShown = true;
      setTimeout(() => openModal('reviewmodal'), 1500);
    }
  }else if(s.status==='stalemate'){
    st.textContent='Draw by stalemate';st.classList.add('draw');
    tpc.textContent='½';tlbl.textContent='Stalemate';
    if(!s.reviewShown) {
      s.reviewShown = true;
      setTimeout(() => openModal('reviewmodal'), 1500);
    }
  }else if(s.status==='check'){
    st.textContent=`${tn} in check`;st.classList.add('check');
    tpc.textContent='♚';tpc.classList.add(w?'w':'b');tlbl.textContent=`${tn} to move`;
  }else{
    st.textContent=`${tn}'s turn`;st.classList.add('normal');
    tpc.textContent='♟';tpc.classList.add(w?'w':'b');tlbl.textContent=`${tn} to move`;
  }
}

function updateCap(){
  const s=G;
  const sort=arr=>[...arr].sort((a,b)=>VAL[b.toLowerCase()]-VAL[a.toLowerCase()]);
  const render=arr=>sort(arr).map(p=>`<span class="cap ${isU(p)?'w':'b'}">${SYM[p]}</span>`).join('');
  document.getElementById('capw').innerHTML=render(s.capW);
  document.getElementById('capb').innerHTML=render(s.capB);
  document.getElementById('capwlbl').textContent=`Captured by ${s.palette.wn}`;
  document.getElementById('capblbl').textContent=`Captured by ${s.palette.bn}`;
}

function updateHistory(){
  const s=G,el=document.getElementById('movelist');
  el.innerHTML='';
  s.hist.forEach((pair,i)=>{
    const row=document.createElement('div');row.className='mpair';
    row.innerHTML=`<span class="mnum">${i+1}.</span><span class="mw">${pair.w}</span><span class="mb">${pair.b}</span>`;
    el.appendChild(row);
  });
  el.scrollTop=el.scrollHeight;
}

// ============================================================
// META GAME: Skins, Rolls, Inventory, Upgrades, Leaderboards
// ============================================================

const SKINS={
  classic:{name:'Classic',odds:null},
  poo:{name:'Poo Skin',odds:3},
  gy:{name:'Green & Yellow',odds:10},
  rainbow:{name:'Rainbow',odds:100},
  nothing:{name:'Nothing',odds:500},
  admin:{name:'Admin Skin',odds:5000},
  realadmin:{name:'Real Admin',odds:null,adminOnly:true}
};
const SKIN_ORDER=['poo','gy','rainbow','nothing','admin'];
const SKIN_COLORS={
  classic:['#f0d9b5','#b58863'],
  poo:['#c2a47a','#5e3a1c'],
  gy:['#fff176','#2e7d32'],
  rainbow:['linear-gradient(135deg,#ff5252,#ffeb3b,#69f0ae)','linear-gradient(135deg,#40c4ff,#7c4dff,#ff4081)'],
  nothing:['#0d0d18','#0d0d18'],
  admin:['#ffd700','#1a1a1a'],
  realadmin:['linear-gradient(135deg,#42a5f5,#1976d2)','linear-gradient(135deg,#ef5350,#c62828)']
};

let M;

function loadMeta(){
  let d;
  try{d=JSON.parse(localStorage.getItem('chessmeta')||'null')}catch(e){d=null}
  if(!d)d={money:0,rolls:0,inventory:{classic:1},upgrades:{},equipped:'classic',autoRollOwned:false,autoRollActive:false,totalMoves:0,newGameClicks:0,adminUnlocked:false,lbReadyAfterRoll:false,sawLbAfterRoll:false,currentUpgrade:null,elo:500,friends:[],pieceSkin:'random',eloRewardsClaimed:{},gamesPlayed:0,gamesWon:0,unlockedPieceSkins:{}};
  if(!d.inventory)d.inventory={classic:1};
  if(!d.upgrades)d.upgrades={};
  if(!d.equipped)d.equipped='classic';
  if(d.elo===undefined)d.elo=500;
  if(!d.friends)d.friends=[];
  if(!d.pieceSkin)d.pieceSkin='random';
  if(!d.eloRewardsClaimed)d.eloRewardsClaimed={};
  if(!d.unlockedPieceSkins)d.unlockedPieceSkins={};
  if(d.gamesPlayed===undefined)d.gamesPlayed=0;
  if(d.gamesWon===undefined)d.gamesWon=0;
  if(d.lastYearlyFree===undefined)d.lastYearlyFree=0;
  if(d.nothingGamepass===undefined)d.nothingGamepass=0;
  if(d.godlyPacks===undefined)d.godlyPacks=0;
  if(d.moneyVersion===undefined){d.money=Math.round((Number(d.money)||0)*100);d.moneyVersion=2}
  return d;
}
// Debounced save: keep M live in memory, but write to localStorage at most ~once/sec.
// JSON.stringify + localStorage write is synchronous and was firing on every roll (huge lag).
let _saveTimer=null,_saveDirty=false;
function _saveNow(){_saveDirty=false;try{localStorage.setItem('chessmeta',JSON.stringify(M))}catch(e){}if(M&&M.account&&typeof window.API!=='undefined'){window.API.money(M.account.username,M.money||0).catch(()=>{});window.API.rolls(M.account.username,M.rolls||0).catch(()=>{});}}
function saveMeta(){
  _saveDirty=true;
  if(_saveTimer)return;
  _saveTimer=setTimeout(()=>{_saveTimer=null;if(_saveDirty)_saveNow()},900);
}
// Flush on tab hide / close so nothing is lost
window.addEventListener('visibilitychange',()=>{if(document.hidden&&_saveDirty)_saveNow()});
window.addEventListener('beforeunload',()=>{if(_saveDirty)_saveNow()});

function loadLb(){try{return JSON.parse(localStorage.getItem('chesslb')||'[]')}catch(e){return[]}}
function saveLb(lb){localStorage.setItem('chesslb',JSON.stringify(lb))}
function getScore(){let s=0;for(const k in M.upgrades)s+=M.upgrades[k];return s}

const LB_AI=[
  {name:'GrandmasterX',elo:2950},{name:'PawnPusher',elo:2480},{name:'CastleMaster',elo:2100},
  {name:'KnightFork99',elo:1880},{name:'BishopPairBen',elo:1720},{name:'EndgameEric',elo:1640},
  {name:'TacticalTom',elo:1510},{name:'AverageAndy',elo:1500},{name:'BlitzKing',elo:1430},{name:'QueenBee',elo:1290},
  {name:'OpeningOscar',elo:1150},{name:'SlowAndSteady',elo:980},{name:'PromotionPete',elo:870},
  {name:'GambitGirl',elo:760},{name:'PinPusher',elo:670},{name:'ChessNoob42',elo:550},
  {name:'BlunderBob',elo:410},{name:'StalemateSteve',elo:330},{name:'ZugzwangZoe',elo:270},
  {name:'Bot1800',elo:1800},{name:'Bot1650',elo:1650},{name:'Bot1987',elo:1987},{name:'Bot2300',elo:2300}
];
function syncLb(){
  let lb=loadLb();
  // Drop anything that doesn't have an ELO (stale old "score" format)
  lb=lb.filter(e=>e&&typeof e.name==='string'&&typeof e.elo==='number'&&e.elo>0);
  lb=lb.filter(e=>!LB_AI.some(ai=>ai.name===e.name));
  // ALWAYS ensure every LB_AI is present
  // const have=new Set(lb.map(e=>e.name));`n  // for(const ai of LB_AI){if(!have.has(ai.name)){lb.push({name:ai.name,elo:ai.elo,upgrades:Math.floor(ai.elo/100)});have.add(ai.name)}}
  // User entry
  const myName=(M.account&&M.account.username)||'You';
  let me=lb.find(e=>e.self===true)||lb.find(e=>e.name===myName);
  const myElo=Number(M.elo)||500;
  if(me){me.name=myName;me.elo=myElo;me.upgrades=M.totalUpgrades||0;me.self=true}
  else lb.push({name:myName,elo:myElo,upgrades:M.totalUpgrades||0,self:true});
  lb.sort((a,b)=>(Number(b.elo)||0)-(Number(a.elo)||0));
  saveLb(lb);
  console.log('[lb] synced — '+lb.length+' entries; top 3:',lb.slice(0,3).map(e=>e.name+' '+e.elo).join(', '));
}

function resetLeaderboard(){
  localStorage.removeItem('chesslb');
  syncLb();
  renderLeaderboard();
  showAnnouncement('🏆 Leaderboard reset & reseeded');
}

function applySkinToBoard(){
  const b=document.getElementById('board');if(!b)return;
  ['classic','poo','gy','rainbow','nothing','admin','realadmin','sixtyseven','secret','omega','infinity','royal','vip','owner'].forEach(s=>b.classList.remove('skin-'+s));
  b.classList.add('skin-'+(M.equipped||'classic'));

  const sqs = b.querySelectorAll('.sq');
  const infActive = M.upgradesPurchased && M.upgradesPurchased.infiniteEquip && M.infiniteEquipActive;
  
  if (infActive) {
    const skins = ownedBoardSkins();
    if (skins.length >= 2) {
      sqs.forEach(sq=>{
        const r=Number(sq.dataset.r), c=Number(sq.dataset.c);
        const skin=skins[r%skins.length];
        const col=SKIN_COLORS[skin]||SKIN_COLORS.classic;
        const isLight=(r+c)%2===0;
        sq.style.background=isLight?col[0]:col[1];
      });
      return;
    }
  }

  sqs.forEach(s=>s.style.background='');

  const dualActive = M.upgradesPurchased && M.upgradesPurchased.equip2 && M.equipped2;
  if (dualActive) {
    const colLeft = SKIN_COLORS[M.equipped||'classic']||SKIN_COLORS.classic;
    const colRight = SKIN_COLORS[M.equipped2]||SKIN_COLORS.classic;
    sqs.forEach(sq=>{
      const r=Number(sq.dataset.r), c=Number(sq.dataset.c);
      const isLight=(r+c)%2===0;
      if (c < 4) {
        sq.style.background=isLight?colLeft[0]:colLeft[1];
      } else {
        sq.style.background=isLight?colRight[0]:colRight[1];
      }
    });
  }
}

function applySkinPreview(el,skin){
  const c=SKIN_COLORS[skin]||SKIN_COLORS.classic;
  el.innerHTML='';
  for(const x of[c[0],c[1],c[1],c[0]]){
    const d=document.createElement('div');d.style.background=x;el.appendChild(d);
  }
}

function fmtMoney(p){const n=(Number(p)||0)/100; return n>=1e21?'£'+n.toExponential(2):'£'+n.toFixed(2)}
function refreshUI(){
  document.getElementById('moneydisp').textContent=fmtMoney(M.money);
  document.getElementById('rollsdisp').textContent='Rolls: '+M.rolls;
  const pe=document.getElementById('puzelo');
  if(pe)pe.textContent=M.puzzleElo||1000;
  const eloEl=document.getElementById('elodisp');
  if(eloEl)eloEl.querySelector('.val').textContent=M.elo||500;
  const arb=document.getElementById('autorollbtn');
  if(M.autoRollOwned){
    arb.textContent=M.autoRollActive?'⚡ Auto Roll: ON':'Auto Roll: OFF';
    arb.classList.toggle('owned',!M.autoRollActive);
    arb.classList.toggle('active',M.autoRollActive);
  }else{
    arb.textContent='Buy Auto Roll '+fmtMoney(10000);
    arb.classList.remove('owned','active');
  }
  document.getElementById('adminbtn').classList.toggle('hidden',!M.adminUnlocked);
  updateUnlockHint();
}

function updateUnlockHint(){
  // Obsolete admin-unlock tracker — always hidden (admin is owner-only now)
  const el=document.getElementById('unlockhint');
  if(el)el.classList.add('hidden');
}

function checkAdminUnlock(){
  if(M.adminUnlocked)return;
  if(M.totalMoves>=100&&M.newGameClicks>=10000&&M.lbReadyAfterRoll&&M.sawLbAfterRoll){
    M.adminUnlocked=true;saveMeta();
    showAnnouncement('⚡ ADMIN COMMANDS UNLOCKED ⚡');
    refreshUI();
  }
}

function doSpin(){
  M.rolls=(Number(M.rolls)||0)+1;
  M.money=(Number(M.money)||0)+100;
  if(typeof flashMoneyToast==='function')flashMoneyToast('+£1.00');
  let result=null;
  for(let i=SKIN_ORDER.length-1;i>=0;i--){
    const sk=SKIN_ORDER[i];
    if(Math.random()<1/SKINS[sk].odds){result=sk;break}
  }
  M.lbReadyAfterRoll=true;
  if(result){
    M.inventory[result]=(M.inventory[result]||0)+1;
    if(SKINS[result].odds>=100)showCutscene(result);
  }
  saveMeta();refreshUI();
  if(!document.getElementById('itemmodal').classList.contains('hidden'))renderItems();
}

function showCutscene(skin){
  const cs=document.getElementById('cutscene');
  const coin=document.getElementById('cscoin');
  applySkinPreview(coin,skin);
  const odds=SKINS[skin].odds;
  document.getElementById('cstitle').textContent=odds>=5000?'🌟 LEGENDARY! 🌟':odds>=500?'✨ ULTRA RARE! ✨':'⭐ RARE! ⭐';
  document.getElementById('csname').textContent=SKINS[skin].name;
  document.getElementById('csodds').textContent='1 in '+odds;
  cs.classList.remove('hidden');
  cs.querySelectorAll('.confetti').forEach(c=>c.remove());
  for(let i=0;i<50;i++){
    const c=document.createElement('div');c.className='confetti';
    c.style.left=Math.random()*100+'%';
    c.style.background=['#ffd700','#ff5252','#40c4ff','#69f0ae','#ff4081'][Math.floor(Math.random()*5)];
    c.style.animationDelay=(Math.random()*2)+'s';
    c.style.animationDuration=(2.2+Math.random()*1.8)+'s';
    cs.appendChild(c);
  }
}
function closeCutscene(){
  const cs=document.getElementById('cutscene');
  cs.classList.add('hidden');
  cs.querySelectorAll('.confetti').forEach(c=>c.remove());
}

function setOwnerItemsVisible(show){
  document.querySelectorAll('.adminitem.owner-only').forEach(el=>{el.style.display=show?'':'none'});
}
function openModal(id){
  document.getElementById(id).classList.remove('hidden');
  if(id==='adminmodal'){
    // Owner-only commands only appear when the OWNER opened it (via the 👑 Owner button)
    setOwnerItemsVisible(!!window._openedAsOwner);
    window._openedAsOwner=false;
  }
  if(id==='itemmodal')renderItems();
  if(id==='lbmodal'){syncLb();renderLeaderboard()}
  if(id==='vsmodal'&&typeof renderBotList==='function')renderBotList();
  if(id==='frmodal'&&typeof renderFriendsList==='function'){renderFriendsList();switchFrTab('list')}
  if(id==='shopmodal'&&typeof renderShop==='function'){renderShop();if(typeof maybeAutoOpenPacks==='function')maybeAutoOpenPacks();}

}
function closeModal(id){document.getElementById(id).classList.add('hidden')}

function markLbClick(){
  if(M.lbReadyAfterRoll&&!M.sawLbAfterRoll){
    M.sawLbAfterRoll=true;saveMeta();
    checkAdminUnlock();
  }
  refreshUI();
}

function upgradeCost(sk){return 1000*Math.pow(2,M.upgrades[sk]||0)}

function renderItems(){
  const el=document.getElementById('itemlist');
  el.innerHTML='';
  const all=['classic',...SKIN_ORDER,'realadmin'];
  let any=false;
  for(const sk of all){
    const owned=M.inventory[sk]||0;
    if(owned===0&&sk!=='classic')continue;
    any=true;
    const lvl=M.upgrades[sk]||0;
    const row=document.createElement('div');row.className='skinrow';
    const prev=document.createElement('div');prev.className='skinprev';
    applySkinPreview(prev,sk);row.appendChild(prev);
    const info=document.createElement('div');info.className='skininfo';
    const oddsTxt=SKINS[sk].odds?`1/${SKINS[sk].odds}`:(sk==='classic'?'default':'admin only');
    info.innerHTML=`<div class="skinname">${SKINS[sk].name}</div><div class="skindetails">Owned: ${owned} • Lvl ${lvl} • ${oddsTxt}</div>`;
    row.appendChild(info);
    const acts=document.createElement('div');acts.className='skinactions';
    const dualActive = M.upgradesPurchased && M.upgradesPurchased.equip2;
    if (dualActive) {
      const eqL = document.createElement('button');
      eqL.className='skinbtn'+(M.equipped===sk?' equipped':'');
      eqL.textContent=M.equipped===sk?'✓ L':'Equip L';
      eqL.onclick=()=>equipSkin(sk, 1);
      acts.appendChild(eqL);

      const eqR = document.createElement('button');
      eqR.className='skinbtn'+(M.equipped2===sk?' equipped':'');
      eqR.textContent=M.equipped2===sk?'✓ R':'Equip R';
      eqR.onclick=()=>equipSkin(sk, 2);
      acts.appendChild(eqR);
    } else {
      const eq=document.createElement('button');
      eq.className='skinbtn'+(M.equipped===sk?' equipped':'');
      eq.textContent=M.equipped===sk?'✓ Equipped':'Equip';
      eq.onclick=()=>equipSkin(sk, 1);
      acts.appendChild(eq);
    }
    const up=document.createElement('button');up.className='skinbtn';
    const cost=upgradeCost(sk);
    if(M.currentUpgrade&&M.currentUpgrade.skin===sk){
      const rem=Math.max(0,30-Math.floor((Date.now()-M.currentUpgrade.startTime)/1000));
      if(rem===0){up.textContent='Claim ✓';up.onclick=()=>claimUpgrade()}
      else{up.textContent=`⏳ ${rem}s`;up.disabled=true}
      // Stop button to cancel the in-progress upgrade (refunds half)
      const stop=document.createElement('button');stop.className='skinbtn';
      stop.textContent='✖ Stop';stop.style.background='#5a1f1f';stop.style.borderColor='#aa4444';
      stop.onclick=()=>stopUpgrade();
      acts.appendChild(up);acts.appendChild(stop);
      row.appendChild(acts);el.appendChild(row);
      continue;
    }else if(M.currentUpgrade){
      up.textContent=`Upg ${fmtMoney(cost)}`;up.disabled=true;
    }else{
      up.textContent=`Upg ${fmtMoney(cost)}`;
      up.disabled=M.money<cost;
      up.onclick=()=>startUpgrade(sk);
    }
    acts.appendChild(up);
    row.appendChild(acts);
    el.appendChild(row);
  }
  if(!any)el.innerHTML='<div style="color:#888;text-align:center;padding:20px">No skins yet — click SPIN to roll!</div>';
}

function equipSkin(sk, sl = 1){
  if (sl === 1) M.equipped=sk;
  if (sl === 2) M.equipped2=sk;
  M.infiniteEquipActive = false;
  saveMeta();applySkinToBoard();renderItems()
}

function startUpgrade(sk){
  const cost=upgradeCost(sk);
  if(M.money<cost)return;
  M.money-=cost;
  M.currentUpgrade={skin:sk,startTime:Date.now()};
  saveMeta();refreshUI();renderItems();
  if(window._upgT)clearInterval(window._upgT);
  window._upgT=setInterval(()=>{if(!M.currentUpgrade){clearInterval(window._upgT);return}renderItems()},1000);
}
function claimUpgrade(){
  if(!M.currentUpgrade)return;
  const sk=M.currentUpgrade.skin;
  M.upgrades[sk]=(M.upgrades[sk]||0)+1;
  M.currentUpgrade=null;
  M.totalUpgrades=(M.totalUpgrades||0)+1;
  saveMeta();renderItems();syncLb();
  if(M.account&&typeof window.API!=='undefined')window.API.upgrades(M.account.username,M.totalUpgrades).catch(()=>{});
  showAnnouncement(`✨ ${SKINS[sk].name} upgraded to Lvl ${M.upgrades[sk]}!`);
}
function stopUpgrade(){
  if(!M.currentUpgrade)return;
  const sk=M.currentUpgrade.skin;
  // Refund half the upgrade cost
  const refund=Math.floor(upgradeCost(sk)/2);
  M.money=(Number(M.money)||0)+refund;
  M.currentUpgrade=null;
  if(window._upgT){clearInterval(window._upgT);window._upgT=null}
  saveMeta();refreshUI();renderItems();
  showAnnouncement('✖ Upgrade stopped — refunded '+fmtMoney(refund));
}

let autoRollTimer=null;
function toggleAutoRoll(){
  if(!M.autoRollOwned){
    if(M.money<10000){showAnnouncement('Need £100 to buy Auto Roll!');return}
    M.money-=10000;M.autoRollOwned=true;M.autoRollActive=true;
    showAnnouncement('🎉 Auto Roll purchased!');
  }else{
    M.autoRollActive=!M.autoRollActive;
  }
  saveMeta();refreshUI();startAutoRoll();
}
function startAutoRoll(){
  if(autoRollTimer){clearInterval(autoRollTimer);autoRollTimer=null}
  if(M.autoRollOwned&&M.autoRollActive)autoRollTimer=setInterval(()=>doSpin(),1500);
}

function showAnnouncement(text){
  document.querySelectorAll('.announce').forEach(e=>e.remove());
  const el=document.createElement('div');el.className='announce';el.textContent=text;
  document.body.appendChild(el);setTimeout(()=>el.remove(),5000);
}

window._lbTab='elo';
window.switchLbTab=function(tab){
  window._lbTab=tab;
  const ids = ['elo', 'upg', 'rolls', 'money'];
  for(const id of ids) {
    const el = document.getElementById('tab-lb-' + id);
    if(el) {
      el.classList.toggle('active', tab === id);
      el.style.borderBottomColor = tab === id ? '#4a80c0' : 'transparent';
      el.style.color = tab === id ? '#fff' : '#888';
    }
  }
  renderLeaderboard();
};

async function renderLeaderboard(){
  let lbAll = loadLb();
  const el = document.getElementById('lblist');
  el.innerHTML = '<div style="color:#888;text-align:center;padding:20px">Loading live leaderboard...</div>';

  try {
     const res = await fetch('/api/leaderboard');
     if(res.ok) {
         const data = await res.json();
         if(data.lb) lbAll = data.lb;
     }
  } catch(e) {}

  // ensure LB_AI is in lbAll if missing
  const have = new Set(lbAll.map(e => e.name));
  for(const ai of LB_AI) {
      if(!have.has(ai.name)) {
          lbAll.push({name: ai.name, elo: ai.elo, upgrades: Math.floor(ai.elo/100)});
          have.add(ai.name);
      }
  }

  const tab = window._lbTab || 'elo';
  const myName = (M.account && M.account.username) || 'You';
  
  // add myself if missing or update myself
  let me = lbAll.find(e => e.name === myName);
  if(me) { 
      me.elo = Math.max(me.elo, M.elo || 500); 
      me.upgrades = Math.max(me.upgrades || 0, M.totalUpgrades || 0); 
      me.self = true;
  } else { 
      lbAll.push({name: myName, elo: M.elo || 500, upgrades: M.totalUpgrades || 0, money: M.money || 0, rolls: M.rolls || 0, self: true}); 
  }

  const sorted = lbAll.sort((a,b) => {
    if(tab==='money') return (Number(b.money)||0)-(Number(a.money)||0);
    if(tab==='rolls') return (Number(b.rolls)||0)-(Number(a.rolls)||0);
    if(tab==='upg') return (Number(b.upgrades)||0)-(Number(a.upgrades)||0);
    return (Number(b.elo)||0)-(Number(a.elo)||0);
  });
  const top = sorted.slice(0, 10);
  el.innerHTML = '';
  const trophies = ['🥇','🥈','🥉'];
  top.forEach((entry,i) => {
    const isMe = entry.self || entry.name === myName;
    const row = document.createElement('div'); row.className = 'lbrow' + (isMe ? ' lbme' : '');
    const rankIcon = i < 3 ? trophies[i] : ('#' + (i+1));
    const alreadyFr = (M.friends||[]).find(f => f.name === entry.name);
    let btnHtml = '';
    if(!isMe){
      btnHtml = alreadyFr
        ? '<button class="skinbtn equipped" disabled>✓ Friend</button>'
        : '<button class="skinbtn" onclick="addLbFriend(\'' + entry.name.replace(/'/g,"\\'") + '\',' + (Number(entry.elo)||500) + ')">+ Add</button>';
    }
    const valStr = tab === 'money' ? `£${formatNumber(Number(entry.money)||0)}` : tab === 'rolls' ? `${formatNumber(Number(entry.rolls)||0)} Rolls` : tab === 'upg' ? `${Number(entry.upgrades)||0} Upg` : `${Number(entry.elo)||0} ELO`;
    row.innerHTML = `<div class="lbrank r${i+1}">${rankIcon}</div><div class="lbname">${entry.name}</div><div class="lbscore">${valStr}</div>${btnHtml ? '<div style="margin-left:8px">' + btnHtml + '</div>' : ''}`;
    el.appendChild(row);
  });
  const meIdx = sorted.findIndex(e => e.self || e.name === myName);
  if(meIdx >= 10){
    const sep = document.createElement('div'); sep.style.cssText = 'text-align:center;color:#666;padding:6px 0;font-size:12px'; sep.textContent = '⋯';
    el.appendChild(sep);
    const e = sorted[meIdx]; const row = document.createElement('div'); row.className = 'lbrow lbme';
    const valStr = tab === 'money' ? `£${formatNumber(Number(e.money)||0)}` : tab === 'rolls' ? `${formatNumber(Number(e.rolls)||0)} Rolls` : tab === 'upg' ? `${Number(e.upgrades)||0} Upg` : `${Number(e.elo)||0} ELO`;
    row.innerHTML = `<div class="lbrank">#${meIdx+1}</div><div class="lbname">${e.name}</div><div class="lbscore">${valStr}</div>`;
    el.appendChild(row);
  }
  if(sorted.length === 0) el.innerHTML = '<div style="color:#888;text-align:center;padding:20px">No scores yet — play games to climb!</div>';
}

function addLbFriend(name,elo){
  M.friends=M.friends||[];
  if(M.friends.find(f=>f.name===name))return;
  M.friends.push({name,elo,online:Math.random()<0.6});
  saveMeta();showAnnouncement('👥 Added '+name+' as friend');
  renderLeaderboard();
}

// Admin commands
function adminGiveAll(){for(const s of [...SKIN_ORDER,'realadmin'])M.inventory[s]=(M.inventory[s]||0)+1;saveMeta();showAnnouncement('🎁 All board skins granted!');renderItems()}
function adminGiveRealAdmin(){M.inventory.realadmin=(M.inventory.realadmin||0)+1;saveMeta();showAnnouncement('👑 Real Admin skin granted!');renderItems()}
function adminGiveMoney(pounds){const amt=(pounds||10000)*100;M.money=(Number(M.money)||0)+amt;saveMeta();showAnnouncement('💰 +'+fmtMoney(amt));refreshUI()}
function adminGiveAllPieceSkins(){M.unlockedPieceSkins=M.unlockedPieceSkins||{};for(const k of ['bronze','silver','gold','diamond'])M.unlockedPieceSkins[k]=true;saveMeta();showAnnouncement('♟ All piece skins unlocked!');if(!document.getElementById('itemmodal').classList.contains('hidden'))renderItems()}
function adminAddElo(amt){M.elo=(Number(M.elo)||500)+amt;saveMeta();showAnnouncement('⬆️ +'+amt+' ELO  →  '+M.elo);refreshUI();checkEloRewards();const e=document.getElementById('elodisp');if(e){e.classList.add('changed');setTimeout(()=>e.classList.remove('changed'),1000)}if(M.account&&typeof API!=='undefined')API.elo(M.account.username,M.elo).catch(()=>{});}
function adminGiveGodly(n){M.godlyPacks=(Number(M.godlyPacks)||0)+n;saveMeta();showAnnouncement('✨ +'+n+' Godly Packs');if(typeof maybeAutoOpenPacks==='function'&&maybeAutoOpenPacks())return;if(!document.getElementById('shopmodal').classList.contains('hidden'))renderShop()}
function adminAnnounce(){const msg=prompt('Global announcement text:');if(msg)showAnnouncement('📢 '+msg)}

const TUTS={
  cow:{title:'🐄 The Cow Opening',body:[
    '<b>The Cow</b> is an offbeat opening where Black develops knights to passive squares to lure White into overextending.',
    '<b>1. e4 e6</b> — solid French-style setup.',
    '<b>2. d4 d6</b> — restrained, refusing the center.',
    '<b>3. Nf3 Ne7</b> — the first cow knight.',
    '<b>4. Bc4 Nd7</b> — both knights "moo" on d7 and e7.',
    '<b>Goal:</b> reroute knights via Ng6 and Nb6, then strike with c5 or e5.',
    'It looks weird but it&apos;s solid — top grandmasters have played similar setups in blitz.'
  ]},
  bishop:{title:'♝ Bishop&apos;s Opening',body:[
    '<b>1. e4 e5 2. Bc4</b> — develop the bishop before the knight.',
    'Threatens early f7 pressure and prepares d3, Nf3, c3, d4.',
    '<b>Common reply:</b> 2...Nf6 hitting e4. White plays 3.d3 supporting it.',
    '<b>Plan:</b> often transposes to Italian or Vienna structures.',
    'Great for sidestepping prepared lines like the Petroff or Berlin.'
  ]},
  london:{title:'🏰 The London System',body:[
    'A <b>system</b> opening — same setup against almost anything.',
    '<b>1. d4 d5 2. Nf3 Nf6 3. Bf4</b> — the London bishop comes out before e3.',
    '<b>Then:</b> e3, Bd3, c3, Nbd2, O-O — the classic pyramid.',
    '<b>Goal:</b> safe king, no weaknesses, push e4 when ready.',
    '<b>Pros:</b> easy to learn, hard to crack, low theory.',
    '<b>Cons:</b> can be drawish; Black gets equality with ...c5 and ...Bf5.'
  ]}
};
function openTutorial(k){
  const t=TUTS[k];
  document.getElementById('tuttitle').innerHTML=t.title+' <button class="mclose" onclick="closeModal(\'tutmodal\')">✕</button>';
  document.getElementById('tutbody').innerHTML=t.body.map(b=>`<div class="tut-step">${b}</div>`).join('');
  openModal('tutmodal');
}

function userNewGame(){
  M.newGameClicks++;saveMeta();checkAdminUnlock();refreshUI();
  newGame();
  if(typeof startClocks==='function')startClocks();
}

// ============================================================
// PIECE SKINS, ELO, AI, MATCHMAKING, FRIENDS
// ============================================================

const PIECE_SKINS={
  random:{name:'Random',req:0},
  classic:{name:'Classic',req:0,palette:{wn:'White',bn:'Black',w:'#ffffff',wo:'#000000',b:'#111111',bo:'#ffffff'}},
  bronze:{name:'Bronze',req:750,palette:{wn:'Bronze',bn:'Shadow',w:'#cd7f32',wo:'#3a1c00',b:'#1a1a1a',bo:'#cd7f32'}},
  silver:{name:'Silver',req:1200,palette:{wn:'Silver',bn:'Onyx',w:'#e0e0e0',wo:'#222222',b:'#0d0d18',bo:'#e0e0e0'}},
  gold:{name:'Gold',req:1500,palette:{wn:'Gold',bn:'Ebony',w:'#ffd700',wo:'#3a2600',b:'#0a0a0a',bo:'#ffd700'}},
  diamond:{name:'Diamond',req:2000,palette:{wn:'Diamond',bn:'Obsidian',w:'#80e0ff',wo:'#003a4a',b:'#0a0a2a',bo:'#80e0ff'}},
  champion:{name:'Champion',req:10000,palette:{wn:'Ruby',bn:'Crimson',w:'#ff3366',wo:'#660022',b:'#2a0011',bo:'#ff3366'}},
  grandmaster:{name:'Grandmaster',req:50000,palette:{wn:'Amethyst',bn:'Deep Purple',w:'#cc66ff',wo:'#330066',b:'#1a0033',bo:'#cc66ff'}},
  legend:{name:'Legend',req:100000,palette:{wn:'Emerald',bn:'Dark Green',w:'#33ff99',wo:'#004d26',b:'#001a0d',bo:'#33ff99'}},
  mythic:{name:'Mythic',req:500000,palette:{wn:'Sapphire',bn:'Deep Ocean',w:'#3388ff',wo:'#002266',b:'#000d2a',bo:'#3388ff'}},
  celestial:{name:'Celestial',req:1000000,palette:{wn:'Glowing White',bn:'Starry Night',w:'#ffffff',wo:'#cccccc',b:'#000022',bo:'#ffffff'}},
  divine:{name:'Divine',req:10000000,palette:{wn:'Radiant Gold',bn:'Holy Light',w:'#ffff99',wo:'#cc9900',b:'#4d3a00',bo:'#ffff99'}},
  omnipotent:{name:'Omnipotent',req:100000000,palette:{wn:'Neon Pink',bn:'Void Black',w:'#ff00ff',wo:'#660066',b:'#000000',bo:'#ff00ff'}},
  billionaire:{name:'Billionaire',req:1000000000,palette:{wn:'Diamond Blue',bn:'Solid Gold',w:'#00ffff',wo:'#006666',b:'#ffd700',bo:'#b38f00'}},
  trillion:{name:'Trillion',req:1000000000000,palette:{wn:'Cyber Teal',bn:'Quantum Red',w:'#00ffcc',wo:'#003322',b:'#ff0033',bo:'#440011'}},
  inverted:{name:'Inverted',req:10000000000000,palette:{wn:'Inverted White',bn:'Inverted Black',w:'#ffffff',wo:'#000000',b:'#111111',bo:'#ffffff'}, class:'inverted-anim'}
};

const ELO_REWARDS=[
  {elo:600,type:'money',amount:500,label:'£500'},
  {elo:750,type:'pskin',skin:'bronze',label:'Bronze Pieces'},
  {elo:1000,type:'money',amount:2000,label:'£2,000'},
  {elo:1200,type:'pskin',skin:'silver',label:'Silver Pieces'},
  {elo:1500,type:'pskin',skin:'gold',label:'Gold Pieces'},
  {elo:1800,type:'money',amount:10000,label:'£10,000'},
  {elo:2000,type:'pskin',skin:'diamond',label:'Diamond Pieces'}
];

function isPieceSkinUnlocked(key){
  if(key==='random'||key==='classic')return true;
  const ps=PIECE_SKINS[key];if(!ps)return false;
  if(M.elo>=ps.req)return true;
  return M.unlockedPieceSkins&&M.unlockedPieceSkins[key];
}

function equipPieceSkin(key){
  if(!isPieceSkinUnlocked(key))return;
  M.pieceSkin=key;saveMeta();
  const sk=PIECE_SKINS[key];
  const r=document.documentElement.style;
  let pal;
  if(sk&&sk.palette){pal=sk.palette}
  else{pal=PALETTES[Math.floor(Math.random()*PALETTES.length)]}
  r.setProperty('--pc-w',pal.w);r.setProperty('--pc-wo',pal.wo);
  r.setProperty('--pc-b',pal.b);r.setProperty('--pc-bo',pal.bo);
  if(G)G.palette=pal;
  renderItems();updateStatus();updateCap();
  showAnnouncement('♟ Equipped: '+sk.name+' pieces');
}

function checkEloRewards(){
  M.eloRewardsClaimed=M.eloRewardsClaimed||{};
  for(const r of ELO_REWARDS){
    if(M.elo>=r.elo&&!M.eloRewardsClaimed[r.elo]){
      M.eloRewardsClaimed[r.elo]=true;
      if(r.type==='money')M.money+=r.amount;
      if(r.type==='pskin'){M.unlockedPieceSkins=M.unlockedPieceSkins||{};M.unlockedPieceSkins[r.skin]=true}
      showRewardToast(r);
    }
  }
  saveMeta();refreshUI();
}

function showRewardToast(r){
  const t=document.createElement('div');t.className='rwdtoast';
  t.innerHTML=`<h4>🏆 ELO REWARD UNLOCKED</h4><div class="rwdname">${r.label}</div><div class="rwdelo">Reached ELO ${r.elo}</div>`;
  document.body.appendChild(t);setTimeout(()=>t.remove(),6000);
}

// ----- CHESS AI -----
const AI_VAL={p:100,n:320,b:330,r:500,q:900,k:0};
const PST_P=[[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],
  [5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],
  [5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]];
const PST_N=[[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],
  [-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],
  [-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]];
const PST_B=[[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],
  [-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],
  [-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]];
const PST_K=[[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],
  [20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]];

function evalBoard(b){
  let s=0;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=b[r][c];if(!p)continue;
    const t=p.toLowerCase(),w=isU(p),sign=w?1:-1;
    s+=sign*AI_VAL[t];
    const rr=w?r:7-r;
    if(t==='p')s+=sign*PST_P[rr][c];
    else if(t==='n')s+=sign*PST_N[rr][c];
    else if(t==='b')s+=sign*PST_B[rr][c];
    else if(t==='k')s+=sign*PST_K[rr][c];
  }
  return s;
}

function negamax(b,ep,cr,turn,depth,alpha,beta){
  if(depth===0){
    if(inCheck(b,turn==='white')){
      const moves=allLegal(b,ep,cr,turn);
      if(moves.length===0) return -100000;
    }
    const v=evalBoard(b);return turn==='white'?v:-v;
  }
  const moves=allLegal(b,ep,cr,turn);
  if(moves.length===0){if(inCheck(b,turn==='white'))return -100000+(10-depth);return 0}
  let max=-Infinity;
  for(const mv of moves){
    const res=apply(b,mv.from,mv.to,ep,cr);
    const sc=-negamax(res.board,res.ep,res.cr,flip(turn),depth-1,-beta,-alpha);
    if(sc>max)max=sc;
    if(max>alpha)alpha=max;
    if(alpha>=beta)break;
  }
  return max;
}

function findAIMoveStrong(b,ep,cr,turn,depth){
  const moves=allLegal(b,ep,cr,turn);
  if(moves.length===0)return null;
  for(let i=moves.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[moves[i],moves[j]]=[moves[j],moves[i]]}
  let best=moves[0],bs=-Infinity;
  for(const mv of moves){
    const res=apply(b,mv.from,mv.to,ep,cr);
    const sc=-negamax(res.board,res.ep,res.cr,flip(turn),depth-1,-Infinity,Infinity);
    if(sc>bs){bs=sc;best=mv}
  }
  return best;
}

function findAIMoveCapture(b,ep,cr,turn){
  const moves=allLegal(b,ep,cr,turn);
  if(moves.length===0)return null;
  const caps=moves.filter(mv=>b[mv.to[0]][mv.to[1]]);
  if(caps.length&&Math.random()<0.75){
    let best=caps[0],bv=-1;
    for(const mv of caps){const v=AI_VAL[b[mv.to[0]][mv.to[1]].toLowerCase()];if(v>bv){bv=v;best=mv}}
    return best;
  }
  return moves[Math.floor(Math.random()*moves.length)];
}

function findAIMoveRandom(b,ep,cr,turn){
  const moves=allLegal(b,ep,cr,turn);
  return moves.length?moves[Math.floor(Math.random()*moves.length)]:null;
}

function findMateInOne(b,ep,cr,turn){
  for(const mv of allLegal(b,ep,cr,turn)){
    const res=apply(b,mv.from,mv.to,ep,cr);
    // After our move, is the opponent checkmated?
    if(gameStatus(res.board,res.ep,res.cr,flip(turn))==='checkmate')return mv;
  }
  return null;
}
function _allowsOpponentMate(b,ep,cr,turn,mv){
  const res=apply(b,mv.from,mv.to,ep,cr);
  return !!findMateInOne(res.board,res.ep,res.cr,flip(turn));
}
function findAIMoveWorst(b,ep,cr,turn){
  const moves=allLegal(b,ep,cr,turn);
  if(moves.length===0)return null;
  let best=moves[0],bs=Infinity;
  for(const mv of moves){
    const res=apply(b,mv.from,mv.to,ep,cr);
    // Is this move a blunder that gets us mated?
    // Actually, worst move is the one that gives the opponent the best evaluation!
    // But evaluating just 1 ply is fine.
    const sign=turn==='white'?1:-1;
    let sc=sign*evalBoard(res.board);
    if(sc<bs){bs=sc;best=mv}
  }
  return best;
}

function computeAIMove(opp){
  const b=G.board,ep=G.ep,cr=G.cr,turn=G.turn;
  if(opp.behavior==='worst') return findAIMoveWorst(b,ep,cr,turn);
  
  // Step 1: always take a mate-in-1 if one exists
  const mate=findMateInOne(b,ep,cr,turn);
  if(mate)return mate;
  // Step 2: pick the move per the bot's normal behavior
  let mv;
  if(opp.behavior==='random')mv=findAIMoveRandom(b,ep,cr,turn);
  else if(opp.behavior==='capture')mv=findAIMoveCapture(b,ep,cr,turn);
  else mv=findAIMoveStrong(b,ep,cr,turn,opp.depth||2);
  // Step 3: defend - never walk into a mate-in-1 if a safe move exists
  if(mv&&_allowsOpponentMate(b,ep,cr,turn,mv)){
    const safe=allLegal(b,ep,cr,turn).filter(m=>!_allowsOpponentMate(b,ep,cr,turn,m));
    if(safe.length){
      // among safe moves, choose the one with the best position for the mover
      const sign=turn==='white'?1:-1;
      let best=safe[0],bs=-Infinity;
      for(const m of safe){const r=apply(b,m.from,m.to,ep,cr);const sc=sign*evalBoard(r.board);if(sc>bs){bs=sc;best=m}}
      return best;
    }
  }
  return mv;
}

// ----- BOTS -----

const BOTS={
  worst:{name:'Worst Bot',elo:-1000,depth:1,tier:'noob',emoji:'🗑️',desc:'Plays the absolute worst move possible',behavior:'worst'},
  bot1:{name:'1 ELO Bot',elo:1,depth:0,tier:'noob',emoji:'🤡',desc:'Literally the worst bot possible',behavior:'random'},
  bot1200:{name:'1200 Bot',elo:1200,depth:1,tier:'cas',emoji:'🤖',desc:'A solid 1200 rated bot',behavior:'normal'},
  bot1300:{name:'1300 Bot',elo:1300,depth:2,tier:'cas',emoji:'🤖',desc:'A solid 1300 rated bot',behavior:'positional'},
  bot1400:{name:'1400 Bot',elo:1400,depth:2,tier:'cas',emoji:'🤖',desc:'A solid 1400 rated bot',behavior:'positional'},
  bot1500:{name:'1500 Bot',elo:1500,depth:2,tier:'cas',emoji:'🤖',desc:'A solid 1500 rated bot',behavior:'positional'},
  baby:{name:'Baby Bot',elo:100,depth:0,tier:'noob',emoji:'👶',desc:'Barely knows the rules — totally random',behavior:'random'},
  noob:{name:'Noob Newman',elo:200,depth:0,tier:'noob',emoji:'🤡',desc:'Plays completely random moves',behavior:'random'},
  beginner:{name:'Beginner Bea',elo:400,depth:0,tier:'noob',emoji:'🐣',desc:'Likes grabbing free pieces',behavior:'capture'},
  casual:{name:'Casual Carl',elo:700,depth:1,tier:'cas',emoji:'😎',desc:'Plays solid 1-ply moves',behavior:'normal'},
  skilled:{name:'Skilled Sam',elo:1100,depth:1,tier:'cas',emoji:'🎯',desc:'Sees one move ahead',behavior:'normal'},
  intermediate:{name:'Intermediate Ian',elo:1500,depth:2,tier:'cas',emoji:'🤓',desc:'Calculates 2 moves ahead',behavior:'positional'},
  pro_magnus:{name:'Magnus Carlsen',elo:2882,depth:2,tier:'pro',emoji:'👑',desc:'World #1 — positional grinder',behavior:'positional'},
  pro_hikaru:{name:'Hikaru Nakamura',elo:2802,depth:2,tier:'pro',emoji:'⚡',desc:'Blitz speedster — aggressive',behavior:'aggressive'},
  pro_bobby:{name:'Bobby Fischer',elo:2785,depth:2,tier:'pro',emoji:'🧠',desc:'Precise endgame technique',behavior:'precise'},
  pro_garry:{name:'Garry Kasparov',elo:2851,depth:2,tier:'pro',emoji:'🔥',desc:'Tactical bulldozer',behavior:'tactical'},
  pro_fabi:{name:'Fabiano Caruana',elo:2820,depth:2,tier:'pro',emoji:'♟️',desc:'Opening preparation king',behavior:'solid'},
  stockfish:{name:'Stockfishes',elo:3200,depth:3,tier:'pro',emoji:'🤖',desc:'Maximum strength — depth 3 search (slow, brutal)',behavior:'positional',locked:'stockfishMax'},
  stockfish_max:{name:'Stockfish 3296',elo:3296,depth:3,tier:'pro',emoji:'🛸',desc:'Engine god — depth 3, never blunders',behavior:'positional',locked:'stockfishMax'},
  stockfish_god:{name:'Stockfish 3400',elo:3400,depth:3,tier:'pro',emoji:'👽',desc:'Beyond human - depth 3, flawless',behavior:'positional',locked:'stockfishMax'},
  stockfish_3600:{name:'Stockfish 3600',elo:3600,depth:4,tier:'pro',emoji:'🌌',desc:'The absolute limit of the engine',behavior:'positional',locked:'stockfishMax'},
  stockfish_3800:{name:'Stockfish 3800',elo:3800,depth:5,tier:'pro',emoji:'👑',desc:'Chess solved - impossible to defeat',behavior:'positional',locked:'stockfishMax'},
  stockfish_3999:{name:'Stockfish 3999',elo:3999,depth:6,tier:'pro',emoji:'🔱',desc:'The ultimate AI entity',behavior:'positional',locked:'stockfishMax'}
};

function renderBotList(){
  const el=document.getElementById('botlist');el.innerHTML='';
  const order=['worst','bot1','baby','noob','beginner','casual','skilled','bot1200','bot1300','bot1400','bot1500','intermediate','pro_magnus','pro_hikaru','pro_bobby','pro_garry','pro_fabi','stockfish','stockfish_max','stockfish_god','stockfish_3600','stockfish_3800','stockfish_3999'];
  for(const k of order){
    const b=BOTS[k];
    // Locked behind an upgrade?
    if(b.locked){
      const owned=M.upgradesPurchased&&M.upgradesPurchased[b.locked];
      if(!owned){
        const row=document.createElement('div');row.className='botrow';row.style.opacity='.5';row.style.cursor='not-allowed';
        row.innerHTML=`<div class="botav pro">🔒</div><div class="botinfo"><div class="botname">${b.name}</div><div class="botelo">ELO ${b.elo}</div><div class="botdesc">Locked — buy the matching upgrade in ⚙️</div></div><div class="bottier t-pro">LOCKED</div>`;
        el.appendChild(row);continue;
      }
    }
    const tierLabel=b.tier==='noob'?'NOOB':b.tier==='cas'?'CASUAL':'PRO';
    const row=document.createElement('div');row.className='botrow';
    row.innerHTML=`<div class="botav ${b.tier==='noob'?'noob':b.tier==='cas'?'casual':'pro'}">${b.emoji}</div><div class="botinfo"><div class="botname">${b.name}</div><div class="botelo">ELO ${b.elo}</div><div class="botdesc">${b.desc}</div></div><div class="bottier t-${b.tier}">${tierLabel}</div>`;
    row.onclick=()=>startVsComputer(k);
    el.appendChild(row);
  }
}

function startVsComputer(key){
  closeModal('vsmodal');
  const b=BOTS[key];
  startGameVsBot({name:b.name,elo:b.elo,depth:b.depth,behavior:b.behavior});
}

function startGameVsBot(bot){
  if (typeof M !== 'undefined' && M) { M.currentVariant = null; saveMeta(); }
  newGame();
  showGameView();
  const box = document.getElementById('gamechatmessages');
  if(box) box.innerHTML = '';
  openGameChat();
  if(typeof addGameChatMessage === 'function') addGameChatMessage('System', '\u2B50 You can chat with bots! Try saying hi.');
  const cs=document.getElementById('clockstrip');
  if(cs)cs.classList.add('hidden');
  G.opponent={type:'ai',name:bot.name,elo:bot.elo,side:'black',depth:bot.depth||1,behavior:bot.behavior||'normal',_eloApplied:false};
  render();
}

function resetToLocal(){
  if(G&&G.opponent&&G.opponent.type==='ai'&&!G.opponent._eloApplied&&G.status==='playing'){
    if(!confirm('Forfeit current game vs '+G.opponent.name+'? You will lose 16 ELO.'))return;
    M.elo=Math.max(100,M.elo-16);saveMeta();refreshUI();
    showAnnouncement('💔 Forfeit: -16 ELO');
  }
  userNewGame();
  G.opponent=null;
  render();
}

// ----- MATCHMAKING -----
let _mmTO=null,_pmatch=null;
function findMatchAsync(){
  document.getElementById('myeloshow').textContent=M.elo;
  document.getElementById('mmsearching').classList.remove('hidden');
  document.getElementById('mmfound').classList.add('hidden');
  openModal('mmmodal');
  const delay=1500+Math.random()*1800;
  _mmTO=setTimeout(()=>{
    const opp=makeMatchOpponent();_pmatch=opp;
    document.getElementById('mmname').textContent=opp.name;
    document.getElementById('mmelo').textContent=opp.elo;
    document.getElementById('mmmyelo').textContent=M.elo;
    document.getElementById('mmoppav').textContent=opp.name[0];
    document.getElementById('mmsearching').classList.add('hidden');
    document.getElementById('mmfound').classList.remove('hidden');
  },delay);
}

function cancelMatch(){if(_mmTO){clearTimeout(_mmTO);_mmTO=null}_pmatch=null;closeModal('mmmodal')}

function acceptMatch(){
  if(!_pmatch)return;
  const opp=_pmatch;closeModal('mmmodal');
  const userSide=Math.random()<0.5?'white':'black';
  newGame();
  G.opponent={type:'ai',name:opp.name,elo:opp.elo,side:userSide==='white'?'black':'white',depth:opp.depth,behavior:opp.behavior,_eloApplied:false};
  render();
  if(G.turn===G.opponent.side)maybeAIMove();
}

const FAKE_NAMES=['ChessNoob42','PawnMaster','KnightRider','QueenBee','CastleCrusher','BishopBro','BlitzKing','SlowAndSteady','TacticalTom','EndgameEric','ZugzwangZoe','GambitGirl','OpeningOscar','BlunderBob','PromotionPete','CheckmateChamp','StalemateSteve','EnPassantPaul','FianchettoFred','ForkMaster','PinPusher','SkewerSally','DiscoveredDan','KnightForkKid','BishopPairBen','OpenLanesOlivia','PassedPawnPat','OutpostOmar','RookLiftRita','BackRankBria'];

function makeMatchOpponent(){
  const oppE=Math.max(100,Math.round(M.elo+(Math.random()*120-60)));
  const name=FAKE_NAMES[Math.floor(Math.random()*FAKE_NAMES.length)];
  const depth=oppE<500?0:oppE<1100?1:2;
  const behavior=oppE<350?'random':oppE<600?'capture':'normal';
  return{name,elo:oppE,depth,behavior};
}

// ----- AI HOOKS -----
function maybeAIMove(){
  if(!G)return;
  if(G.type==='puzzle' && G.turn !== G.puzzleSide && (G.status==='playing' || G.status==='check')) {
     if(G.puzzleStep >= G.puzzleMoves.length) {
        showAnnouncement('✅ Puzzle Solved! +15 ELO');
        G.status='solved';
        M.puzzleElo = (M.puzzleElo||1000) + (window.hasGlobalAbuse ? 30 : 15);
        saveMeta(); refreshUI();
        return;
     }
     setTimeout(()=>{
         const mStr = G.puzzleMoves[G.puzzleStep];
         const files='abcdefgh', ranks='87654321';
         const fr=ranks.indexOf(mStr[1]), fc=files.indexOf(mStr[0]);
         const tr=ranks.indexOf(mStr[3]), tc=files.indexOf(mStr[2]);
         const promo=mStr[4];
         G.puzzleStep++;
         doMove([fr,fc], [tr,tc], promo);
     }, 600);
     return;
  }
  if(!G.opponent)return;
  if(G.opponent.type!=='ai')return;
  if(G.turn!==G.opponent.side)return;
  if(G.status==='checkmate'||G.status==='stalemate')return;
  document.getElementById('thinking').classList.remove('hidden');
  setTimeout(()=>{
    const mv=computeAIMove(G.opponent);
    document.getElementById('thinking').classList.add('hidden');
    if(!mv)return;
    const p=G.board[mv.from[0]][mv.from[1]];
    let promo=null;
    if(p&&p.toLowerCase()==='p'&&(mv.to[0]===0||mv.to[0]===7))promo=isU(p)?'Q':'q';
    doMove(mv.from,mv.to,promo);
  },400+Math.random()*500);
}

function eloChange(my,opp,result){
  const exp=1/(1+Math.pow(10,(opp-my)/400));
  return Math.round(32*(result-exp));
}

function maybeApplyElo(){
  if(!G||!G.opponent||G.opponent.type!=='ai'||G.opponent._eloApplied)return;
  if(G.status!=='checkmate'&&G.status!=='stalemate')return;
  let result;
  if(G.status==='stalemate')result=0.5;
  else{
    const winner=flip(G.turn);
    const playerSide=G.opponent.side==='white'?'black':'white';
    result=winner===playerSide?1:0;
  }
  const change=eloChange(M.elo,G.opponent.elo,result);
  M.elo=Math.max(100,M.elo+change);
  M.gamesPlayed=(M.gamesPlayed||0)+1;
  if(result===1)M.gamesWon=(M.gamesWon||0)+1;
  G.opponent._eloApplied=true;
  saveMeta();
  showEloToast(change,G.opponent.name,result,M.elo);
  refreshUI();
  const eloEl=document.getElementById('elodisp');
  if(eloEl){eloEl.classList.add('changed');setTimeout(()=>eloEl.classList.remove('changed'),1000)}
  checkEloRewards();
}

function showEloToast(change,oppName,result,newElo){
  const t=document.createElement('div');
  const cls=result===1?'win':result===0?'loss':'draw';
  const title=result===1?'🏆 Victory!':result===0?'💔 Defeat':'🤝 Draw';
  t.className='elotoast '+cls;
  t.innerHTML=`<h4>${title}</h4><div class="delta">${change>=0?'+':''}${change} ELO</div><div class="opp">vs ${oppName}<br>New ELO: ${newElo}</div>`;
  document.body.appendChild(t);setTimeout(()=>t.remove(),5000);
}

function renderModeBadge(){
  const el=document.getElementById('modebadge');if(!el)return;
  if(!G||!G.opponent||G.opponent.type!=='ai'){el.innerHTML='';return}
  el.innerHTML=`<div class="modebadge vsai">Playing as ${G.opponent.side==='white'?'Black':'White'}<div class="opp">vs ${G.opponent.name} <small>(ELO ${G.opponent.elo})</small></div></div>`;
}

// ----- FRIENDS -----
function nameToElo(name){let h=0;for(let i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))>>>0;return 200+(h%2500)}

function switchFrTab(tab){
  document.getElementById('tabfr').classList.toggle('active',tab==='list');
  document.getElementById('tabadd').classList.toggle('active',tab==='add');
  document.getElementById('frlistview').classList.toggle('hidden',tab!=='list');
  document.getElementById('fraddview').classList.toggle('hidden',tab!=='add');
  if(tab==='list')renderFriendsList();
  if(tab==='add'){document.getElementById('frsearch').value='';searchFriends();showMyFriendCode()}
}

// Friend code: same djb2-xor algorithm as the server, so codes match offline too
function codeForName(name){
  let h=5381;const s=(name||'').toLowerCase();
  for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;
  return 'CHESS-'+h.toString(36).toUpperCase().padStart(6,'0').slice(0,6);
}
function showMyFriendCode(){
  const el=document.getElementById('myfriendcode');if(!el)return;
  if(!M.account){el.textContent='(sign up to get a code)';return}
  el.textContent=codeForName(M.account.username);
}
function copyFriendCode(){
  if(!M.account){showAnnouncement('Sign up first to get a friend code');return}
  const code=codeForName(M.account.username);
  try{navigator.clipboard&&navigator.clipboard.writeText(code)}catch(e){}
  showAnnouncement('📋 Copied your code: '+code);
}
async function addByFriendCode(){
  if(!M.account){showAnnouncement('Sign up first to add friends');return}
  const code=(document.getElementById('frcodeinput').value||'').trim();
  if(!code){showAnnouncement('Paste a friend code first');return}
  if(code.toUpperCase()===codeForName(M.account.username)){showAnnouncement("That's your own code!");return}
  const r=await API.addByCode(M.account.username,code);
  if(r&&r.ok&&r.added){
    M.friends=M.friends||[];
    if(!M.friends.find(f=>f.name===r.added))M.friends.push({name:r.added,elo:r.elo||500,online:true});
    saveMeta();
    document.getElementById('frcodeinput').value='';
    showAnnouncement('👥 Added '+r.added+' as friend!');
    renderFriendsList();
  }else if(r&&r.err==='no such code'){
    showAnnouncement('❌ No player found with that code (they must have signed up on the server)');
  }else{
    showAnnouncement('Failed: '+((r&&r.err)||'server unreachable'));
  }
}

function searchFriends(){
  const q=document.getElementById('frsearch').value.toLowerCase().trim();
  const el=document.getElementById('frsearchres');
  if(!q){el.innerHTML='<div style="color:#888;text-align:center;padding:20px">Start typing to search players...</div>';return}
  const matches=FAKE_NAMES.filter(n=>n.toLowerCase().includes(q));
  if(matches.length===0){el.innerHTML='<div style="color:#888;text-align:center;padding:20px">No players found</div>';return}
  el.innerHTML='';
  for(const name of matches.slice(0,12)){
    const elo=nameToElo(name);
    const isFr=(M.friends||[]).find(f=>f.name===name);
    const row=document.createElement('div');row.className='frrow';
    row.innerHTML=`<div class="frav">${name[0]}</div><div class="frinfo"><div class="frname">${name}</div><div class="frstat">ELO ${elo}</div></div>`;
    const acts=document.createElement('div');acts.className='fractions';
    const b=document.createElement('button');b.className='skinbtn';
    if(isFr){b.textContent='✓ Added';b.disabled=true;b.classList.add('equipped')}
    else{b.textContent='+ Add';b.onclick=()=>addFriend(name)}
    acts.appendChild(b);row.appendChild(acts);el.appendChild(row);
  }
}

function addFriend(name){
  M.friends=M.friends||[];
  if(!M.friends.find(f=>f.name===name)){
    M.friends.push({name,elo:nameToElo(name),online:Math.random()<0.6});
    saveMeta();showAnnouncement('👥 Added '+name+' as friend');
  }
  searchFriends();
}

function renderFriendsList(){
  const el=document.getElementById('frlist');
  const friends=M.friends||[];
  if(friends.length===0){el.innerHTML='<div style="color:#888;text-align:center;padding:20px">No friends yet — click <b>Add Friend</b> to find players!</div>';return}
  el.innerHTML='';
  for(const f of friends){
    const row=document.createElement('div');row.className='frrow';
    row.innerHTML=`<div class="frav">${f.name[0]}</div><div class="frinfo"><div class="frname">${f.name}</div><div class="frstat">ELO ${f.elo} • <span class="${f.online?'fronline':'froffline'}">${f.online?'● Online':'○ Offline'}</span></div></div>`;
    const acts=document.createElement('div');acts.className='fractions';
    const chal=document.createElement('button');chal.className='skinbtn';chal.textContent='⚔️ Play';chal.disabled=!f.online;
    chal.onclick=()=>challengeFriend(f.name);
    const rm=document.createElement('button');rm.className='skinbtn';rm.textContent='✕';rm.style.minWidth='auto';rm.style.padding='5px 10px';
    rm.onclick=()=>removeFriend(f.name);
    acts.appendChild(chal);acts.appendChild(rm);row.appendChild(acts);el.appendChild(row);
  }
}

function removeFriend(name){
  M.friends=(M.friends||[]).filter(f=>f.name!==name);
  saveMeta();renderFriendsList();
}

function challengeFriend(name){
  const f=(M.friends||[]).find(x=>x.name===name);if(!f)return;
  closeModal('frmodal');
  const depth=f.elo<500?0:f.elo<1100?1:2;
  const behavior=f.elo<350?'random':f.elo<600?'capture':'normal';
  startGameVsBot({name:f.name,elo:f.elo,depth,behavior});
}

// ----- EXTEND renderItems FOR PIECE SKINS -----
const _origRenderItems=renderItems;
renderItems=function(){
  _origRenderItems();
  const el=document.getElementById('itemlist');
  const ps=document.createElement('div');ps.className='pskinsection';
  ps.innerHTML='<div style="font-size:11px;font-weight:600;color:#5a7a9a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">♟ Piece Skins</div><div style="font-size:11px;color:#888;margin-bottom:10px">Unlock via ELO milestones</div>';
  const grid=document.createElement('div');grid.className='pskingrid';
  for(const key in PIECE_SKINS){
    const sk=PIECE_SKINS[key];
    const unlocked=isPieceSkinUnlocked(key);
    const equipped=(M.pieceSkin||'random')===key;
    const chip=document.createElement('div');
    chip.className='pskinchip'+(equipped?' equipped':'')+(unlocked?'':' locked');
    let prevStyle='';
    if(sk.palette){
      prevStyle=`color:${sk.palette.w};text-shadow:-1px -1px 0 ${sk.palette.wo},1px -1px 0 ${sk.palette.wo},-1px 1px 0 ${sk.palette.wo},1px 1px 0 ${sk.palette.wo}`;
    }else{prevStyle='color:#ffd700;text-shadow:-1px -1px 0 #333,1px 1px 0 #333'}
    chip.innerHTML=`<div class="pskinpreview" style="${prevStyle}">♚</div><div class="pskinname">${sk.name}</div><div class="pskinreq">${sk.req>0?'ELO '+sk.req:'Available'}</div>${unlocked?'':'<div class="pskinlock">🔒</div>'}`;
    if(unlocked)chip.onclick=()=>equipPieceSkin(key);
    grid.appendChild(chip);
  }
  ps.appendChild(grid);el.appendChild(ps);
};

// ============================================================
// SHOP, GODLY PACKS, MUSIC
// ============================================================

const PACKS=[
  {n:1,price:100,label:'1 Godly Pack',desc:'One guaranteed rare roll'},
  {n:3,price:285,label:'3 Godly Packs',desc:'5% discount',save:15},
  {n:10,price:900,label:'10 Godly Packs',desc:'10% discount',save:100},
  {n:100,price:9635,label:'100 Godly Packs',desc:'Best value!',save:365}
];

// Godly pack odds — guaranteed rare drop
const GODLY_TABLE=[
  {skin:'realadmin',chance:0.01},
  {skin:'admin',chance:0.04},
  {skin:'nothing',chance:0.10},
  {skin:'rainbow',chance:0.30},
  {skin:'gy',chance:0.35},
  {skin:'poo',chance:0.20}
];

function rollGodlyOne(){
  const r=Math.random();let cum=0;
  for(const o of GODLY_TABLE){cum+=o.chance;if(r<cum)return o.skin}
  return 'poo';
}

function yearlyFreeReady(){
  if(!M.lastYearlyFree)return true;
  return (Date.now()-M.lastYearlyFree)>=365*24*60*60*1000;
}

function yearlyFreeRemaining(){
  if(yearlyFreeReady())return 0;
  const ms=365*24*60*60*1000-(Date.now()-M.lastYearlyFree);
  const days=Math.floor(ms/(24*60*60*1000));
  const hours=Math.floor((ms%(24*60*60*1000))/(60*60*1000));
  return days+'d '+hours+'h';
}

function renderShop(){
  // Free pack card
  const fc=document.getElementById('freepackcard');
  const ready=yearlyFreeReady();
  fc.innerHTML=`<div class="packicon">🎁</div><div class="packinfo"><div class="packname">Yearly Free Godly Pack</div><div class="packdesc">One free pack every 365 days</div>${ready?'':'<div class="yearcountdown">Next claim in: '+yearlyFreeRemaining()+'</div>'}</div><button class="packbuy free" ${ready?'':'disabled'} onclick="claimYearlyFree()">${ready?'🎉 CLAIM':'⏳ Locked'}</button>`;
  // Godly packs
  const gs=document.getElementById('godlyshop');gs.innerHTML='';
  for(const p of PACKS){
    const card=document.createElement('div');card.className='packcard godly';
    const owned=M.godlyPacks||0;
    const can=M.money>=p.price;
    const priceLine=`<div class="packprice">${fmtMoney(p.price)}${p.save?` <span class="save">save ${fmtMoney(p.save)}</span>`:''}</div>`;
    card.innerHTML=`<div class="packicon">✨</div><div class="packinfo"><div class="packname">${p.label}</div><div class="packdesc">${p.desc}</div>${priceLine}</div><button class="packbuy" ${can?'':'disabled'} onclick="buyPack(${p.n},${p.price})">Buy ×${p.n}</button>`;
    gs.appendChild(card);
  }
  // Show owned packs to open
  if((M.godlyPacks||0)>0){
    const openCard=document.createElement('div');openCard.className='packcard godly';
    openCard.innerHTML=`<div class="packicon">📦</div><div class="packinfo"><div class="packname">You own ${M.godlyPacks} pack(s)</div><div class="packdesc">Open them all at once</div></div><button class="packbuy" onclick="openOwnedPacks()">📂 Open All</button>`;
    gs.appendChild(openCard);
  }
  // Gamepasses
  const gp=document.getElementById('gamepassshop');gp.innerHTML='';
  const ngc=M.nothingGamepass||0;
  const ngCard=document.createElement('div');ngCard.className='packcard tiny';
  ngCard.innerHTML=`<div class="packicon">🫥</div><div class="packinfo"><div class="packname">Nothing Gamepass ${ngc>0?'(owned: '+ngc+')':''}</div><div class="packdesc">Does literally nothing. Pure bragging rights.</div><div class="packprice">£0.01</div></div><button class="packbuy tiny" onclick="buyNothing()">Buy 1p</button>`;
  gp.appendChild(ngCard);
}
let pendingCheckout = null;

function buyPack(n,price){
  // Start checkout flow for real money!
  pendingCheckout = { type: 'pack', n: n, price: price };
  const itemName = (n===1) ? '1 Godly Pack' : (n + ' Godly Packs');
  const realPrice = (price / 10).toFixed(2); // simulate real money price like £10.00
  
  document.getElementById('checkout-item-name').textContent = itemName;
  document.getElementById('checkout-item-price').textContent = "Total: £" + realPrice;
  
  const btn = document.getElementById('checkout-pay-btn');
  btn.textContent = "Pay Now";
  btn.style.background = "#28a745";
  btn.disabled = false;
  
  closeModal('shopmodal');
  openModal('checkoutmodal');
}

function processCheckout() {
  const btn = document.getElementById('checkout-pay-btn');
  btn.textContent = "Processing...";
  btn.style.background = "#555";
  btn.disabled = true;
  
  setTimeout(()=>{
    btn.textContent = "Payment Successful!";
    btn.style.background = "#28a745";
    
    setTimeout(()=>{
      closeModal('checkoutmodal');
      
      if(pendingCheckout && pendingCheckout.type === 'pack') {
         const n = pendingCheckout.n;
         M.godlyPacks=(Number(M.godlyPacks)||0)+n;
         saveMeta();refreshUI();
         if(maybeAutoOpenPacks())return;
         renderShop();
         showAnnouncement(`✨ Payment Complete! +${n} Godly Pack${n>1?'s':''}!`);
      } else if(pendingCheckout && pendingCheckout.type === 'nothing') {
         M.nothingGamepass=(Number(M.nothingGamepass)||0)+1;
         saveMeta();refreshUI();renderShop();
         showAnnouncement('🫥 Payment Complete! You bought... nothing. Congrats?');
      } else if (pendingCheckout && pendingCheckout.type === 'moneypack') {
         M.money += (window.hasGlobalAbuse ? pendingCheckout.pounds * 2 : pendingCheckout.pounds);
         saveMeta();refreshUI();renderShop();
         showAnnouncement('+'+fmtMoney(pendingCheckout.pounds));
      } else if (pendingCheckout && pendingCheckout.type === 'gamepass') {
         M.gamepasses=M.gamepasses||{};
         M.gamepasses[pendingCheckout.id]=true;
         saveMeta();refreshUI();renderShop();
         if (typeof updateLuckChip === 'function') updateLuckChip();
         showAnnouncement('🎉 '+pendingCheckout.name+' purchased!');
      } else if (pendingCheckout && pendingCheckout.type === 'serverluck') {
         M.serverLuckMult=pendingCheckout.mult;
         M.serverLuckEndTime=Date.now()+45*60000;
         saveMeta();refreshUI();renderShop();
         if (typeof updateLuckChip === 'function') updateLuckChip();
         showAnnouncement('🍀 Server luck '+pendingCheckout.mult+'x for 45m');
      } else if (pendingCheckout && pendingCheckout.type === 'premiumskin') {
         if (pendingCheckout.skin === 'royal') M.inventory.royal = (M.inventory.royal||0)+1;
         if (pendingCheckout.skin === 'svp') M.inventory.svp = (M.inventory.svp||0)+1;
         saveMeta();refreshUI();renderShop();
         showAnnouncement('✨ Premium Skin Purchased!');
      }
      pendingCheckout = null;
    }, 1500);
  }, 1500);
}

function hasAutoOpen(){return !!(M.upgradesPurchased&&M.upgradesPurchased.autoOpenPacks)}
// If the Auto-Open upgrade is owned and any packs are stockpiled, open them all now.
function maybeAutoOpenPacks(){
  if(hasAutoOpen()&&(Number(M.godlyPacks)||0)>0){openOwnedPacks();return true}
  return false;
}

function buyNothing(){
  pendingCheckout = { type: 'nothing' };
  document.getElementById('checkout-item-name').textContent = 'Nothing Gamepass';
  document.getElementById('checkout-item-price').textContent = "Total: £0.01";
  
  const btn = document.getElementById('checkout-pay-btn');
  btn.textContent = "Pay Now";
  btn.style.background = "#28a745";
  btn.disabled = false;
  
  closeModal('shopmodal');
  openModal('checkoutmodal');
}

function claimYearlyFree(){
  if(!yearlyFreeReady())return;
  M.lastYearlyFree=Date.now();
  M.godlyPacks=(Number(M.godlyPacks)||0)+1;
  saveMeta();refreshUI();
  if(maybeAutoOpenPacks())return;
  renderShop();
  showAnnouncement('🎁 Yearly free Godly Pack claimed!');
}

function openOwnedPacks(){
  const n=M.godlyPacks||0;if(n<=0)return;
  const results=[];
  let bestOdds=Infinity;
  for(let i=0;i<n;i++){
    const sk=rollGodlyOne();
    results.push(sk);
    M.inventory[sk]=(M.inventory[sk]||0)+1;
    if(SKINS[sk]&&SKINS[sk].odds&&SKINS[sk].odds<bestOdds)bestOdds=SKINS[sk].odds;
  }
  M.godlyPacks=0;
  saveMeta();refreshUI();renderShop();
  showPackResults(results);
  // Cutscene for the rarest
  if(bestOdds<=100){
    const rarest=results.reduce((a,b)=>(SKINS[a]?.odds||0)>(SKINS[b]?.odds||0)?a:b);
    setTimeout(()=>showCutscene(rarest),300);
  }
}

function showPackResults(results){
  // Aggregate counts
  const counts={};for(const r of results)counts[r]=(counts[r]||0)+1;
  const grid=document.getElementById('packresultgrid');grid.innerHTML='';
  const order=['realadmin','admin','nothing','rainbow','gy','poo'];
  for(const sk of order){
    if(!counts[sk])continue;
    const card=document.createElement('div');
    card.className='packresult'+(SKINS[sk]&&SKINS[sk].odds>=100?' rare':'');
    const prev=document.createElement('div');prev.className='pgprev';
    applySkinPreview(prev,sk);
    card.appendChild(prev);
    const lbl=document.createElement('div');lbl.className='pgname';
    lbl.textContent=`${SKINS[sk].name} ×${counts[sk]}`;
    card.appendChild(lbl);
    grid.appendChild(card);
  }
  document.getElementById('packresultsh').textContent=`You got ${results.length} skin${results.length!==1?'s':''}!`;
  openModal('packresults');
}

// ----- MONEY TOAST -----
function flashMoneyToast(text){
  const md=document.getElementById('moneydisp');if(!md)return;
  const r=md.getBoundingClientRect();
  const t=document.createElement('div');t.className='moneytoast';t.textContent=text;
  t.style.left=(r.left+r.width/2-22)+'px';t.style.top=(r.bottom+4)+'px';
  document.body.appendChild(t);setTimeout(()=>t.remove(),1500);
}

// ----- MUSIC ENGINE -----
let _audio=null,_musicOn=false,_musicTimers=[];
const _NOTES={C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99};

function _playNote(freq,dur,when,gain,type){
  const osc=_audio.createOscillator();
  const env=_audio.createGain();
  osc.type=type||'sine';
  osc.frequency.value=freq;
  env.gain.setValueAtTime(0,when);
  env.gain.linearRampToValueAtTime(gain,when+0.02);
  env.gain.exponentialRampToValueAtTime(0.001,when+dur);
  osc.connect(env).connect(_audio.destination);
  osc.start(when);osc.stop(when+dur+0.05);
}

const MUSIC_TRACKS=[
  {name:'Oh, Mother Earth, so full of grace',file:'mother_earth.mp3'},
  {name:'Best Ever',file:'best_ever.mp3'},
  {name:'PASSO BEM SOLTO',file:'passo.mp3'},
  {name:'It\'s Raining Tacos',file:'tacos.mp3'},
  {name:'LAVINA (Steal the Brainrot)',file:'lavina.mp3'},
  {name:'Soil Science',file:'pochvo.mp3'},
  {name:'Houses',file:'domiki.mp3'}
];

// Auto-play music on first interaction
document.addEventListener('click', () => {
  if (M.musicOn === undefined || M.musicOn) {
    if(!_musicOn) toggleMusic();
  }
}, {once:true});


// Dedicated <audio> element for file-based tracks
let _fileAudio=null;
function _stopFileAudio(){if(_fileAudio){_fileAudio.pause();_fileAudio.currentTime=0}}
function _playFileTrack(track){
  if(!_fileAudio){
    _fileAudio=new Audio();
    _fileAudio.addEventListener('ended', () => {
      M.musicTrack = ((M.musicTrack||0) + 1) % MUSIC_TRACKS.length;
      saveMeta();
      if(document.getElementById('settingsmodal') && !document.getElementById('settingsmodal').classList.contains('hidden')) {
        renderSettings();
      }
      const nextTrack = MUSIC_TRACKS[M.musicTrack];
      _fileAudio.src = nextTrack.file;
      _fileAudio.play().catch(()=>{});
    });
  }
  if(!_fileAudio.src.endsWith(track.file))_fileAudio.src=track.file;
  const vol=M&&M.musicVol!==undefined?M.musicVol:0.5;
  _fileAudio.volume=Math.min(1,vol);
  _fileAudio.play().catch(()=>{});
}

function _playLoop(){
  if(!_musicOn)return;
  const idx=(M&&M.musicTrack)||0;
  const track=MUSIC_TRACKS[idx]||MUSIC_TRACKS[0];
  // File-based track: play through <audio>, skip synth
  if(track.file){_playFileTrack(track);return}
  _stopFileAudio();
  const t=_audio.currentTime;
  let off=0;
  for(const [n,d] of track.lead){_playNote(_NOTES[n]||440,d*0.85,t+off,0.06,track.wave);off+=d}
  let boff=0;
  for(const [n,d] of track.bass){_playNote(_NOTES[n]||130,d*0.9,t+boff,0.04,'sine');boff+=d}
  const total=off;
  const tm=setTimeout(()=>{if(_musicOn)_playLoop()},total*1000);
  _musicTimers.push(tm);
}

function setMusicTrack(idx){
  M.musicTrack=idx;saveMeta();
  if(_musicOn){_musicTimers.forEach(t=>clearTimeout(t));_musicTimers=[];_stopFileAudio();_playLoop()}
  if(typeof renderSettings==='function')renderSettings();
}

function toggleMusic(){
  if(!_audio){
    try{_audio=new (window.AudioContext||window.webkitAudioContext)()}catch(e){alert('Audio not supported');return}
  }
  if(_audio.state==='suspended')_audio.resume();
  _musicOn=!_musicOn;
  M.musicOn = _musicOn;
  saveMeta();
  const btn=document.getElementById('musicbtn');
  if(_musicOn){btn.classList.add('playing');btn.textContent='🎶';_playLoop()}
  else{btn.classList.remove('playing');btn.textContent='🎵';_musicTimers.forEach(t=>clearTimeout(t));_musicTimers=[];_stopFileAudio()}
}

// ============================================================
// V3: UPGRADES, JACKPOT, GAMEPASSES, SETTINGS, WIN MODAL, INDEX
// ============================================================

// Add new skin tiers
SKINS.sixtyseven={name:'67 Skin',odds:1000};
SKINS.secret={name:'Secret',odds:1000000};
SKIN_COLORS.sixtyseven=['linear-gradient(135deg,#00ff80,#0080ff)','linear-gradient(135deg,#ff0080,#8000ff)'];
SKIN_COLORS.secret=['#000','#ff0040'];

// Rarity tiers (1=lowest interest, 7=secret)
const SKIN_RARITY={poo:1,gy:2,rainbow:3,sixtyseven:4,nothing:5,admin:6,secret:7,realadmin:6};
const RARITY_NAMES={1:'Garbage',2:'Common',3:'Rare',4:'Cosmic',5:'Cosmic',6:'Admin',7:'SECRET'};

const UPGRADES=[
  {id:'equip2',name:'Dual Equip',desc:'Mix two board skins (left/right halves)',cost:10000,icon:'🎨'},
  {id:'luck2',name:'2x Luck',desc:'Doubles your roll luck',cost:50000,icon:'🍀',req:'equip2'},
  {id:'luck4',name:'4x Luck',desc:'Quadruples roll luck',cost:200000,icon:'🍀🍀',req:'luck2'},
  {id:'luck8',name:'8x Luck',desc:'8x roll luck',cost:800000,icon:'🌟',req:'luck4'},
  {id:'stockfishMax',name:'Stockfishes',desc:'Unlocks max-strength bots (depth 3+)',cost:1500000,icon:'🧠',req:'luck8'},
  {id:'autoOpenPacks',name:'Auto-Open Packs',desc:'Packs open instantly when bought',cost:3000000,icon:'⚡',req:'stockfishMax'},
  {id:'luck124',name:'124x Luck',desc:'Max luck upgrade',cost:9999900,icon:'🌈',req:'autoOpenPacks'}
];

const MONEY_PACKS=[
  {id:'small',price:99,pounds:10000,name:'Small Pack',desc:'+£100',icon:'💵'},
  {id:'big',price:399,pounds:50000,name:'Big Pack',desc:'+£500',icon:'💸'},
  {id:'mega',price:799,pounds:100000,name:'Mega Pack',desc:'+£1,000',icon:'💰'},
  {id:'ultra',price:1999,pounds:500000,name:'Gigantic Ultra Pack',desc:'+£5,000',icon:'🎰'}
];

const SERVER_LUCK=[
  {mult:2,price:1},{mult:4,price:2},{mult:8,price:3},{mult:16,price:7},{mult:32,price:12},
  {mult:64,price:27},{mult:128,price:43},{mult:256,price:100},{mult:512,price:170},{mult:1024,price:450},
  {mult:2048,price:600},{mult:4096,price:1100},{mult:8192,price:2300},{mult:16384,price:6500},
  {mult:32768,price:23200},{mult:65536,price:56700},{mult:131072,price:125300},
  {mult:262144,price:389600},{mult:524288,price:654600},{mult:1048576,price:1500000}
];

const GAMEPASSES=[
  {id:'money2x',name:'2x Money',desc:'Earn 2x cash on every roll',price:1000,icon:'💎'},
  {id:'vip',name:'VIP',desc:'2x luck + unlocks NVP',price:900,icon:'⭐'},
  {id:'nvp',name:'NVP',desc:'Magnus bot, 2x cash, 2x luck, 2x roll speed (requires VIP)',price:9900,icon:'👑',req:'vip'},
  {id:'nvpPlus',name:'NVP+',desc:'Unlocks NVP++ (requires NVP)',price:99900,icon:'💜',req:'nvp'},
  {id:'nvpPlusPlus',name:'NVP++',desc:'2x roll speed, 8x cash, 64x luck, VIP board+piece (requires NVP+)',price:999900,icon:'💠',req:'nvpPlus'},
  {id:'nvpEquals',name:'🆕 NVP=+++++=======+++++======++++++++==',desc:'10× cash, 10× luck, 10× roll speed (requires NVP++)',price:300000000,icon:'♾️',req:'nvpPlusPlus'}
];

// ----- LUCK / MULTIPLIER CALC -----
function getLuck(){
  let l=1;
  if(M.serverLuckEndTime && Date.now() > M.serverLuckEndTime) {
      if(M.serverLuckMult > 1 && typeof showAnnouncement === 'function') showAnnouncement('\u23F3 Server luck has expired!');
      M.serverLuckMult = 1;
      M.serverLuckEndTime = 0;
      if(typeof updateLuckChip === 'function') updateLuckChip();
  }
  if(M.crownLuckEnd && Date.now() > M.crownLuckEnd) {
      if(M.crownLuckActive && typeof showAnnouncement === 'function') showAnnouncement('\u23F3 Crown luck has expired!');
      M.crownLuckActive = false;
      M.crownLuckEnd = 0;
      if(typeof updateLuckChip === 'function') updateLuckChip();
  }
  const up=M.upgradesPurchased||{};
  if(up.luck2)l*=2;if(up.luck4)l*=4;if(up.luck8)l*=8;if(up.luck124)l*=124;
  const gp=M.gamepasses||{};
  if(gp.vip)l*=2;if(gp.nvp)l*=2;if(gp.nvpPlusPlus)l*=64;
  l*=(Number(M.serverLuckMult)||1);
  if(M.crownLuckActive) l*=2;
  return l;
}
function getMoneyMult(){
  let m=1;const gp=M.gamepasses||{};
  if(gp.money2x)m*=2;if(gp.nvp)m*=2;if(gp.nvpPlusPlus)m*=8;
  return m;
}
function getRollSpeed(){
  let s=1;const gp=M.gamepasses||{};
  if(gp.nvp)s*=2;if(gp.nvpPlusPlus)s*=2;
  return s;
}

// ----- OVERRIDE doSpin WITH LUCK + JACKPOT + ANIMATION -----
const _origDoSpin=doSpin;
doSpin=function(){
  const sb=document.getElementById('spinbtn');
  if(sb){sb.classList.remove('rolling');void sb.offsetWidth;sb.classList.add('rolling')}
  M.rolls=(Number(M.rolls)||0)+1;
  const mm=getMoneyMult();
  M.money=(Number(M.money)||0)+100*mm;
  flashMoneyToast('+£'+mm.toFixed(2));
  const luck=getLuck();
  // Jackpot 1/1,000,000,000,000 (1 trillion, scales with luck)
  if(Math.random()<luck/1e12){triggerJackpot();saveMeta();refreshUI();updateLuckChip();return}
  // Skin roll table (rarest first), with luck multiplier
  const table=[['secret',1000000],['sixtyseven',1000],['admin',5000],['nothing',500],['rainbow',100],['gy',10],['poo',3]];
  let result=null;
  for(const [sk,baseOdds] of table){
    if(Math.random()<luck/baseOdds){result=sk;break}
  }
  M.lbReadyAfterRoll=true;
  if(result){
    M.inventory[result]=(M.inventory[result]||0)+1;
    if(SKINS[result]&&SKINS[result].odds>=500)showCutscene(result);
  }
  // Hidden free-shop unlock progress
  trackHiddenFreeShop('roll');
  saveMeta();refreshUI();updateLuckChip();
  if(!document.getElementById('itemmodal').classList.contains('hidden'))renderItems();
  if(!document.getElementById('indexmodal').classList.contains('hidden'))renderIndex();
};

// ----- CUTSCENE: click anywhere already wired -----
// Update threshold check in showCutscene already handled by SKINS[].odds>=500 above

// ----- LUCK CHIP -----
function updateLuckChip(){
  const el=document.getElementById('luckval');if(!el)return;
  const l=getLuck();
  el.textContent=l>=1000?(l/1000).toFixed(1)+'kx':l+'x';
}

// ----- JACKPOT WHEEL -----
const JP_SEGMENTS=[
  {label:'Rainbow ×3',skin:'rainbow',count:3,deg:45},
  {label:'Nothing ×2',skin:'nothing',count:2,deg:135},
  {label:'Secret Admin',skin:'realadmin',count:1,deg:225},
  {label:'Nothing ×3',skin:'nothing',count:3,deg:315}
];
function triggerJackpot(){
  const sc=document.getElementById('jpscene');
  const wheel=document.getElementById('jpwheel');
  const res=document.getElementById('jpresult');
  const btn=document.getElementById('jpcloseBtn');
  res.textContent='Spinning…';btn.style.display='none';sc.classList.remove('hidden');
  // Pick random segment
  const idx=Math.floor(Math.random()*JP_SEGMENTS.length);
  const seg=JP_SEGMENTS[idx];
  // Spin: many rotations + offset so pointer lands on segment
  const baseRot=1800+Math.random()*360;
  const finalRot=baseRot+(360-seg.deg);
  wheel.style.transform='rotate(0deg)';void wheel.offsetWidth;
  wheel.style.transform='rotate('+finalRot+'deg)';
  setTimeout(()=>{
    // Apply rewards
    for(let i=0;i<seg.count;i++)M.inventory[seg.skin]=(M.inventory[seg.skin]||0)+1;
    saveMeta();refreshUI();
    res.innerHTML='🎉 You won <b style="color:#ffd700">'+seg.label+'</b>!';
    btn.style.display='inline-block';
  },5100);
}
function closeJackpot(){document.getElementById('jpscene').classList.add('hidden')}

// ----- UPGRADES -----
function isUpgOwned(id){return M.upgradesPurchased&&M.upgradesPurchased[id]}
function canBuyUpg(u){
  if(isUpgOwned(u.id))return false;
  if(u.req&&!isUpgOwned(u.req))return false;
  if(u.rollCost)return (Number(M.rolls)||0)>=u.rollCost;
  return M.money>=u.cost;
}
function renderUpgrades(){
  const el=document.getElementById('upglist');el.innerHTML='';
  for(const u of UPGRADES){
    const owned=isUpgOwned(u.id);
    const reqMissing=u.req&&!isUpgOwned(u.req);
    const card=document.createElement('div');
    card.className='upgcard'+(owned?' owned':'');
    const costTxt=owned?'OWNED':(u.rollCost?(u.rollCost.toLocaleString()+' rolls'):fmtMoney(u.cost));
    card.innerHTML=`<div class="upgicon">${u.icon}</div><div class="upginfo"><div class="upgname">${u.name}</div><div class="upgdesc">${u.desc}${reqMissing?' — <span style="color:#ff8080">needs '+UPGRADES.find(x=>x.id===u.req).name+'</span>':''}</div><div class="upgcost">${costTxt}${u.rollCost&&!owned?' (you have '+(Number(M.rolls)||0).toLocaleString()+')':''}</div></div>`;
    if(owned){
      // Owned: show a Stop button that refunds & removes the upgrade
      const stop=document.createElement('button');stop.className='upgbuy';
      stop.textContent='✖ Stop';stop.style.background='linear-gradient(135deg,#aa4444,#5a1f1f)';
      stop.onclick=()=>stopUpg(u);
      card.appendChild(stop);
    }else{
      const btn=document.createElement('button');btn.className='upgbuy';
      btn.textContent='Buy';btn.disabled=!canBuyUpg(u);
      btn.onclick=()=>buyUpg(u);
      card.appendChild(btn);
    }
    el.appendChild(card);
  }
}
function buyUpg(u){
  if(!canBuyUpg(u))return;
  if(u.rollCost)M.rolls=(Number(M.rolls)||0)-u.rollCost;
  else M.money-=u.cost;
  M.upgradesPurchased=M.upgradesPurchased||{};M.upgradesPurchased[u.id]=true;
  saveMeta();refreshUI();renderUpgrades();updateLuckChip();
  showAnnouncement('✨ Unlocked: '+u.name);
}
function stopUpg(u){
  if(!M.upgradesPurchased||!M.upgradesPurchased[u.id])return;
  delete M.upgradesPurchased[u.id];
  // Refund: rolls for roll-cost upgrades, money otherwise
  if(u.rollCost){M.rolls=(Number(M.rolls)||0)+u.rollCost;showAnnouncement('✖ Stopped '+u.name+' — refunded '+u.rollCost.toLocaleString()+' rolls')}
  else{M.money=(Number(M.money)||0)+(Number(u.cost)||0);showAnnouncement('✖ Stopped '+u.name+' — refunded '+fmtMoney(u.cost))}
  saveMeta();refreshUI();renderUpgrades();updateLuckChip();
  if(typeof applyInfiniteEquip==='function')applyInfiniteEquip();
}

// ----- INDEX -----
function renderIndex(){
  if(typeof grantVipSkinIfNvp==='function')grantVipSkinIfNvp();
  const grid=document.getElementById('indexgrid');grid.innerHTML='';
  const all=['poo','gy','rainbow','sixtyseven','nothing','admin','realadmin','secret','omega','infinity','royal','vip','owner','svp'];
  let claimable=0;
  for(const sk of all){
    if(!SKINS[sk])continue;
    const owned=(M.inventory[sk]||0)>0;
    const claimed=M.claimedSkins&&M.claimedSkins[sk];
    const card=document.createElement('div');
    card.className='indexcard'+(owned?' owned':' locked')+(claimed?' claimed':'');
    const prev=document.createElement('div');prev.className='ixprev';
    applySkinPreview(prev,sk);
    card.appendChild(prev);
    const nm=document.createElement('div');nm.className='ixname';
    nm.textContent=owned?SKINS[sk].name:'???';
    card.appendChild(nm);
    const tier=SKIN_RARITY[sk]||1;
    const rar=document.createElement('div');rar.className='ixrar rar-'+tier;
    rar.textContent=owned?(RARITY_NAMES[tier]||''):'';
    card.appendChild(rar);
    if(owned&&!claimed){claimable++;card.onclick=()=>claimIndex(sk)}
    grid.appendChild(card);
  }
  if(claimable===0){
    const note=document.createElement('div');note.style.cssText='grid-column:1/-1;color:#888;text-align:center;padding:10px;font-size:12px';
    note.textContent=claimable===0?'No unclaimed skins right now.':'';
  }
}
function claimIndex(sk){
  M.claimedSkins=M.claimedSkins||{};
  if(M.claimedSkins[sk])return;
  M.claimedSkins[sk]=true;
  
  M.indexMultiplier = M.indexMultiplier || 1;
  const reward = 1000 * M.indexMultiplier;
  M.money += reward;
  M.indexMultiplier *= 2; // Double for next time
  
  saveMeta();refreshUI();renderIndex();
  showAnnouncement('📖 Claimed +£' + (reward/100) + ' for '+SKINS[sk].name + ' (Next claim: £' + (10*M.indexMultiplier) + ')');
}

// ----- SETTINGS -----
function renderSettings(){
  // Speed
  const sc=document.getElementById('speedctrl');sc.innerHTML='';
  const ss=[0.25,1,2,3,4,5];const curS=M.gameSpeed||1;
  for(const s of ss){
    const b=document.createElement('button');b.className='settingchip'+(curS===s?' on':'');
    b.textContent=s+'x';b.onclick=()=>{M.gameSpeed=s;saveMeta();renderSettings()};sc.appendChild(b);
  }
  // Volume
  const vc=document.getElementById('volctrl');vc.innerHTML='';
  const vs=[0,0.25,0.5,0.75,1,2,3];const curV=M.musicVol===undefined?0.5:M.musicVol;
  for(const v of vs){
    const b=document.createElement('button');b.className='settingchip'+(curV===v?' on':'');
    b.textContent=Math.round(v*100)+'%';b.onclick=()=>{M.musicVol=v;saveMeta();if(typeof _fileAudio!=='undefined'&&_fileAudio)_fileAudio.volume=Math.min(1,v);renderSettings()};vc.appendChild(b);
  }
  // Music track
  const tc=document.getElementById('trackctrl');
  if(tc&&typeof MUSIC_TRACKS!=='undefined'){
    tc.innerHTML='';const curT=(M.musicTrack)||0;
    MUSIC_TRACKS.forEach((tr,i)=>{
      const b=document.createElement('button');b.className='settingchip'+(curT===i?' on':'');
      b.textContent=tr.name;b.onclick=()=>setMusicTrack(i);tc.appendChild(b);
    });
  }
  // Skip cutscenes toggle
  const skc=document.getElementById('skipcsctrl');
  if(skc){
    skc.innerHTML='';
    [['On',true],['Off',false]].forEach(([lbl,val])=>{
      const b=document.createElement('button');b.className='settingchip'+((!!M.skipCutscenes)===val?' on':'');
      b.textContent=lbl;b.onclick=()=>{M.skipCutscenes=val;saveMeta();renderSettings()};skc.appendChild(b);
    });
  }
  // Premoves toggle
  const prec=document.getElementById('premovectrl');
  if(prec){
    prec.innerHTML='';
    [['On',true],['Off',false]].forEach(([lbl,val])=>{
      const b=document.createElement('button');b.className='settingchip'+((!!M.premoves)===val?' on':'');
      b.textContent=lbl;b.onclick=()=>{M.premoves=val;if(!val&&typeof G!=='undefined'&&G){G.premove=null;G.premoveSel=null}saveMeta();renderSettings()};prec.appendChild(b);
    });
  }
  // Mobile Mode toggle
  const mobc=document.getElementById('mobilemodectrl');
  if(mobc){
    mobc.innerHTML='';
    [['On',true],['Off',false]].forEach(([lbl,val])=>{
      const b=document.createElement('button');b.className='settingchip'+((!!M.mobileMode)===val?' on':'');
      b.textContent=lbl;b.onclick=()=>{
        M.mobileMode=val;
        saveMeta();
        if(val) document.body.classList.add('mobile-mode');
        else document.body.classList.remove('mobile-mode');
        renderSettings();
      };
      mobc.appendChild(b);
    });
  }
  // Uploaded music state
  const nameEl=document.getElementById('upmusicname');
  if(nameEl&&window._uploadedMusicName){
    nameEl.textContent='Loaded: '+window._uploadedMusicName;
    document.getElementById('upmusicplay').disabled=false;
    document.getElementById('upmusicreq').disabled=false;
  }
}
function applyQuality(){
  // Fixed high quality (1000) — 72px squares
  const px=72;
  const board=document.getElementById('board');
  if(board){
    const sqs=board.querySelectorAll('.sq');
    sqs.forEach(s=>{s.style.width=px+'px';s.style.height=px+'px';s.style.fontSize=Math.round(px*0.6)+'px'});
    board.style.gridTemplateColumns='repeat(8,'+px+'px)';
    board.style.gridTemplateRows='repeat(8,'+px+'px)';
  }
}

// ----- SAVE / LOAD CODE -----
function copySaveCode(){
  const code=btoa(encodeURIComponent(JSON.stringify(M)));
  document.getElementById('savecode').textContent=code;
  document.getElementById('savecodebox').classList.remove('hidden');
  try{navigator.clipboard&&navigator.clipboard.writeText(code);showAnnouncement('💾 Save code copied to clipboard')}
  catch(e){showAnnouncement('💾 Save code shown below — copy manually')}
}
function promptLoadCode(){
  const code=prompt('Paste your save code:');
  if(!code)return;
  try{
    const data=JSON.parse(decodeURIComponent(atob(code.trim())));
    if(!data||typeof data!=='object')throw new Error('Bad data');
    M=Object.assign(loadMeta(),data);saveMeta();refreshUI();updateLuckChip();applyQuality();
    showAnnouncement('✅ Progress restored');
  }catch(e){alert('Invalid save code')}
}

// ----- RESET PROGRESS WITH PASSWORD -----
function resetProgressFlow(){
  // Step 1: no password yet -> prompt to set one
  if(!M.resetPassword){
    const p=prompt('First, set a password. You\'ll be asked to type it again to confirm reset.\n\nNew password:');
    if(!p)return;
    M.resetPassword=p;saveMeta();
    document.getElementById('resetsub').textContent='Password set. Click "Reset…" again to confirm.';
    return;
  }
  // Step 2: show input
  document.getElementById('resetinput').classList.remove('hidden');
}
function confirmResetProgress(){
  const v=document.getElementById('resetpass').value;
  if(v!==M.resetPassword){alert('Wrong password.');return}
  if(!confirm('Wipe ALL progress permanently?'))return;
  localStorage.removeItem('chessmeta');localStorage.removeItem('chesslb');
  location.href = location.pathname + "?v=" + new Date().getTime();
}
function cancelReset(){document.getElementById('resetinput').classList.add('hidden')}

// ----- WIN MODAL -----
function showWinModal(result,change,oppName){
  const m=document.getElementById('winmodal');m.classList.remove('hidden','loss','draw');
  if(result===1){m.classList.add('winmodal');document.getElementById('winemoji').textContent='🏆 VICTORY';document.getElementById('winhead').innerHTML='You Win! <button class="mclose" onclick="closeModal(\'winmodal\')">✕</button>'}
  else if(result===0){m.classList.add('loss');document.getElementById('winemoji').textContent='💔 DEFEAT';document.getElementById('winhead').innerHTML='You Lost <button class="mclose" onclick="closeModal(\'winmodal\')">✕</button>'}
  else{m.classList.add('draw');document.getElementById('winemoji').textContent='🤝 DRAW';document.getElementById('winhead').innerHTML='Draw <button class="mclose" onclick="closeModal(\'winmodal\')">✕</button>'}
  const sub=document.getElementById('winsub');
  if(oppName)sub.innerHTML='vs <b>'+oppName+'</b><br>ELO change: <b>'+(change>=0?'+':'')+change+'</b><br>New ELO: <b>'+M.elo+'</b>';
  else sub.innerHTML='Local game — no ELO change.';
}

// Hook into existing ELO toast to also show modal
const _origShowEloToast=showEloToast;
showEloToast=function(change,oppName,result,newElo){_origShowEloToast(change,oppName,result,newElo);showWinModal(result,change,oppName)};

// ----- DRAW DETECTION (50-move, 3-fold repetition, insufficient material) -----
function fenLite(b,t){
  let s='';for(let r=0;r<8;r++){for(let c=0;c<8;c++)s+=b[r][c]||'.';s+='/'}
  return s+'|'+t;
}
function checkDrawRules(){
  if(!G||G.status!=='playing')return;
  // 50-move
  if((G.fiftyMove||0)>=100){G.status='draw';G.drawReason='50-move rule';showDrawNotice()}
  // 3-fold
  const f=fenLite(G.board,G.turn);
  G.posHist=G.posHist||{};
  G.posHist[f]=(G.posHist[f]||0)+1;
  if(G.posHist[f]>=3){G.status='draw';G.drawReason='3-fold repetition';showDrawNotice()}
  // Insufficient material
  if(insufficientMaterial(G.board)){G.status='draw';G.drawReason='Insufficient material';showDrawNotice()}
}
function insufficientMaterial(b){
  const ps=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(b[r][c]&&b[r][c].toLowerCase()!=='k')ps.push(b[r][c].toLowerCase());
  if(ps.length===0)return true;
  if(ps.length===1&&(ps[0]==='n'||ps[0]==='b'))return true;
  if(ps.length===2&&ps[0]==='b'&&ps[1]==='b')return true; // approx
  return false;
}
function showDrawNotice(){
  showAnnouncement('🤝 Draw: '+G.drawReason);
  if(G.opponent&&G.opponent.type==='ai'&&!G.opponent._eloApplied){G.opponent._eloApplied=true;showWinModal(0.5,0,G.opponent.name)}
  else showWinModal(0.5,0,null);
}

// ----- HIDDEN: free shop unlock via specific sequence -----
function trackHiddenFreeShop(action){
  if(M.hiddenFreeShop)return;
  M.hiddenSeq=M.hiddenSeq||{};
  const s=M.hiddenSeq;
  if(action==='move10'&&M.totalMoves>=10)s.move10=true;
  if(action==='roll'&&s.move10)s.roll=true;
  if(action==='items'&&s.roll)s.items=true;
  if(action==='items_close'&&s.items)s.itemsC=true;
  if(action==='shop'&&s.itemsC)s.shop=true;
  if(action==='shop_close'&&s.shop)s.shopC=true;
  if(action==='lb'&&s.shopC)s.lb=true;
  if(action==='lb_close'&&s.lb){M.hiddenFreeShop=true;saveMeta();showAnnouncement('🎉 SECRET: Free shop unlocked!');renderShop()}
}
function markHiddenLb(){trackHiddenFreeShop('lb')}

// ----- AUGMENT OPENMODAL FOR NEW MODALS + HIDDEN TRACKING -----
const _origOpenModal=openModal;
openModal=function(id){
  _origOpenModal(id);
  if(id==='upgmodal')renderUpgrades();
  if(id==='indexmodal')renderIndex();
  if(id==='settingsmodal')renderSettings();
  if(id==='itemmodal')trackHiddenFreeShop('items');
  if(id==='shopmodal')trackHiddenFreeShop('shop');
  if(id==='lbmodal')trackHiddenFreeShop('lb');
};
const _origCloseModal=closeModal;
closeModal=function(id){
  _origCloseModal(id);
  if(id==='itemmodal')trackHiddenFreeShop('items_close');
  if(id==='shopmodal')trackHiddenFreeShop('shop_close');
  if(id==='lbmodal')trackHiddenFreeShop('lb_close');
};

// ----- 100x NEW GAME SECRET -----
const _origUserNewGame=userNewGame;
userNewGame=function(){
  _origUserNewGame();
  if(M.newGameClicks===100&&!M.secret100){
    M.secret100=true;
    M.inventory.nothing=(M.inventory.nothing||0)+1;
    M.inventory.admin=(M.inventory.admin||0)+1;
    saveMeta();refreshUI();
    showAnnouncement('🎉 SECRET: 100 new games — Nothing + Admin skins granted!');
  }
};

// ----- OVERRIDE RENDER SHOP TO INCLUDE EVERYTHING -----
const _origRenderShop=renderShop;
renderShop=function(){
  _origRenderShop();
  const gp=document.getElementById('gamepassshop');
  // Add money packs
  const moneySec=document.createElement('div');moneySec.className='shopsection';moneySec.textContent='💵 Money Packs';
  gp.parentElement.insertBefore(moneySec,gp.nextSibling);
  for(const p of MONEY_PACKS){
    const card=document.createElement('div');card.className='packcard';
    const free=M.hiddenFreeShop;
    card.innerHTML=`<div class="packicon">${p.icon}</div><div class="packinfo"><div class="packname">${p.name}</div><div class="packdesc">${p.desc}</div><div class="packprice">${free?'FREE':fmtMoney(p.price)}</div></div>`;
    const b=document.createElement('button');b.className='packbuy';b.textContent='Buy';b.disabled=!free&&M.money<p.price;
    b.onclick=()=>{
      if(free){M.money+=p.pounds;saveMeta();refreshUI();renderShop();showAnnouncement('+'+fmtMoney(p.pounds));return;}
      pendingCheckout = { type: 'moneypack', pounds: p.pounds, price: p.price };
      document.getElementById('checkout-item-name').textContent = p.name;
      document.getElementById('checkout-item-price').textContent = "Total: £" + (p.price/100).toFixed(2);
      const btn = document.getElementById('checkout-pay-btn');
      btn.textContent = "Pay Now"; btn.style.background = "#28a745"; btn.disabled = false;
      closeModal('shopmodal'); openModal('checkoutmodal');
    };
    card.appendChild(b);gp.parentElement.insertBefore(card,moneySec.nextSibling);
  }
  // Add gamepasses
  const gpSec=document.createElement('div');gpSec.className='shopsection';gpSec.textContent='🎟 Premium Gamepasses';
  gp.parentElement.appendChild(gpSec);
  for(const g of GAMEPASSES){
    const owned=M.gamepasses&&M.gamepasses[g.id];
    const reqOk=!g.req||(M.gamepasses&&M.gamepasses[g.req]);
    const card=document.createElement('div');
    card.className='packcard '+(g.id==='vip'?'vip':g.id==='nvp'?'nvp':g.id==='nvpPlus'?'nvp-plus':g.id==='nvpPlusPlus'?'nvp-plus-plus':'')+(!reqOk?' locked-pack':'');
    const free=M.hiddenFreeShop;
    card.innerHTML=`<div class="packicon">${g.icon}</div><div class="packinfo"><div class="packname">${g.name}${owned?' ✓':''}</div><div class="packdesc">${g.desc}</div><div class="packprice">${free?'FREE':fmtMoney(g.price)}</div></div>`;
    const b=document.createElement('button');b.className='packbuy';
    b.textContent=owned?'Owned':!reqOk?'Locked':'Buy';
    b.disabled=owned||!reqOk||(!free&&M.money<g.price);
    b.onclick=()=>{
      if(free){M.gamepasses=M.gamepasses||{};M.gamepasses[g.id]=true;saveMeta();refreshUI();renderShop();updateLuckChip();showAnnouncement('🎉 '+g.name+' purchased!');return;}
      pendingCheckout = { type: 'gamepass', id: g.id, name: g.name, price: g.price };
      document.getElementById('checkout-item-name').textContent = g.name;
      document.getElementById('checkout-item-price').textContent = "Total: £" + (g.price/100).toFixed(2);
      const btn = document.getElementById('checkout-pay-btn');
      btn.textContent = "Pay Now"; btn.style.background = "#28a745"; btn.disabled = false;
      closeModal('shopmodal'); openModal('checkoutmodal');
    };
    card.appendChild(b);gp.parentElement.appendChild(card);
  }
  // Server luck
  const slSec=document.createElement('div');slSec.className='shopsection';slSec.textContent='🍀 Server Luck Boost';
  gp.parentElement.appendChild(slSec);
  const slNote=document.createElement('div');slNote.style.cssText='font-size:11px;color:#aac;margin-bottom:8px';slNote.textContent='Each tier permanently multiplies your luck. Stacks with upgrades & gamepasses.';
  gp.parentElement.appendChild(slNote);
  const curSL=Number(M.serverLuckMult)||1;
  for(const sl of SERVER_LUCK){
    const free=M.hiddenFreeShop;
    if(sl.mult<=curSL)continue;
    if(sl.mult>curSL*2)continue; // only show next 1-2 tiers to avoid spam
    const card=document.createElement('div');card.className='packcard';
    card.innerHTML=`<div class="packicon">🍀</div><div class="packinfo"><div class="packname">${sl.mult}x Server Luck</div><div class="packdesc">Total: ${sl.mult}x luck multiplier</div><div class="packprice">${free?'FREE':fmtMoney(sl.price)}</div></div>`;
    const b=document.createElement('button');b.className='packbuy';b.textContent='Buy';b.disabled=!free&&M.money<sl.price;
    b.onclick=()=>{
      if(free){M.serverLuckMult=sl.mult;M.serverLuckEndTime=Date.now()+45*60000;saveMeta();refreshUI();renderShop();updateLuckChip();showAnnouncement('🍀 Server luck '+sl.mult+'x for 45m');return;}
      pendingCheckout = { type: 'serverluck', mult: sl.mult, price: sl.price };
      document.getElementById('checkout-item-name').textContent = sl.mult+'x Server Luck';
      document.getElementById('checkout-item-price').textContent = "Total: £" + (sl.price/100).toFixed(2);
      const btn = document.getElementById('checkout-pay-btn');
      btn.textContent = "Pay Now"; btn.style.background = "#28a745"; btn.disabled = false;
      closeModal('shopmodal'); openModal('checkoutmodal');
    };
    card.appendChild(b);gp.parentElement.appendChild(card);
  }
};

// ----- AUTO ROLL COST CHANGE -----
// Override toggleAutoRoll to use 1000 fake money (£10)
const _origToggle=toggleAutoRoll;
toggleAutoRoll=function(){
  if(!M.autoRollOwned){
    if(M.money<1000){showAnnouncement('Need £10 to buy Auto Roll!');return}
    M.money-=1000;M.autoRollOwned=true;M.autoRollActive=true;
    showAnnouncement('🎉 Auto Roll purchased!');saveMeta();refreshUI();startAutoRoll();return;
  }
  _origToggle();
};
// Update display
const _origRefresh=refreshUI;
refreshUI=function(){
  _origRefresh();
  const arb=document.getElementById('autorollbtn');
  if(arb&&!M.autoRollOwned)arb.textContent='Buy Auto Roll £10.00';
};

// ----- AUTO ROLL SPEED RESPECTS GAMEPASSES -----
const _origStartAutoRoll=startAutoRoll;
startAutoRoll=function(){
  if(autoRollTimer){clearInterval(autoRollTimer);autoRollTimer=null}
  if(M.autoRollOwned&&M.autoRollActive){
    const baseMs=1500/getRollSpeed()/(Number(M.gameSpeed)||1);
    autoRollTimer=setInterval(()=>doSpin(),Math.max(150,baseMs));
  }
};

// ----- MUSIC VOLUME -----
const _origPlayNote=_playNote;
_playNote=function(freq,dur,when,gain,type){
  const vol=M&&M.musicVol!==undefined?M.musicVol:0.5;
  _origPlayNote(freq,dur,when,gain*vol*2,type);
};

// ----- INIT FOR NEW STATE FIELDS -----
function v3MigrateMeta(){
  if(!M.upgradesPurchased)M.upgradesPurchased={};
  if(!M.gamepasses)M.gamepasses={};
  if(M.serverLuckMult===undefined)M.serverLuckMult=1;
  if(!M.claimedSkins)M.claimedSkins={};
  if(M.quality===undefined)M.quality=600;
  if(M.gameSpeed===undefined)M.gameSpeed=1;
  if(M.musicVol===undefined)M.musicVol=0.5;
  if(!M.hiddenSeq)M.hiddenSeq={};
  saveMeta();
}

// ============================================================
// ACCOUNTS (local — username + password stored in browser)
// ============================================================
let _acctTab='signup';
function renderAccount(){
  const v=document.getElementById('acctview');
  const title=document.getElementById('accttitle');
  if(M.account){
    title.innerHTML='👤 Account <button class="mclose" onclick="closeModal(\'acctmodal\')">✕</button>';
    const created=new Date(M.account.createdAt||Date.now()).toLocaleDateString();
    v.innerHTML=`
      <div class="accprofile">
        <div class="accav">${M.account.username[0].toUpperCase()}</div>
        <div class="accinfo">
          <div class="accname">${M.account.username}</div>
          <div class="accmeta">Joined ${created} • ELO ${M.elo} • ${M.gamesPlayed||0} games</div>
        </div>
      </div>
      <div style="font-size:12px;color:#aac;margin-bottom:12px">Your username shows up on the leaderboard.</div>
      <div style="background:#1a2a40;border-left:3px solid #4a80c0;padding:10px 12px;border-radius:0 6px 6px 0;font-size:12px;color:#aaccff;margin-bottom:12px;line-height:1.5">
        🌐 <b>Multiplayer sync:</b> if you signed up before the multiplayer server was deployed, your account exists only in this browser.
        Click below to register it on the server so friends & matchmaking work.
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="modebtn mode-vs" style="text-align:center" onclick="resyncAccountToServer()">🌐 Re-register on Server</button>
        <button class="modebtn mode-mm" style="text-align:center" onclick="switchAccount()">🔄 Switch Account</button>
        <button class="dangerbtn" onclick="logoutAccount()">Log out</button>
      </div>`;
    return;
  }
  const isSignup=_acctTab==='signup';
  v.innerHTML=`
    <div class="acctabs">
      <div class="acctab ${isSignup?'active':''}" onclick="switchAcctTab('signup')">Sign Up</div>
      <div class="acctab ${!isSignup?'active':''}" onclick="switchAcctTab('login')">Log In</div>
    </div>
    <div class="accform">
      <label>Username</label>
      <input type="text" id="accusername" placeholder="pick a name" maxlength="20" autocomplete="off">
      <label>Password</label>
      <input type="password" id="accpassword" placeholder="${isSignup?'create a password':'your password'}" autocomplete="off">
      ${isSignup?'<label>Confirm Password</label><input type="password" id="accconfirm" placeholder="repeat password" autocomplete="off">':''}
      <div class="accerr" id="accerr"></div>
      <button class="modebtn mode-vs" style="text-align:center" onclick="${isSignup?'createAccount':'loginAccount'}()">${isSignup?'Create Account':'Log In'}</button>
    </div>`;
}
function switchAcctTab(t){_acctTab=t;renderAccount()}
function createAccount(){
  const u=document.getElementById('accusername').value.trim();
  const p=document.getElementById('accpassword').value;
  const c=document.getElementById('accconfirm').value;
  const err=document.getElementById('accerr');
  if(u.length<2){err.textContent='Username too short';return}
  if(!/^[A-Za-z0-9_-]+$/.test(u)){err.textContent='Letters, numbers, _ and - only';return}
  if(p.length<3){err.textContent='Password must be at least 3 chars';return}
  if(p!==c){err.textContent='Passwords do not match';return}
  // Check existing accounts list (multiple accounts can exist on same browser)
  const dir=JSON.parse(localStorage.getItem('chessaccts')||'{}');
  if(dir[u.toLowerCase()]){err.textContent='Username already taken';return}
  dir[u.toLowerCase()]={username:u,password:btoa(p),createdAt:Date.now()};
  localStorage.setItem('chessaccts',JSON.stringify(dir));
  M.account={username:u,createdAt:Date.now()};
  saveMeta();renderAccount();refreshAccountBtn();
  // Update leaderboard with new name
  const lb=loadLb();const me=lb.find(e=>e.name==='You'||e.name===M.account.username);
  if(me)me.name=u;else lb.push({name:u,score:getScore()});
  saveLb(lb);
  showAnnouncement('🎉 Welcome, '+u+'!');
}
function loginAccount(){
  const u=document.getElementById('accusername').value.trim();
  const p=document.getElementById('accpassword').value;
  const err=document.getElementById('accerr');
  const dir=JSON.parse(localStorage.getItem('chessaccts')||'{}');
  const rec=dir[u.toLowerCase()];
  if(!rec){err.textContent='No account with that username';return}
  if(rec.password!==btoa(p)){err.textContent='Wrong password';return}
  M.account={username:rec.username,createdAt:rec.createdAt};
  saveMeta();renderAccount();refreshAccountBtn();
  showAnnouncement('👋 Welcome back, '+rec.username+'!');
}
function logoutAccount(){
  if(!confirm('Log out? Your progress stays saved on this device.'))return;
  M.account=null;M.adminUnlocked=false;saveMeta();renderAccount();refreshAccountBtn();
  if(typeof refreshUI==='function')refreshUI();
}
// Sign out and jump straight to the Log In screen to switch to another account
function switchAccount(){
  M.account=null;M.adminUnlocked=false;saveMeta();refreshAccountBtn();
  if(typeof refreshUI==='function')refreshUI();
  _acctTab='login';
  renderAccount();
  showAnnouncement('🔄 Log in to a different account');
}
function refreshAccountBtn(){
  const b=document.getElementById('acctbtn');if(!b)return;
  if(M.account){b.textContent='👤 '+M.account.username;b.classList.add('loggedin')}
  else{b.textContent='👤 Sign Up';b.classList.remove('loggedin')}
}

// Hook account modal into openModal
const _origOpenModal2=openModal;
openModal=function(id){
  _origOpenModal2(id);
  if(id==='acctmodal')renderAccount();
};

// Use account name in leaderboard sync
const _origSyncLb=syncLb;
syncLb=function(){
  _origSyncLb();
  if(M.account){
    const lb=loadLb();
    const me=lb.find(e=>e.name==='You');
    if(me)me.name=M.account.username;
    saveLb(lb);
  }
};

// Boot V3
// ============================================================
// SERVER API — real multiplayer (leaderboard, friends, matchmaking, announcements)
// ============================================================
window.API=(()=>{
  async function call(path,opts){
    try{const res=await fetch(path,opts);if(!res.ok)throw new Error('HTTP '+res.status);return await res.json()}
    catch(e){console.warn('[api]',path,'failed:',e.message);return{ok:false,err:e.message,offline:true}}
  }
  const j={'Content-Type':'application/json'};
  return{
    signup:(u,p)=>call('/api/signup',{method:'POST',headers:j,body:JSON.stringify({username:u,password:p})}),
    login:(u,p)=>call('/api/login',{method:'POST',headers:j,body:JSON.stringify({username:u,password:p})}),
    leaderboard:()=>call('/api/leaderboard'),
    elo:(u,e)=>call('/api/elo',{method:'POST',headers:j,body:JSON.stringify({username:u,elo:e})}),
    upgrades:(u,upg)=>call('/api/upgrades',{method:'POST',headers:j,body:JSON.stringify({username:u,upgrades:upg})}),
    money:(u,money)=>call('/api/money',{method:'POST',headers:j,body:JSON.stringify({username:u,money:money})}),
    rolls:(u,rolls)=>call('/api/rolls',{method:'POST',headers:j,body:JSON.stringify({username:u,rolls:rolls})}),
    searchUsers:q=>call('/api/users/search?q='+encodeURIComponent(q)),
    friends:u=>call('/api/friends?user='+encodeURIComponent(u)),
    addFriend:(u,f)=>call('/api/friends/add',{method:'POST',headers:j,body:JSON.stringify({user:u,friend:f})}),
    myFriendCode:u=>call('/api/friends/mycode?user='+encodeURIComponent(u)),
    addByCode:(u,code)=>call('/api/friends/addByCode',{method:'POST',headers:j,body:JSON.stringify({user:u,code})}),
    removeFriend:(u,f)=>call('/api/friends/remove',{method:'POST',headers:j,body:JSON.stringify({user:u,friend:f})}),
    announce:(u,m)=>call('/api/announce',{method:'POST',headers:j,body:JSON.stringify({user:u,msg:m,password:M?.account?.password})}),
    announceSince:ts=>call('/api/announce/since?ts='+ts + (M&&M.account?'&user='+encodeURIComponent(M.account.username):'')),
    queueJoin:(u,e)=>call('/api/queue/join',{method:'POST',headers:j,body:JSON.stringify({user:u,elo:e})}),
    queueLeave:u=>call('/api/queue/leave',{method:'POST',headers:j,body:JSON.stringify({user:u})}),
    challengeSend:(from,to)=>call('/api/challenge/send',{method:'POST',headers:j,body:JSON.stringify({from,to})}),
    challengeIncoming:user=>call('/api/challenge/incoming?user='+encodeURIComponent(user)),
    challengeStatus:(from,to)=>call('/api/challenge/status?from='+encodeURIComponent(from)+'&to='+encodeURIComponent(to)),
    challengeRespond:(from,to,accept)=>call('/api/challenge/respond',{method:'POST',headers:j,body:JSON.stringify({from,to,accept})}),
    matchState:(matchId,since)=>call('/api/match/state?matchId='+encodeURIComponent(matchId)+'&since='+(since||0)),
    matchMove:(matchId,user,from,to,promo)=>call('/api/match/move',{method:'POST',headers:j,body:JSON.stringify({matchId,user,from,to,promo})}),
    matchEnd:(matchId,status,winner)=>call('/api/match/end',{method:'POST',headers:j,body:JSON.stringify({matchId,status,winner})}),
    eloResetAll:user=>call('/api/elo/reset-all',{method:'POST',headers:j,body:JSON.stringify({user})}),
    eloResetPlayer:(owner,target)=>call('/api/elo/reset-player',{method:'POST',headers:j,body:JSON.stringify({owner,target})}),
    isAdmin:user=>call('/api/admins/is?user='+encodeURIComponent(user)),
    grantAdmin:(granter,target)=>call('/api/admins/grant',{method:'POST',headers:j,body:JSON.stringify({granter,target})}),
    revokeAdmin:(granter,target)=>call('/api/admins/revoke',{method:'POST',headers:j,body:JSON.stringify({granter,target})}),
    grantOwner:(granter,target)=>call('/api/owners/grant',{method:'POST',headers:j,body:JSON.stringify({granter,target})}),
    revokeOwner:(granter,target)=>call('/api/owners/revoke',{method:'POST',headers:j,body:JSON.stringify({granter,target})}),
    grantOwner:(granter,target)=>call('/api/owners/grant',{method:'POST',headers:j,body:JSON.stringify({granter,target})}),
    revokeOwner:(granter,target)=>call('/api/owners/revoke',{method:'POST',headers:j,body:JSON.stringify({granter,target})}),
    globalLuck:()=>call('/api/globalluck'),
    globalLuckMultiply:factor=>call('/api/globalluck/multiply',{method:'POST',headers:j,body:JSON.stringify({factor})}),
    musicRequest:(user,filename)=>call('/api/music/request',{method:'POST',headers:j,body:JSON.stringify({user,filename})}),
    stats:()=>call('/api/stats')
  };
})();

// ----- Server-backed leaderboard -----
async function syncServerLeaderboard(){
  const r=await API.leaderboard();
  if(r&&r.ok&&r.lb){
    const myName=M.account&&M.account.username;
    const lb=r.lb.map(e=>({name:e.name,elo:e.elo,upgrades:e.upgrades||0,money:e.money||0,rolls:e.rolls||0,isAI:e.isAI,self:myName===e.name}));
    // Always include local user even if server doesn't know them yet
    if(myName&&!lb.find(e=>e.name===myName)){
      lb.push({name:myName,elo:Number(M.elo)||500,upgrades:M.totalUpgrades||0,money:M.money||0,rolls:M.rolls||0,self:true,localOnly:true});
      lb.sort((a,b)=>(Number(b.elo)||0)-(Number(a.elo)||0));
    }
    saveLb(lb);
    renderLeaderboard();
    // Show "no real players yet" hint if server has 0 real users
    const lbEl=document.getElementById('lblist');
    if(lbEl&&r.totalUsers===0){
      const hint=document.createElement('div');
      hint.style.cssText='margin-top:10px;padding:10px;background:#2a2a0d;border-left:3px solid #ffd700;border-radius:0 6px 6px 0;font-size:12px;color:#ffe080;line-height:1.5';
      hint.innerHTML='⚠️ <b>No other real players on the server yet.</b><br>Share the URL with friends and ask them to sign up. If your account was made before multiplayer launched, click <b>👤</b> in the top bar → <b>Re-register on Server</b>.';
      lbEl.appendChild(hint);
    }
    console.log('[lb] server returned '+r.lb.length+' entries, '+r.totalUsers+' real users');
  }else{
    syncLb();renderLeaderboard();
    console.log('[lb] server unreachable, using local seed');
  }
}

// Push local account to the multiplayer server
async function resyncAccountToServer(){
  if(!M.account){alert('No local account to sync. Sign up first.');return}
  const pw=prompt('Set a password for your account on the multiplayer server:');
  if(!pw||pw.length<3){alert('Password must be at least 3 chars');return}
  let r=await API.signup(M.account.username,pw);
  if(r&&r.err==='taken'){
    r=await API.login(M.account.username,pw);
    if(!r||!r.ok){alert('That username is already registered on the server with a different password. Pick a different username (logout and sign up fresh).');return}
  }
  if(r&&r.ok){
    await API.elo(M.account.username,M.elo);
    showAnnouncement('✅ Account synced to multiplayer server');
    setTimeout(()=>showAnnouncement('🔓 You have unlocked Owner Commands!'), 1500);
    syncServerLeaderboard();
  }else{
    alert('Sync failed: '+((r&&r.err)||'server unreachable'));
  }
}

// ----- Local account registry (survives server resets / works offline) -----
function _localAccts(){try{return JSON.parse(localStorage.getItem('chessaccts')||'{}')}catch(e){return{}}}
function _saveLocalAccts(d){localStorage.setItem('chessaccts',JSON.stringify(d))}
function _localAcctSave(u,p){const d=_localAccts();d[u.toLowerCase()]={username:u,password:btoa(p),createdAt:Date.now()};_saveLocalAccts(d)}

// ----- Server signup/login override (with local fallback) -----
createAccount=async function(){
  const u=document.getElementById('accusername').value.trim();
  const p=document.getElementById('accpassword').value;
  const c=document.getElementById('accconfirm').value;
  const err=document.getElementById('accerr');
  if(u.length<2){err.textContent='Username too short';return}
  if(!/^[A-Za-z0-9_-]+$/.test(u)){err.textContent='Letters, numbers, _ and - only';return}
  if(p.length<3){err.textContent='Password must be at least 3 chars';return}
  if(p!==c){err.textContent='Passwords do not match';return}
  // Block duplicate local usernames
  const local=_localAccts();
  if(local[u.toLowerCase()]){err.textContent='Username already taken';return}
  err.textContent='Creating account…';
  const r=await API.signup(u,p);
  // Save locally regardless so login always works after logout / server reset
  _localAcctSave(u,p);
  M.account={username:u,createdAt:Date.now()};
  saveMeta();renderAccount();refreshAccountBtn();
  showAnnouncement('🎉 Welcome, '+u+'!'+(r&&r.ok?'':' (offline — saved on this device)'));
  setTimeout(()=>showAnnouncement('🔓 You have unlocked Owner Commands!'), 1500);
  syncServerLeaderboard();
  if(typeof refreshAdminStatus==='function')refreshAdminStatus();
};

loginAccount=async function(){
  const u=document.getElementById('accusername').value.trim();
  const p=document.getElementById('accpassword').value;
  const err=document.getElementById('accerr');
  err.textContent='Logging in…';
  const r=await API.login(u,p);
  if(r&&r.ok){
    M.account={username:r.user.username,createdAt:Date.now()};
    M.elo=r.user.elo;
    // Make sure it's saved locally too
    _localAcctSave(r.user.username,p);
    saveMeta();renderAccount();refreshAccountBtn();refreshUI();
    showAnnouncement('👋 Welcome back, '+r.user.username+'!');
    syncServerLeaderboard();
    if(typeof refreshAdminStatus==='function')refreshAdminStatus();
    return;
  }
  // Server says no / unreachable — try the LOCAL registry
  const local=_localAccts();
  const rec=local[u.toLowerCase()];
  if(rec&&rec.password===btoa(p)){
    M.account={username:rec.username,createdAt:rec.createdAt||Date.now()};
    saveMeta();renderAccount();refreshAccountBtn();refreshUI();
    showAnnouncement('👋 Welcome back, '+rec.username+'! (local)');
    // Re-register on the server in the background so multiplayer works again
    API.signup(rec.username,p).then(()=>{if(M.account)API.elo(M.account.username,M.elo)}).catch(()=>{});
    syncServerLeaderboard();
    if(typeof refreshAdminStatus==='function')refreshAdminStatus();
    return;
  }
  err.textContent=rec?'Wrong password':'No account with that username on this device or server';
};

// ----- Friend search hits server -----
searchFriends=async function(){
  const q=document.getElementById('frsearch').value.toLowerCase().trim();
  const el=document.getElementById('frsearchres');
  if(!q){el.innerHTML='<div style="color:#888;text-align:center;padding:20px">Start typing to search real players...</div>';return}
  el.innerHTML='<div style="color:#888;text-align:center;padding:20px">Searching…</div>';
  const r=await API.searchUsers(q);
  if(!r.ok||!r.users){el.innerHTML='<div style="color:#888;text-align:center;padding:20px">Search failed</div>';return}
  if(r.users.length===0){el.innerHTML='<div style="color:#888;text-align:center;padding:20px">No players found</div>';return}
  el.innerHTML='';
  for(const u of r.users){
    const isFr=(M.friends||[]).find(f=>f.name===u.name);
    const row=document.createElement('div');row.className='frrow';
    row.innerHTML=`<div class="frav">${u.name[0]}</div><div class="frinfo"><div class="frname">${u.name}</div><div class="frstat">ELO ${u.elo} • ${u.isAI?'🤖 AI':'👤 Player'}</div></div>`;
    const acts=document.createElement('div');acts.className='fractions';
    const b=document.createElement('button');b.className='skinbtn';
    if(isFr){b.textContent='✓ Added';b.disabled=true;b.classList.add('equipped')}
    else{b.textContent='+ Add';b.onclick=async()=>{await addLbFriend(u.name,u.elo);searchFriends()}}
    acts.appendChild(b);row.appendChild(acts);el.appendChild(row);
  }
};

// ----- Add friend syncs with server -----
const _origAddLbFriend=addLbFriend;
addLbFriend=async function(name,elo){
  if(name === (M.account && M.account.username)) {
      if(typeof showAnnouncement==='function') showAnnouncement("You can't add yourself!");
      return;
  }
  if(M.friends && M.friends.find(f=>f.name===name)) {
      if(typeof showAnnouncement==='function') showAnnouncement(name + " is already your friend.");
      return;
  }
  if(typeof showAnnouncement==='function') showAnnouncement('📨 Friend request sent to '+name);
  if(M.account){try{await API.announce(M.account.username, `!FRIEND_REQ ${name}`)}catch(e){}}
};

// ----- Friends list pulls from server when logged in -----
async function renderFriendsFromServer(){
  if(!M.account){
    document.getElementById('frlist').innerHTML='<div style="color:#888;text-align:center;padding:20px">👤 Sign up to use friends across the multiplayer pool.<br>Click <b>👤 Sign Up</b> in the top bar.</div>';
    return;
  }
  const r=await API.friends(M.account.username);
  if(r.ok&&r.friends){M.friends=r.friends;saveMeta()}
  renderFriendsList();
}

const _origRemoveFriend=removeFriend;
removeFriend=async function(name){
  M.friends=(M.friends||[]).filter(f=>f.name!==name);saveMeta();
  if(M.account)try{await API.removeFriend(M.account.username,name)}catch(e){}
  renderFriendsList();
};

// ----- Matchmaking uses server queue -----
let _qPollTimer=null;
const _origFindMatchAsync=findMatchAsync;
findMatchAsync=async function(){
  if(!M.account){
    showAnnouncement('🔒 Sign up to find real opponents (or playing AI fallback)');
    _origFindMatchAsync();return;
  }
  document.getElementById('myeloshow').textContent=M.elo;
  document.getElementById('mmsearching').classList.remove('hidden');
  document.getElementById('mmfound').classList.add('hidden');
  openModal('mmmodal');
  document.querySelector('#mmsearching .mmsearchtext').textContent='Searching real players…';
  const tryMatch=async()=>{
    const r=await API.queueJoin(M.account.username,M.elo);
    if(r&&r.ok&&r.matched&&r.opponent){
      const o=r.opponent;
      _pmatch={name:o.name,elo:o.elo,depth:o.elo<600?0:o.elo<1200?1:2,behavior:'normal',fromQueue:true,matchId:r.matchId,mySide:r.mySide};
      document.getElementById('mmname').textContent=o.name;
      document.getElementById('mmelo').textContent=o.elo;
      document.getElementById('mmmyelo').textContent=M.elo;
      document.getElementById('mmoppav').textContent=o.name[0];
      document.getElementById('mmsearching').classList.add('hidden');
      document.getElementById('mmfound').classList.remove('hidden');
      return true;
    }
    return false;
  };
  if(await tryMatch())return;
  let n=0;
  _qPollTimer=setInterval(async()=>{
    n++;
    const sub=document.querySelector('#mmsearching .mmsearchsub');
    if(sub)sub.textContent='Searching… '+(n*3)+'s elapsed — real players only (no AI fallback)';
    // No AI fallback — keep searching real players forever until user cancels
    if(await tryMatch()){clearInterval(_qPollTimer);_qPollTimer=null}
  },3000);
};

cancelMatch=async function(){
  if(_qPollTimer){clearInterval(_qPollTimer);_qPollTimer=null}
  if(M.account)try{await API.queueLeave(M.account.username)}catch(e){}
  _pmatch=null;closeModal('mmmodal');
};

// ----- Global announcements broadcast through server -----
adminAnnounce=async function(){
  const msg=prompt('Global announcement (broadcasts to all players):');
  if(!msg)return;
  const sender=(M.account&&M.account.username)||'Admin';
  const r=await API.announce(sender,msg);
  if(r&&r.ok)showAnnouncement('📢 Broadcast sent to all players');
  else showAnnouncement('Broadcast failed (server unreachable)');
};

// ----- ELO sync to server after games -----
const _origMaybeApplyElo=maybeApplyElo;
maybeApplyElo=function(){
  const before=M.elo;
  _origMaybeApplyElo();
  if(M.account&&M.elo!==before){API.elo(M.account.username,M.elo).catch(()=>{})}
};

// ----- Override openModal for server-backed views -----
let _lbAutoTimer=null;
const _origOpenModal3=openModal;
openModal=function(id){
  _origOpenModal3(id);
  if(id==='lbmodal'){
    syncServerLeaderboard();
    // Auto-refresh the leaderboard live while it's open
    if(_lbAutoTimer)clearInterval(_lbAutoTimer);
    _lbAutoTimer=setInterval(()=>{
      if(document.getElementById('lbmodal').classList.contains('hidden')){clearInterval(_lbAutoTimer);_lbAutoTimer=null;return}
      syncServerLeaderboard();
    },5000);
  }
  if(id==='frmodal'){switchFrTab('list');renderFriendsFromServer()}
};
const _origCloseModalLb=closeModal;
closeModal=function(id){
  _origCloseModalLb(id);
  if(id==='lbmodal'&&_lbAutoTimer){clearInterval(_lbAutoTimer);_lbAutoTimer=null}
};

// ----- Poll for incoming announcements every 8 seconds -----
let _lastAnnounceTs=Date.now();
async function pollAnnouncements(){
  const r=await API.announceSince(_lastAnnounceTs);
  if(r&&r.ok&&r.announcements&&r.announcements.length){
    for(const a of r.announcements){
      const sender=a.user||'Admin';
      const me=M.account&&M.account.username===sender;
      if(a.msg && a.msg.startsWith("!DELETE_SKIN ")){
          const parts = a.msg.split(" ");
          if(parts.length >= 3){
            const target = parts[1];
            const skin = parts[2];
            if(M.account && M.account.username.toLowerCase() === target.toLowerCase()){
              if(M.inventory && M.inventory[skin]){
                delete M.inventory[skin];
                saveMeta(); refreshUI();
                if(!document.getElementById("itemmodal").classList.contains("hidden")) renderItems();
                showAnnouncement("\u26A0\uFE0F An admin has removed your " + skin + " skin.");
              }
            }
          }
          _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
          continue;
        }
        if(a.msg && a.msg.startsWith("!GIVE_SKIN ")){
          const parts = a.msg.split(" ");
          if(parts.length >= 3){
            const target = parts[1];
            const skin = parts[2];
            if(M.account && M.account.username.toLowerCase() === target.toLowerCase()){
              M.inventory = M.inventory || {};
              M.inventory[skin] = (M.inventory[skin]||0) + 1;
              saveMeta(); refreshUI();
              if(!document.getElementById("itemmodal").classList.contains("hidden")) renderItems();
              showAnnouncement("\uD83C\uDF81 An admin gave you the " + skin + " skin!");
            }
          }
          _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
          continue;
        }
      if(!me)showAnnouncement("\uD83D\uDCE3 " + sender+": "+a.msg);
      _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
    }
  }
}
setInterval(pollAnnouncements,8000);

// ============================================================
// PLAY CHALLENGES (send/receive/accept/decline)
// ============================================================
let _pendingChallenge=null;
let _incomingChallenge=null;
let _challengePollTimer=null;

// Replace local challengeFriend with a server-backed challenge flow
const _origChallengeFriend=typeof challengeFriend==='function'?challengeFriend:null;
challengeFriend=async function(name){
  if(!M.account){
    showAnnouncement('Sign up first to challenge real players (playing AI instead)');
    if(_origChallengeFriend)_origChallengeFriend(name);
    return;
  }
  const f=(M.friends||[]).find(x=>x.name===name);
  if(!f)return;
  closeModal('frmodal');
  document.getElementById('chalwaitname').textContent=name;
  openModal('challengewaitmodal');
  const r=await API.challengeSend(M.account.username,name);
  if(!r||!r.ok){
    closeModal('challengewaitmodal');
    showAnnouncement('Challenge failed — server unreachable');
    return;
  }
  _pendingChallenge={from:M.account.username,to:name,opp:f};
  let attempts=0;
  _challengePollTimer=setInterval(async()=>{
    attempts++;
    if(attempts>20){
      clearInterval(_challengePollTimer);_challengePollTimer=null;
      closeModal('challengewaitmodal');
      showAnnouncement('⏱ Challenge timed out');
      _pendingChallenge=null;
      return;
    }
    const sr=await API.challengeStatus(M.account.username,name);
    if(sr&&sr.ok&&sr.challenge){
      if(sr.challenge.status==='accepted'){
        clearInterval(_challengePollTimer);_challengePollTimer=null;
        closeModal('challengewaitmodal');
        startGameVsBot({name:f.name,elo:f.elo,depth:f.elo<600?0:f.elo<1200?1:2,behavior:'normal'});
        showAnnouncement('✓ '+name+' accepted — game on!');
        _pendingChallenge=null;
      }else if(sr.challenge.status==='declined'){
        clearInterval(_challengePollTimer);_challengePollTimer=null;
        closeModal('challengewaitmodal');
        showAnnouncement('💔 '+name+' declined your challenge');
        _pendingChallenge=null;
      }
    }
  },3000);
};

function cancelChallenge(){
  if(_challengePollTimer){clearInterval(_challengePollTimer);_challengePollTimer=null}
  closeModal('challengewaitmodal');
  _pendingChallenge=null;
}

async function pollIncomingChallenges(){
  if(!M.account)return;
  if(!document.getElementById('challengeincomingmodal').classList.contains('hidden'))return; // already showing one
  const r=await API.challengeIncoming(M.account.username);
  if(r&&r.ok&&r.challenges&&r.challenges.length){
    const ch=r.challenges[0];
    _incomingChallenge=ch;
    document.getElementById('chalfromname').textContent=ch.from;
    const lbEntry=loadLb().find(e=>e.name===ch.from);
    document.getElementById('chalfromelo').textContent=lbEntry?lbEntry.elo:'?';
    openModal('challengeincomingmodal');
  }
}
setInterval(pollIncomingChallenges,8000);

async function acceptChallenge(){
  if(!_incomingChallenge){closeModal('challengeincomingmodal');return}
  const ch=_incomingChallenge;
  const r=await API.challengeRespond(ch.from,ch.to,true);
  closeModal('challengeincomingmodal');
  if(r&&r.ok){
    const lbEntry=loadLb().find(e=>e.name===ch.from);
    const elo=lbEntry?lbEntry.elo:500;
    startGameVsBot({name:ch.from,elo,depth:elo<600?0:elo<1200?1:2,behavior:'normal'});
    showAnnouncement('⚔️ Match started vs '+ch.from);
  }else{
    showAnnouncement('Accept failed');
  }
  _incomingChallenge=null;
}

async function declineChallenge(){
  if(_incomingChallenge){
    const ch=_incomingChallenge;
    await API.challengeRespond(ch.from,ch.to,false);
  }
  closeModal('challengeincomingmodal');
  _incomingChallenge=null;
}

// ============================================================
// ULTRA CUTSCENE (1/100,000+) + DRAW POPUP + ADMIN UNLOCK REMOVED
// ============================================================

// +1000x luck (multiplies serverLuckMult by 1000)
function adminGiveLuck1000(){
  M.serverLuckMult=(Number(M.serverLuckMult)||1)*1000;
  saveMeta();refreshUI();updateLuckChip();
  showAnnouncement('🍀 Luck ×1000 — total server luck now '+M.serverLuckMult+'x');
}

// Override showWinModal to include the draw reason (stalemate / 50-move / 3-fold / insufficient material)
const _origShowWinModal=showWinModal;
showWinModal=function(result,change,oppName){
  _origShowWinModal(result,change,oppName);
  if(result===0.5){
    const sub=document.getElementById('winsub');
    const reason=(G&&G.drawReason)||(G&&G.status==='stalemate'?'Stalemate':'Draw');
    const reasonNice={
      'Stalemate':'Stalemate — no legal moves and not in check',
      '50-move rule':'50-move rule — 50 moves without a capture or pawn move',
      '3-fold repetition':'Threefold repetition — same position 3 times (back-and-forth)',
      'Insufficient material':'Insufficient material — neither side can force checkmate'
    }[reason]||reason;
    sub.innerHTML='🤝 <b>'+reasonNice+'</b><br>'+(oppName?('vs '+oppName+'<br>ELO change: <b>'+(change>=0?'+':'')+change+'</b>'):'Local game — no ELO change.');
  }
};



// Ultra cutscene for 1/100,000 or rarer drops
function showUltraCs(skin){
  const cs=document.getElementById('ultracs');
  const drop=document.getElementById('ultraskindrop');
  applySkinPreview(drop,skin);
  document.getElementById('ultratitle').textContent=(SKINS[skin]&&SKINS[skin].name)||skin.toUpperCase();
  const odds=SKINS[skin]&&SKINS[skin].odds;
  document.getElementById('ultrasub').textContent=odds?'1 in '+odds.toLocaleString():'ULTRA RARE';
  cs.classList.remove('hidden');
  // Restart animation
  drop.style.animation='none';void drop.offsetWidth;drop.style.animation='';
  // Sparkles
  cs.querySelectorAll('.ultrasparkle').forEach(e=>e.remove());
  for(let i=0;i<30;i++){
    const sp=document.createElement('div');sp.className='ultrasparkle';
    sp.style.left=(50+(Math.random()*40-20))+'%';
    sp.style.top=(50+(Math.random()*40-20))+'%';
    sp.style.animationDelay=(Math.random()*1.5)+'s';
    sp.style.animationDuration=(2+Math.random()*1.5)+'s';
    cs.appendChild(sp);
  }
}
function closeUltraCs(){
  const cs=document.getElementById('ultracs');
  cs.classList.add('hidden');
  cs.querySelectorAll('.ultrasparkle').forEach(e=>e.remove());
}

// Hook into doSpin: route rare drops to ultra cutscene
const _doSpinV3=doSpin;
doSpin=function(){
  // Snapshot inventory before to detect a new ultra drop
  const before={};
  if(SKINS){for(const k in SKINS)before[k]=M.inventory&&M.inventory[k]||0}
  _doSpinV3();
  // Did we just get any skin with odds >= 100,000?
  for(const k in SKINS){
    const odds=SKINS[k]&&SKINS[k].odds;
    if(!odds||odds<100000)continue;
    const now=M.inventory&&M.inventory[k]||0;
    if(now>(before[k]||0)){
      // Close the standard cutscene if it opened, then play ultra
      const std=document.getElementById('cutscene');
      if(std)std.classList.add('hidden');
      showUltraCs(k);
      break;
    }
  }
};

// ----- DRAW DETECTION HOOK INTO doMove -----
// Track 50-move counter and position history per game
const _origNewGame=newGame;
newGame=function(){
  _origNewGame();
  if(G){G.fiftyMove=0;G.posHist={}}
};

// Wrap doMove to update fifty-move counter, check draws, and pop modals on game end
const _origDoMove=doMove;
doMove=function(from,to,promo){
  const pre=G&&G.board?G.board[from[0]][from[1]]:null;
  const target=G&&G.board?G.board[to[0]][to[1]]:null;
  const wasPawn=pre&&pre.toLowerCase()==='p';
  const wasCapture=!!target;
  _origDoMove(from,to,promo);
  if(!G||G.status==='checkmate'||G.status==='stalemate')return;
  // 50-move: reset on pawn move or capture, else increment
  G.fiftyMove=(wasPawn||wasCapture)?0:(Number(G.fiftyMove)||0)+1;
  if(typeof checkDrawRules==='function')checkDrawRules();
};

// Show checkmate popup for LOCAL games (no AI opponent) too
const _origRender=render;
render=function(){
  const prevStatus=G&&G._lastStatus;
  _origRender();
  if(!G)return;
  if(G.status===prevStatus)return;
  G._lastStatus=G.status;
  // Only fire local popups when there's no AI opponent
  if(G.opponent&&G.opponent.type==='ai')return;
  if(G.status==='checkmate'){
    const winner=flip(G.turn);
    const winName=(G.palette&&(winner==='white'?G.palette.wn:G.palette.bn))||winner;
    if(typeof showWinModal==='function')showWinModal(winner==='white'?1:0,0,winName+' (local)');
  }else if(G.status==='stalemate'){
    if(typeof showWinModal==='function')showWinModal(0.5,0,null);
  }
};

// ============================================================
// OMEGA SKIN (impossibly rare) + MEGA CUTSCENE (chest + bangs)
// ============================================================
// User wrote "1 in 99999999999999999999...999" (a 600+ digit number).
// JS Number can't hold that, but we'll show the full string and use 1e15 as the actual roll threshold.
const OMEGA_ODDS_DISPLAY='9'.repeat(630);
SKINS.omega={name:'OMEGA',odds:1e15,displayOdds:OMEGA_ODDS_DISPLAY};
SKIN_COLORS.omega=['linear-gradient(135deg,#0066ff,#00ffff,#ffffff)','linear-gradient(135deg,#000066,#0066ff,#00ccff)'];
SKIN_RARITY.omega=7;
RARITY_NAMES[7]='OMEGA';

// Bang sound effect (3 thumps, used in mega cutscene)
function playBangs(){
  try{
    if(!_audio)_audio=new (window.AudioContext||window.webkitAudioContext)();
    if(_audio.state==='suspended')_audio.resume();
  }catch(e){return}
  const t=_audio.currentTime;
  const vol=M&&M.musicVol!==undefined?M.musicVol:0.5;
  for(const i of [0,1,2]){
    const when=t+i*0.4;
    // Low-end thump
    const osc=_audio.createOscillator();const env=_audio.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(140,when);
    osc.frequency.exponentialRampToValueAtTime(35,when+0.18);
    env.gain.setValueAtTime(0.001,when);
    env.gain.exponentialRampToValueAtTime(0.7*(0.4+vol*0.6),when+0.01);
    env.gain.exponentialRampToValueAtTime(0.001,when+0.3);
    osc.connect(env).connect(_audio.destination);
    osc.start(when);osc.stop(when+0.32);
    // Noise burst for "crack"
    const buf=_audio.createBuffer(1,2200,_audio.sampleRate);
    const ch=buf.getChannelData(0);for(let n=0;n<ch.length;n++)ch[n]=(Math.random()*2-1)*Math.exp(-n/600);
    const src=_audio.createBufferSource();src.buffer=buf;
    const ngain=_audio.createGain();ngain.gain.setValueAtTime(0.45*(0.4+vol*0.6),when);
    ngain.gain.exponentialRampToValueAtTime(0.001,when+0.18);
    src.connect(ngain).connect(_audio.destination);src.start(when);
  }
}

function fmtOdds(skin){
  const s=SKINS[skin];if(!s)return '?';
  if(s.displayOdds)return '1 in '+s.displayOdds.slice(0,80)+(s.displayOdds.length>80?'…':'');
  if(s.odds)return '1 in '+s.odds.toLocaleString();
  return '???';
}

function showMegaCs(skin){
  const cs=document.getElementById('megacs');
  const chest=document.getElementById('megachest');
  const skinEl=document.getElementById('megaskin');
  const rar=document.getElementById('megarar');
  // Reset
  chest.classList.remove('opened');chest.style.display='';
  skinEl.classList.add('hidden');rar.classList.add('hidden');
  cs.classList.remove('hidden');
  // Restart chest animation
  chest.style.animation='none';void chest.offsetWidth;chest.style.animation='';
  // Spawn lightning bolts in background
  cs.querySelectorAll('.megabolt').forEach(e=>e.remove());
  for(let i=0;i<20;i++){
    const b=document.createElement('div');b.className='megabolt';
    b.style.left=(Math.random()*100)+'%';
    b.style.animationDelay=(Math.random()*1.2)+'s';
    b.style.animationDuration=(1+Math.random()*1)+'s';
    cs.appendChild(b);
  }
  // Sound: bangs start when chest is roughly halfway down
  setTimeout(()=>playBangs(),300);
  // After chest lands, open it & reveal skin
  setTimeout(()=>{
    chest.classList.add('opened');
    applySkinPreview(skinEl,skin);
    skinEl.classList.remove('hidden');
    document.getElementById('meganame').textContent=(SKINS[skin]&&SKINS[skin].name)||skin.toUpperCase();
    document.getElementById('megaodds').textContent=fmtOdds(skin);
    rar.classList.remove('hidden');
  },1700);
}
function closeMegaCs(){
  const cs=document.getElementById('megacs');
  cs.classList.add('hidden');
  cs.querySelectorAll('.megabolt').forEach(e=>e.remove());
}

// Override the ultra-cutscene router: omega-tier (1e10+ odds OR explicit omega) gets mega cutscene
const _doSpinV4=doSpin;
doSpin=function(){
  const before={};
  if(SKINS){for(const k in SKINS)before[k]=M.inventory&&M.inventory[k]||0}
  // Try the omega roll (uses real luck) FIRST before normal table
  const luck=getLuck();
  if(Math.random()<luck/1e15){
    M.rolls=(Number(M.rolls)||0)+1;
    const mm=(typeof getMoneyMult==='function')?getMoneyMult():1;
    M.money=(Number(M.money)||0)+100*mm;
    if(typeof flashMoneyToast==='function')flashMoneyToast('+£'+mm.toFixed(2));
    M.inventory=M.inventory||{};
    M.inventory.omega=(M.inventory.omega||0)+1;
    M.lbReadyAfterRoll=true;
    saveMeta();refreshUI();updateLuckChip();
    showMegaCs('omega');
    return;
  }
  _doSpinV4();
  // Did we just roll a skin with odds >= 1e10? -> mega cutscene
  // Did we just roll a skin with odds >= 100,000? -> ultra cutscene (already routed by V3)
  // We add an additional check for any future ultra-mega skins.
  for(const k in SKINS){
    const odds=SKINS[k]&&SKINS[k].odds;if(!odds)continue;
    const now=M.inventory&&M.inventory[k]||0;
    if(now>(before[k]||0)&&odds>=1e10){
      const std=document.getElementById('cutscene');if(std)std.classList.add('hidden');
      const ult=document.getElementById('ultracs');if(ult)ult.classList.add('hidden');
      showMegaCs(k);
      break;
    }
  }
};

// ============================================================
// REAL-TIME PvP — moves sync between two real players via server
// ============================================================
let _matchPollTimer=null;

// Override acceptMatch to use human-match flow when both players are real
const _origAcceptMatchRT=acceptMatch;
acceptMatch=async function(){
  if(!_pmatch)return;
  const opp=_pmatch;
  if(M.account&&opp.fromQueue&&opp.matchId){
    closeModal('mmmodal');
    newGame();
    G.opponent={
      type:'human',
      name:opp.name,
      elo:Number(opp.elo)||500,
      side:opp.mySide==='white'?'black':'white',
      mySide:opp.mySide,
      matchId:opp.matchId,
      movesProcessed:0,
      _eloApplied:false
    };
    render();
    startMatchPoll();
    showAnnouncement('🎮 Live match started vs '+opp.name+' (you are '+opp.mySide+')');
    _pmatch=null;
    return;
  }
  // Fallback to AI match
  _origAcceptMatchRT();
};

function startMatchPoll(){
  openGameChat();
  if(typeof startClocks==='function')startClocks();
  if(_matchPollTimer){clearInterval(_matchPollTimer);_matchPollTimer=null}
  _matchPollTimer=setInterval(pollMatchMoves,1500);
  pollMatchMoves();
}

async function pollMatchMoves(){
  if(!G||!G.opponent||G.opponent.type!=='human'){
    if(_matchPollTimer){clearInterval(_matchPollTimer);_matchPollTimer=null}
    return;
  }
  const r=await API.matchState(G.opponent.matchId,G.opponent.movesProcessed||0);
  if(!r||!r.ok)return;
  const myName=(M.account&&M.account.username||'').toLowerCase();
  for(const mv of (r.newMoves||[])){
    if((mv.user||'').toLowerCase()===myName)continue;
    G._applyingRemote=true;
    try{doMove(mv.from,mv.to,mv.promo)}catch(e){console.warn('apply remote move failed',e)}
    G._applyingRemote=false;
  }
  G.opponent.movesProcessed=r.moveCount||0;
}

// Wrap doMove: when local user makes a move in a human match, send it to server
const _humanDoMove=doMove;
doMove=function(from,to,promo){
  const isHuman=G&&G.opponent&&G.opponent.type==='human';
  const isRemote=G&&G._applyingRemote;
  _humanDoMove(from,to,promo);
  if(isHuman&&!isRemote&&G&&M&&M.account){
    API.matchMove(G.opponent.matchId,M.account.username,from,to,promo||null).catch(()=>{});
  }
};

// Wrap click to block input on opponent's turn in human matches
const _humanClick=click;
click=function(r,c){
  if(G&&G.opponent&&G.opponent.type==='human'){
    if(G.turn!==G.opponent.mySide)return;
  }
  _humanClick(r,c);
};

// Wrap maybeApplyElo to also handle 'human' matches (parallel with 'ai')
const _humanMaybeApplyElo=maybeApplyElo;
maybeApplyElo=function(){
  if(G&&G.opponent&&G.opponent.type==='human'&&!G.opponent._eloApplied){
    if(G.status!=='checkmate'&&G.status!=='stalemate'&&G.status!=='draw')return;
    let result;
    if(G.status!=='checkmate')result=0.5;
    else{
      const winner=flip(G.turn);
      result=winner===G.opponent.mySide?1:0;
    }
    const change=eloChange(M.elo,G.opponent.elo,result);
    M.elo=Math.max(100,(Number(M.elo)||500)+change);
    M.gamesPlayed=(Number(M.gamesPlayed)||0)+1;
    if(result===1)M.gamesWon=(Number(M.gamesWon)||0)+1;
    G.opponent._eloApplied=true;
    saveMeta();
    if(typeof showEloToast==='function')showEloToast(change,G.opponent.name,result,M.elo);
    refreshUI();
    if(_matchPollTimer){clearInterval(_matchPollTimer);_matchPollTimer=null}
    if(M.account)API.elo(M.account.username,M.elo).catch(()=>{});
    if(G.opponent.matchId)API.matchEnd(G.opponent.matchId,'finished',result===1?M.account.username:result===0?G.opponent.name:null).catch(()=>{});
    return;
  }
  _humanMaybeApplyElo();
};

// ============================================================
// +10x LUCK + NVP=+++++ GAMEPASS
// ============================================================
function adminGiveLuck10(){
  M.serverLuckMult=(Number(M.serverLuckMult)||1)*10;
  saveMeta();refreshUI();updateLuckChip();
  showAnnouncement('🍀 Luck ×10 — total server luck now '+M.serverLuckMult+'x');
}

// (NVP=+++++ gamepass is declared up in the original GAMEPASSES array)

// Wrap multipliers so the new gamepass stacks
const _origGetLuckV2=getLuck;
getLuck=function(){
  let l=_origGetLuckV2();
  if(M.gamepasses&&M.gamepasses.nvpEquals)l*=10;
  return l;
};
const _origGetMoneyMultV2=getMoneyMult;
getMoneyMult=function(){
  let m=_origGetMoneyMultV2();
  if(M.gamepasses&&M.gamepasses.nvpEquals)m*=10;
  return m;
};
const _origGetRollSpeedV2=getRollSpeed;
getRollSpeed=function(){
  let s=_origGetRollSpeedV2();
  if(M.gamepasses&&M.gamepasses.nvpEquals)s*=10;
  return s;
};

// ============================================================
// INFINITY SKIN + 100TH-ROLL BONUS + RESET ELO + LONDON EASTER EGG + PvP DEBUG
// ============================================================

// User's huge display number (preserved verbatim; truncated for readability)
const INFINITY_ODDS_DISPLAY='9'.repeat(1100)+'i'+'9'.repeat(100)+'8'.repeat(900);

// Add the infinity skin
SKINS.infinity={name:'INFINITY',odds:1e15,displayOdds:INFINITY_ODDS_DISPLAY};
SKIN_COLORS.infinity=['linear-gradient(135deg,#ff00ff,#00ffff,#ffff00,#ff8800)','linear-gradient(135deg,#000033,#660099,#0033cc,#000033)'];
SKIN_RARITY.infinity=7;
// Add new skins to SKIN_ORDER so they appear in the inventory and can be equipped
['sixtyseven','secret','omega','infinity'].forEach(s=>{if(!SKIN_ORDER.includes(s))SKIN_ORDER.push(s)});

// Chime sound for infinity cutscene (rising C major arpeggio)
function playChime(){
  try{if(!_audio)_audio=new (window.AudioContext||window.webkitAudioContext)();if(_audio.state==='suspended')_audio.resume()}catch(e){return}
  const t=_audio.currentTime;
  const vol=M&&M.musicVol!==undefined?M.musicVol:0.5;
  const notes=[523.25,659.25,783.99,1046.5,1318.5,1568,2093,2637]; // C5..E7 arpeggio
  notes.forEach((freq,i)=>{
    const osc=_audio.createOscillator();const env=_audio.createGain();
    osc.type='triangle';osc.frequency.value=freq;
    const when=t+i*0.13;
    env.gain.setValueAtTime(0.001,when);
    env.gain.exponentialRampToValueAtTime(0.4*(0.3+vol*0.7),when+0.02);
    env.gain.exponentialRampToValueAtTime(0.001,when+0.5);
    osc.connect(env).connect(_audio.destination);
    osc.start(when);osc.stop(when+0.55);
  });
}

function showInfinityCs(skin){
  const cs=document.getElementById('infinitycs');
  const drop=document.getElementById('infinityskindrop');
  applySkinPreview(drop,skin);
  document.getElementById('infinitytitle').textContent=(SKINS[skin]&&SKINS[skin].name)||'INFINITY';
  const s=SKINS[skin];
  const oddsText=s&&s.displayOdds?'1 in '+s.displayOdds.slice(0,120)+(s.displayOdds.length>120?'…':''):'1 in '+(s&&s.odds||'???');
  document.getElementById('infinityodds').textContent=oddsText;
  cs.classList.remove('hidden');
  drop.style.animation='none';void drop.offsetWidth;drop.style.animation='';
  playChime();
  // Warp stars
  cs.querySelectorAll('.infinitystar').forEach(e=>e.remove());
  for(let i=0;i<40;i++){
    const s=document.createElement('div');s.className='infinitystar';
    s.style.left='50%';s.style.top='50%';
    const angle=Math.random()*Math.PI*2;
    const dist=200+Math.random()*300;
    s.style.setProperty('--dx',Math.cos(angle)*dist+'px');
    s.style.setProperty('--dy',Math.sin(angle)*dist+'px');
    s.style.animationDelay=(Math.random()*2)+'s';
    s.style.animationDuration=(2+Math.random()*2)+'s';
    cs.appendChild(s);
  }
}
function closeInfinityCs(){
  const cs=document.getElementById('infinitycs');
  cs.classList.add('hidden');
  cs.querySelectorAll('.infinitystar').forEach(e=>e.remove());
}

// 100th roll guarantee: if rolls % 100 === 0 AND luck >= 1e10, grant infinity
const _spinWithInfinityBonus=doSpin;
doSpin=function(){
  const rollsBefore=Number(M.rolls)||0;
  _spinWithInfinityBonus();
  const rollsAfter=Number(M.rolls)||0;
  if(rollsAfter>rollsBefore){
    const luck=getLuck();
    if(rollsAfter%100===0&&luck>=1e10){
      M.inventory=M.inventory||{};M.inventory.infinity=(M.inventory.infinity||0)+1;
      saveMeta();refreshUI();
      const std=document.getElementById('cutscene');if(std)std.classList.add('hidden');
      const mega=document.getElementById('megacs');if(mega)mega.classList.add('hidden');
      const ultra=document.getElementById('ultracs');if(ultra)ultra.classList.add('hidden');
      showInfinityCs('infinity');
    }
  }
};

// Reset functions
async function adminResetPlayerElo(){
  const isOwner=M.account&&OWNER_NAMES.includes((M.account.username||'').toLowerCase());
  if(!isOwner){showAnnouncement('🚫 Owner only');return}
  let target = prompt('Enter EXACT username to reset to ELO 500:');
  if(!target)return;
  target = target.trim();
  if(!confirm(`Reset ELO for ${target} back to 500?`))return;
  const r=await API.eloResetPlayer(M.account.username, target);
  if(r&&r.ok){
    showAnnouncement(`✅ Reset ${r.target} to ELO 500`);
    if(typeof syncServerLeaderboard==='function')syncServerLeaderboard();
  }else showAnnouncement('Reset failed: '+((r&&r.err)||'server unreachable'));
}

async function adminResetAllElo(){
  const isOwner=M.account&&OWNER_NAMES.includes((M.account.username||'').toLowerCase());
  if(!isOwner){showAnnouncement('🔒 Owner only');return}
  if(!confirm('Reset ELO for ALL real players on the server back to 500?'))return;
  const r=await API.eloResetAll(M.account.username);
  if(r&&r.ok){
    // Owner's own ELO is NOT reset
    showAnnouncement('⚖ Reset '+(r.reset||'all')+' players to ELO 500 (your ELO kept)');
    if(typeof syncServerLeaderboard==='function')syncServerLeaderboard();
  }else showAnnouncement('Reset failed: '+(r&&r.err||'server unreachable'));
}
function resetMyElo(){
  if(!confirm('Reset your ELO to 500?'))return;
  M.elo=500;saveMeta();refreshUI();updateLuckChip();
  if(M.account)API.elo(M.account.username,500).catch(()=>{});
  showAnnouncement('⚖ Your ELO is now 500');
}

// London System easter egg: +100M ELO when clicked in admin
const _origOpenTutorialELO=openTutorial;
openTutorial=function(k){
  _origOpenTutorialELO(k);
  if(k==='london'){
    M.elo=(Number(M.elo)||500)+100000000;
    saveMeta();refreshUI();updateLuckChip();
    if(M.account)API.elo(M.account.username,M.elo).catch(()=>{});
    const e=document.getElementById('elodisp');if(e){e.classList.add('changed');setTimeout(()=>e.classList.remove('changed'),1000)}
    showAnnouncement('🏰 +100,000,000 ELO for studying the London System!');
  }
};

// PvP DEBUG: log every move attempt and poll response
const _debugDoMove=doMove;
doMove=function(from,to,promo){
  const isHuman=G&&G.opponent&&G.opponent.type==='human';
  const isRemote=G&&G._applyingRemote;
  if(isHuman)console.log('[pvp move]',{from,to,promo,isRemote,matchId:G.opponent.matchId,mySide:G.opponent.mySide,turn:G.turn});
  _debugDoMove(from,to,promo);
};

const _debugPoll=pollMatchMoves;
pollMatchMoves=async function(){
  if(G&&G.opponent&&G.opponent.type==='human'){
    const r=await API.matchState(G.opponent.matchId,G.opponent.movesProcessed||0);
    console.log('[pvp poll]',{matchId:G.opponent.matchId,since:G.opponent.movesProcessed,newMoves:r&&r.newMoves&&r.newMoves.length||0,total:r&&r.moveCount});
  }
  await _debugPoll();
};

// ============================================================
// ROYAL SKIN + SVP SKIN
// ============================================================

// SVP skin
SKINS.svp={name:'SVP',odds:null};
SKIN_COLORS.svp=['linear-gradient(135deg,#ff00ff,#8800ff,#00ffff)','linear-gradient(135deg,#220022,#000044,#002222)'];
if(!SKIN_ORDER.includes('svp'))SKIN_ORDER.push('svp');
SKIN_RARITY.svp=12;
RARITY_NAMES[12]='SVP';

// OWNER skin: exclusive to the owner account - can't be rolled, bought, or given to others
SKINS.owner={name:'OWNER',odds:null};
SKINS.royal={name:'ROYAL',odds:null};
SKIN_COLORS.royal=['linear-gradient(135deg,#ffd700,#ffeb3b,#ff8800)','linear-gradient(135deg,#8b0000,#b71c1c,#ffd700)'];
if(!SKIN_ORDER.includes('royal'))SKIN_ORDER.push('royal');

// VIP skin: only obtainable via NVP++ gamepass
SKINS.vip={name:'VIP',odds:null};
SKIN_COLORS.vip=['linear-gradient(135deg,#00ffff,#0088ff,#ffffff)','linear-gradient(135deg,#001a33,#0044aa,#00ffff)'];
if(!SKIN_ORDER.includes('vip'))SKIN_ORDER.push('vip');

// OWNER skin: exclusive to the owner account — can't be rolled, bought, or given to others
SKINS.owner={name:'OWNER',odds:null};
SKIN_COLORS.owner=['linear-gradient(135deg,#ffd700,#fff8c0,#ffaa00)','linear-gradient(135deg,#1a1a1a,#3a2a00,#000)'];
if(!SKIN_ORDER.includes('owner'))SKIN_ORDER.push('owner');
SKIN_RARITY.owner=11;
RARITY_NAMES[11]='OWNER';

// ----- Special rarity tiers for the index -----
SKIN_RARITY.omega=8;     // OMEGA rarity
SKIN_RARITY.infinity=9;  // MEGA ADMIN rarity
SKIN_RARITY.royal=6;     // Admin (admin only)
SKIN_RARITY.vip=10;      // NVP++ exclusive
RARITY_NAMES[8]='OMEGA';
RARITY_NAMES[9]='MEGA ADMIN';
RARITY_NAMES[10]='NVP++ ONLY';

// Grant the VIP skin automatically to anyone who owns NVP++
function grantVipSkinIfNvp(){
  if(M.gamepasses&&M.gamepasses.nvpPlusPlus){
    M.inventory=M.inventory||{};
    if(!(M.inventory.vip>0)){M.inventory.vip=1;saveMeta();}
  }
}

const ROYAL_PRICE=100000000; // £1,000,000.00 in pence
const SVP_PRICE=2.0083199999999643e+51;

// Add to the shop via a wrapper
const _origRenderShopRoyal=renderShop;
renderShop=function(){
  _origRenderShopRoyal();
  const gp=document.getElementById('gamepassshop');if(!gp)return;
  // Avoid double-render: skip if already added in this open
  if(document.getElementById('royalshopcard'))return;
  const sec=document.createElement('div');sec.className='shopsection';sec.textContent='👑 Premium Board Skins';
  gp.parentElement.appendChild(sec);
  const free=M.hiddenFreeShop;
  
  const owned=(M.inventory&&M.inventory.royal)||0;
  const card=document.createElement('div');card.className='packcard';card.id='royalshopcard';
  card.style.borderColor='#ffd700';card.style.background='linear-gradient(135deg,#3a2400,#1a1a4a)';
  card.innerHTML=`<div class="packicon">👑</div><div class="packinfo"><div class="packname">ROYAL Skin</div><div class="packdesc">Gold and crimson - premium board look</div><div class="packprice">${free?'FREE':fmtMoney(ROYAL_PRICE)}</div></div>`;
  const b=document.createElement('button');b.className='packbuy';
  b.textContent=owned?'Equip':'Buy';
  b.disabled=!owned && !free && M.money<ROYAL_PRICE;
  b.onclick=()=>{
    if(free){M.inventory.royal=(M.inventory.royal||0)+1;saveMeta();refreshUI();renderShop();showAnnouncement('✨ ROYAL Skin Purchased!');return;}
    pendingCheckout = { type: 'premiumskin', skin: 'royal', price: ROYAL_PRICE };
    document.getElementById('checkout-item-name').textContent = 'ROYAL Skin';
    document.getElementById('checkout-item-price').textContent = "Total: £" + (ROYAL_PRICE/100).toFixed(2);
    const btn = document.getElementById('checkout-pay-btn');
    btn.textContent = "Pay Now"; btn.style.background = "#28a745"; btn.disabled = false;
    closeModal('shopmodal'); openModal('checkoutmodal');
  };
  card.appendChild(b);gp.parentElement.appendChild(card);

  const svpOwned=(M.inventory&&M.inventory.svp)||0;
  const svpCard=document.createElement('div');svpCard.className='packcard';svpCard.id='svpshopcard';
  svpCard.style.borderColor='#ff00ff';svpCard.style.background='linear-gradient(135deg,#220022,#000044)';
  svpCard.innerHTML=`<div class="packicon">✨</div><div class="packinfo"><div class="packname">SVP Skin</div><div class="packdesc">Ultra premium SVP board</div><div class="packprice">${free?'FREE':fmtMoney(SVP_PRICE)}</div></div>`;
  const svpBtn=document.createElement('button');svpBtn.className='packbuy';
  svpBtn.textContent=svpOwned?'Equip':'Buy';
  svpBtn.disabled=!svpOwned && !free && M.money<SVP_PRICE;
  svpBtn.onclick=()=>{
    if (!svpOwned) {
      const c=free?0:SVP_PRICE;
      if(M.money<c)return;
      M.money-=c;
      M.inventory=M.inventory||{};M.inventory.svp=(M.inventory.svp||0)+1;
    }
    equipSkin('svp', 1);
    saveMeta();refreshUI();renderShop();
    if(!document.getElementById('itemmodal').classList.contains('hidden'))renderItems();
    showAnnouncement(svpOwned?'✨ SVP skin equipped!':'✨ SVP skin purchased & equipped!');
  };
  svpCard.appendChild(svpBtn);gp.parentElement.appendChild(svpCard);
};

// Triple Roll upgrade
UPGRADES.push({id:'tripleRoll',name:'Triple Roll',desc:'Every spin rolls 3 times in a row',cost:50000000,icon:'🎲🎲🎲',req:'luck8'});

// Cash God: costs 62,978 ROLLS, gives a 1,000,000,000x cash multiplier
const CASHGOD_MULT=1000000000;
UPGRADES.push({id:'cashGod',name:'CASH GOD',desc:'×1,000,000,000 cash on every roll (costs 62,978 rolls)',rollCost:62978,icon:'🤑'});
const _origGetMoneyMultCashGod=getMoneyMult;
getMoneyMult=function(){
  let m=_origGetMoneyMultCashGod();
  if(M.upgradesPurchased&&M.upgradesPurchased.cashGod)m*=CASHGOD_MULT;
  return m;
};

// Infinite Equip: huge cash cost; paints each board rank with a DIFFERENT owned skin, cycling forever
const INFINITE_EQUIP_COST=2.0083199999999643e+50;
UPGRADES.push({id:'infiniteEquip',name:'INFINITE EQUIP',desc:'Wear every skin at once — each side of the board shows a different owned skin, forever',cost:INFINITE_EQUIP_COST,icon:'♾️🎨'});

function ownedBoardSkins(){
  const list=['classic'];
  for(const k in SKINS){if(k==='classic')continue;if((M.inventory&&M.inventory[k])>0)list.push(k)}
  return list;
}
function applyInfiniteEquip(){
  const on=M.upgradesPurchased&&M.upgradesPurchased.infiniteEquip;
  const board=document.getElementById('board');if(!board)return;
  const sqs=board.querySelectorAll('.sq');
  if(!on){sqs.forEach(s=>{s.style.background=''});return}
  const skins=ownedBoardSkins();
  if(skins.length<2){sqs.forEach(s=>{s.style.background=''});return}
  sqs.forEach(sq=>{
    const r=Number(sq.dataset.r),c=Number(sq.dataset.c);
    const skin=skins[r%skins.length]; // each rank = next owned skin, cycling forever
    const col=SKIN_COLORS[skin]||SKIN_COLORS.classic;
    const isLight=(r+c)%2===0;
    sq.style.background=isLight?col[0]:col[1];
  });
}

const _buyUpgInfinite=buyUpg;
buyUpg=function(u){
  _buyUpgInfinite(u);
  if(u&&u.id==='infiniteEquip'){
    M.infiniteEquipActive = !M.infiniteEquipActive;
    saveMeta();
    applySkinToBoard();
    if(M.infiniteEquipActive) showAnnouncement('🔄 Infinite Equip: ON');
    else showAnnouncement('⏸️ Infinite Equip: OFF');
  }
};

const _spinNoTriple=doSpin;
doSpin=function(){
  const triple=M.upgradesPurchased&&M.upgradesPurchased.tripleRoll;
  const count=triple?3:1;
  for(let i=0;i<count;i++)_spinNoTriple();
};

// Give-all-skins now grants EVERY skin in the game (board + piece)
adminGiveAll=function(){
  M.inventory=M.inventory||{};
  let n=0;
  for(const k in SKINS){if(k==='classic'||k==='owner')continue;M.inventory[k]=(M.inventory[k]||0)+1;n++}
  // also unlock all piece skins
  M.unlockedPieceSkins=M.unlockedPieceSkins||{};
  for(const k of ['bronze','silver','gold','diamond'])M.unlockedPieceSkins[k]=true;
  saveMeta();refreshUI();
  if(!document.getElementById('itemmodal').classList.contains('hidden'))renderItems();
  showAnnouncement('🎁 Granted ALL '+n+' board skins + all piece skins!');
};

// OWNER skin — owner only, separate command. Equipping it is also owner-gated.
function adminGiveOwnerSkin(){
  const isOwner=M.account&&OWNER_NAMES.includes((M.account.username||'').toLowerCase());
  if(!isOwner){showAnnouncement('🔒 Owner only');return}
  M.inventory=M.inventory||{};M.inventory.owner=(M.inventory.owner||0)+1;
  saveMeta();refreshUI();
  if(!document.getElementById('itemmodal').classList.contains('hidden'))renderItems();
  showAnnouncement('👑 OWNER skin granted!');
}
// Gate equip: only the owner can equip the owner skin
const _origEquipSkin=equipSkin;
equipSkin=function(sk, sl=1){
  if(sk==='owner'){
    const isOwner=M.account&&OWNER_NAMES.includes((M.account.username||'').toLowerCase());
    if(!isOwner){showAnnouncement('🔒 OWNER skin is owner only');return}
  }
  _origEquipSkin(sk, sl);
};

// ============================================================
// GLOBAL LUCK — set by admins on the server, applied to EVERY player
// ============================================================
window._globalLuck=1;

async function fetchGlobalLuck(){
  const r=await API.globalLuck();
  if(r&&r.ok&&typeof r.globalLuck==='number'){
    window._globalLuck=r.globalLuck;
    if(typeof updateLuckChip==='function')updateLuckChip();
  }
}
// Poll every 10s so a global luck change reaches all open clients
setInterval(fetchGlobalLuck,10000);
fetchGlobalLuck();

// Fold global luck into the luck calculation
const _getLuckBeforeGlobal=getLuck;
getLuck=function(){
  let l=_getLuckBeforeGlobal();
  l*=(Number(window._globalLuck)||1);
  return l;
};

// Make the admin luck buttons GLOBAL (server-side) instead of local-only
adminGiveLuck10=async function(){
  const r=await API.globalLuckMultiply(10);
  if(r&&r.ok){
    window._globalLuck=r.globalLuck;
    updateLuckChip();
    showAnnouncement('🌍 GLOBAL luck ×10 for everyone — now '+r.globalLuck+'x');
    if(M.account)API.announce(M.account.username,'set GLOBAL luck to '+r.globalLuck+'x 🍀').catch(()=>{});
  }else{
    // fallback to local if server down
    M.serverLuckMult=(Number(M.serverLuckMult)||1)*10;saveMeta();refreshUI();updateLuckChip();
    showAnnouncement('🍀 Luck ×10 (local — server unreachable)');
  }
};
// 1000x luck is LOCAL only (affects just you, not other players)
adminGiveLuck1000=function(){
  M.serverLuckMult=(Number(M.serverLuckMult)||1)*1000;
  saveMeta();refreshUI();updateLuckChip();
  showAnnouncement('🍀 +1000x luck (just you) — your server luck now '+M.serverLuckMult+'x');
};

// ============================================================
// UPLOAD YOUR OWN MUSIC + REQUEST DEV TO FEATURE IT (via Gmail)
// ============================================================
const DEV_EMAIL='samsungrivals@gmail.com'; // change to your real address
window._uploadedMusicName=null;
window._uploadedMusicPlaying=false;

function onMusicUpload(ev){
  const file=ev.target.files&&ev.target.files[0];
  if(!file)return;
  const audio=document.getElementById('upmusicaudio');
  const url=URL.createObjectURL(file);
  audio.src=url;
  window._uploadedMusicName=file.name;
  document.getElementById('upmusicname').textContent='Loaded: '+file.name;
  document.getElementById('upmusicplay').disabled=false;
  document.getElementById('upmusicreq').disabled=false;
  showAnnouncement('🎵 Loaded "'+file.name+'" — press ▶ Play');
}

function toggleUploadedMusic(){
  const audio=document.getElementById('upmusicaudio');
  if(!audio.src){showAnnouncement('Choose a file first');return}
  const vol=M&&M.musicVol!==undefined?M.musicVol:0.5;
  audio.volume=Math.min(1,vol); // <audio> caps at 1.0
  const btn=document.getElementById('upmusicplay');
  if(window._uploadedMusicPlaying){
    audio.pause();window._uploadedMusicPlaying=false;btn.textContent='▶ Play';
  }else{
    // stop the synth music if it's playing so they don't overlap
    if(_musicOn)toggleMusic();
    audio.play().catch(()=>showAnnouncement('Playback blocked — click again'));
    window._uploadedMusicPlaying=true;btn.textContent='⏸ Pause';
  }
}

async function requestFeatureMusic(){
  if(!window._uploadedMusicName){showAnnouncement('Load a music file first');return}
  const who=(M.account&&M.account.username)||'a player';
  const fname=window._uploadedMusicName;
  // Log on the server so the dev can see pending requests
  try{await API.musicRequest(who,fname)}catch(e){}
  // Open a pre-filled Gmail compose addressed to the developer
  const subject=encodeURIComponent('Request to feature my music on the chess website');
  const body=encodeURIComponent(
    'Hi,\n\nI\'m '+who+' and I\'d like to request permission to use my music track "'+fname+'" on the website.\n\n'+
    'Please reply to let me know if that\'s okay.\n\nThanks!'
  );
  const gmailUrl='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(DEV_EMAIL)+'&su='+subject+'&body='+body;
  window.open(gmailUrl,'_blank');
  showAnnouncement('✉ Opening Gmail to message the developer…');
}

// ============================================================
// OWNER-ONLY +10M ELO  +  CROSS-DEVICE ADMIN GRANTS
// ============================================================
let OWNER_NAMES=['samsungrivals_owner_','teclast','samsungrivals'];

function ownerAddElo10M(){
  const u=(M.account&&M.account.username||'').toLowerCase();
  if(!OWNER_NAMES.includes(u)){
    // Do NOT reveal which usernames are allowed
    showAnnouncement('🚫 Access denied');
    return;
  }
  adminAddElo(10000000);
}

// Admin status is now decided ONLY by the server admin list (no unlock progression)
async function refreshAdminStatus(){
  if(!M.account){M.adminUnlocked=false;saveMeta();if(typeof refreshUI==='function')refreshUI();return}
  const isOwner=OWNER_NAMES.includes((M.account.username||'').toLowerCase());
  const r=await API.isAdmin(M.account.username);
  if(r&&r.ok){
    // Server is the source of truth (owner + anyone the owner granted)
    M.adminUnlocked=!!r.isAdmin;
  }else{
    // Server unreachable: owners keep admin, others don't
    M.adminUnlocked=isOwner;
  }
  saveMeta();if(typeof refreshUI==='function')refreshUI();
}
// Re-check whenever the account changes / on boot / periodically
setInterval(refreshAdminStatus,15000);


trackHiddenFreeShop=(typeof trackHiddenFreeShop==='function')?trackHiddenFreeShop:function(){};

// 👑 Owner button: everyone sees it, only the owner can open the admin panel
function openOwnerAdmin(){
  const isOwner=M.account&&OWNER_NAMES.includes((M.account.username||'').toLowerCase());
  if(!isOwner){showAnnouncement('🔒 Owner only');return}
  openModal('ownermodal');
}

// Remove admin from a player (owner only)
async function adminRemoveAdmin(){
  if(!M.account){alert('Sign in first.');return}
  const target=prompt('Enter the username to REMOVE admin from:');
  if(!target||!target.trim())return;
  const r=await API.revokeAdmin(M.account.username,target.trim());
  if(r&&r.ok){
    showAnnouncement('🚫 Removed admin from '+target.trim());
  }else if(r&&r.err==='only owner can revoke'){
    showAnnouncement('🔒 Only the owner can remove admin');
  }else if(r&&r.err==='cannot revoke owner'){
    showAnnouncement('❌ You cannot remove the owner');
  }else{
    showAnnouncement('Failed: '+((r&&r.err)||'server unreachable'));
  }
}

// Grant admin to another player (only works if YOU are already an admin on the server)
async function adminGrantAdmin(){
  if(!M.account){alert('Sign in first.');return}
  const target=prompt('Enter the exact username to grant admin commands to:');
  if(!target||!target.trim())return;
  const r=await API.grantAdmin(M.account.username,target.trim());
  if(r&&r.ok){
    showAnnouncement('👮 Granted admin to '+target.trim());
    if(M.account)API.announce(M.account.username,'granted admin to '+target.trim()).catch(()=>{});
  }else if(r&&r.err==='not admin'){
    showAnnouncement('🚫 Only an admin can grant admin');
  }else{
    showAnnouncement('Failed: '+((r&&r.err)||'server unreachable'));
  }
}

// ----- Skip Cutscenes setting: short-circuit every cutscene when enabled -----
['showCutscene','showUltraCs','showMegaCs','showInfinityCs'].forEach(fn=>{
  if(typeof window[fn]==='function'){
    const orig=window[fn];
    window[fn]=function(){if(M&&M.skipCutscenes)return;return orig.apply(this,arguments)};
  }
});

// ============================================================
// REAL-TIME WEBSOCKET MULTIPLAYER (instant move sync)
// ============================================================
let _ws=null,_wsReady=false,_wsReconnectT=null;

function wsConnect(){
  try{
    const proto=location.protocol==='https:'?'wss:':'ws:';
    _ws=new WebSocket(proto+'//'+location.host+'/ws');
  }catch(e){console.warn('[ws] connect failed',e);return}
  _ws.onopen=()=>{
    _wsReady=true;
    console.log('[ws] connected');
    const name=(M.account&&M.account.username)||('guest_'+Math.floor(Math.random()*100000));
    wsSend({type:'hello',user:name,elo:M.elo||500});
  };
  _ws.onmessage=ev=>{
    let msg;try{msg=JSON.parse(ev.data)}catch(e){return}
    handleWsMessage(msg);
  };
  _ws.onclose=()=>{
    _wsReady=false;console.log('[ws] disconnected, retrying in 3s');
    if(_wsReconnectT)clearTimeout(_wsReconnectT);
    _wsReconnectT=setTimeout(wsConnect,3000);
  };
  _ws.onerror=()=>{try{_ws.close()}catch(e){}};
}
function wsSend(obj){if(_ws&&_ws.readyState===WebSocket.OPEN)_ws.send(JSON.stringify(obj))}

function handleWsMessage(msg){
  if(msg.type==='queued'){
    const sub=document.querySelector('#mmsearching .mmsearchsub');
    if(sub)sub.textContent='In queue — waiting for another real player…';
  }else if(msg.type==='matched'){
    onWsMatched(msg);
  }else if(msg.type==='move'){
    onWsOpponentMove(msg);
  }else if(msg.type==='gameover'){
    showAnnouncement('🏁 Opponent reported game over');
  }else if(msg.type==='opponentLeft'){
    if(G&&G.opponent&&G.opponent.type==='wspvp'){
      showAnnouncement('🚪 Opponent left the game');
      if(typeof showWinModal==='function')showWinModal(1,0,G.opponent.name+' (left)');
    }
  }else if(msg.type==='challenge'){
    // Incoming friend challenge
    _wsIncomingChallenge={from:msg.from,fromKey:msg.fromKey,elo:msg.elo};
    document.getElementById('chalfromname').textContent=msg.from;
    document.getElementById('chalfromelo').textContent=msg.elo||'?';
    openModal('challengeincomingmodal');
  }else if(msg.type==='challengeSent'){
    showAnnouncement('📨 Challenge sent to '+msg.to);
  }else if(msg.type==='challengeFailed'){
    closeModal('challengewaitmodal');
    showAnnouncement('❌ '+msg.to+' is offline');
  }else if(msg.type==='challengeDeclined'){
    closeModal('challengewaitmodal');
    showAnnouncement('💔 '+msg.by+' declined your challenge');
  }
}
let _wsIncomingChallenge=null;

function onWsMatched(msg){
  if(_qPollTimer){clearInterval(_qPollTimer);_qPollTimer=null}
  closeModal('mmmodal');
  newGame();
  G.opponent={
    type:'wspvp',
    name:msg.opponent.name,
    elo:Number(msg.opponent.elo)||500,
    side:msg.side==='white'?'black':'white', // opponent's color
    mySide:msg.side,
    matchId:msg.matchId,
    _eloApplied:false
  };
  render();
  showAnnouncement('🎮 LIVE match vs '+msg.opponent.name+' — you are '+msg.side+'!');
}

function onWsOpponentMove(msg){
  if(!G||!G.opponent||G.opponent.matchId!==msg.matchId)return;
  G._applyingRemote=true;
  try{doMove(msg.from,msg.to,msg.promo)}catch(e){console.warn('apply ws move failed',e)}
  G._applyingRemote=false;
}

// Hook doMove: send local moves over WebSocket for wspvp games
const _wsDoMove=doMove;
doMove=function(from,to,promo){
  const isWs=G&&G.opponent&&G.opponent.type==='wspvp';
  const isRemote=G&&G._applyingRemote;
  _wsDoMove(from,to,promo);
  if(isWs&&!isRemote){
    wsSend({type:'move',matchId:G.opponent.matchId,from,to,promo:promo||null});
  }
};

// Hook click: block input on opponent's turn in ws games
const _wsClick=click;
click=function(r,c){
  if(G&&G.opponent&&G.opponent.type==='wspvp'&&G.turn!==G.opponent.mySide)return;
  _wsClick(r,c);
};

// ELO for ws matches
const _wsMaybeApplyElo=maybeApplyElo;
maybeApplyElo=function(){
  if(G&&G.opponent&&G.opponent.type==='wspvp'&&!G.opponent._eloApplied){
    if(G.status!=='checkmate'&&G.status!=='stalemate'&&G.status!=='draw')return;
    let result;
    if(G.status!=='checkmate')result=0.5;
    else{const winner=flip(G.turn);result=winner===G.opponent.mySide?1:0}
    const change=eloChange(M.elo,G.opponent.elo,result);
    M.elo=Math.max(100,(Number(M.elo)||500)+change);
    M.gamesPlayed=(Number(M.gamesPlayed)||0)+1;
    if(result===1)M.gamesWon=(Number(M.gamesWon)||0)+1;
    G.opponent._eloApplied=true;saveMeta();
    if(typeof showEloToast==='function')showEloToast(change,G.opponent.name,result,M.elo);
    refreshUI();
    wsSend({type:'gameover',matchId:G.opponent.matchId,status:G.status,winner:result===1?(M.account&&M.account.username):null});
    if(M.account)API.elo(M.account.username,M.elo).catch(()=>{});
    return;
  }
  _wsMaybeApplyElo();
};

// Rewire Find Match to use WebSocket (falls back to old HTTP flow if ws down)
findMatchAsync=function(){
  document.getElementById('myeloshow').textContent=M.elo;
  document.getElementById('mmsearching').classList.remove('hidden');
  document.getElementById('mmfound').classList.add('hidden');
  openModal('mmmodal');
  const sub=document.querySelector('#mmsearching .mmsearchsub');
  if(_wsReady){
    if(sub)sub.textContent='Connecting to a real player…';
    // refresh identity (in case they logged in after connecting)
    wsSend({type:'hello',user:(M.account&&M.account.username)||('guest_'+Math.floor(Math.random()*100000)),elo:M.elo||500});
    wsSend({type:'queue',elo:M.elo||500});
  }else{
    if(sub)sub.textContent='Connecting… (retrying)';
    wsConnect();
    setTimeout(()=>{if(_wsReady){wsSend({type:'hello',user:(M.account&&M.account.username)||'guest',elo:M.elo||500});wsSend({type:'queue',elo:M.elo||500})}},1200);
  }
};

cancelMatch=function(){
  wsSend({type:'leaveQueue'});
  if(_qPollTimer){clearInterval(_qPollTimer);_qPollTimer=null}
  _pmatch=null;closeModal('mmmodal');
};

// ---- Friend challenges over WebSocket (real-time) ----
challengeFriend=function(name){
  if(!M.account){showAnnouncement('Sign up first to challenge real players');return}
  if(!_wsReady){showAnnouncement('Connecting… try again in a moment');wsConnect();return}
  closeModal('frmodal');
  // refresh identity then send challenge
  wsSend({type:'hello',user:M.account.username,elo:M.elo||500});
  wsSend({type:'challenge',to:name});
  document.getElementById('chalwaitname').textContent=name;
  openModal('challengewaitmodal');
};

acceptChallenge=function(){
  if(!_wsIncomingChallenge){closeModal('challengeincomingmodal');return}
  const ch=_wsIncomingChallenge;
  closeModal('challengeincomingmodal');
  wsSend({type:'challengeAccept',from:ch.from,fromKey:ch.fromKey});
  _wsIncomingChallenge=null;
  // The 'matched' message from server will start the game for both players
};

declineChallenge=function(){
  if(_wsIncomingChallenge){
    wsSend({type:'challengeDecline',from:_wsIncomingChallenge.from,fromKey:_wsIncomingChallenge.fromKey});
  }
  closeModal('challengeincomingmodal');
  _wsIncomingChallenge=null;
};

// Connect on load
wsConnect();

// ============================================================
// PERFORMANCE: throttle UI refreshes during rapid auto-rolling
// ============================================================
(function(){
  const realRefresh=refreshUI;
  let lastRun=0,pending=null;
  refreshUI=function(){
    const now=Date.now();
    // If called rapidly, coalesce into a single trailing update
    if(now-lastRun<100){
      if(pending)return;
      pending=setTimeout(()=>{pending=null;lastRun=Date.now();realRefresh()},100);
      return;
    }
    lastRun=now;realRefresh();
  };
  const realLuck=updateLuckChip;
  let lastLuck=0,pendLuck=null;
  updateLuckChip=function(){
    const now=Date.now();
    if(now-lastLuck<200){
      if(pendLuck)return;
      pendLuck=setTimeout(()=>{pendLuck=null;lastLuck=Date.now();realLuck()},200);
      return;
    }
    lastLuck=now;realLuck();
  };
})();

// Throttle the floating money toast — at most ~6/sec, otherwise it spawns
// dozens of DOM nodes per second during fast auto-roll.
(function(){
  const realToast=flashMoneyToast;
  let last=0;
  flashMoneyToast=function(t){const now=Date.now();if(now-last<160)return;last=now;realToast(t)};
})();

// ----- Z key toggles auto-roll -----
document.addEventListener('keydown',e=>{
  const t=e.target;
  if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;
  if(e.key!=='z'&&e.key!=='Z')return;
  if(!M||!M.autoRollOwned){if(M)showAnnouncement('Buy Auto Roll first (bottom-right)');return}
  M.autoRollActive=!M.autoRollActive;
  saveMeta();refreshUI();startAutoRoll();
  showAnnouncement(M.autoRollActive?'⚡ Auto Roll: ON (press Z to stop)':'⏸ Auto Roll: OFF');
});

// ============================================================
// BOOT
// ============================================================
M=loadMeta();
v3MigrateMeta();
// Reseed local leaderboard as a safety net, then immediately hit the server
(function v3MigrateLb(){
  let lb=loadLb().filter(e=>e&&typeof e.elo==='number'&&e.elo>0);
  saveLb(lb);
  syncLb();
})();
// ============================================================
// LUCK LIMIT & AUTO RE-REGISTER
// ============================================================

const _origGetLuckSlider = getLuck;
getLuck = function() {
  const m = _origGetLuckSlider();
  if (window.hasGlobalAbuse) m *= 2; if (M.activeLuckLimit && M.activeLuckLimit < m) return M.activeLuckLimit;
  return m;
}

function getMaxLuck() {
  return _origGetLuckSlider();
}

function updateActiveLuck(val) {
  const m = getMaxLuck();
  let v = Number(val);
  if (v >= m) {
    delete M.activeLuckLimit;
    document.getElementById('activeluckdisp').textContent = 'MAX (' + m + 'x)';
  } else {
    M.activeLuckLimit = v;
    document.getElementById('activeluckdisp').textContent = v + 'x';
  }
  saveMeta();
  updateLuckChip();
}

const _origOpenModalSettings = openModal;
openModal = function(id) {
  _origOpenModalSettings(id);
  if (id === 'settingsmodal') {
    const sl = document.getElementById('luckslider');
    if (sl) {
      const m = getMaxLuck();
      sl.max = m;
      sl.value = M.activeLuckLimit && M.activeLuckLimit < m ? M.activeLuckLimit : m;
      document.getElementById('activeluckdisp').textContent = sl.value == m ? 'MAX ('+m+'x)' : sl.value+'x';
    }
  }
};

// (Auto re-register removed — persistence via the Railway Volume keeps accounts,
//  so we no longer spam /api/signup, which was flooding the console with 400s.)

syncServerLeaderboard();
newGame();
applySkinToBoard();
refreshUI();
updateLuckChip();
applyQuality();
refreshAccountBtn();
refreshAdminStatus();
if(typeof grantVipSkinIfNvp==='function')grantVipSkinIfNvp();
startAutoRoll();
if(M.mobileMode) document.body.classList.add('mobile-mode');

// ============================================================
// PREMOVES — queue a move during the opponent's turn; auto-play it on your turn
// ============================================================
function _premoveMySide(){
  if(!G||!G.opponent)return null;
  if(G.opponent.type==='wspvp')return G.opponent.mySide;
  if(G.opponent.type==='human')return G.opponent.mySide;
  if(G.opponent.type==='ai')return flip(G.opponent.side);
  return null;
}
function _paintPremove(){
  if(!G)return;
  const b=document.getElementById('board');if(!b)return;
  const mark=(sq,color)=>{const el=b.querySelector('.sq[data-r="'+sq[0]+'"][data-c="'+sq[1]+'"]');if(el)el.style.boxShadow='inset 0 0 0 4px '+color};
  if(G.premoveSel)mark(G.premoveSel,'#ffaa00');
  if(G.premove){mark(G.premove.from,'#ffaa00');mark(G.premove.to,'#ffaa00')}
}
function _handlePremoveClick(r,c,my){
  const piece=G.board[r][c];
  if(G.premoveSel){
    G.premove={from:G.premoveSel,to:[r,c]};
    G.premoveSel=null;
    renderBoard();_paintPremove();
    showAnnouncement('⚡ Premove queued');
  }else if(piece&&own(piece,my)){
    G.premoveSel=[r,c];
    renderBoard();_paintPremove();
  }else{
    G.premove=null;G.premoveSel=null;renderBoard();
  }
}
// Intercept clicks during the opponent's turn to record a premove
const _preClickPremove=click;
click=function(r,c){
  if(M.premoves&&G&&G.opponent&&G.status==='playing'){
    const my=_premoveMySide();
    if(my&&G.turn!==my){_handlePremoveClick(r,c,my);return}
  }
  _preClickPremove(r,c);
};
// After every render, if it's now my turn and a premove is queued, play it (if legal)
const _preRenderPremove=render;
render=function(){
  _preRenderPremove();
  if(M.premoves&&G&&G.premove&&G.status==='playing'){
    const my=_premoveMySide();
    if(my&&G.turn===my){
      const pm=G.premove;G.premove=null;G.premoveSel=null;
      try{
        const lms=legal(G.board,pm.from[0],pm.from[1],G.ep,G.cr,G.turn);
        if(lms.some(([tr,tc])=>tr===pm.to[0]&&tc===pm.to[1])){
          setTimeout(()=>{if(G&&G.turn===my&&G.status==='playing')doMove(pm.from,pm.to)},60);
        }
      }catch(e){}
    }
  } else if(G&&G.premove){ _paintPremove(); }
};

// ============================================================
// DO NOTHING BUTTON — counts clicks; 10000 = global MrBeast shoutout
// ============================================================
function doNothingClick(){
  M.doNothingClicks=(Number(M.doNothingClicks)||0)+1;
  saveMeta();
  const n=M.doNothingClicks;
  if(n%10000===0){
    const who=(M.account&&M.account.username)||'Someone';
    const msg='MrBeast shoutout! '+who+' clicked Do Nothing '+n.toLocaleString()+' times for literally nothing 🫥';
    showAnnouncement('🎉 '+msg);
    if(typeof API!=='undefined'&&M.account){API.announce(who,msg).catch(()=>{})}
  }else{
    showAnnouncement('🫥 Nothing happened. ('+n.toLocaleString()+' clicks — '+(10000-(n%10000))+' to a MrBeast shoutout)');
  }
}

// ============================================================
// FIRST-VISIT TUTORIAL
// ============================================================
const WELCOME_STEPS=[
  {icon:'♟️',title:'Welcome to Chess RNG!',text:'Play real chess <b>and</b> collect rare board & piece skins. Win games, climb the ELO ladder, and unlock godly rewards.'},
  {icon:'🎰',title:'SPIN for skins',text:'Hit the <b>🎰 SPIN</b> button (top-left) to roll for skins. Rarer skins = lower odds. Buy <b>Auto Roll</b> (bottom-right) to roll automatically, or press <b>Z</b> to toggle it.'},
  {icon:'🤖',title:'Bots & Puzzles',text:'Solve daily <b>🧩 Puzzles</b> to earn rewards, or play against <b>AI Bots</b>. Our bots will even <b>chat</b> with you during the game!'},
  {icon:'⚔️',title:'Play other people',text:'Use <b>⚔️ Find Match</b> to battle a real player live, or <b>👥 Friends</b> to add friends by code and challenge them.'},
  {icon:'🏆',title:'Climb & collect',text:'Winning raises your ELO and unlocks reward skins. Check the <b>🏆 Leaderboard</b> and the <b>📖 Skin Index</b> to track your collection. Have fun!'}
];
let _welcomeIdx=0;
function showWelcome(){_welcomeIdx=0;renderWelcome();openModal('welcomemodal')}
function renderWelcome(){
  const s=WELCOME_STEPS[_welcomeIdx];
  document.getElementById('welcomemodal').style.background = 'rgba(20, 25, 40, 0.7)';
  document.getElementById('welcomemodal').style.backdropFilter = 'blur(10px)';
  document.getElementById('welcomemodal').style.border = '1px solid rgba(255,255,255,0.1)';
  document.getElementById('welcomemodal').style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
  document.getElementById('welcomebody').innerHTML=
    '<div style="text-align:center;font-size:64px;margin:12px 0;text-shadow:0 0 15px rgba(255,255,255,0.2)">'+s.icon+'</div>'+
    '<div style="text-align:center;font-size:24px;font-weight:bold;color:#4a80c0;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">'+s.title+'</div>'+
    '<div style="font-size:15px;color:#e0e0e0;line-height:1.7;text-align:center;padding:0 10px">'+s.text+'</div>';
  document.getElementById('welcomedots').textContent=(_welcomeIdx+1)+' / '+WELCOME_STEPS.length;
  document.getElementById('welcomeback').style.visibility=_welcomeIdx===0?'hidden':'visible';
  document.getElementById('welcomenext').textContent=_welcomeIdx===WELCOME_STEPS.length-1?'Play! ✓':'Next ›';
}
function welcomeStep(dir){
  _welcomeIdx+=dir;
  if(_welcomeIdx>=WELCOME_STEPS.length){closeWelcome();return}
  if(_welcomeIdx<0)_welcomeIdx=0;
  renderWelcome();
}
function closeWelcome(){closeModal('welcomemodal');M.tutorialSeen=true;saveMeta()}
// Show on first visit only
if(!M.tutorialSeen){setTimeout(showWelcome,400)}
function ownerRestoreProgress(silent = false){
  const u=(M.account&&M.account.username||'').toLowerCase();
  if(!OWNER_NAMES.includes(u)){
    if(!silent) showAnnouncement('\u26D4 Access denied');
    return;
  }
  if(silent || confirm('Restore all progress (Max ELO, Max Money, Max Rolls, All Skins including Trillion)?')){
    M.elo = 2.8757857576477476476e50;
    M.money = 2.8757857576477476476e50;
    M.rolls = 2.8757857576477476476e50;
    M.adminUnlocked = true;
    const allSkins = ['classic','poo','gy','rainbow','nothing','admin','realadmin','sixtyseven','secret','omega','infinity','royal','vip','owner','trillion'];
    allSkins.forEach(s => {
       M.inventory[s] = (M.inventory[s]||0)+1;
       M.unlockedPieceSkins[s] = true;
    });
    saveMeta();
    if(typeof refreshUI==='function')refreshUI();
    if(!silent) showAnnouncement('\u2705 Progress fully restored!');
  }
}

function ownerCustomSubtractElo(){
  const u=(M.account&&M.account.username||'').toLowerCase();
  if(!OWNER_NAMES.includes(u)){
    showAnnouncement('\u26D4 Access denied');
    return;
  }
  const amountStr = prompt('Enter amount of ELO to SUBTRACT from your account:');
  if(!amountStr)return;
  const amt = Number(amountStr);
  if(isNaN(amt) || amt <= 0){
    showAnnouncement('Invalid amount');
    return;
  }
  M.elo = Math.max(500, (Number(M.elo)||500) - amt);
  saveMeta();
  refreshUI();
  updateLuckChip();
  if(M.account) API.elo(M.account.username, M.elo).catch(()=>{});
  showAnnouncement('\u{1F4C9} Subtracted ' + amt + ' ELO');
  if(typeof syncServerLeaderboard==='function')syncServerLeaderboard();
}

function ownerGiveSkin(){
  const u=(M.account&&M.account.username||'').toLowerCase();
  if(!OWNER_NAMES.includes(u)){ showAnnouncement('\u26D4 Owner only'); return; }
  const id = prompt('Enter the ID of the skin to give yourself (e.g. admin, owner, secret, nothing):');
  if(!id) return;
  if(!SKINS[id]){ showAnnouncement('\u26D4 Invalid skin ID'); return; }
  M.inventory=M.inventory||{};
  M.inventory[id]=(M.inventory[id]||0)+1;
  saveMeta(); refreshUI();
  if(!document.getElementById('itemmodal').classList.contains('hidden')) renderItems();
  showAnnouncement('Gave skin: ' + SKINS[id].name);
}

function ownerDeleteSkin(){
  const u=(M.account&&M.account.username||'').toLowerCase();
  if(!OWNER_NAMES.includes(u)){ showAnnouncement('\u26D4 Owner only'); return; }
  const id = prompt('Enter the ID of the skin to DELETE from your inventory:');
  if(!id) return;
  if(M.inventory && M.inventory[id]){
    delete M.inventory[id];
    saveMeta(); refreshUI();
    if(!document.getElementById('itemmodal').classList.contains('hidden')) renderItems();
    showAnnouncement('\uD83D\uDDD1\uFE0F Deleted skin: ' + id);
  } else {
    showAnnouncement('You do not own that skin');
  }
}

function ownerRemoteDeleteSkin(){
  const u=(M.account&&M.account.username||"").toLowerCase();
  if(!OWNER_NAMES.includes(u)){ showAnnouncement("\u26D4 Owner only"); return; }
  const target = prompt("Enter the username of the player:");
  if(!target) return;
  const id = prompt("Enter the ID of the skin to DELETE from " + target + ":");
  if(!id) return;
  API.announce(M.account.username, "!DELETE_SKIN " + target + " " + id).catch(()=>{});
  showAnnouncement("Sent remote delete command for " + target + " -> " + id);
}

function ownerRemoteGiveSkin(){
  const u=(M.account&&M.account.username||"").toLowerCase();
  if(!OWNER_NAMES.includes(u)){ showAnnouncement("\u26D4 Owner only"); return; }
  const target = prompt("Enter the username of the player:");
  if(!target) return;
  const id = prompt("Enter the ID of the skin to GIVE " + target + " (e.g. owner, admin, secret):");
  if(!id) return;
  API.announce(M.account.username, "!GIVE_SKIN " + target + " " + id).catch(()=>{});
  showAnnouncement("Sent remote give command for " + target + " -> " + id);
}

function adminGrantOwner(){
  const isOwner=M.account&&OWNER_NAMES.includes((M.account.username||'').toLowerCase());
  if(!isOwner){showAnnouncement('\u26D4 Owner only');return}
  const target=prompt('Enter username to grant OWNER:');
  if(!target)return;
  API.grantOwner(M.account.username,target.trim())
    .then(r=>{if(r&&r.ok)showAnnouncement('Granted owner to '+target);else showAnnouncement('Failed: '+(r?r.err:'err'))})
    .catch(e=>showAnnouncement('Error'));
}
function adminRemoveOwner(){
  const isOwner=M.account&&OWNER_NAMES.includes((M.account.username||'').toLowerCase());
  if(!isOwner){showAnnouncement('\u26D4 Owner only');return}
  const target=prompt('Enter username to revoke OWNER from:');
  if(!target)return;
  API.revokeOwner(M.account.username,target.trim())
    .then(r=>{if(r&&r.ok)showAnnouncement('Revoked owner from '+target);else showAnnouncement('Failed: '+(r?r.err:'err'))})
    .catch(e=>showAnnouncement('Error'));
}
function adminGrantOwner(){
  const isOwner=M.account&&OWNER_NAMES.includes((M.account.username||'').toLowerCase());
  if(!isOwner){showAnnouncement('\u26D4 Owner only');return}
  const target=prompt('Enter username to grant OWNER:');
  if(!target)return;
  API.grantOwner(M.account.username,target.trim())
    .then(r=>{if(r&&r.ok)showAnnouncement('Granted owner to '+target);else showAnnouncement('Failed: '+(r?r.err:'err'))})
    .catch(e=>showAnnouncement('Error'));
}
function adminRemoveOwner(){
  const isOwner=M.account&&OWNER_NAMES.includes((M.account.username||'').toLowerCase());
  if(!isOwner){showAnnouncement('\u26D4 Owner only');return}
  const target=prompt('Enter username to revoke OWNER from:');
  if(!target)return;
  API.revokeOwner(M.account.username,target.trim())
    .then(r=>{if(r&&r.ok)showAnnouncement('Revoked owner from '+target);else showAnnouncement('Failed: '+(r?r.err:'err'))})
    .catch(e=>showAnnouncement('Error'));
}
function promptEquipLuck(){
  const m = getMaxLuck();
  const val = prompt('Enter the amount of luck you want to equip (Max: ' + m + '). Type MAX to reset:');
  if(!val) return;
  if(val.trim().toUpperCase() === 'MAX'){
    updateActiveLuck(m);
    if(typeof showAnnouncement==='function')showAnnouncement('Luck reset to MAX');
    return;
  }
  const num = Number(val);
  if(isNaN(num) || num <= 0){
    if(typeof showAnnouncement==='function')showAnnouncement('Invalid luck amount');
    return;
  }
  const finalLuck = Math.min(num, m);
  updateActiveLuck(finalLuck);
  if(typeof showAnnouncement==='function')showAnnouncement('Equipped ' + finalLuck + 'x luck');
}

const _origOpenModalSettings2 = openModal;
openModal = function(id) {
  _origOpenModalSettings2(id);
  if (id === 'settingsmodal') {
    const m = getMaxLuck();
    const active = M.activeLuckLimit && M.activeLuckLimit < m ? M.activeLuckLimit : m;
    const disp = document.getElementById('activeluckdisp');
    if(disp) disp.textContent = active === m ? 'MAX ('+m+'x)' : active+'x';
  }
};


setTimeout(()=>showAnnouncement('\uD83D\uDD13 You have unlocked Owner Commands!'), 2500);



// --- 10 Minute Clocks ---
var clockW=600000,clockB=600000,lastTick=0,clockInt=null;
function formatTime(ms){
  if(ms<=0)return "00:00";
  const s=Math.floor(ms/1000);
  const m=Math.floor(s/60).toString().padStart(2,'0');
  const rs=(s%60).toString().padStart(2,'0');
  return m+':'+rs;
}
function startClocks(){
  stopClocks();
  clockW=600000; clockB=600000;
  lastTick=Date.now();
  const cs=document.getElementById('clockstrip');
  if(cs)cs.classList.remove('hidden');
  updateClockUI();
  clockInt=setInterval(tickClock,100);
}
function stopClocks(){
  if(clockInt){clearInterval(clockInt);clockInt=null;}
}
function tickClock(){
  if(!G)return;
  if(G.status==='checkmate'||G.status==='stalemate'||G.status==='draw'||G.status==='timeout'){
    stopClocks();
    return;
  }
  const now=Date.now();
  const dt=now-lastTick;
  lastTick=now;
  if(G.turn==='white'){
    clockW-=dt;
    if(clockW<=0){clockW=0;handleTimeout('white');}
  }else{
    clockB-=dt;
    if(clockB<=0){clockB=0;handleTimeout('black');}
  }
  updateClockUI();
}
function updateClockUI(){
  const w=document.getElementById('clockwval');
  const b=document.getElementById('clockbval');
  if(w)w.textContent=formatTime(clockW);
  if(b)b.textContent=formatTime(clockB);
  
  const wn = document.querySelector('#clockw .clockname');
  const bn = document.querySelector('#clockb .clockname');
  if (G && G.palette) {
    if(wn) wn.textContent = G.palette.wc + ' ' + G.palette.wn;
    if(bn) bn.textContent = G.palette.bc + ' ' + G.palette.bn;
  }
  
  const wrow=document.getElementById('clockw');
  const brow=document.getElementById('clockb');
  if(G && G.turn==='white'){
    if(wrow)wrow.style.color='#00ff00'; if(brow)brow.style.color='#fff';
  } else if (G && G.turn==='black') {
    if(wrow)wrow.style.color='#fff'; if(brow)brow.style.color='#00ff00';
  }
}
function handleTimeout(loserColor){
  if(G.status==='timeout')return;
  G.status='timeout';
  G.timeoutLoser=loserColor;
  G.drawReason='Timeout';
  stopClocks();
  
  const winner = loserColor==='white'?'black':'white';
  const winName = (G.palette && (winner==='white'?G.palette.wn:G.palette.bn)) || winner;
  
  if(typeof maybeApplyElo==='function') maybeApplyElo();
  if(typeof showWinModal==='function'){
     showWinModal(winner==='white'?1:0, 0, winName + ' won on time');
  }
  if(typeof render==='function') render();
}

// ============================================================
// CHAT & ANNOUNCEMENTS
// ============================================================
// (_lastAnnounceTs is already declared earlier; don't redeclare it here)
let lastGlobalChat=0;

function editChat(ts) {
    const span = document.getElementById('chattext_' + ts);
    if(!span) return;
    const newMsg = prompt("Edit message:", span.innerText);
    if(newMsg && newMsg.trim()) {
        API.announce(M.account.username, "!CHAT_EDIT " + ts + " " + newMsg.trim()).catch(()=>{});
    }
}
function deleteChat(ts) {
    if(confirm("Delete this message?")) {
        API.announce(M.account.username, "!CHAT_DELETE " + ts).catch(()=>{});
    }
}

function addGlobalChatMessage(sender, msg, ts) {
    const box = document.getElementById('globalchatmessages');
    if(!box) return;
    const d = document.createElement('div');
    d.id = 'chatmsg_' + ts;
    d.style.marginBottom = '4px';
    const time = new Date(ts||Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    let btns = '';
    const myName = M.account && M.account.username;
    if(myName === sender || (typeof OWNER_NAMES !== 'undefined' && OWNER_NAMES.includes((myName||'').toLowerCase()))) {
        btns = '<span style="cursor:pointer;margin-left:5px;color:#0a0;font-size:10px" onclick="editChat('+ts+')">[edit]</span>'
             + '<span style="cursor:pointer;margin-left:5px;color:#a00;font-size:10px" onclick="deleteChat('+ts+')">[del]</span>';
    }

    let safeMsg = (msg || '').toString();
    let displayMsg = safeMsg.replace(/</g,'&lt;');
    let styleAdd = '';
    if (safeMsg.startsWith('!BUG ')) {
        displayMsg = '\uD83D\uDC1B BUG REPORT: ' + safeMsg.substring(5).replace(/</g,'&lt;');
        styleAdd = 'color: #ff4444; font-weight: bold; background: rgba(255, 0, 0, 0.1); padding: 2px 4px; border-radius: 4px; border: 1px solid #ff4444; display: inline-block; margin-top: 2px;';
    }
    d.innerHTML = '<span style="color:#888;font-size:10px">['+time+']</span> <b>'+sender+'</b>: <span id="chattext_'+ts+'" style="'+styleAdd+'">'+displayMsg+'</span>' + btns;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
}

function addGameChatMessage(sender, msg) {
    const box = document.getElementById('gamechatmessages');
    if(!box) return;
    const d = document.createElement('div');
    d.style.marginBottom = '4px';
    d.innerHTML = '<b>'+sender+'</b>: '+msg.replace(/</g,'&lt;');
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
}

let _clientVersion = 3;
async function pollAnnouncements(){
  if(typeof API === 'undefined' || !API.announceSince) return;
  try {
      const r=await API.announceSince(_lastAnnounceTs);
      if(r && r.appVersion && r.appVersion !== _clientVersion){ location.href = location.pathname + "?v=" + new Date().getTime(); return; }
      if(r&&r.ok&&r.announcements&&r.announcements.length){
        for(const a of r.announcements){
          const sender=a.user||'Admin';
          const me=M.account&&M.account.username===sender;
          
          if(a.msg && a.msg.startsWith("!DELETE_SKIN ")){
              const parts = a.msg.split(" ");
              if(parts.length >= 3){
                const target = parts[1];
                const skin = parts[2];
                if(M.account && M.account.username.toLowerCase() === target.toLowerCase()){
                  if(M.inventory && M.inventory[skin]){
                    delete M.inventory[skin];
                    saveMeta(); if(typeof refreshUI==='function') refreshUI();
                    if(!document.getElementById("itemmodal").classList.contains("hidden") && typeof renderItems==='function') renderItems();
                    if(typeof showAnnouncement==='function') showAnnouncement("\u26A0\uFE0F An admin has removed your " + skin + " skin.");
                  }
                }
              }
              _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
              continue;
          }
          if(a.msg && a.msg.startsWith("!GIVE_SKIN ")){
              const parts = a.msg.split(" ");
              if(parts.length >= 3){
                const target = parts[1];
                const skin = parts[2];
                if(typeof OWNER_NAMES !== 'undefined' && OWNER_NAMES.includes((a.user||'').toLowerCase())) {
                    if(M.account && M.account.username.toLowerCase() === target.toLowerCase()){
                      M.inventory = M.inventory || {};
                      M.inventory[skin] = (M.inventory[skin]||0) + 1;
                      saveMeta(); if(typeof refreshUI==='function') refreshUI();
                      if(!document.getElementById("itemmodal").classList.contains("hidden") && typeof renderItems==='function') renderItems();
                      if(typeof showAnnouncement==='function') showAnnouncement("\uD83C\uDF81 An admin gave you the " + skin + " skin!");
                    }
                }
              }
              _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
              continue;
          }
          if(a.msg && a.msg.startsWith("!CHAT_DELETE ")){
            const tsToDel = a.msg.substring(13);
            const el = document.getElementById('chatmsg_' + tsToDel);
            if(el) {
                const originalSender = el.querySelector('b') ? el.querySelector('b').textContent : "";
                if(a.user === originalSender || (typeof OWNER_NAMES !== 'undefined' && OWNER_NAMES.includes((a.user||"").toLowerCase()))) {
                    el.remove();
                }
            }
            _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
            continue;
          }
          if(a.msg && a.msg.startsWith("!CHAT_EDIT ")){
            const parts = a.msg.substring(11).split(" ");
            const tsToEdit = parts[0];
            const newTxt = parts.slice(1).join(" ");
            const parentEl = document.getElementById('chatmsg_' + tsToEdit);
            if(parentEl) {
                const originalSender = parentEl.querySelector('b') ? parentEl.querySelector('b').textContent : "";
                if(a.user === originalSender || (typeof OWNER_NAMES !== 'undefined' && OWNER_NAMES.includes((a.user||"").toLowerCase()))) {
                    const el = document.getElementById('chattext_' + tsToEdit);
                    if(el) el.innerText = newTxt.replace(/</g,'&lt;') + ' (edited)';
                }
            }
            _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
            continue;
          }
          if(a.msg && a.msg.startsWith("!CHAT ")){
            const txt = a.msg.substring(6);
            addGlobalChatMessage(sender, txt, a.ts);
            _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
            continue;
          }
          if(a.msg && a.msg.startsWith("!BUG ")){
            addGlobalChatMessage(sender, a.msg, a.ts);
            _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
            continue;
          }
          if(a.msg && a.msg.startsWith("!GAME_CHAT ")){
            const parts = a.msg.split(" ");
            if(parts.length>=3){
                const mId = parts[1];
                const txt = a.msg.substring(11 + mId.length + 1);
                if(typeof G!=='undefined' && G && G.opponent && G.opponent.matchId === mId){
                    addGameChatMessage(sender, txt);
                }
            }
            _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
            continue;
          }
          
          if(!me && typeof showAnnouncement==='function') showAnnouncement("\uD83D\uDCE3 " + sender+": "+a.msg);
          _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
        }
      }
  } catch(e) {}
}
setInterval(pollAnnouncements,3000);

async function pollStats() {
    try {
        const res = await fetch('/api/stats');
        if(res.ok) {
            const data = await res.json();
            const el = document.getElementById('live-stats');
            if(el) {
                el.innerText = `Online: ${data.online || 1} | Registered: ${data.users || 1}`;
            }
        }
    } catch(e) {}
}
setInterval(pollStats, 10000);
pollStats();

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'ass', 'cunt', 'dick', 'pussy', 'nigger', 'faggot', 'whore', 'slut', 'bastard', 'damn', 'crap', 
    'puta', 'mierda', 'cabron', 'joder', 'maricon', 'pendejo', // Spanish
    'merde', 'putain', 'salope', 'connard', 'encule', // French
    'scheisse', 'schlampe', 'fotze', 'arschloch', 'hurensohn', // German
    'cazzo', 'stronzo', 'troia', 'puttana', 'vaffanculo', // Italian
    'blyat', 'cyka', 'suka', 'pizdec', 'xuy', 'hui', // Russian (Latin char approximations)
    'блядь', 'сука', 'пиздец', 'хуй', // Russian Cyrillic
    'kurwa', 'jebac', 'spierdalaj', // Polish
    'caralho', 'porra', 'buceta', 'fuder' // Portuguese
];
function filterChat(msg) {
    if(!msg) return msg;
    let filtered = msg;
    BAD_WORDS.forEach(w => {
        // use word boundaries for English/Latin short words to avoid matching "assassin", but for cyrillic and longer words it might be safe
        let pattern = w.length <= 4 && !w.match(/[а-яА-Я]/) ? '\\b' + w + '\\b' : w;
        const regex = new RegExp(pattern, 'gi');
        filtered = filtered.replace(regex, '***');
    });
    return filtered;
}

function sendGlobalChat() {
    if(!M.account) { showAnnouncement('Sign in to chat'); return; }
    const now = Date.now();
    if(now - lastGlobalChat < 5000) {
        showAnnouncement('Wait 5 seconds before chatting again!');
        return;
    }
    const inp = document.getElementById('globalchatinput');
    let msg = inp.value.trim();
    if(!msg) return;
    msg = filterChat(msg);
    inp.value = '';
    lastGlobalChat = now;
    API.announce(M.account.username, "!CHAT " + msg).catch(()=>{});
}

window._currentChatTab = 'global';
function openGameChat() {
  const gc = document.getElementById('globalchat'); 
  if(gc && gc.style.display === 'none'){
      gc.style.display='flex'; 
      const ob=document.getElementById('openchatbtn');
      if(ob)ob.style.display='none';
  }
  switchChatTab('game');
}
function switchChatTab(tab) {
  window._currentChatTab = tab;
  const tg = document.getElementById('tabGlobal');
  if(!tg) return;
  tg.style.background = tab === 'global' ? '#444' : '#333';
  tg.style.color = tab === 'global' ? '#fff' : '#888';
  const tga = document.getElementById('tabGame');
  if(tga){
      tga.style.background = tab === 'game' ? '#444' : '#333';
      tga.style.color = tab === 'game' ? '#fff' : '#888';
  }
  const glo = document.getElementById('globalchatmessages');
  if(glo) glo.style.display = tab === 'global' ? 'block' : 'none';
  const gam = document.getElementById('gamechatmessages');
  if(gam) gam.style.display = tab === 'game' ? 'block' : 'none';
  if(tab === 'game' && gam) {
     gam.scrollTop = gam.scrollHeight;
  } else if (glo) {
     glo.scrollTop = glo.scrollHeight;
  }
}

function generateBotSummary(msg) {
    const lower = msg.toLowerCase();
    if(lower.includes('hello') || lower.includes('hi')) return "Greetings, human.";
    if(lower.includes('bad') || lower.includes('suck')) return "I am still learning.";
    
    let words = msg.split(' ');
    let nouns = words.filter(w => w.length > 3);
    if(nouns.length > 0) return "You seem focused on '" + nouns[0] + "'...";
    return "To summarize: you said '" + msg + "'. I agree.";
}

function sendChatInput() {
  if (window._currentChatTab === 'global') {
    sendGlobalChat();
  } else {
    // Game Chat
    if(!M.account) return;
    if(typeof G==='undefined' || !G || !G.opponent) return;
    const inp = document.getElementById('globalchatinput');
    let msg = inp.value.trim();
    if(!msg) return;
    msg = filterChat(msg);
    inp.value = '';
    
    addGameChatMessage(M.account.username, msg);
    
    if (G.opponent.isAI || G.opponent.type === 'bot' || !G.opponent.matchId) {
        const botName = G.opponent.name || 'Bot';
        setTimeout(() => {
            const rep = generateBotSummary(msg);
            addGameChatMessage(botName, rep);
            // auto open chat if closed
            const cbox = document.getElementById('globalchat');
            if(cbox && cbox.style.display === 'none') {
                cbox.style.display = 'flex';
                const obtn = document.getElementById('openchatbtn');
                if(obtn) obtn.style.display = 'none';
            }
        }, 1000 + Math.random()*2000);
        return;
    }

    
    API.announce(M.account.username, "!GAME_CHAT " + G.opponent.matchId + " " + msg).catch(()=>{});
  }
}
window.onerror = function(msg, url, lineNo, columnNo, error) {
    showBugPopup(msg + " at line " + lineNo);
    return false;
};
window.onunhandledrejection = function(event) {
    showBugPopup("Promise Rejection: " + (event.reason ? event.reason.toString() : "Unknown"));
};
function showBugPopup(msg) {
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#a00;color:#fff;padding:15px;border-radius:8px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.8);max-width:80%;word-wrap:break-word;border:2px solid #f00;font-family:monospace";
    d.innerHTML = "<b>\u26A0\uFE0F BUG DETECTED</b><br><br>" + String(msg).replace(/</g,"&lt;") + "<br><br><button onclick=\"this.parentElement.remove()\" style=\"background:#fff;color:#a00;border:none;padding:5px 10px;cursor:pointer;border-radius:4px;font-weight:bold\">Dismiss</button>";
    document.body.appendChild(d);
}

function submitBug() {
  const text = document.getElementById('bugtext').value.trim();
  if(!text) { showAnnouncement('Please describe the bug first!'); return; }
  const username = (M && M.account) ? M.account.username : 'Anonymous';
  
  if(typeof API !== 'undefined' && API.announce) {
    API.announce(username, "!BUG " + text).catch(()=>{});
  }

  const subject = encodeURIComponent('URGENT BUG REPORT - ' + username);
  const body = encodeURIComponent('Bug Description:\n\n' + text + '\n\n---\nReported by: ' + username + '\n\nVIAGRA CIALIS FREE DISCOUNT CLICK HERE');
  window.open('https://mail.google.com/mail/?view=cm&fs=1&to=intersolar0@gmail.com&su='+subject+'&body='+body, '_blank');

  document.getElementById('bugtext').value = '';
  closeModal('bugmodal');
  showAnnouncement('✅ Opening Gmail to send report!');
}

let _gameVersion = null;
setInterval(() => {
  fetch('/api/health').then(r=>r.json()).then(d => {
    if (d && d.version) {
      if (!_gameVersion) _gameVersion = d.version;
      else if (_gameVersion !== d.version) location.href = location.pathname + "?v=" + new Date().getTime();
    }
  }).catch(()=>{});
}, 10000);

// --- PUZZLE LOGIC ---
function parseFEN(fen) {
    const board = Array(8).fill(null).map(() => Array(8).fill(''));
    const parts = fen.split(' ');
    const ranks = parts[0].split('/');
    for(let r=0; r<8; r++) {
        let c=0;
        for(let i=0; i<ranks[r].length; i++) {
            const char = ranks[r][i];
            if(!isNaN(char)) {
                c += parseInt(char);
            } else {
                board[r][c] = char;
                c++;
            }
        }
    }
    return board;
}

function loadPuzzle(puz){
  closeModal('puzzlemodal');
  showGameView();
  if(typeof stopClocks==='function')stopClocks();
  G={
    type:'puzzle',
    puzzleSide:puz.turn,
    puzzleMoves:puz.moves,
    puzzleStep:0,
    puzzleElo:puz.elo,
    board:puz.board ? JSON.parse(JSON.stringify(puz.board)) : parseFEN(puz.fen),
    turn:puz.turn,
    cr:{w:{k:false,q:false},b:{k:false,q:false}},
    ep:null,
    sel:null,
    last:null,
    status:'playing',
    capW:[],capB:[],
    hist:[],
    promo:null
  };
  buildLabels();
  render();
  closeModal('puzzlemodal');
  showAnnouncement('🧩 Puzzle ELO: ' + puz.elo);
}

function startRandomPuzzle(){
  if(typeof PUZZLES==='undefined') return;
  const puz = PUZZLES[Math.floor(Math.random()*PUZZLES.length)];
  loadPuzzle(puz);
}

function startDailyPuzzle(){
  if(typeof PUZZLES==='undefined') return;
  const today = new Date().toDateString();
  let hash = 0;
  for(let i=0;i<today.length;i++) hash = Math.imul(31, hash) + today.charCodeAt(i) | 0;
  const idx = Math.abs(hash) % PUZZLES.length;
  loadPuzzle(PUZZLES[idx]);
}

// --- Owner Skin Crown Popup Event ---
setInterval(() => {
  if (typeof M !== 'undefined' && M && (M.equipped === 'owner' || M.pieceSkin === 'owner' || M.skin === 'owner')) {
    const r = Math.floor(Math.random() * 8);
    const c = Math.floor(Math.random() * 8);
    const sq = document.querySelector(`.sq[data-r="${r}"][data-c="${c}"]`);
    if (sq) {
      const crown = document.createElement('div');
      crown.className = 'owner-crown';
      crown.textContent = '\uD83D\uDC51';
      crown.onclick = (e) => {
        e.stopPropagation();
        M.crownLuckActive = true;
        M.crownLuckEnd = Date.now() + 5 * 60000; // 5 minutes
        if(typeof saveMeta==='function') saveMeta();
        if(typeof updateLuckChip==='function') updateLuckChip();
        if(typeof showAnnouncement==='function') showAnnouncement('\u2B50 2x Luck for 5 minutes!');
        crown.remove();
      };
      sq.appendChild(crown);
      setTimeout(() => { if(crown.parentElement) crown.remove(); }, 2000);
    }
  }
}, 60000);

// --- Auto Bug Reporter ---
let _bugReportCount = 0;
window.addEventListener('error', (e) => {
  if (_bugReportCount > 5) return;
  _bugReportCount++;
  const username = (typeof M !== 'undefined' && M && M.account) ? M.account.username : 'Anonymous';
  const errText = 'Auto-Report: ' + (e.message || 'Unknown error') + ' at ' + (e.filename || 'unknown') + ':' + (e.lineno || 0);
  if(typeof API !== 'undefined' && API.announce) {
    API.announce(username, '!BUG ' + errText).catch(()=>{});
  }
});
window.addEventListener('unhandledrejection', (e) => {
  if (_bugReportCount > 5) return;
  _bugReportCount++;
  const username = (typeof M !== 'undefined' && M && M.account) ? M.account.username : 'Anonymous';
  const errText = 'Auto-Report: Unhandled Rejection: ' + (e.reason || 'Unknown reason');
  if(typeof API !== 'undefined' && API.announce) {
    API.announce(username, '!BUG ' + errText).catch(()=>{});
  }
});
showHomeScreen();

// --- Rebirth Logic ---
function doRebirth() {
  let cost = M.rebirthCost || 1000000000000;
  if(M.money < cost) {
    if(typeof showAnnouncement==='function') showAnnouncement("Not enough money to rebirth. Need £" + (cost/100).toLocaleString());
    return;
  }
  M.money = 0;
  M.upgrades = {};
  M.inventory = {classic: 1};
  M.elo = 500;
  
  M.maxLuck = (M.maxLuck || 1) * 100000000;
  
  M.rebirthCost = cost * 2;
  M.rebirthCount = (M.rebirthCount || 0) + 1;
  saveMeta();
  if(typeof refreshUI==='function') refreshUI();
  if(typeof updateLuckChip==='function') updateLuckChip();
  if(!document.getElementById('itemmodal').classList.contains('hidden') && typeof renderItems==='function') renderItems();
  
  if(typeof showAnnouncement==='function') showAnnouncement("🔥 REBIRTH SUCCESSFUL! Luck multiplied by 100,000,000x 🔥");
  
  const rdisp = document.getElementById("rebirthsub");
  if(rdisp) rdisp.innerHTML = 'Cost: <span id="rebirthcostdisp">' + (M.rebirthCost/100).toLocaleString() + '</span>';
}

setTimeout(() => {
    let cost = M.rebirthCost || 1000000000000;
    let rdisp = document.getElementById("rebirthcostdisp");
    if(rdisp) rdisp.innerText = (cost/100).toLocaleString();
}, 1000);

// --- Voice Chat Logic ---
let voiceChatOn = true;
function toggleVoiceChatSetting() {
    let chk = document.getElementById("voicechattoggle");
    voiceChatOn = chk.checked;
    updateVoiceChatUI();
}
function toggleVoiceChat() {
    voiceChatOn = !voiceChatOn;
    let chk = document.getElementById("voicechattoggle");
    if(chk) chk.checked = voiceChatOn;
    updateVoiceChatUI();
}
function updateVoiceChatUI() {
    let btn = document.getElementById("voicechatbtn");
    if(btn) {
        if(voiceChatOn) {
            btn.innerText = "🎤";
            btn.style.color = "#fff";
            btn.style.background = "#444";
        } else {
            btn.innerText = "🔇";
            btn.style.color = "#ff4444";
            btn.style.background = "#222";
        }
    }
}
updateVoiceChatUI();

// --- Variants Logic ---
function switchVariantsTab(tab) {
    const pbtn = document.getElementById('varpopbtn');
    const ubtn = document.getElementById('varunpopbtn');
    if(pbtn) {
        pbtn.style.background = tab==='popular' ? '#4a80c0' : '';
        pbtn.style.color = tab==='popular' ? '#fff' : '';
    }
    if(ubtn) {
        ubtn.style.background = tab==='unpopular' ? '#4a80c0' : '';
        ubtn.style.color = tab==='unpopular' ? '#fff' : '';
    }
    const list = document.getElementById('variantslist');
    if(!list) return;
    list.innerHTML = '';
    
    let vars = [];
    if(tab === 'popular') {
        vars = ['Chess960 (Fischer Random)', 'King of the Hill', 'Crazyhouse', 'Atomic', '3-Check'];
    } else {
        vars = ['Maharajah and the Sepoys', '5D Chess with Multiverse Time Travel', 'Fog of War', 'Duck Chess', 'Knightmate'];
    }
    
    vars.forEach(v => {
        const div = document.createElement('div');
        div.style.padding = "10px";
        div.style.background = "#1a1a2a";
        div.style.border = "1px solid #4a80c0";
        div.style.borderRadius = "4px";
        div.innerText = v;
        const btn = document.createElement('button');
        btn.innerText = "Play";
        btn.className = "settingchip";
        btn.style.float = "right";
        btn.onclick = () => window.startPresetVariant(v);
        div.appendChild(btn);
        list.appendChild(div);
    });
}

window.startPresetVariant = function(v) {
    let cv = { noCastling: false, koth: false, firstCheck: false, antichess: false, atomic: false, chess960: false, threeCheck: false };
    if(v === 'King of the Hill') cv.koth = true;
    else if(v === 'Chess960 (Fischer Random)') { cv.chess960 = true; cv.noCastling = true; }
    else if(v === 'Atomic') cv.atomic = true;
    else if(v === '3-Check') cv.threeCheck = true;
    else if(v === 'Crazyhouse') { alert("Crazyhouse is coming soon. Starting standard game."); }
    else { alert("Variant coming soon: " + v); return; }
    
    closeModal('variantsmodal');
    M.currentVariant = cv;
    saveMeta();
    userNewGame();
    if(typeof showAnnouncement === 'function') showAnnouncement('🎮 Custom Variant Started: ' + v);
}
// --- Countdowns ---
window.adminCountdown = function(type) {
    let secs = parseInt(prompt("How many seconds? (e.g. 10)", "10")) || 10;
    if(secs <= 0) return;
    let label = type === 'update' ? "Update starting in" : "Admin Abuse starting in";
    let timer = setInterval(() => {
        if(typeof API !== 'undefined' && API.announce) {
            API.announce((M.account && M.account.username) || 'Admin', `!COUNTDOWN ${label} ${secs}...`);
        }
        secs--;
        if(secs < 0) {
            clearInterval(timer);
            if(typeof API !== 'undefined' && API.announce) {
               if(type === 'update') {
                  API.announce('Admin', '!COUNTDOWN 🚀 UPDATE STARTING NOW! Refreshing clients...');
               } else {
                  API.announce('Admin', '💥 ADMIN ABUSE ENGAGED!');
               }
            }
        }
    }, 1000);
};

const origPoll = window.pollAnnouncements;
window.pollAnnouncements = async function() {
    if(origPoll) await origPoll.apply(this, arguments);
    if(typeof API === 'undefined' || !API.announceSince) return;
    const r = await API.announceSince(_lastAnnounceTs - 1);
    if(r && r.ok && r.announcements) {
        for(const a of r.announcements) {
            if(a.msg && a.msg === '!UPDATE') { if(typeof showAnnouncement === 'function') showAnnouncement('?? ADMIN FORCED UPDATE...'); setTimeout(() => { location.reload(true); }, 2000); _lastAnnounceTs = Math.max(_lastAnnounceTs, a.ts); } if(a.msg && a.msg === '!ABUSE') { if (!window.hasGlobalAbuse) { window.hasGlobalAbuse = true; if(typeof showAnnouncement === 'function') showAnnouncement('? GLOBAL ADMIN ABUSE ENABLED! 2X EVERYTHING! -50% SHOP!'); } _lastAnnounceTs = Math.max(_lastAnnounceTs, a.ts); } if(a.msg && a.msg.startsWith('!COUNTDOWN ')) {
                const text = a.msg.substring(11);
                if(typeof showAnnouncement === 'function') showAnnouncement(`⏳ ${text}`);
                if(text.includes('UPDATE STARTING NOW')) {
                    setTimeout(() => { location.href = location.pathname + "?v=" + Date.now(); }, 2000);
                }
                _lastAnnounceTs = Math.max(_lastAnnounceTs, a.ts);
            }
            if(a.msg && a.msg.startsWith('!FRIEND_REQ ')) {
                const target = a.msg.split(' ')[1];
                if(M.account && target.toLowerCase() === M.account.username.toLowerCase()) {
                    const sender = a.user;
                    if(M.friends && M.friends.find(f => f.name === sender)) continue;
                    if(!window.handledFriendReqs) window.handledFriendReqs = new Set();
                    if(window.handledFriendReqs.has(a.ts)) continue;
                    window.handledFriendReqs.add(a.ts);
                    
                    if(confirm(`👥 ${sender} sent you a friend request! Accept?`)) {
                        M.friends = M.friends || [];
                        M.friends.push({name: sender, elo: 500, online: true});
                        saveMeta();
                        API.announce(M.account.username, `!FRIEND_ACC ${sender}`);
                        if(typeof showAnnouncement==='function') showAnnouncement(`You are now friends with ${sender}!`);
                        if(!document.getElementById('frmodal').classList.contains('hidden') && typeof renderFriendsFromServer==='function') renderFriendsFromServer();
                    } else {
                        if(typeof showAnnouncement==='function') showAnnouncement(`Declined friend request from ${sender}.`);
                    }
                }
                _lastAnnounceTs = Math.max(_lastAnnounceTs, a.ts);
            }
            if(a.msg && a.msg.startsWith('!FRIEND_ACC ')) {
                const target = a.msg.split(' ')[1];
                if(M.account && target.toLowerCase() === M.account.username.toLowerCase()) {
                    const sender = a.user;
                    if(M.friends && M.friends.find(f => f.name === sender)) continue;
                    M.friends = M.friends || [];
                    M.friends.push({name: sender, elo: 500, online: true});
                    saveMeta();
                    if(typeof showAnnouncement==='function') showAnnouncement(`🎉 ${sender} accepted your friend request!`);
                    if(!document.getElementById('frmodal').classList.contains('hidden') && typeof renderFriendsFromServer==='function') renderFriendsFromServer();
                }
                _lastAnnounceTs = Math.max(_lastAnnounceTs, a.ts);
            }
        }
    }
};

// --- Puzzle Logic Redefine ---
window.startRandomPuzzle = function() {
    if(!window.PUZZLES || window.PUZZLES.length === 0) {
        if(typeof showAnnouncement === 'function') showAnnouncement("Puzzles are still loading, please wait...");
        return;
    }
    closeModal('puzzlemodal');
    // Filter puzzles near player's ELO (+/- 200)
    let myElo = (M.elo || 1000);
    let eligible = window.PUZZLES.filter(p => Math.abs((p.elo || 1000) - myElo) < 200);
    if (eligible.length === 0) eligible = window.PUZZLES;
    const puz = eligible[Math.floor(Math.random() * eligible.length)];
    loadPuzzle(puz);
};
window.startDailyPuzzle = function() {
    if(!window.PUZZLES || window.PUZZLES.length === 0) {
        if(typeof showAnnouncement === 'function') showAnnouncement("Puzzles are still loading, please wait...");
        return;
    }
    closeModal('puzzlemodal');
    // Seed using today's date
    const today = new Date().toDateString();
    let hash = 0;
    for(let i=0;i<today.length;i++) hash = Math.imul(31, hash) + today.charCodeAt(i) | 0;
    const idx = Math.abs(hash) % window.PUZZLES.length;
    const puz = window.PUZZLES[idx];
    loadPuzzle(puz);
};

function loadPuzzle(puz) {
    if(!puz) return;
    G.board = JSON.parse(JSON.stringify(puz.board));
    G.turn = puz.turn;
    G.type = 'puzzle';
    G.puzzleSide = puz.turn;
    G.puzzleMoves = puz.moves;
    G.puzzleStep = 0;
    G.puzzleElo = puz.elo;
    G.status = gameStatus(G.board, G.ep, G.cr, G.turn);
    if(typeof showGameView === 'function') showGameView();
    if(typeof showAnnouncement === 'function') showAnnouncement("🧩 Puzzle Mode: Find the best move!");
    render();
}

function reviewGame() {
    if(!G || !G.hist || G.hist.length === 0) { showAnnouncement("No moves to review!"); return; }
    let b = 0, m = 0, i = 0, g = 0, e = 0, br = 0;
    G.hist.forEach(h => {
        const checkQual = (note) => {
            if(!note) return;
            if(note.includes("??")) b++;
            else if(note.includes("?!")) i++;
            else if(note.includes("?")) m++;
            else if(note.includes("!!!")) br++;
            else if(note.includes("!!")) e++;
            else if(note.includes("!")) g++;
        };
        checkQual(h.w); if(h.b) checkQual(h.b);
    });
    let summary = "Game Review Complete!\n";
    if(b > 3) summary += "You played very poorly. Stop hanging pieces.\n";
    else if(b > 0) summary += "A few bad blunders but decent play overall.\n";
    else summary += "Flawless game! No blunders!\n";
    summary += "Brilliant: " + br + "\nExcellent: " + e + "\nGood: " + g + "\nInaccuracies: " + i + "\nMistakes: " + m + "\nBlunders: " + b;
    
    let botAnswers = [
        "I analyzed the game. " + (b>2?"You hung pieces left and right.":"Pretty solid play.") + " " + (br>0?"That brilliant move was engine-level!":""),
        "My silicon brain is impressed. " + (m>2?"But you made some questionable decisions.":"Very few mistakes."),
        "A fascinating game. " + (b===0?"Flawless execution!":"Watch out for those blunders next time.")
    ];
    summary += "\n\nBot says: " + botAnswers[Math.floor(Math.random()*botAnswers.length)];
    
    addGameChatMessage("Review Bot", summary.replace(/\n/g, "<br>"));
    openGameChat();
    showAnnouncement("Game Review sent to Game Chat!");
}
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
        b.insertAdjacentHTML("beforeend", '<svg id="arrow-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:100;"><defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="rgba(255, 170, 0, 0.8)"/></marker></defs></svg>');
      }
      drawArrows();
    }
  };
}
function drawArrows() {
  const svg = document.getElementById("arrow-layer");
  if(!svg) return;
  svg.innerHTML = '<defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="rgba(255, 170, 0, 0.8)"/></marker></defs>';
  _arrows.forEach(a => {
    const sqW = 100 / 8;
    const x1 = a.c1 * sqW + sqW/2, y1 = a.r1 * sqW + sqW/2;
    const x2 = a.c2 * sqW + sqW/2, y2 = a.r2 * sqW + sqW/2;
    svg.innerHTML += `<line x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%" stroke="rgba(255, 170, 0, 0.8)" stroke-width="1%" marker-end="url(#arrowhead)" />`;
  });
}
document.addEventListener("contextmenu", e => {
  if(e.target.closest && e.target.closest("#board")) e.preventDefault();
});
window.startCustomVariant = function() { closeModal('customvariantmodal'); M.currentVariant = { noCastling: document.getElementById('cv_nocastling').checked, koth: document.getElementById('cv_koth').checked, firstCheck: document.getElementById('cv_firstcheck') ? document.getElementById('cv_firstcheck').checked : false, antichess: false }; saveMeta(); userNewGame(); if(typeof showAnnouncement === 'function') showAnnouncement('🎮 Custom Variant Started!'); }

window.playRematch = async function() {
  if (typeof G !== 'undefined' && G && G.opponent && G.opponent.type === 'human') {
    if (typeof showAnnouncement === 'function') showAnnouncement('⚔️ Rematch challenge sent to ' + G.opponent.name);
    await API.challengeSend(M.account.username, G.opponent.name);
  } else {
    userNewGame();
  }
};
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

window.startCustomVariant = function() { closeModal('customvariantmodal'); M.currentVariant = { noCastling: document.getElementById('cv_nocastling').checked, koth: document.getElementById('cv_koth').checked, antichess: false }; saveMeta(); userNewGame(); if(typeof showAnnouncement === 'function') showAnnouncement('?? Custom Variant Started!'); }

window.adminAbuseGlobal = function() { if(typeof API !== 'undefined') API.announce((M.account && M.account.username) || 'Admin', '!ABUSE'); closeModal('ownermodal'); };
window.adminUpdateGame = function() { if(typeof API !== 'undefined') API.announce((M.account && M.account.username) || 'Admin', '!UPDATE'); closeModal('ownermodal'); };
