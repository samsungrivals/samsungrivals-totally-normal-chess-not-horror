 = Get-Content -Raw "app.js"

# 1. Move formatNumber to top
 =  -replace "function formatNumber\(n\)\s*\{\s*return\s*\(Number\(n\)\|\|0\)\.toLocaleString\(\);\s*\}", ""
 = "function formatNumber(n) { return (Number(n)||0).toLocaleString(); }
" + 

# 2. Fix Leaderboard rendering
 = "async function renderLeaderboard(){
  const lbAll=loadLb();
  const tab=window._lbTab||'elo';
  const el=document.getElementById('lblist');
  el.innerHTML='<div style="color:#888;text-align:center;padding:20px">Loading...</div>';

  let serverLb = [];
  try {
     const res = await fetch('/api/leaderboard');
     if(res.ok) {
         const data = await res.json();
         if(data.lb) serverLb = data.lb;
     }
  } catch(e) {}

  // Merge server data and local data
  let merged = [...serverLb];
  
  // Add LB_AI if missing
  const have=new Set(merged.map(e=>e.name));
  for(const ai of LB_AI){if(!have.has(ai.name)){merged.push({name:ai.name,elo:ai.elo,upgrades:Math.floor(ai.elo/100)});have.add(ai.name)}}
  
  // Add self
  const myName=(M.account&&M.account.username)||'You';
  let me=merged.find(e=>e.name===myName);
  if(me) { 
      me.elo = Math.max(me.elo||500, M.elo||500); 
      me.upgrades = Math.max(me.upgrades||0, M.totalUpgrades||0);
      me.self = true;
  } else { 
      merged.push({name:myName,elo:M.elo||500,upgrades:M.totalUpgrades||0,money:M.money||0,rolls:M.rolls||0,self:true}); 
  }

  const sorted=merged.sort((a,b)=>{
    if(tab==='money') return (Number(b.money)||0)-(Number(a.money)||0);
    if(tab==='rolls') return (Number(b.rolls)||0)-(Number(a.rolls)||0);
    if(tab==='upg') return (Number(b.upgrades)||0)-(Number(a.upgrades)||0);
    return (Number(b.elo)||0)-(Number(a.elo)||0);
  });
  const top=sorted.slice(0,10);
  el.innerHTML='';
"

 =  -replace "(?s)function renderLeaderboard\(\)\{.*?const top=sorted\.slice\(0,10\);\s*const el=document\.getElementById\('lblist'\);el\.innerHTML='';", 

# 3. Process Checkout updates
 = "} else if(pendingCheckout && pendingCheckout.type === 'nothing') {
         M.nothingGamepass=(Number(M.nothingGamepass)||0)+1;
         saveMeta();refreshUI();renderShop();
         showAnnouncement('🫥 Payment Complete! You bought... nothing. Congrats?');
      }
      pendingCheckout = null;"
      
 = "} else if(pendingCheckout && pendingCheckout.type === 'nothing') {
         M.nothingGamepass=(Number(M.nothingGamepass)||0)+1;
         saveMeta();refreshUI();renderShop();
         showAnnouncement('🫥 Payment Complete! You bought... nothing. Congrats?');
      } else if (pendingCheckout && pendingCheckout.type === 'moneypack') {
         M.money += pendingCheckout.pounds;
         saveMeta();refreshUI();renderShop();
         showAnnouncement('+'+fmtMoney(pendingCheckout.pounds));
      } else if (pendingCheckout && pendingCheckout.type === 'gamepass') {
         M.gamepasses=M.gamepasses||{};
         M.gamepasses[pendingCheckout.id]=true;
         saveMeta();refreshUI();renderShop();updateLuckChip();
         showAnnouncement('🎉 '+pendingCheckout.name+' purchased!');
      } else if (pendingCheckout && pendingCheckout.type === 'serverluck') {
         M.serverLuckMult=pendingCheckout.mult;
         M.serverLuckEndTime=Date.now()+45*60000;
         saveMeta();refreshUI();renderShop();updateLuckChip();
         showAnnouncement('🍀 Server luck '+pendingCheckout.mult+'x for 45m');
      } else if (pendingCheckout && pendingCheckout.type === 'premiumskin') {
         if (pendingCheckout.skin === 'royal') M.inventory.royal = (M.inventory.royal||0)+1;
         if (pendingCheckout.skin === 'svp') M.inventory.svp = (M.inventory.svp||0)+1;
         saveMeta();refreshUI();renderShop();
         showAnnouncement('✨ Premium Skin Purchased!');
      }
      pendingCheckout = null;"

 = .Replace(, )

# 4. Money Packs click hook
 =  -replace "b\.onclick=\(\)=>\{const c=free\?0:p\.price;if\(M\.money<c\)return;M\.money-=c;M\.money\+=p\.pounds;saveMeta\(\);refreshUI\(\);renderShop\(\);showAnnouncement\('\+'\+fmtMoney\(p\.pounds\)\)\};", "b.onclick=()=>{if(free){M.money+=p.pounds;saveMeta();refreshUI();renderShop();showAnnouncement('+'+fmtMoney(p.pounds));return;} pendingCheckout = { type: 'moneypack', pounds: p.pounds, price: p.price }; document.getElementById('checkout-item-name').textContent = p.name; document.getElementById('checkout-item-price').textContent = "Total: £" + (p.price/100).toFixed(2); const btn = document.getElementById('checkout-pay-btn'); btn.textContent = "Pay Now"; btn.style.background = "#28a745"; btn.disabled = false; closeModal('shopmodal'); openModal('checkoutmodal'); };"

