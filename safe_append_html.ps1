$utf8 = [System.Text.Encoding]::UTF8
$appContent = [System.IO.File]::ReadAllText("app.js", $utf8)
$appendContent = [System.IO.File]::ReadAllText("html_injects.js", $utf8)
[System.IO.File]::WriteAllText("app.js", $appContent + "`r`n" + $appendContent, $utf8)
Write-Host "Appended HTML injects safely"
