$content = [System.IO.File]::ReadAllText("$pwd\index.html", [System.Text.Encoding]::UTF8)
$t1 = '<b>📈 +100,000,000 ELO</b> - owner only</div>
    <div class="adminitem owner-only" onclick="adminResetPlayerElo()"'
$r1 = '<b>📈 +100,000,000 ELO</b> - owner only</div>
    <div class="adminitem owner-only" onclick="ownerCustomSubtractElo()" style="background:linear-gradient(135deg,#3a2a00,#1a1a1a);border-color:#ffd700"><b>📉 - Custom ELO</b> - type how much to subtract</div>
    <div class="adminitem owner-only" onclick="adminResetPlayerElo()"'
$content = $content.Replace($t1, $r1)

$t2 = '<input type="range" id="luckslider" min="1" max="1" value="1" step="1" style="width:100%;margin-top:8px" oninput="if(typeof updateActiveLuck===''function'')updateActiveLuck(this.value)">'
$r2 = '<button onclick="if(typeof promptEquipLuck===''function'')promptEquipLuck()" style="width:100%; padding:8px; margin-top:8px; background:#2a4a2a; border:1px solid #4a8a4a; color:#fff; border-radius:4px; cursor:pointer; font-weight:bold">Equip Custom Luck</button>'
$content = $content.Replace($t2, $r2)

$utf8NoBom = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText("$pwd\index.html", $content, $utf8NoBom)


$js = [System.IO.File]::ReadAllText("$pwd\live_app.js", [System.Text.Encoding]::UTF8)

$t3 = 'function ownerAddElo10M(){
  const u=(M.account&&M.account.username||'''').toLowerCase();
  if(!OWNER_NAMES.includes(u)){
    // Do NOT reveal which usernames are allowed
    showAnnouncement(''🚫 Access denied'');
    return;
  }
  adminAddElo(10000000);
}'

$r3 = $t3 + '

function ownerCustomSubtractElo(){
  const u=(M.account&&M.account.username||'''').toLowerCase();
  if(!OWNER_NAMES.includes(u)){
    showAnnouncement(''🚫 Access denied'');
    return;
  }
  const amountStr = prompt(''Enter amount of ELO to SUBTRACT from your account:'');
  if(!amountStr)return;
  const amt = Number(amountStr);
  if(isNaN(amt) || amt <= 0){
    showAnnouncement(''Invalid amount'');
    return;
  }
  M.elo = Math.max(500, (Number(M.elo)||500) - amt);
  saveMeta();
  refreshUI();
  updateLuckChip();
  if(M.account) API.elo(M.account.username, M.elo).catch(()=>{});
  showAnnouncement(''📉 Subtracted '' + amt + '' ELO'');
  if(typeof syncServerLeaderboard===''function'')syncServerLeaderboard();
}'

$js = $js.Replace($t3, $r3)

$t4 = 'function updateActiveLuck(val) {
  const m = getMaxLuck();
  let v = Number(val);
  if (v >= m) {
    delete M.activeLuckLimit;
    document.getElementById(''activeluckdisp'').textContent = ''MAX ('' + m + ''x)'';
  } else {
    M.activeLuckLimit = v;
    document.getElementById(''activeluckdisp'').textContent = v + ''x'';
  }
  saveMeta();
  updateLuckChip();
}'

$r4 = $t4 + '

function promptEquipLuck(){
  const m = getMaxLuck();
  const val = prompt(''Enter the amount of luck you want to equip (Max: '' + m + ''). Type MAX to reset:'');
  if(!val) return;
  if(val.trim().toUpperCase() === ''MAX''){
    updateActiveLuck(m);
    if(typeof showAnnouncement===''function'')showAnnouncement(''Luck reset to MAX'');
    return;
  }
  const num = Number(val);
  if(isNaN(num) || num <= 0){
    if(typeof showAnnouncement===''function'')showAnnouncement(''Invalid luck amount'');
    return;
  }
  const finalLuck = Math.min(num, m);
  updateActiveLuck(finalLuck);
  if(typeof showAnnouncement===''function'')showAnnouncement(''Equipped '' + finalLuck + ''x luck'');
}'

$js = $js.Replace($t4, $r4)

$t5 = 'const _origOpenModalSettings = openModal;
openModal = function(id) {
  _origOpenModalSettings(id);
  if (id === ''settingsmodal'') {
    const sl = document.getElementById(''luckslider'');
    if (sl) {
      const m = getMaxLuck();
      sl.max = m;
      sl.value = M.activeLuckLimit && M.activeLuckLimit < m ? M.activeLuckLimit : m;
      document.getElementById(''activeluckdisp'').textContent = sl.value == m ? ''MAX (''+m+''x)'' : sl.value+''x'';
    }
  }
};'

$r5 = 'const _origOpenModalSettings = openModal;
openModal = function(id) {
  _origOpenModalSettings(id);
  if (id === ''settingsmodal'') {
    const m = getMaxLuck();
    const active = M.activeLuckLimit && M.activeLuckLimit < m ? M.activeLuckLimit : m;
    const disp = document.getElementById(''activeluckdisp'');
    if(disp) disp.textContent = active === m ? ''MAX (''+m+''x)'' : active+''x'';
  }
};'

$js = $js.Replace($t5, $r5)

[System.IO.File]::WriteAllText("$pwd\live_app.js", $js, $utf8NoBom)
