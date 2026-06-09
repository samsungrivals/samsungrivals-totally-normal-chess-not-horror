$lines = Get-Content 'app.js' -Encoding UTF8

$lines[2] = "const SYM={'K':'\u2654','Q':'\u2655','R':'\u2656','B':'\u2657','N':'\u2658','P':'\u2659','k':'\u265A','q':'\u265B','r':'\u265C','b':'\u265D','n':'\u265E','p':'\u265F','D':'\uD83E\uDD86','M':'\uD83D\uDC18'};"
$lines[558] = "  const symbols = ['??', '?', '?!', '', '!', '!!', '!!!', '\u2B50'];"

# Fix fmtMoney which starts around line 885
# We will search for 'function fmtMoney' and replace it until 'function refreshUI'
$text = $lines -join "`n"

$fmtPattern = '(?s)function fmtMoney\(p\)\{.*?function refreshUI\(\)'
$fmtReplacement = "function fmtMoney(p){
  const n = (Number(p)||0)/100;
  if(n < 1e6) return '\u00A3' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if(n < 1e15) return '\u00A3' + Intl.NumberFormat('en-GB', { notation: `"compact`", maximumFractionDigits: 2 }).format(n);
  
  const suffixes = [
    `"`", `"Thousand`", `"Million`", `"Billion`", `"Trillion`", `"Quadrillion`", `"Quintillion`", `"Sextillion`", `"Septillion`", 
    `"Octillion`", `"Nonillion`", `"Decillion`", `"Undecillion`", `"Duodecillion`", `"Tredecillion`", `"Quattuordecillion`", 
    `"Quindecillion`", `"Sexdecillion`", `"Septendecillion`", `"Octodecillion`", `"Novemdecillion`", `"Vigintillion`", 
    `"Unvigintillion`", `"Duovigintillion`", `"Trevigintillion`", `"Quattuorvigintillion`", `"Quinvigintillion`", 
    `"Sexvigintillion`", `"Septenvigintillion`", `"Octovigintillion`", `"Novemvigintillion`", `"Trigintillion`"
  ];
  
  let exp = Math.floor(Math.log10(n));
  let suffixIndex = Math.floor(exp / 3);
  
  if (suffixIndex < suffixes.length) {
    let mantissa = n / Math.pow(10, suffixIndex * 3);
    return '\u00A3' + mantissa.toFixed(2) + ' ' + suffixes[suffixIndex];
  }
  
  return '\u00A3' + n.toExponential(2).replace('e+', 'e');
}
function refreshUI()"

$text = $text -replace $fmtPattern, $fmtReplacement

[System.IO.File]::WriteAllText('app.js', $text, [System.Text.Encoding]::UTF8)
Write-Host "Fixed!"
