$c = [System.IO.File]::ReadAllText("live_app.js", [System.Text.Encoding]::UTF8)

$replacement = 'if(a.msg && a.msg.startsWith("!DELETE_SKIN ")){
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
        if(a.msg && a.msg.startsWith("!GIVE_SKIN ")){
          const parts = a.msg.split(" ");
          if(parts.length >= 3 && OWNER_NAMES.includes(sender.toLowerCase())){
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
        }'

$c = [System.Text.RegularExpressions.Regex]::Replace($c, 'if\(a\.msg && a\.msg\.startsWith\("!DELETE_SKIN "\)\)\{[\s\S]*?continue;\r?\n\s*\}', $replacement)

$utf8NoBom = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText("live_app.js", $c, $utf8NoBom)
