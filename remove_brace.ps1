$text = Get-Content app.js -Raw
$text = $text.Substring(0, $text.Length - 1)
Set-Content app.js $text -NoNewline
