$files = @("app.js", "live_app.js")
foreach ($f in $files) {
    $c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

    # Change const OWNER_NAMES to let
    $c = $c.Replace("const OWNER_NAMES=['samsungrivals_owner_','teclast','samsungrivals'];", "let OWNER_NAMES=['samsungrivals_owner_','teclast','samsungrivals'];")

    # Fix sender issue in !GIVE_SKIN and !DELETE_SKIN
    $c = $c.Replace("if(parts.length >= 3 && OWNER_NAMES.includes(sender.toLowerCase())){", "if(parts.length >= 3){")

    # Fix adminResetPlayerElo local update
    $c = $c.Replace("showAnnouncement(``Reset `${r.target} to ELO 500``);`n    if(typeof syncServerLeaderboard==='function')syncServerLeaderboard();", "showAnnouncement(``Reset `${r.target} to ELO 500``);`n    if(M.account && M.account.username.toLowerCase()===r.target.toLowerCase()){ M.elo=500; saveMeta(); updateLuckChip(); }`n    if(typeof syncServerLeaderboard==='function')syncServerLeaderboard();")

    # Add adminGrantOwner and adminRemoveOwner functions before promptEquipLuck
    $grantOwnerCode = @"
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
function promptEquipLuck
"@
    $c = $c.Replace("function promptEquipLuck", $grantOwnerCode)

    # Add API endpoints for owner
    $apiCode = @"
    revokeAdmin:(granter,target)=>call('/api/admins/revoke',{method:'POST',headers:j,body:JSON.stringify({granter,target})}),
    grantOwner:(granter,target)=>call('/api/owners/grant',{method:'POST',headers:j,body:JSON.stringify({granter,target})}),
    revokeOwner:(granter,target)=>call('/api/owners/revoke',{method:'POST',headers:j,body:JSON.stringify({granter,target})}),
"@
    $c = $c.Replace("    revokeAdmin:(granter,target)=>call('/api/admins/revoke',{method:'POST',headers:j,body:JSON.stringify({granter,target})}),", $apiCode)

    $utf8NoBom = New-Object System.Text.UTF8Encoding $False
    [System.IO.File]::WriteAllText($f, $c, $utf8NoBom)
}
