// Tiny multiplayer backend for the chess app.
// In-memory + JSON file. Endpoints power leaderboard, friends, announcements, matchmaking.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(express.static('.'));

const DB_FILE = path.join(__dirname, 'db.json');
let db = { users: {}, friends: {}, announce: [], queue: [], matches: {} };

// 18 seed AI competitors so the leaderboard is never empty
const SEED_AI = [
  { name: 'GrandmasterX', elo: 2950 }, { name: 'PawnPusher', elo: 2480 }, { name: 'CastleMaster', elo: 2100 },
  { name: 'KnightFork99', elo: 1880 }, { name: 'BishopPairBen', elo: 1720 }, { name: 'EndgameEric', elo: 1640 },
  { name: 'TacticalTom', elo: 1510 }, { name: 'BlitzKing', elo: 1430 }, { name: 'QueenBee', elo: 1290 },
  { name: 'OpeningOscar', elo: 1150 }, { name: 'SlowAndSteady', elo: 980 }, { name: 'PromotionPete', elo: 870 },
  { name: 'GambitGirl', elo: 760 }, { name: 'PinPusher', elo: 670 }, { name: 'ChessNoob42', elo: 550 },
  { name: 'BlunderBob', elo: 410 }, { name: 'StalemateSteve', elo: 330 }, { name: 'ZugzwangZoe', elo: 270 }
];

try {
  const saved = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  db = Object.assign(db, saved);
} catch (e) { /* first run */ }

// Always re-seed AI players
for (const ai of SEED_AI) {
  const key = ai.name.toLowerCase();
  if (!db.users[key]) db.users[key] = { username: ai.name, elo: ai.elo, isAI: true, createdAt: 0 };
}

let saveTimer = null;
function saveSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch (e) { console.error('save failed', e); }
  }, 500);
}

function ok(res, data) { res.json({ ok: true, ...data }); }
function bad(res, code, err) { res.status(code).json({ ok: false, err }); }

// --- Accounts ---
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return bad(res, 400, 'missing');
  if (username.length < 2 || username.length > 20) return bad(res, 400, 'username length');
  if (!/^[A-Za-z0-9_-]+$/.test(username)) return bad(res, 400, 'username chars');
  if (password.length < 3) return bad(res, 400, 'password length');
  const key = username.toLowerCase();
  if (db.users[key] && !db.users[key].isAI) return bad(res, 400, 'taken');
  const elo = db.users[key] ? db.users[key].elo : 500;
  db.users[key] = { username, password, elo, isAI: false, createdAt: Date.now() };
  saveSoon();
  ok(res, { user: { username, elo } });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const key = (username || '').toLowerCase();
  const u = db.users[key];
  if (!u || u.isAI) return bad(res, 401, 'no user');
  if (u.password !== password) return bad(res, 401, 'wrong password');
  ok(res, { user: { username: u.username, elo: u.elo } });
});

// --- Leaderboard ---
app.get('/api/leaderboard', (req, res) => {
  const list = Object.values(db.users)
    .map(u => ({ name: u.username, elo: u.elo, isAI: !!u.isAI }))
    .sort((a, b) => b.elo - a.elo)
    .slice(0, 50);
  ok(res, { lb: list, totalUsers: Object.values(db.users).filter(u => !u.isAI).length });
});

// --- Update ELO ---
app.post('/api/elo', (req, res) => {
  const { username, elo } = req.body || {};
  const key = (username || '').toLowerCase();
  const u = db.users[key];
  if (!u) return bad(res, 404, 'no user');
  u.elo = Math.max(100, Math.round(Number(elo) || 500));
  saveSoon();
  ok(res, { elo: u.elo });
});

// --- Search users (for adding friends) ---
app.get('/api/users/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return ok(res, { users: [] });
  const list = Object.values(db.users)
    .filter(u => u.username.toLowerCase().includes(q))
    .sort((a, b) => b.elo - a.elo)
    .slice(0, 20)
    .map(u => ({ name: u.username, elo: u.elo, isAI: !!u.isAI }));
  ok(res, { users: list });
});

// --- Friends ---
app.get('/api/friends', (req, res) => {
  const u = req.query.user || '';
  const friends = db.friends[u.toLowerCase()] || [];
  const list = friends.map(name => {
    const rec = db.users[name.toLowerCase()];
    return rec ? { name: rec.username, elo: rec.elo, isAI: !!rec.isAI, online: !rec.isAI } : { name, elo: 500, online: false };
  });
  ok(res, { friends: list });
});

