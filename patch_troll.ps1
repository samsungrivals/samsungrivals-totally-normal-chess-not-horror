$c = [System.IO.File]::ReadAllText("live_app.js", [System.Text.Encoding]::UTF8)

# Signup/Sync
$c = [System.Text.RegularExpressions.Regex]::Replace($c, 'if\(OWNER_NAMES\.includes\(\(M\.account\.username\|\|''''\)\.toLowerCase\(\)\)\)\{\s*(setTimeout\(\(\)=>showAnnouncement\(.*?\),\s*1500\);)\s*\}', '$1')

# Login
$c = [System.Text.RegularExpressions.Regex]::Replace($c, 'if\(r&&r\.ok&&OWNER_NAMES\.includes\(u\.toLowerCase\(\)\)\)\{\s*(setTimeout\(\(\)=>showAnnouncement\(.*?\),\s*1500\);)\s*\}', '$1')

$utf8NoBom = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText("live_app.js", $c, $utf8NoBom)
