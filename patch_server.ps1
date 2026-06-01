$c = [System.IO.File]::ReadAllText("server.js", [System.Text.Encoding]::UTF8)

# Change const OWNER_NAMES to let
$c = $c -replace 'const OWNER_NAMES\s*=\s*\[', 'let OWNER_NAMES=['

# Update reset-all logic
$resetAllLogic = @"
app.post('/api/elo/reset-all', (req, res) => {
  const user = (req.body || {}).user || '';
  if (!isOwner(user)) return bad(res, 403, 'owner only');
  let count = 0;
  for (const key in db.users) {
    if (db.users[key].isAI) continue;
    db.users[key].elo = 500;
    count++;
  }
  saveSoon();
  ok(res, { reset: count });
});
"@
$c = [System.Text.RegularExpressions.Regex]::Replace($c, 'app\.post\(''/api/elo/reset-all'', \(\s*req,\s*res\s*\)\s*=>\s*\{[\s\S]*?ok\(res, \{ reset: count \}\);\s*\}\);', $resetAllLogic)

# Add owner API
$ownerApi = @"
app.post('/api/owners/grant', (req, res) => {
  const {granter, target} = req.body || {};
  if (!isOwner(granter)) return bad(res, 403, 'owner only');
  if (target) {
    const tl = target.toLowerCase().trim();
    if (!OWNER_NAMES.includes(tl)) OWNER_NAMES.push(tl);
  }
  ok(res, { ok: true });
});

app.post('/api/owners/revoke', (req, res) => {
  const {granter, target} = req.body || {};
  if (!isOwner(granter)) return bad(res, 403, 'owner only');
  if (target) {
    const tl = target.toLowerCase().trim();
    OWNER_NAMES = OWNER_NAMES.filter(n => n !== tl);
  }
  ok(res, { ok: true });
});
"@

$c = $c -replace 'app\.post\(''/api/elo/reset-player''', "$ownerApi`napp.post('/api/elo/reset-player'"

$utf8NoBom = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText("server.js", $c, $utf8NoBom)
