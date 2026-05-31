
function ownerCustomSubtractElo(){
  const u=(M.account&&M.account.username||'').toLowerCase();
  if(!OWNER_NAMES.includes(u)){
    showAnnouncement('\u26D4 Access denied');
    return;
  }
  const amountStr = prompt('Enter amount of ELO to SUBTRACT from your account:');
  if(!amountStr)return;
  const amt = Number(amountStr);
  if(isNaN(amt) || amt <= 0){
    showAnnouncement('Invalid amount');
    return;
  }
  M.elo = Math.max(500, (Number(M.elo)||500) - amt);
  saveMeta();
  refreshUI();
  updateLuckChip();
  if(M.account) API.elo(M.account.username, M.elo).catch(()=>{});
  showAnnouncement('\u{1F4C9} Subtracted ' + amt + ' ELO');
  if(typeof syncServerLeaderboard==='function')syncServerLeaderboard();
}

function promptEquipLuck(){
  const m = getMaxLuck();
  const val = prompt('Enter the amount of luck you want to equip (Max: ' + m + '). Type MAX to reset:');
  if(!val) return;
  if(val.trim().toUpperCase() === 'MAX'){
    updateActiveLuck(m);
    if(typeof showAnnouncement==='function')showAnnouncement('Luck reset to MAX');
    return;
  }
  const num = Number(val);
  if(isNaN(num) || num <= 0){
    if(typeof showAnnouncement==='function')showAnnouncement('Invalid luck amount');
    return;
  }
  const finalLuck = Math.min(num, m);
  updateActiveLuck(finalLuck);
  if(typeof showAnnouncement==='function')showAnnouncement('Equipped ' + finalLuck + 'x luck');
}

const _origOpenModalSettings2 = openModal;
openModal = function(id) {
  _origOpenModalSettings2(id);
  if (id === 'settingsmodal') {
    const m = getMaxLuck();
    const active = M.activeLuckLimit && M.activeLuckLimit < m ? M.activeLuckLimit : m;
    const disp = document.getElementById('activeluckdisp');
    if(disp) disp.textContent = active === m ? 'MAX ('+m+'x)' : active+'x';
  }
};
