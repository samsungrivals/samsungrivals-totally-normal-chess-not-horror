const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const s1 = 'if(a.msg && a.msg.startsWith("!CHAT_DELETE ")){';
const s2 = 'if(a.msg && a.msg.startsWith("!CHAT ")){';

const p1 = code.indexOf(s1);
const p2 = code.indexOf(s2);

if(p1 !== -1 && p2 !== -1) {
    const newCode = code.substring(0, p1) + 
`if(a.msg && a.msg.startsWith("!CHAT_DELETE ")){
            const tsToDel = a.msg.substring(13);
            const el = document.getElementById('chatmsg_' + tsToDel);
            if(el) {
                const originalSender = el.querySelector('b') ? el.querySelector('b').textContent : "";
                if(a.user === originalSender || (typeof OWNER_NAMES !== 'undefined' && OWNER_NAMES.includes((a.user||'').toLowerCase()))) {
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
                if(a.user === originalSender || (typeof OWNER_NAMES !== 'undefined' && OWNER_NAMES.includes((a.user||'').toLowerCase()))) {
                    const el = document.getElementById('chattext_' + tsToEdit);
                    if(el) el.innerText = newTxt.replace(/</g,'&lt;') + ' (edited)';
                }
            }
            _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
            continue;
          }
          ` + code.substring(p2);
          
    fs.writeFileSync('app.js', newCode);
    console.log('SUCCESS');
} else {
    console.log('FAIL p1:', p1, 'p2:', p2);
}
