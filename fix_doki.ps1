$content = Get-Content "app.js" -Raw -Encoding UTF8

$content = $content -replace "document\.getElementById\('doki-action-game'\)\.style\.display !== 'none'", "document.getElementById('dokicanvas')"

[System.IO.File]::WriteAllText("app.js", $content, [System.Text.Encoding]::UTF8)
Write-Host "Replaced doki condition."
