$app = Get-Content app.js -Raw

# 1. Add switchChatTab function and remove old sendGameChat
# Wait, I can just replace `function sendGameChat() {` to `API.announce(M.account.username, "!GAME_CHAT " + G.opponent.matchId + " " + msg).catch(()=>{}); }` with our new tab logic.

$oldSendGameChatRegex = '(?s)function sendGameChat\(\) \{.*?\n\}'
$newChatLogic = @"
window._currentChatTab = 'global';
function switchChatTab(tab) {
  window._currentChatTab = tab;
  document.getElementById('tabGlobal').style.background = tab === 'global' ? '#444' : '#333';
  document.getElementById('tabGlobal').style.color = tab === 'global' ? '#fff' : '#888';
  document.getElementById('tabGame').style.background = tab === 'game' ? '#444' : '#333';
  document.getElementById('tabGame').style.color = tab === 'game' ? '#fff' : '#888';
  document.getElementById('globalchatmessages').style.display = tab === 'global' ? 'block' : 'none';
  document.getElementById('gamechatmessages').style.display = tab === 'game' ? 'block' : 'none';
  if(tab === 'game') {
     const gb = document.getElementById('gamechatmessages');
     gb.scrollTop = gb.scrollHeight;
  } else {
     const gb = document.getElementById('globalchatmessages');
     gb.scrollTop = gb.scrollHeight;
  }
}
function sendChatInput() {
  if (window._currentChatTab === 'global') {
    sendGlobalChat();
  } else {
    // Game Chat
    if(!M.account) return;
    if(typeof G==='undefined' || !G || !G.opponent) return;
    const inp = document.getElementById('globalchatinput');
    const msg = inp.value.trim();
    if(!msg) return;
    inp.value = '';
    
    addGameChatMessage(M.account.username, msg);
    
    if (G.opponent.isAI || G.opponent.type === 'bot' || !G.opponent.matchId) {
        const botName = G.opponent.name || 'Bot';
        setTimeout(() => {
            const replies = ["Good move!", "I didn't see that coming.", "Are you sure about that?", "Interesting...", "Hmm.", "I am calculating 14 moves deep.", "Prepare to lose.", "Checkmate is inevitable.", "Beep boop."];
            const rep = replies[Math.floor(Math.random() * replies.length)];
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
"@

# Replace the sendGameChat function with the new logic
$app = $app -replace $oldSendGameChatRegex, $newChatLogic

# 2. Inject switchChatTab('game') into newGame()
$app = $app -replace 'function newGame\(\)\{', "function newGame(){ switchChatTab('game'); const gc = document.getElementById('globalchat'); if(gc && gc.style.display === 'none'){gc.style.display='flex'; const ob=document.getElementById('openchatbtn');if(ob)ob.style.display='none';}"

# 3. Inject switchChatTab('global') into closeMatch() or when going back to menu
$app = $app -replace 'function showScreen\(id\)\{', "function showScreen(id){ if(id!=='match'){ switchChatTab('global'); } "

Set-Content app.js $app -NoNewline
