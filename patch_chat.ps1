$code = @"
// ============================================================
// CHAT & ANNOUNCEMENTS
// ============================================================
let _lastAnnounceTs=Date.now();
let lastGlobalChat=0;

function addGlobalChatMessage(sender, msg, ts) {
    const box = document.getElementById('globalchatmessages');
    if(!box) return;
    const d = document.createElement('div');
    d.style.marginBottom = '4px';
    const time = new Date(ts||Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    d.innerHTML = `<span style="color:#888;font-size:10px">[`+time+`]</span> <b>`+sender+`</b>: `+msg.replace(/</g,'&lt;');
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
}

function addGameChatMessage(sender, msg) {
    const box = document.getElementById('gamechatmessages');
    if(!box) return;
    const d = document.createElement('div');
    d.style.marginBottom = '4px';
    d.innerHTML = `<b>`+sender+`</b>: `+msg.replace(/</g,'&lt;');
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
}

async function pollAnnouncements(){
  if(typeof API === 'undefined' || !API.announceSince) return;
  try {
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
                if(M.account && M.account.username.toLowerCase() === target.toLowerCase()){
                  M.inventory = M.inventory || {};
                  M.inventory[skin] = (M.inventory[skin]||0) + 1;
                  saveMeta(); if(typeof refreshUI==='function') refreshUI();
                  if(!document.getElementById("itemmodal").classList.contains("hidden") && typeof renderItems==='function') renderItems();
                  if(typeof showAnnouncement==='function') showAnnouncement("\uD83C\uDF81 An admin gave you the " + skin + " skin!");
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

function sendGlobalChat() {
    if(!M.account) { showAnnouncement('Sign in to chat'); return; }
    const now = Date.now();
    if(now - lastGlobalChat < 5000) {
        showAnnouncement('Wait 5 seconds before chatting again!');
        return;
    }
    const inp = document.getElementById('globalchatinput');
    const msg = inp.value.trim();
    if(!msg) return;
    inp.value = '';
    lastGlobalChat = now;
    API.announce(M.account.username, "!CHAT " + msg).catch(()=>{});
}

function sendGameChat() {
    if(!M.account) return;
    if(typeof G==='undefined' || !G || !G.opponent || !G.opponent.matchId) return;
    const inp = document.getElementById('gamechatinput');
    const msg = inp.value.trim();
    if(!msg) return;
    inp.value = '';
    API.announce(M.account.username, "!GAME_CHAT " + G.opponent.matchId + " " + msg).catch(()=>{});
}
"@

$app = Get-Content app.js -Raw
$app = $app + "`n" + $code
Set-Content app.js $app -NoNewline
