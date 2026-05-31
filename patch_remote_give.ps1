$c = [System.IO.File]::ReadAllText("live_app.js", [System.Text.Encoding]::UTF8)

$replacement = 'function ownerRemoteDeleteSkin(){
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
}'

$c = [System.Text.RegularExpressions.Regex]::Replace($c, 'function ownerRemoteDeleteSkin\(\)\{[\s\S]*?\}', $replacement)

$utf8NoBom = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText("live_app.js", $c, $utf8NoBom)
