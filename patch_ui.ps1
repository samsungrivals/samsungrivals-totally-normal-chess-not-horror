$html = Get-Content index.html -Raw

$globalChatUI = @"
<!-- Global Chat -->
<div id="globalchat" style="position:fixed;bottom:10px;left:10px;width:300px;height:250px;background:#222;border:1px solid #444;border-radius:8px;display:flex;flex-direction:column;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.5);font-family:sans-serif;">
  <div style="padding:8px;background:#333;border-bottom:1px solid #444;font-weight:bold;color:#fff;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;">
    <span>Global Chat</span>
    <span onclick="document.getElementById('globalchat').style.display='none'" style="cursor:pointer;color:#888;">&times;</span>
  </div>
  <div id="globalchatmessages" style="flex:1;overflow-y:auto;padding:8px;color:#eee;font-size:13px;"></div>
  <div style="display:flex;padding:4px;border-top:1px solid #444;">
    <input type="text" id="globalchatinput" placeholder="Type a message..." style="flex:1;background:#111;color:#fff;border:1px solid #333;padding:6px;border-radius:4px;outline:none;" onkeydown="if(event.key==='Enter') sendGlobalChat()">
    <button onclick="sendGlobalChat()" style="background:#0a0;color:#fff;border:none;padding:6px 12px;margin-left:4px;border-radius:4px;cursor:pointer;font-weight:bold;">Send</button>
  </div>
</div>
<!-- Chat Toggle Button -->
<button onclick="document.getElementById('globalchat').style.display='flex'" style="position:fixed;bottom:10px;left:10px;background:#007BFF;color:#fff;border:none;padding:10px 15px;border-radius:20px;cursor:pointer;z-index:9998;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.5);">💬 Open Chat</button>
"@

$gameChatUI = @"
<!-- Game Chat -->
<div id="gamechat" style="margin-top:10px;width:100%;height:150px;background:#222;border:1px solid #444;border-radius:8px;display:flex;flex-direction:column;box-shadow:0 4px 12px rgba(0,0,0,0.5);font-family:sans-serif;">
  <div style="padding:6px;background:#333;border-bottom:1px solid #444;font-weight:bold;color:#fff;border-radius:8px 8px 0 0;font-size:14px;">
    Match Chat
  </div>
  <div id="gamechatmessages" style="flex:1;overflow-y:auto;padding:8px;color:#eee;font-size:13px;"></div>
  <div style="display:flex;padding:4px;border-top:1px solid #444;">
    <input type="text" id="gamechatinput" placeholder="Type to opponent..." style="flex:1;background:#111;color:#fff;border:1px solid #333;padding:6px;border-radius:4px;outline:none;" onkeydown="if(event.key==='Enter') sendGameChat()">
    <button onclick="sendGameChat()" style="background:#007BFF;color:#fff;border:none;padding:6px 12px;margin-left:4px;border-radius:4px;cursor:pointer;font-weight:bold;">Send</button>
  </div>
</div>
"@

$html = $html -replace "</body>", "$globalChatUI`n</body>"
$html = $html -replace '<div id="botctrls"', "$gameChatUI`n    <div id=`"botctrls`""

Set-Content index.html $html
