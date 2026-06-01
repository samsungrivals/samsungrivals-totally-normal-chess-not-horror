$lines = Get-Content app.js

$replacement = @"
          if(a.msg && a.msg.startsWith(`"!CHAT_DELETE `")){
            const tsToDel = a.msg.substring(13);
            const el = document.getElementById('chatmsg_' + tsToDel);
            if(el) {
                const originalSender = el.querySelector('b') ? el.querySelector('b').textContent : `"`";
                if(a.user === originalSender || (typeof OWNER_NAMES !== 'undefined' && OWNER_NAMES.includes((a.user||`"`").toLowerCase()))) {
                    el.remove();
                }
            }
            _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
            continue;
          }
          if(a.msg && a.msg.startsWith(`"!CHAT_EDIT `")){
            const parts = a.msg.substring(11).split(`" `");
            const tsToEdit = parts[0];
            const newTxt = parts.slice(1).join(`" `");
            const parentEl = document.getElementById('chatmsg_' + tsToEdit);
            if(parentEl) {
                const originalSender = parentEl.querySelector('b') ? parentEl.querySelector('b').textContent : `"`";
                if(a.user === originalSender || (typeof OWNER_NAMES !== 'undefined' && OWNER_NAMES.includes((a.user||`"`").toLowerCase()))) {
                    const el = document.getElementById('chattext_' + tsToEdit);
                    if(el) el.innerText = newTxt.replace(/</g,'&lt;') + ' (edited)';
                }
            }
            _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);
            continue;
          }
"@

$before = $lines[0..4519]
$after = $lines[4536..($lines.Length - 1)]

$newLines = $before + $replacement + $after

Set-Content app.js $newLines
