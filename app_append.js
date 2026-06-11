// Add 105 more questions to the impossible quiz!
const additionalQuizQuestions = [];
for(let i=16; i<=110; i++) {
    let wrong1 = "Wrong Answer " + Math.floor(Math.random() * 100);
    let wrong2 = "Wait, what? " + i;
    let wrong3 = "I don't know!";
    let right = "Answer " + i;
    let opts = [wrong1, wrong2, wrong3, right];
    for(let j = opts.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [opts[j], opts[k]] = [opts[k], opts[j]];
    }
    additionalQuizQuestions.push({ q: "Impossible Question #" + i, opts: opts, ans: opts.indexOf(right) });
}
for(let q of additionalQuizQuestions) { quizQuestions.push(q); }

window.quizAnswer = function(idx) {
    if(idx === quizQuestions[currentQuizQ].ans) {
        currentQuizQ++;
        if(currentQuizQ >= quizQuestions.length) {
            document.getElementById('quiz-q').innerText = "YOU BEAT THE IMPOSSIBLE QUIZ!";
            document.getElementById('quiz-options').innerHTML = '<p style="color:#0f0; margin-bottom:10px;">Here is £100,000,000,000!</p><button class="btn" onclick="closeModal(\'quizmodal\'); M.quizBeats = (M.quizBeats||0)+1; saveMeta();">Claim Reward</button>';
            M.money = (Number(M.money)||0) + 100000000000;
            saveMeta();
        } else {
            renderQuiz();
        }
    } else {
        document.getElementById('quiz-q').innerText = "WRONG! YOU FAILED!";
        document.getElementById('quiz-options').innerHTML = '<button class="dangerbtn" onclick="closeModal(\'quizmodal\')">Leave in shame</button>';
        currentQuizQ = 0;
    }
};

// Limit scaling
const EXTENDED_SUFFIXES = [
    "", "k", "m", "b", "t", "qa", "qi", "sx", "sp", "oc", "no", "dc", "ud", "dd", "td", "qad", "qid", "sxd", "spd", "ocd", "nod", "vg",
    "uvg", "dvg", "tvg", "qavg", "qivg", "sxvg", "spvg", "ocvg", "novg", "tg",
    "utg", "dtg", "ttg", "qatg", "qitg", "sxtg", "sptg", "octg", "notg", "qg",
    "uqg", "dqg", "tqg", "qaqg", "qiqg", "sxqg", "spqg", "ocqg", "noqg", "qig",
    "uqig", "dqig", "tqig", "qaqig", "qiqig", "sxqig", "spqig", "ocqig", "noqig", "sxg",
    "usxg", "dsxg", "tsxg", "qasxg", "qisxg", "sxsxg", "spsxg", "ocsxg", "nosxg", "spg",
    "uspg", "dspg", "tspg", "qaspg", "qispg", "sxspg", "spspg", "ocspg", "nospg", "ocg",
    "uocg", "docg", "tocg", "qaocg", "qiocg", "sxocg", "spocg", "ococg", "noocg", "nog",
    "unog", "dnog", "tnog", "qanog", "qinog", "sxnog", "spnog", "ocnog", "nonog", "ce"
];

window.fmtMoney = function(v) {
    if(v === Infinity) return "Infinity";
    if(typeof v !== 'number' || isNaN(v)) return "£0";
    if(v < 1000) return "£" + v.toFixed(2);
    let power = Math.floor(Math.log10(v));
    let suffixIdx = Math.floor(power / 3);
    if (suffixIdx < EXTENDED_SUFFIXES.length) {
        let shortValue = v / Math.pow(10, suffixIdx * 3);
        let digits = shortValue >= 100 ? 0 : shortValue >= 10 ? 1 : 2;
        return "£" + shortValue.toFixed(digits) + EXTENDED_SUFFIXES[suffixIdx];
    }
    return "£" + v.toExponential(2);
};

// Revamped Achievements
SECRET_ACHIEVEMENTS.splice(0, SECRET_ACHIEVEMENTS.length, ...[
    { id: 's_1', name: "???", secretName: "The Architect", desc: "Score exactly 98.3% on a Square in the drawing minigame." },
    { id: 's_2', name: "???", secretName: "Patience is Key", desc: "Wait on the title screen for exactly 5 minutes without clicking." },
    { id: 's_3', name: "???", secretName: "The Void", desc: "Try to buy an item when your money is exactly 0." },
    { id: 's_4', name: "???", secretName: "Admin Abuse Enjoyer", desc: "Use the Admin Abuse button 10 times." },
    { id: 's_5', name: "???", secretName: "Math Genius", desc: "Answer a Doki Doki puzzle in under 1 second." },
    { id: 's_6', name: "???", secretName: "Rebirth Specialist", desc: "Perform 3 Free Rebirths in a single session." },
    { id: 's_7', name: "???", secretName: "Bug Hunter", desc: "Find exactly 0 bugs using the Stot Bug Detector." },
    { id: 's_8', name: "???", secretName: "Beyond the Absolute", desc: "Reach the 'The End' infinity tier." }
]);

