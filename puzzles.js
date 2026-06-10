// Infinite Puzzle Generator

function createEmptyBoard() {
    return [
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','','']
    ];
}

function genBackRank() {
    // Back rank mate in 1 or 2
    let b = createEmptyBoard();
    // Randomize king position on back rank (g8, h8 or c8, b8, a8)
    let kCol = Math.random() < 0.5 ? 6 : 1; // g or b
    b[0][kCol] = 'k';
    
    // Blocking pawns
    if(kCol === 6) {
        b[1][5] = 'p'; b[1][6] = 'p'; b[1][7] = 'p';
    } else {
        b[1][0] = 'p'; b[1][1] = 'p'; b[1][2] = 'p';
    }
    
    // White rook on the same file but bottom, wait, back rank mate means rook attacks rank 8.
    // So Rook is on rank 1-7, but file doesn't matter much as long as it's open.
    let rCol = Math.floor(Math.random()*8);
    let rRow = Math.floor(Math.random()*6) + 2; // rank 1 to 6
    b[rRow][rCol] = 'R';
    
    // Add white king somewhere
    b[7][4] = 'K';
    
    // Moves: Rook moves to back rank
    let cols = "abcdefgh";
    let startSq = cols[rCol] + (8 - rRow);
    let endSq = cols[rCol] + "8";
    
    return {
        id: "gen_backrank_" + Date.now(),
        elo: 800 + Math.floor(Math.random()*400),
        turn: 'white',
        board: b,
        moves: [startSq + endSq]
    };
}

function genKnightFork() {
    // Knight forks King and Queen
    let b = createEmptyBoard();
    let nRow = 4, nCol = 4; // Knight on e4
    b[nRow][nCol] = 'N'; // White knight
    
    // Fork targets: e.g. King on c5 (row 3, col 2), Queen on g5 (row 3, col 6)
    // The previous move was black moving into the fork or white moving the knight
    // Let's make it a 1-move puzzle: White to move and fork
    b[nRow][nCol] = ''; // remove knight, place it where it can jump to e4
    let startMoves = [[6,3],[6,5],[5,2],[5,6]]; // d2, f2, c3, g3
    let s = startMoves[Math.floor(Math.random()*startMoves.length)];
    b[s[0]][s[1]] = 'N';
    
    b[3][2] = 'k'; // c5
    b[3][6] = 'q'; // g5
    
    b[7][0] = 'K'; // White king
    
    let cols = "abcdefgh";
    let startSq = cols[s[1]] + (8 - s[0]);
    let endSq = "e4";
    // We expect the user to find the fork
    return {
        id: "gen_fork_" + Date.now(),
        elo: 1200 + Math.floor(Math.random()*400),
        turn: 'white',
        board: b,
        moves: [startSq + endSq]
    };
}

function genSmotheredMate() {
    let b = createEmptyBoard();
    b[0][7] = 'k';
    b[1][6] = 'p';
    b[1][7] = 'p';
    b[0][6] = 'r'; // Rook blocking king
    
    // Knight can jump to f7
    let nRow = 3, nCol = 5; // f5
    b[nRow][nCol] = 'N';
    
    b[7][0] = 'K';
    
    let cols = "abcdefgh";
    return {
        id: "gen_smothered_" + Date.now(),
        elo: 2000 + Math.floor(Math.random()*500),
        turn: 'white',
        board: b,
        moves: ["f5f7"] // Wait, the notation is start to end
    };
}

function genDeflection() {
    let b = createEmptyBoard();
    b[0][0] = 'r'; b[0][3] = 'q'; b[0][4] = 'k'; b[0][7] = 'r';
    b[1][0] = 'p'; b[1][1] = 'p'; b[1][2] = 'p'; b[1][5] = 'p'; b[1][6] = 'p'; b[1][7] = 'p';
    
    b[7][0] = 'R'; b[7][4] = 'K'; b[7][7] = 'R';
    b[3][2] = 'B'; // Bc4
    b[5][5] = 'N'; // Nf3
    b[3][4] = 'n'; // Ne4 (black knight)
    
    return {
        id: "gen_deflect_" + Date.now(),
        elo: 2500 + Math.floor(Math.random()*500),
        turn: 'white',
        board: b,
        moves: ["c4f7", "e8f7", "f3e5"]
    };
}

function generatePuzzle() {
    let r = Math.random();
    if(r < 0.25) return genBackRank();
    if(r < 0.50) return genKnightFork();
    if(r < 0.75) return genSmotheredMate();
    return genDeflection();
}

// Keep the global array dynamic! We will expose a Proxy or a getter so it generates infinitely
const InfinitePuzzles = new Proxy([], {
    get: function(target, prop) {
        if (prop === 'length') return 999999;
        if (prop === 'filter') return function() { return [generatePuzzle()]; };
        if (prop === 'find') return function() { return generatePuzzle(); };
        let idx = parseInt(prop);
        if (!isNaN(idx)) {
            return generatePuzzle();
        }
        return target[prop];
    }
});

// Since the old code expects a normal array, we might just expose an array with 100 random puzzles
// and refresh them if needed. But a Proxy array is true infinity!
let ACTUAL_PUZZLES = [];
for(let i=0; i<100; i++) {
    ACTUAL_PUZZLES.push(generatePuzzle());
}

if(typeof window !== 'undefined') {
    // Override puzzle fetching to always get fresh ones
    window.PUZZLES = ACTUAL_PUZZLES;
    window.getRandomPuzzle = function() {
        return generatePuzzle();
    };
}
if(typeof module !== 'undefined') module.exports = ACTUAL_PUZZLES;

// Track puzzles generated for secret achievement
let _puzCount = 0;
if(typeof window !== 'undefined') {
    const origGet = window.getRandomPuzzle;
    window.getRandomPuzzle = function() {
        _puzCount++;
        if(_puzCount >= 500 && window.unlockAchievement) {
            window.unlockAchievement('s_7');
        }
        return origGet();
    };
}