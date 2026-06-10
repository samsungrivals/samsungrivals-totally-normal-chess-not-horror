$utf8 = [System.Text.Encoding]::UTF8
$server = [System.IO.File]::ReadAllText("server.js", $utf8)

$oldLine = "announcements: db.announce.length"
$newLine = "announcements: db.announce.length,`r`n      owners: OWNER_NAMES"

if ($server.Contains($oldLine)) {
    $server = $server.Replace($oldLine, $newLine)
    [System.IO.File]::WriteAllText("server.js", $server, $utf8)
    Write-Host "Patched server.js with owners list."
} else {
    Write-Host "Could not find announcements: db.announce.length in server.js"
}
