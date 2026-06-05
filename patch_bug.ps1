$app = Get-Content app.js -Raw

$bugHandler = @"

window.onerror = function(msg, url, lineNo, columnNo, error) {
    showBugPopup(msg + " at line " + lineNo);
    return false;
};
window.onunhandledrejection = function(event) {
    showBugPopup("Promise Rejection: " + (event.reason ? event.reason.toString() : "Unknown"));
};
function showBugPopup(msg) {
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#a00;color:#fff;padding:15px;border-radius:8px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.8);max-width:80%;word-wrap:break-word;border:2px solid #f00;font-family:monospace";
    d.innerHTML = "<b>\u26A0\uFE0F BUG DETECTED</b><br><br>" + msg.replace(/</g,"&lt;") + "<br><br><button onclick=\"this.parentElement.remove()\" style=\"background:#fff;color:#a00;border:none;padding:5px 10px;cursor:pointer;border-radius:4px;font-weight:bold\">Dismiss</button>";
    document.body.appendChild(d);
}
"@

$app = $app + $bugHandler
Set-Content app.js $app -NoNewline
