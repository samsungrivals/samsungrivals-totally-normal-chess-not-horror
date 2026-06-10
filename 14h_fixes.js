// 14h Bug Test Fixes
setTimeout(() => {
    // Fix: Allow quiz replay without page refresh
    const _oldQuizAnswer = window.quizAnswer;
    window.quizAnswer = function(idx) {
        let isWin = (idx === quizQuestions[currentQuizQ].ans) && ((currentQuizQ + 1) >= quizQuestions.length);
        _oldQuizAnswer(idx);
        if (isWin) {
            let optBox = document.getElementById('quiz-options');
            if (optBox) {
                // Add currentQuizQ = 0 to the close modal button so it resets
                optBox.innerHTML = '<p style="color:#0f0; margin-bottom:10px;">Here is £100,000,000,000!</p><button class="btn" onclick="closeModal(\'quizmodal\'); M.quizBeats = (M.quizBeats||0)+1; saveMeta(); currentQuizQ=0; renderQuiz();">Claim Reward</button>';
            }
        }
    };

    // Fix: fmtMoney NaN on negative large numbers
    const _oldFmtMoney = window.fmtMoney;
    window.fmtMoney = function(v) {
        if(v < 0) return "-£" + _oldFmtMoney(Math.abs(v)).replace('£', '');
        return _oldFmtMoney(v);
    };
}, 2000);
