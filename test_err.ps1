$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8080/")
$listener.Start()
Start-Process msedge.exe -ArgumentList "file:///C:/Users/teclast/Pictures/Camera%20Roll/New%20folder/test_err.html"
Write-Host "Waiting for error..."
$context = $listener.GetContext()
$req = $context.Request
Write-Host "Error received: " $req.QueryString["msg"]
$res = $context.Response
$res.Close()
$listener.Stop()
