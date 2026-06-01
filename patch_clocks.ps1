$files = @("app.js", "live_app.js")
foreach ($f in $files) {
    $c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

    # Patch maybeApplyElo to handle timeout
    $c = $c -replace 'G\.status!==''checkmate''&&G\.status!==''stalemate''&&G\.status!==''draw''', 'G.status!==''checkmate''&&G.status!==''stalemate''&&G.status!==''draw''&&G.status!==''timeout'''
    $c = $c -replace 'if\(G\.status!==''checkmate''\)result=0\.5;', 'if(G.status===''stalemate''||G.status===''draw'')result=0.5; else if(G.status===''timeout''){ const winner=G.timeoutLoser===''white''?''black'':''white''; result=winner===(G.opponent.mySide||(G.opponent.side===''white''?''black'':''white''))?1:0; } else '

    # Also for AI maybeApplyElo (which doesn't have 'draw')
    $c = $c -replace 'if\(G\.status!==''checkmate''&&G\.status!==''stalemate''\)return;', 'if(G.status!==''checkmate''&&G.status!==''stalemate''&&G.status!==''draw''&&G.status!==''timeout'')return;'
    $c = $c -replace 'if\(G\.status===''stalemate''\)result=0\.5;\s*else\{', 'if(G.status===''stalemate''||G.status===''draw'')result=0.5; else if(G.status===''timeout''){ const winner=G.timeoutLoser===''white''?''black'':''white''; const playerSide=G.opponent.side===''white''?''black'':''white''; result=winner===playerSide?1:0; } else {'

    # Patch render / newGame to start clock
    $c = $c -replace 'function newGame\(isPvp\)\{', "function newGame(isPvp){ if(typeof startClocks==='function')startClocks();"

    # Patch doMove to reset lastTick
    $c = $c -replace 's\.hist\.push\(\{w:note,b:''''\}\)', "s.hist.push({w:note,b:''}); lastTick=Date.now();"
    $c = $c -replace 's\.hist\[s\.hist\.length-1\]\.b=note;', "s.hist[s.hist.length-1].b=note; lastTick=Date.now();"
    
    # Patch showWinModal to use timeout string
    $c = $c -replace 'const reasonNice=\{', "const reasonNice={'Timeout':'Timeout - player ran out of time',"

    # Append clock functions
    $clockCode = @"

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
"@
    
    $c = $c + $clockCode

    $utf8NoBom = New-Object System.Text.UTF8Encoding $False
    [System.IO.File]::WriteAllText($f, $c, $utf8NoBom)
}
