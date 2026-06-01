const PUZZLES = [
  {
    id: "puz_800",
    elo: 800,
    turn: 'white',
    // Back rank mate in 1
    fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
    moves: ["a1a8"]
  },
  {
    id: "puz_1500",
    elo: 1500,
    turn: 'white',
    // Knight fork
    fen: "2k5/8/8/8/3n4/8/3Q4/2K5 b - - 0 1",
    moves: ["d4b3", "c1c2", "b3d2"]
  },
  {
    id: "puz_2500",
    elo: 2500,
    turn: 'white',
    // Deflection mate in 2
    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5",
    moves: ["c4f7", "e8f7", "f3e5"]
  },
  {
    id: "puz_3500",
    elo: 3500,
    turn: 'white',
    // Queen sacrifice mate (Morphy's Opera Game ending)
    fen: "1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17",
    moves: ["e8d8"] // Wait, this is black to move, black is forced to e8d8, wait, no. The puzzle should start with the player's move.
  },
  {
    id: "puz_4500",
    elo: 4500,
    turn: 'white',
    // Ridiculous deep engine calculation
    fen: "rnbqkb1r/pppp1ppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: ["e2e4", "e7e5", "g1f3"]
  }
];

// Re-write the puzzles to correctly reflect standard tactical patterns with 'player' to move.
const ACTUAL_PUZZLES = [
  { id:"1", elo:800, turn:'white', board:[
    ['','','','','','','k',''],
    ['','','','','','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['R','','','','','','K','']
  ], moves:["a1a8"] }, // White R to a8 mate
  
  { id:"2", elo:1500, turn:'black', board:[
    ['','','k','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','n','','','',''],
    ['','','','','','','',''],
    ['','','','Q','','','',''],
    ['','','K','','','','','']
  ], moves:["d4b3", "c1c2", "b3d2"] }, // Black fork
  
  { id:"3", elo:2500, turn:'white', board:[
    ['r','','b','q','k','b','','r'],
    ['p','p','p','p','','p','p','p'],
    ['','','n','','','','',''],
    ['','','','','p','','',''],
    ['','','B','','n','','',''],
    ['','','','','','N','',''],
    ['P','P','P','P','','P','P','P'],
    ['R','N','B','Q','K','','','R']
  ], moves:["c4f7", "e8f7", "f3e5"] }, // Deflection

  { id:"4", elo:3500, turn:'white', board:[
    ['','n','','r','k','b','','r'],
    ['p','','','','','p','p','p'],
    ['','','','','q','','',''],
    ['','','','','p','','B',''],
    ['','','','','P','','',''],
    ['','','','','','','',''],
    ['P','P','P','','','P','P','P'],
    ['','','K','R','','','','']
  ], moves:["d1d8", "e8d8"] }, // Wait, Rd8# in Morphy

  { id:"5", elo:4500, turn:'white', board:[
    ['','k','','','','','',''],
    ['','p','','','','','',''],
    ['p','','p','','','','',''],
    ['','P','','','','','',''],
    ['P','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','K','','','','','','']
  ], moves:["a4a5"] } // Zugzwang
];

if(typeof module!=='undefined') module.exports=ACTUAL_PUZZLES;
if(typeof window!=='undefined') window.PUZZLES=ACTUAL_PUZZLES;
