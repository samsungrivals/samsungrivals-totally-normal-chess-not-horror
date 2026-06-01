
// --- 10 Minute Clocks ---
let clockW=600000,clockB=600000,lastTick=0,clockInt=null;
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