app.post('/api/friends/add', (req, res) => {
  const { user, friend } = req.body || {};
  if (!user || !friend) return bad(res, 400, 'missing');
  const key = user.toLowerCase();
  db.friends[key] = db.friends[key] || [];
  if (!db.friends[key].includes(friend)) db.friends[key].push(friend);
  saveSoon();
  ok(res, { friends: db.friends[key] });
});

app.post('/api/friends/remove', (req, res) => {
  const { user, friend } = req.body || {};
  const key = (user || '').toLowerCase();
  db.friends[key] = (db.friends[key] || []).filter(f => f !== friend);
  saveSoon();
  ok(res, { friends: db.friends[key] });
});

// --- Global announcements ---
app.post('/api/announce', (req, res) => {
  const { user, msg } = req.body || {};
  if (!user || !msg) return bad(res, 400, 'missing');
  const safe = String(msg).slice(0, 200);
  db.announce.push({ user, msg: safe, ts: Date.now() });
  while (db.announce.length > 50) db.announce.shift();
  saveSoon();
  ok(res, { ts: Date.now() });
});

app.get('/api/announce/since', (req, res) => {
  const since = Number(req.query.ts || 0);
  ok(res, { announcements: db.announce.filter(a => a.ts > since) });
});

// --- Matchmaking queue ---
app.post('/api/queue/join', (req, res) => {
  const { user, elo } = req.body || {};
  if (!user) return bad(res, 400, 'missing');
  const myElo = Number(elo) || 500;
  // Clean old (>90s)
  db.queue = db.queue.filter(q => Date.now() - q.ts < 90000);
  // Look for a real opponent within ±250 ELO
  for (let i = 0; i < db.queue.length; i++) {
    const o = db.queue[i];
    if (o.user.toLowerCase() === user.toLowerCase()) continue;
    if (Math.abs(o.elo - myElo) <= 250) {
      db.queue.splice(i, 1);
      const matchId = user + '_' + o.user + '_' + Date.now();
      db.matches[matchId] = { players: [user, o.user], ts: Date.now() };
      saveSoon();
      return ok(res, { matched: true, opponent: { name: o.user, elo: o.elo } });
    }
  }
  // Add me to queue
  db.queue = db.queue.filter(q => q.user.toLowerCase() !== user.toLowerCase());
  db.queue.push({ user, elo: myElo, ts: Date.now() });
  saveSoon();
  ok(res, { matched: false, queueSize: db.queue.length });
});

app.post('/api/queue/leave', (req, res) => {
  const { user } = req.body || {};
  db.queue = db.queue.filter(q => q.user.toLowerCase() !== (user || '').toLowerCase());
  saveSoon();
  ok(res, {});
});

// --- Play challenges (send / accept / decline) ---
db.challenges = db.challenges || [];

function cleanChallenges() {
  const now = Date.now();
  db.challenges = db.challenges.filter(c => now - c.ts < 90000);
}

app.post('/api/challenge/send', (req, res) => {
  const { from, to } = req.body || {};
  if (!from || !to) return bad(res, 400, 'missing');
  cleanChallenges();
  db.challenges = db.challenges.filter(c => !(c.from === from && c.to === to && c.status === 'pending'));
  db.challenges.push({ from, to, status: 'pending', ts: Date.now() });
  saveSoon();
  ok(res, {});
});

app.get('/api/challenge/incoming', (req, res) => {
  cleanChallenges();
  const user = (req.query.user || '').toLowerCase();
  const incoming = db.challenges.filter(c => c.to.toLowerCase() === user && c.status === 'pending');
  ok(res, { challenges: incoming });
});

app.get('/api/challenge/status', (req, res) => {
  cleanChallenges();
  const from = req.query.from || '', to = req.query.to || '';
  const ch = db.challenges.find(c => c.from === from && c.to === to);
  ok(res, { challenge: ch || null });
});

app.post('/api/challenge/respond', (req, res) => {
  const { from, to, accept } = req.body || {};
  if (!from || !to) return bad(res, 400, 'missing');
  const ch = db.challenges.find(c => c.from === from && c.to === to && c.status === 'pending');
  if (!ch) return bad(res, 404, 'not found');
  ch.status = accept ? 'accepted' : 'declined';
  saveSoon();
  ok(res, { challenge: ch });
});

app.get('/api/stats', (req, res) => {
  ok(res, {
    users: Object.values(db.users).filter(u => !u.isAI).length,
    ai: Object.values(db.users).filter(u => u.isAI).length,
    queue: db.queue.length,
    announcements: db.announce.length
  });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log('chess server listening on ' + port);
  console.log('users: ' + Object.keys(db.users).length + ' (' + SEED_AI.length + ' AI seeded)');
});
