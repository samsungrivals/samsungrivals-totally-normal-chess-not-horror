$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8089/")
$listener.Start()

Start-Process "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" -ArgumentList "--headless --disable-gpu http://localhost:8089/" -NoNewWindow

Write-Host "Listening for errors..."
$context = $listener.GetContext()
$request = $context.Request
$response = $context.Response

$html = @"
<!DOCTYPE html>
<html>
<head>
<script>
window.addEventListener('error', function(e) {
    if (e.message) fetch('/report?msg=' + encodeURIComponent(e.message + ' at line ' + e.lineno));
    else fetch('/report?msg=' + encodeURIComponent('Script error on ' + e.target.src));
}, true);
window.onerror = function(m,u,l,c,e) {
    fetch('/report?msg=' + encodeURIComponent(m + ' at line ' + l));
};
window.onload = function() {
    fetch('/report?msg=' + encodeURIComponent(window.lastAppError || 'NO_ERROR'));
};
</script>
<script src="app_wrapped.js"></script>
</head>
<body></body>
</html>
"@

if ($request.Url.AbsolutePath -eq '/') {
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.Close()
    
    while ($true) {
        $context2 = $listener.GetContext()
        if ($context2.Request.Url.AbsolutePath -eq '/favicon.ico') { $context2.Response.Close(); continue }
        $msg = $context2.Request.QueryString["msg"]
        if ($msg) { Write-Host "RESULT: $msg"; $context2.Response.Close(); break }
        $context2.Response.Close()
    }
    $context2.Response.Close()
} elseif ($request.Url.AbsolutePath -eq '/app_wrapped.js') {
    $js = Get-Content app_wrapped.js -Raw
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($js)
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.Close()
    
    while ($true) {
        $context2 = $listener.GetContext()
        if ($context2.Request.Url.AbsolutePath -eq '/favicon.ico') { $context2.Response.Close(); continue }
        $msg = $context2.Request.QueryString["msg"]
        if ($msg) { Write-Host "RESULT: $msg"; $context2.Response.Close(); break }
        $context2.Response.Close()
    }
    $context2.Response.Close()
}

$listener.Stop()