window.checkSecretAchievement = function(id) {
    if(!M.achievements) M.achievements = {};
    if(!M.achievements[id]) {
        M.achievements[id] = true; saveMeta();
        let ach = SECRET_ACHIEVEMENTS.find(a => a.id === id);
        if(ach) {
            showAnnouncement("💎 SECRET UNLOCKED: " + ach.secretName + " (+5x Multiplier!)");
            refreshUI();
        }
    }
};

window.checkNormalAchievement = function(id) {
    if(!M.achievements) M.achievements = {};
    if(!M.achievements[id]) {
        M.achievements[id] = true; saveMeta();
        showAnnouncement("🏆 ACHIEVEMENT UNLOCKED! (+1.5x Multiplier)");
        refreshUI();
    }
};

const _oldBuyItem = window.buyItem;
window.buyItem = function(id) {
    if(M.money === 0 && id) checkSecretAchievement('s_3');
    _oldBuyItem(id);
};

const _oldAdminAbuse = window.adminGiveMoney;
window.adminAbuseCount = 0;
window.adminGiveMoney = function(amt) {
    window.adminAbuseCount++;
    if(window.adminAbuseCount >= 10) checkSecretAchievement('s_4');
    _oldAdminAbuse(amt);
};

// Draw shapes logic
let drawPts = [], isDrawing = false, drawingScore = 0;
window.clearDrawCanvas = function() {
    drawPts = [];
    let cvs = document.getElementById('drawCanvas');
    if(cvs) {
        let ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, cvs.width, cvs.height);
    }
    let res = document.getElementById('drawResult');
    if(res) res.innerText = "";
};

window.endDrawShape = function() {
    isDrawing = false;
    if(drawPts.length < 10) return;
    let minX = 9999, maxX = -9999, minY = 9999, maxY = -9999;
    for(let p of drawPts) {
        if(p.x < minX) minX = p.x; if(p.x > maxX) maxX = p.x;
        if(p.y < minY) minY = p.y; if(p.y > maxY) maxY = p.y;
    }
    let w = maxX - minX, h = maxY - minY;
    let shape = document.getElementById('drawShapeSelect').value;
    let score = 0;
    
    if(shape === 'square') {
        let ratio = w / h;
        score = 100 - (Math.abs(1 - ratio) * 100) - (Math.random()*10);
    } else if (shape === 'circle') {
        let ratio = w / h;
        score = 100 - (Math.abs(1 - ratio) * 80) - (Math.random()*10);
    } else {
        score = Math.random() * 80 + 10;
    }
    
    score = Math.max(0, Math.min(100, score));
    drawingScore = score;
    let displayScore = score.toFixed(1);
    
    let res = document.getElementById('drawResult');
    res.innerText = displayScore + "% Accuracy";
    
    if(shape === 'square' && displayScore === "98.3") {
        checkSecretAchievement('s_1');
    }
    
    if(score > 90) {
        res.style.color = "#0f0";
        M.money = (Number(M.money) || 0) + (1000000000 * getLuck());
        saveMeta();
        showAnnouncement("🎨 Perfect Shape! You gained a massive money drop!");
    } else {
        res.style.color = "#f00";
    }
};

setTimeout(() => {
    let cvs = document.getElementById('drawCanvas');
    if(cvs) {
        cvs.addEventListener('mousedown', (e) => { isDrawing = true; drawPts = []; clearDrawCanvas(); });
        cvs.addEventListener('mousemove', (e) => {
            if(!isDrawing) return;
            let rect = cvs.getBoundingClientRect();
            let x = e.clientX - rect.left; let y = e.clientY - rect.top;
            drawPts.push({x,y});
            let ctx = cvs.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(x,y,2,2);
        });
        cvs.addEventListener('mouseup', endDrawShape);
        cvs.addEventListener('mouseleave', () => { if(isDrawing) endDrawShape(); });
    }
    
    let shopBox = document.querySelector('#shopmodal .mbox');
    if(shopBox) {
        let rbBtn = document.createElement('button');
        rbBtn.className = 'tbbtn';
        rbBtn.innerText = "♻️ FREE REBIRTH (Does not reset progress)";
        rbBtn.style.background = 'purple';
        rbBtn.onclick = function() {
            let cost = M.rebirthCost || 1000000000000;
            if(M.money >= cost || M.money === Infinity || M.moneyInfinities > 0) {
                if(!M.rebirths) M.rebirths = 0;
                M.rebirths++;
                saveMeta();
                checkSecretAchievement('s_6');
                showAnnouncement("♻️ REBIRTH +1! (No money deducted)");
            } else {
                showAnnouncement("❌ You need " + window.fmtMoney(cost));
            }
        };
        shopBox.appendChild(rbBtn);
    }
}, 1000);

const _oldPollStats = window.pollStats;
window.pollStats = async function() {
    try {
        const res = await fetch('/api/stats');
        if(res.ok) {
            const data = await res.json();
            const el = document.getElementById('live-stats');
            if(el) {
                let fakeOn = 84200 + ((data.online||1)*13) + (Math.floor(Date.now()/10000)%500); let fakeReg = 140500 + ((data.users||1)*7); 
                el.innerText = `Online: ${fakeOn.toLocaleString()} | Registered: ${fakeReg.toLocaleString()}`;
            }
            if(data.owners) {
                for(let o of data.owners) {
                    if(!OWNER_NAMES.includes(o)) OWNER_NAMES.push(o);
                }
            }
        }
    } catch(e) {}
};
