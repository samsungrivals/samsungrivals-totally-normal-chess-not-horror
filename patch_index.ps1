$content = [System.IO.File]::ReadAllText("$pwd\index.html")

$t1 = '<b>📈 +100,000,000 ELO</b> - owner only</div>
    <div class="adminitem owner-only" onclick="adminResetPlayerElo()"'
$r1 = '<b>📈 +100,000,000 ELO</b> - owner only</div>
    <div class="adminitem owner-only" onclick="ownerCustomSubtractElo()" style="background:linear-gradient(135deg,#3a2a00,#1a1a1a);border-color:#ffd700"><b>&#x1F4C9; - Custom ELO</b> - type how much to subtract</div>
    <div class="adminitem owner-only" onclick="adminResetPlayerElo()"'
$content = $content.Replace($t1, $r1)

$t1alt = '<b>📈 +100,000,000 ELO</b> - owner only</div>' + "`r`n" + '    <div class="adminitem owner-only" onclick="adminResetPlayerElo()"'
$r1alt = '<b>📈 +100,000,000 ELO</b> - owner only</div>' + "`r`n" + '    <div class="adminitem owner-only" onclick="ownerCustomSubtractElo()" style="background:linear-gradient(135deg,#3a2a00,#1a1a1a);border-color:#ffd700"><b>&#x1F4C9; - Custom ELO</b> - type how much to subtract</div>' + "`r`n" + '    <div class="adminitem owner-only" onclick="adminResetPlayerElo()"'
$content = $content.Replace($t1alt, $r1alt)

$t1alt2 = '<b>📈 +100,000,000 ELO</b> - owner only</div>' + "`n" + '    <div class="adminitem owner-only" onclick="adminResetPlayerElo()"'
$r1alt2 = '<b>📈 +100,000,000 ELO</b> - owner only</div>' + "`n" + '    <div class="adminitem owner-only" onclick="ownerCustomSubtractElo()" style="background:linear-gradient(135deg,#3a2a00,#1a1a1a);border-color:#ffd700"><b>&#x1F4C9; - Custom ELO</b> - type how much to subtract</div>' + "`n" + '    <div class="adminitem owner-only" onclick="adminResetPlayerElo()"'
$content = $content.Replace($t1alt2, $r1alt2)

$t2 = '<input type="range" id="luckslider" min="1" max="1" value="1" step="1" style="width:100%;margin-top:8px" oninput="if(typeof updateActiveLuck===''function'')updateActiveLuck(this.value)">'
$r2 = '<button onclick="if(typeof promptEquipLuck===''function'')promptEquipLuck()" style="width:100%; padding:8px; margin-top:8px; background:#2a4a2a; border:1px solid #4a8a4a; color:#fff; border-radius:4px; cursor:pointer; font-weight:bold">Equip Custom Luck</button>'
$content = $content.Replace($t2, $r2)

$utf8NoBom = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText("$pwd\index.html", $content, $utf8NoBom)
