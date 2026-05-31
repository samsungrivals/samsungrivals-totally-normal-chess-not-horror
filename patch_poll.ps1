$c = [System.IO.File]::ReadAllText("live_app.js", [System.Text.Encoding]::UTF8)
$t = '      const me=M.account&&M.account.username===sender;
      if(!me)showAnnouncement(''📣 ''+sender+'': ''+a.msg);
      _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);'

$r = '      const me=M.account&&M.account.username===sender;
      if(a.msg && a.msg.startsWith("!DELETE_SKIN ")){
        const parts = a.msg.split(" ");
        if(parts.length >= 3 && OWNER_NAMES.includes(sender.toLowerCase())){
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
      if(!me)showAnnouncement(''📣 ''+sender+'': ''+a.msg);
      _lastAnnounceTs=Math.max(_lastAnnounceTs,a.ts);'

$c = $c.Replace($t, $r)
$utf8NoBom = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText("live_app.js", $c, $utf8NoBom)
