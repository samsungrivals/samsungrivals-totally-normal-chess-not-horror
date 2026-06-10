$utf8 = [System.Text.Encoding]::UTF8
$appContent = [System.IO.File]::ReadAllText("app.js", $utf8)
$appendContent = [System.IO.File]::ReadAllText("14h_fixes.js", $utf8)
[System.IO.File]::WriteAllText("app.js", $appContent + "`r`n" + $appendContent, $utf8)
Write-Host "Appended 14h fixes safely"
