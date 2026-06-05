$lines = Get-Content app.js -Encoding UTF8
$newLines = @()
$newLines += $lines[0..1535]
$newLines += "const MUSIC_TRACKS=["
$newLines += "  {name:'Oh, Mother Earth, so full of grace',file:'mother_earth.mp3'},"
$newLines += "  {name:'Best Ever',file:'best_ever.mp3'},"
$newLines += "  {name:'PASSO BEM SOLTO',file:'passo.mp3'},"
$newLines += "  {name:'It\'s Raining Tacos',file:'tacos.mp3'},"
$newLines += "  {name:'\u041B\u0410\u0412\u0418\u041D\u0410 (Steal the Brainrot)',file:'lavina.mp3'},"
$newLines += "  {name:'\u041F\u043E\u0447\u0432\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435',file:'pochvo.mp3'},"
$newLines += "  {name:'\u0414\u043E\u043C\u0438\u043A\u0438',file:'domiki.mp3'}"
$newLines += "];"
$newLines += $lines[1543..($lines.Count-1)]

[System.IO.File]::WriteAllLines('app.js', $newLines, [System.Text.Encoding]::UTF8)
