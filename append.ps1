$text = [System.IO.File]::ReadAllText('append_clocks.js', [System.Text.Encoding]::UTF8)
$utf8NoBom = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::AppendAllText('app.js', "`r`n" + $text, $utf8NoBom)
[System.IO.File]::AppendAllText('live_app.js', "`r`n" + $text, $utf8NoBom)
