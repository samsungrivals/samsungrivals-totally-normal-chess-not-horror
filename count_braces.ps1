$js = Get-Content app.js -Raw
$o = [regex]::Matches($js, '\{').Count
$c = [regex]::Matches($js, '\}').Count
Write-Output "Open: $o, Close: $c"
