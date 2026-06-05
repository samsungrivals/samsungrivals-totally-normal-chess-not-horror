$html = Get-Content index.html -Raw

# Replace the old globalchat with the new unified one
$oldChatRegex = '(?s)<div id="globalchat".*?</div>\s*</div>\s*</div>'
$newChat = @"
<div id="globalchat" style="position:fixed;bottom:70px;left:20px;width:300px;height:250px;background:#222;border:1px solid #444;border-radius:8px;display:none;flex-direction:column;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.5);font-family:sans-serif;">
  <div style="display:flex;justify-content:space-between;align-items:center;background:#333;border-top-left-radius:8px;border-top-right-radius:8px;">
    <div style="display:flex;flex:1;">
      <div id="tabGlobal" onclick="switchChatTab('global')" style="flex:1;padding:8px;text-align:center;cursor:pointer;font-weight:bold;color:#fff;background:#444;border-top-left-radius:8px;">Global</div>
      <div id="tabGame" onclick="switchChatTab('game')" style="flex:1;padding:8px;text-align:center;cursor:pointer;font-weight:bold;color:#888;">Match</div>
    </div>
    <span onclick="document.getElementById('globalchat').style.display='none'" style="cursor:pointer;color:#ccc;padding:0 12px;font-size:18px;font-weight:bold;">&times;</span>
  </div>
  <div id="globalchatmessages" style="flex:1;overflow-y:auto;padding:8px;color:#eee;font-size:13px;display:block;"></div>
  <div id="gamechatmessages" style="flex:1;overflow-y:auto;padding:8px;color:#eee;font-size:13px;display:none;"></div>
  <div style="display:flex;padding:8px;border-top:1px solid #333;">
    <input type="text" id="globalchatinput" placeholder="Type a message..." style="flex:1;background:#111;color:#fff;border:1px solid #333;padding:6px;border-radius:4px;outline:none;" onkeydown="if(event.key==='Enter') sendChatInput()">
    <button onclick="sendChatInput()" style="background:#0a0;color:#fff;border:none;padding:6px 12px;margin-left:4px;border-radius:4px;cursor:pointer;font-weight:bold;">Send</button>
  </div>
</div>
"@

$html = $html -replace $oldChatRegex, $newChat
Set-Content index.html $html -NoNewline
