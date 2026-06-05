
$html = Get-Content index.html -Raw
$js = Get-Content app.js -Raw

$htmlIds = [regex]::Matches($html, 'id="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
$jsIds = [regex]::Matches($js, 'getElementById\([''"]([^''"]+)[''"]\)') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

Write-Output "--- IDs missing in HTML ---"
foreach ($id in $jsIds) {
    if ($htmlIds -notcontains $id -and $id -notmatch '\+') {
        Write-Output $id
    }
}
