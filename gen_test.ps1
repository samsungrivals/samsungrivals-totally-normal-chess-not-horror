$app = Get-Content app.js -Raw
$html = '<!DOCTYPE html><html><head><script>window.onerror=function(m,u,l,c,e){fetch("http://127.0.0.1:8080/err?msg="+encodeURIComponent(m+" at line "+l));};setTimeout(function(){fetch("http://127.0.0.1:8080/err?msg="+encodeURIComponent("No error"));}, 2000);</script><script>' + $app + '</script></head><body></body></html>'
Set-Content test_err.html -Value $html
