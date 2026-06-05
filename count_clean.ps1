$text = Get-Content app.js -Raw
$text = $text -replace '/\*[\s\S]*?\*/', ''
$text = $text -replace '//.*', ''
$text = $text -replace '"[^"\\]*(?:\\.[^"\\]*)*"', ''
$text = $text -replace "'[^'\\]*(?:\\.[^'\\]*)*'", ''
$text = $text -replace '`[^`\\]*(?:\\.[^`\\]*)*`', ''

$open = ($text.ToCharArray() | Where-Object { $_ -eq '{' }).Count
$close = ($text.ToCharArray() | Where-Object { $_ -eq '}' }).Count
Write-Host "Open: $open, Close: $close"
