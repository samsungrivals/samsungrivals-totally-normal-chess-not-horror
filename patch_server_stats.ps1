$utf8 = [System.Text.Encoding]::UTF8
$server = [System.IO.File]::ReadAllText("server.js", $utf8)

$oldStats = "ok(res, {
      users: Object.values(db.users).filter(u => !u.isAI && u.username && !u.isBot).length,
      online: Object.values(db.users).filter(u => !u.isAI && u.lastSeen && (now - u.lastSeen < 15000)).length,
      ai: Object.values(db.users).filter(u => u.isAI).length,
      queue: db.queue.length,
      announcements: db.announce.length
    });"

$newStats = "ok(res, {
      users: Object.values(db.users).filter(u => !u.isAI && u.username && !u.isBot).length,
      online: Object.values(db.users).filter(u => !u.isAI && u.lastSeen && (now - u.lastSeen < 15000)).length,
      ai: Object.values(db.users).filter(u => u.isAI).length,
      queue: db.queue.length,
      announcements: db.announce.length,
      owners: OWNER_NAMES
    });"

if ($server.Contains($oldStats)) {
    $server = $server.Replace($oldStats, $newStats)
    [System.IO.File]::WriteAllText("server.js", $server, $utf8)
    Write-Host "Patched server.js stats"
} else {
    Write-Host "Could not find stats object"
}
