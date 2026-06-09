$text = [System.IO.File]::ReadAllText('app.js', [System.Text.Encoding]::UTF8)

# Replace the mangled SYM dictionary
$text = $text -replace 'const SYM=\{.*?\};', "const SYM={'K':'♔','Q':'♕','R':'♖','B':'♗','N':'♘','P':'♙','k':'♚','q':'♛','r':'♜','b':'♝','n':'♞','p':'♟','D':'🦆','M':'🐘'};"

# Replace the mangled symbols array
$text = $text -replace 'const symbols = \[.*?\];', "const symbols = ['??', '?', '?!', '', '!', '!!', '!!!', '⭐'];"

# Ensure fmtMoney has the correct implementation
$fmtPattern = '(?s)function fmtMoney\(p\)\{.*?function refreshUI\(\)'
$fmtReplacement = "function fmtMoney(p){
  const n = (Number(p)||0)/100;
  if(n < 1e6) return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if(n < 1e15) return '£' + Intl.NumberFormat('en-GB', { notation: `"compact`", maximumFractionDigits: 2 }).format(n);
  
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
    return '£' + mantissa.toFixed(2) + ' ' + suffixes[suffixIndex];
  }
  
  return '£' + n.toExponential(2).replace('e+', 'e');
}
function refreshUI()"

$text = $text -replace $fmtPattern, $fmtReplacement

[System.IO.File]::WriteAllText('app.js', $text, [System.Text.Encoding]::UTF8)
Write-Host "Done fixing app.js"
