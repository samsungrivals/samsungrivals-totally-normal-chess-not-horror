$app = Get-Content app.js -Raw
$app = $app -replace 'const have=new Set\(lb\.map\(e=>e\.name\)\);\r?\n\s*for\(const ai of LB_AI\)\{if\(!have\.has\(ai\.name\)\)\{lb\.push\(\{name:ai\.name,elo:ai\.elo,upgrades:Math\.floor\(ai\.elo/100\)\}\);have\.add\(ai\.name\)\}\}', '// const have=new Set(lb.map(e=>e.name));`n  // for(const ai of LB_AI){if(!have.has(ai.name)){lb.push({name:ai.name,elo:ai.elo,upgrades:Math.floor(ai.elo/100)});have.add(ai.name)}}'
Set-Content app.js $app -NoNewline

$svr = Get-Content server.js -Raw
$svr = $svr -replace 'app\.get\(''/api/leaderboard'', \(req, res\) => \{\r?\n\s*const realUsers = Object\.values\(db\.users\)\.filter\(u => !u\.isAI\);\r?\n\s*const list = Object\.values\(db\.users\)\r?\n\s*\.map\(u => \(\{ name: u\.username, elo: u\.elo, upgrades: u\.upgrades\|\|0, isAI: u\.isAI \}\)\)\r?\n\s*ok\(res, \{ lb: list, totalUsers: realUsers\.length \}\);\r?\n\}\);', "app.get('/api/leaderboard', (req, res) => {`n  const list = Object.values(db.users)`n    .filter(u => !u.isAI)`n    .map(u => ({ name: u.username, elo: u.elo, upgrades: u.upgrades||0, isAI: false }))`n  ok(res, { lb: list, totalUsers: list.length });`n});"
Set-Content server.js $svr -NoNewline
