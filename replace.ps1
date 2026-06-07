$content = Get-Content app.js -Raw -Encoding UTF8
$content = $content -replace '(?s)window\.adminAbuseGlobal = function\(\) \{.*?window\.adminUpdateGame = function\(\) \{ if\(typeof API !== ''undefined''\) API\.announce\(\(M\.account && M\.account\.username\) \|\| ''Admin'', ''!UPDATE''\); closeModal\(''ownermodal''\); \};', "window.adminAbuseGlobal = function() { if(typeof API !== 'undefined') API.announce((M.account && M.account.username) || 'Admin', '!ADMIN_ABUSE_2X'); closeModal('ownermodal'); };`nwindow.adminUpdateGame = function() { if(typeof API !== 'undefined') API.announce((M.account && M.account.username) || 'Admin', '!UPDATE_GAME_START'); closeModal('ownermodal'); };"
$content | Set-Content app.js -Encoding UTF8
Write-Host "Done"