# 5. Gamepasses click hook
 =  -replace "b\.onclick=\(\)=>\{const c=free\?0:g\.price;if\(M\.money<c\)return;M\.money-=c;M\.gamepasses=M\.gamepasses\|\|\{\};M\.gamepasses\[g\.id\]=true;saveMeta\(\);refreshUI\(\);renderShop\(\);updateLuckChip\(\);showAnnouncement\('🎉 '\+g\.name\+' purchased!'\)\};", "b.onclick=()=>{if(free){M.gamepasses=M.gamepasses||{};M.gamepasses[g.id]=true;saveMeta();refreshUI();renderShop();updateLuckChip();showAnnouncement('🎉 '+g.name+' purchased!');return;} pendingCheckout = { type: 'gamepass', id: g.id, name: g.name, price: g.price }; document.getElementById('checkout-item-name').textContent = g.name; document.getElementById('checkout-item-price').textContent = "Total: £" + (g.price/100).toFixed(2); const btn = document.getElementById('checkout-pay-btn'); btn.textContent = "Pay Now"; btn.style.background = "#28a745"; btn.disabled = false; closeModal('shopmodal'); openModal('checkoutmodal'); };"

# 6. Server Luck click hook
 =  -replace "b\.onclick=\(\)=>\{const c=free\?0:sl\.price;if\(M\.money<c\)return;M\.money-=c;M\.serverLuckMult=sl\.mult;M\.serverLuckEndTime=Date\.now\(\)\+45\*60000;saveMeta\(\);refreshUI\(\);renderShop\(\);updateLuckChip\(\);showAnnouncement\('🍀 Server luck '\+sl\.mult\+'x for 45m'\)\};", "b.onclick=()=>{if(free){M.serverLuckMult=sl.mult;M.serverLuckEndTime=Date.now()+45*60000;saveMeta();refreshUI();renderShop();updateLuckChip();showAnnouncement('🍀 Server luck '+sl.mult+'x for 45m');return;} pendingCheckout = { type: 'serverluck', mult: sl.mult, price: sl.price }; document.getElementById('checkout-item-name').textContent = sl.mult+'x Server Luck'; document.getElementById('checkout-item-price').textContent = "Total: £" + (sl.price/100).toFixed(2); const btn = document.getElementById('checkout-pay-btn'); btn.textContent = "Pay Now"; btn.style.background = "#28a745"; btn.disabled = false; closeModal('shopmodal'); openModal('checkoutmodal'); };"

# 7. Premium Skins click hook (Royal)
 =  -replace "b\.onclick=\(\)=>\{
      const c=free\?0:ROYAL_PRICE;
      if\(M\.money<c\)return;
      M\.money-=c;
      M\.inventory\.royal=\(M\.inventory\.royal\|\|0\)\+1;
      saveMeta\(\);refreshUI\(\);renderShop\(\);
      showAnnouncement\('✨ ROYAL Skin Purchased!'\);
    \};", "b.onclick=()=>{if(free){M.inventory.royal=(M.inventory.royal||0)+1;saveMeta();refreshUI();renderShop();showAnnouncement('✨ ROYAL Skin Purchased!');return;} pendingCheckout = { type: 'premiumskin', skin: 'royal', price: ROYAL_PRICE }; document.getElementById('checkout-item-name').textContent = 'ROYAL Skin'; document.getElementById('checkout-item-price').textContent = "Total: £" + (ROYAL_PRICE/100).toFixed(2); const btn = document.getElementById('checkout-pay-btn'); btn.textContent = "Pay Now"; btn.style.background = "#28a745"; btn.disabled = false; closeModal('shopmodal'); openModal('checkoutmodal'); };"

# 8. Premium Skins click hook (SVP)
 =  -replace "svpBtn\.onclick=\(\)=>\{
      const c=free\?0:SVP_PRICE;
      if\(M\.money<c\)return;
      M\.money-=c;
      M\.inventory\.svp=\(M\.inventory\.svp\|\|0\)\+1;
      saveMeta\(\);refreshUI\(\);renderShop\(\);
      showAnnouncement\('✨ SVP Skin Purchased!'\);
    \};", "svpBtn.onclick=()=>{if(free){M.inventory.svp=(M.inventory.svp||0)+1;saveMeta();refreshUI();renderShop();showAnnouncement('✨ SVP Skin Purchased!');return;} pendingCheckout = { type: 'premiumskin', skin: 'svp', price: SVP_PRICE }; document.getElementById('checkout-item-name').textContent = 'SVP Skin'; document.getElementById('checkout-item-price').textContent = "Total: £" + (SVP_PRICE/100).toFixed(2); const btn = document.getElementById('checkout-pay-btn'); btn.textContent = "Pay Now"; btn.style.background = "#28a745"; btn.disabled = false; closeModal('shopmodal'); openModal('checkoutmodal'); };"

Set-Content -Path "app.js" -Value 
