$content = Get-Content "app.js" -Raw -Encoding UTF8

$target = @"
const originalSaveMeta = saveMeta;
window.saveMeta = function() {
    let toSave = Object.assign({}, M);
    if(toSave.money === Infinity) toSave.money = "Infinity";
    else if(typeof toSave.money === 'number' && isNaN(toSave.money)) toSave.money = 0;
    
    if(toSave.moneyInfinities) toSave.moneyInfinities = toSave.moneyInfinities;
    
    localStorage.setItem('chessRngMeta', JSON.stringify(toSave));
};

const originalLoadMeta = loadMeta;
window.loadMeta = function() {
    let meta = originalLoadMeta();
    if(meta.money === "Infinity") meta.money = Infinity;
    if(meta.money === "NaN") meta.money = 0;
    
    if(!meta.achievements) meta.achievements = {};
    if(!meta.quizBeats) meta.quizBeats = 0;
    if(!meta.rebirths) meta.rebirths = 0;
    if(!meta.moneyInfinities) meta.moneyInfinities = 0;
    
    return meta;
};
"@

$replacement = @"
const originalSaveMeta = saveMeta;
window.saveMeta = function() {
    if(M.money === Infinity) M.money = "Infinity";
    else if(typeof M.money === 'number' && isNaN(M.money)) M.money = 0;
    originalSaveMeta();
    try{localStorage.setItem('chessmeta', JSON.stringify(M))}catch(e){}
    if(M.money === "Infinity") M.money = Infinity;
};

const originalLoadMeta = loadMeta;
window.loadMeta = function() {
    let meta = originalLoadMeta();
    try {
        let oldMeta = JSON.parse(localStorage.getItem('chessRngMeta'));
        if(oldMeta) {
            if(oldMeta.moneyInfinities > (meta.moneyInfinities||0)) meta.moneyInfinities = oldMeta.moneyInfinities;
            if(oldMeta.rebirths > (meta.rebirths||0)) meta.rebirths = oldMeta.rebirths;
            if(oldMeta.quizBeats > (meta.quizBeats||0)) meta.quizBeats = oldMeta.quizBeats;
            if(oldMeta.achievements) meta.achievements = Object.assign(meta.achievements||{}, oldMeta.achievements);
            if(oldMeta.money > meta.money) meta.money = oldMeta.money;
            localStorage.removeItem('chessRngMeta');
        }
    } catch(e) {}
    
    if(meta.money === "Infinity") meta.money = Infinity;
    if(meta.money === "NaN" || isNaN(meta.money)) meta.money = 0;
    
    if(!meta.achievements) meta.achievements = {};
    if(!meta.quizBeats) meta.quizBeats = 0;
    if(!meta.rebirths) meta.rebirths = 0;
    if(!meta.moneyInfinities) meta.moneyInfinities = 0;
    return meta;
};

if(M) {
    if(M.money === "Infinity") M.money = Infinity;
    if(M.money === "NaN" || (typeof M.money === 'number' && isNaN(M.money))) M.money = 0;
}
"@

$content = $content.Replace($target, $replacement)
[System.IO.File]::WriteAllText("app.js", $content, [System.Text.Encoding]::UTF8)
Write-Host "Replaced."
