// Tiny multiplayer backend for the chess app.
// In-memory + JSON file. Endpoints power leaderboard, friends, announcements, matchmaking.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '256kb' }));
// Never cache HTML so new deploys take effect immediately (no hard-refresh needed)
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});
app.use(express.static('.', { etag: false, lastModified: false }));

const dataDir = process.env.DATA_DIR || __dirname;
const DB_FILE = path.join(dataDir, 'db.json');
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
function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch (e) { console.error('save failed', e); }
}
function saveSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; saveNow(); }, 500);
}
// Flush to disk when Railway shuts the process down for a redeploy (needs a Volume to survive)
function gracefulExit() { saveNow(); process.exit(0); }
process.on('SIGTERM', gracefulExit);
process.on('SIGINT', gracefulExit);

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
    .filter(u => !u.isAI)
    .map(u => ({ name: u.username, elo: u.elo, upgrades: u.upgrades||0, isAI: false }))
  ok(res, { lb: list, totalUsers: list.length });
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

// --- Update Upgrades ---
app.post('/api/upgrades', (req, res) => {
  const { username, upgrades } = req.body || {};
  const key = (username || '').toLowerCase();
  const u = db.users[key];
  if (!u) return bad(res, 404, 'no user');
  u.upgrades = Math.max(0, Math.round(Number(upgrades) || 0));
  saveSoon();
  ok(res, { upgrades: u.upgrades });
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

// Friend code = a short stable code derived from the username (case-insensitive)
function codeForName(name) {
  let h = 5381;
  const s = (name || '').toLowerCase();
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return 'CHESS-' + h.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}
function nameForCode(code) {
  const c = (code || '').trim().toUpperCase();
  for (const key in db.users) {
    if (codeForName(db.users[key].username) === c) return db.users[key].username;
  }
  return null;
}

app.get('/api/friends/mycode', (req, res) => {
  const u = req.query.user || '';
  ok(res, { code: codeForName(u) });
});

app.post('/api/friends/addByCode', (req, res) => {
  const { user, code } = req.body || {};
  if (!user || !code) return bad(res, 400, 'missing');
  const target = nameForCode(code);
  if (!target) return bad(res, 404, 'no such code');
  if (target.toLowerCase() === user.toLowerCase()) return bad(res, 400, 'thats you');
  const key = user.toLowerCase();
  db.friends[key] = db.friends[key] || [];
  if (!db.friends[key].includes(target)) db.friends[key].push(target);
  // make it mutual so both see each other
  const tkey = target.toLowerCase();
  db.friends[tkey] = db.friends[tkey] || [];
  if (!db.friends[tkey].includes(db.users[key] ? db.users[key].username : user)) {
    db.friends[tkey].push(db.users[key] ? db.users[key].username : user);
  }
  saveSoon();
  ok(res, { added: target, elo: db.users[tkey] ? db.users[tkey].elo : 500 });
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
db.activeMatches = db.activeMatches || {};

function findActiveMatch(user) {
  const u = user.toLowerCase();
  return Object.values(db.activeMatches).find(
    m => m.status === 'playing' && (m.p1.toLowerCase() === u || m.p2.toLowerCase() === u)
  );
}

app.post('/api/queue/join', (req, res) => {
  const { user, elo } = req.body || {};
  if (!user) return bad(res, 400, 'missing');
  const myElo = Number(elo) || 500;
  // First: if there's already an active match for this user (someone else matched them), return it
  const existing = findActiveMatch(user);
  if (existing) {
    const opponent = existing.p1.toLowerCase() === user.toLowerCase() ? existing.p2 : existing.p1;
    const mySide = existing.white.toLowerCase() === user.toLowerCase() ? 'white' : 'black';
    return ok(res, { matched: true, opponent: { name: opponent, elo: 500 }, matchId: existing.id, mySide });
  }
  db.queue = db.queue.filter(q => Date.now() - q.ts < 90000);
  // Match ANY two queued users
  for (let i = 0; i < db.queue.length; i++) {
    const o = db.queue[i];
    if (o.user.toLowerCase() === user.toLowerCase()) continue;
    db.queue.splice(i, 1);
    const matchId = [user, o.user].sort().join('_') + '_' + Date.now();
    const whitePlayer = Math.random() < 0.5 ? user : o.user;
    const blackPlayer = whitePlayer === user ? o.user : user;
    db.activeMatches[matchId] = {
      id: matchId, p1: user, p2: o.user,
      white: whitePlayer, black: blackPlayer,
      moves: [], status: 'playing',
      ts: Date.now(), lastMove: Date.now()
    };
    saveSoon();
    const mySide = whitePlayer === user ? 'white' : 'black';
    return ok(res, { matched: true, opponent: { name: o.user, elo: o.elo }, matchId, mySide });
  }
  db.queue = db.queue.filter(q => q.user.toLowerCase() !== user.toLowerCase());
  db.queue.push({ user, elo: myElo, ts: Date.now() });
  saveSoon();
  ok(res, { matched: false, queueSize: db.queue.length });
});

// --- Admin: the owner always has it and can grant admin to other players ---
let OWNER_NAMES = ['samsungrivals_owner_', 'teclast', 'samsungrivals'];
db.admins = db.admins || [];
// Ensure owners are always present (without wiping previously-granted admins)
for (const o of OWNER_NAMES) {
  if (!db.admins.some(a => a.toLowerCase() === o.toLowerCase())) db.admins.push(o);
}
saveSoon();

function isOwner(name) { return OWNER_NAMES.some(a => a.toLowerCase() === (name || '').toLowerCase()); }

app.get('/api/admins/is', (req, res) => {
  const u = (req.query.user || '').toLowerCase();
  const isAdmin = db.admins.some(a => a.toLowerCase() === u);
  ok(res, { isAdmin });
});

// Only the OWNER can grant admin to other players.
app.post('/api/admins/grant', (req, res) => {
  const { granter, target } = req.body || {};
  if (!granter || !target) return bad(res, 400, 'missing');
  if (!isOwner(granter)) return bad(res, 403, 'only owner can grant');
  if (!db.admins.some(a => a.toLowerCase() === target.toLowerCase())) db.admins.push(target);
  saveSoon();
  ok(res, { admins: db.admins });
});

// Owner can revoke a granted admin (can't revoke the owner)
app.post('/api/admins/revoke', (req, res) => {
  const { granter, target } = req.body || {};
  if (!isOwner(granter)) return bad(res, 403, 'only owner can revoke');
  if (isOwner(target)) return bad(res, 400, 'cannot revoke owner');
  db.admins = db.admins.filter(a => a.toLowerCase() !== (target || '').toLowerCase());
  saveSoon();
  ok(res, { admins: db.admins });
});

// --- Music feature requests (users asking the dev to use their music) ---
db.musicRequests = db.musicRequests || [];
app.post('/api/music/request', (req, res) => {
  const { user, filename } = req.body || {};
  db.musicRequests.push({ user: user || 'anon', filename: filename || 'unknown', ts: Date.now() });
  while (db.musicRequests.length > 200) db.musicRequests.shift();
  saveSoon();
  ok(res, { received: true, total: db.musicRequests.length });
});
app.get('/api/music/requests', (req, res) => {
  ok(res, { requests: db.musicRequests });
});

// --- Global luck multiplier (set by admins, applied to every player) ---
if (db.globalLuck === undefined) db.globalLuck = 1;

app.get('/api/globalluck', (req, res) => {
  ok(res, { globalLuck: db.globalLuck || 1 });
});

app.post('/api/globalluck/multiply', (req, res) => {
  const factor = Number((req.body || {}).factor) || 1;
  db.globalLuck = (Number(db.globalLuck) || 1) * factor;
  saveSoon();
  ok(res, { globalLuck: db.globalLuck });
});

app.post('/api/globalluck/set', (req, res) => {
  db.globalLuck = Math.max(1, Number((req.body || {}).value) || 1);
  saveSoon();
  ok(res, { globalLuck: db.globalLuck });
});

// --- Reset all real users' ELO to 500 ---
app.post('/api/owners/grant', (req, res) => {
  const {granter, target} = req.body || {};
  if (!isOwner(granter)) return bad(res, 403, 'owner only');
  if (target) {
    const tl = target.toLowerCase().trim();
    if (!OWNER_NAMES.includes(tl)) OWNER_NAMES.push(tl);
  }
  ok(res, { ok: true });
});

app.post('/api/owners/revoke', (req, res) => {
  const {granter, target} = req.body || {};
  if (!isOwner(granter)) return bad(res, 403, 'owner only');
  if (target) {
    const tl = target.toLowerCase().trim();
    OWNER_NAMES = OWNER_NAMES.filter(n => n !== tl);
  }
  ok(res, { ok: true });
});

app.post('/api/elo/reset-player', (req, res) => {
  const { owner, target } = req.body || {};
  if (!isOwner(owner)) return bad(res, 403, 'owner only');
  const t = (target || '').toLowerCase().trim();
  const u = db.users[t];
  if (!u) return bad(res, 404, 'user not found');
  u.elo = 500;
  saveSoon();
  ok(res, { target: u.username });
});

app.post('/api/elo/reset-all', (req, res) => {
  const user = (req.body || {}).user || '';
  if (!isOwner(user)) return bad(res, 403, 'owner only');
  let count = 0;
  for (const key in db.users) {
    if (db.users[key].isAI) continue;
    db.users[key].elo = 500;
    count++;
  }
  saveSoon();
  ok(res, { reset: count });
});

// --- Real-time PvP match endpoints ---
app.get('/api/match/state', (req, res) => {
  const { matchId, since } = req.query;
  const m = db.activeMatches[matchId];
  if (!m) return bad(res, 404, 'no match');
  const fromIdx = Number(since) || 0;
  ok(res, {
    match: { id: m.id, status: m.status, white: m.white, black: m.black, p1: m.p1, p2: m.p2 },
    newMoves: m.moves.slice(fromIdx),
    moveCount: m.moves.length
  });
});

app.post('/api/match/move', (req, res) => {
  const { matchId, user, from, to, promo } = req.body || {};
  const m = db.activeMatches[matchId];
  if (!m) return bad(res, 404, 'no match');
  m.moves.push({ user, from, to, promo: promo || null, ts: Date.now() });
  m.lastMove = Date.now();
  saveSoon();
  ok(res, { moveCount: m.moves.length });
});

app.post('/api/match/end', (req, res) => {
  const { matchId, status, winner } = req.body || {};
  const m = db.activeMatches[matchId];
  if (m) {
    m.status = status || 'ended';
    if (winner) m.winner = winner;
    saveSoon();
  }
  ok(res, {});
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

// Health/persistence check
app.get('/api/health', (req, res) => {
  ok(res, {
    dataDir: dataDir,
    persistent: !!process.env.DATA_DIR,
    realUsers: Object.values(db.users).filter(u => !u.isAI).length
  });
});

// ============================================================
// REAL-TIME WEBSOCKET MULTIPLAYER  (optional — site still works without it)
// ============================================================
const http = require('http');
const server = http.createServer(app);

// user(lowercase) -> ws socket
const sockets = new Map();
const liveMatches = new Map();
let waiting = null;
let WebSocket = null;

function wsSend(ws, obj) {
  try { if (ws && WebSocket && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); } catch (e) {}
}

function setupWebSockets() {
  try {
    WebSocket = require('ws');
  } catch (e) {
    console.warn('[ws] WebSocket library not available — real-time multiplayer disabled, site still runs. ' + e.message);
    return;
  }
  const wss = new WebSocket.Server({ server, path: '/ws' });
  wss.on('connection', (ws) => {
  ws.userKey = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }

    if (msg.type === 'hello') {
      ws.userKey = (msg.user || ('guest_' + Math.random().toString(36).slice(2, 8))).toLowerCase();
      ws.displayName = msg.user || ws.userKey;
      ws.elo = Number(msg.elo) || 500;
      sockets.set(ws.userKey, ws);
      wsSend(ws, { type: 'hello_ok', user: ws.displayName });
      return;
    }

    if (msg.type === 'queue') {
      ws.elo = Number(msg.elo) || ws.elo || 500;
      // Already someone waiting and it's not us? Make a match.
      if (waiting && waiting.ws !== ws && waiting.ws.readyState === WebSocket.OPEN) {
        const opp = waiting; waiting = null;
        const matchId = 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        const whiteIsMe = Math.random() < 0.5;
        const meName = ws.displayName, oppName = opp.ws.displayName;
        const white = whiteIsMe ? meName : oppName;
        const black = whiteIsMe ? oppName : meName;
        liveMatches.set(matchId, { white, black, moves: [], a: ws.userKey, b: opp.ws.userKey });
        ws.matchId = matchId; opp.ws.matchId = matchId;
        wsSend(ws, { type: 'matched', matchId, opponent: { name: oppName, elo: opp.elo }, side: white === meName ? 'white' : 'black' });
        wsSend(opp.ws, { type: 'matched', matchId, opponent: { name: meName, elo: ws.elo }, side: white === oppName ? 'white' : 'black' });
        console.log('[ws] matched ' + meName + ' vs ' + oppName + ' (' + matchId + ')');
      } else {
        waiting = { user: ws.displayName, elo: ws.elo, ws };
        wsSend(ws, { type: 'queued' });
      }
      return;
    }

    if (msg.type === 'leaveQueue') {
      if (waiting && waiting.ws === ws) waiting = null;
      wsSend(ws, { type: 'queueLeft' });
      return;
    }

    // --- Friend challenges over WebSocket ---
    if (msg.type === 'challenge') {
      const targetKey = (msg.to || '').toLowerCase();
      const targetWs = sockets.get(targetKey);
      if (!targetWs) { wsSend(ws, { type: 'challengeFailed', to: msg.to, reason: 'offline' }); return; }
      wsSend(targetWs, { type: 'challenge', from: ws.displayName, fromKey: ws.userKey, elo: ws.elo || 500 });
      wsSend(ws, { type: 'challengeSent', to: msg.to });
      return;
    }
    if (msg.type === 'challengeAccept') {
      const challengerKey = (msg.fromKey || msg.from || '').toLowerCase();
      const challengerWs = sockets.get(challengerKey);
      if (!challengerWs) { wsSend(ws, { type: 'challengeFailed', to: msg.from, reason: 'offline' }); return; }
      // Create a live match between challenger and me (acceptor)
      const matchId = 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const meName = ws.displayName, oppName = challengerWs.displayName;
      const whiteIsChallenger = Math.random() < 0.5;
      const white = whiteIsChallenger ? oppName : meName;
      const black = whiteIsChallenger ? meName : oppName;
      liveMatches.set(matchId, { white, black, moves: [], a: ws.userKey, b: challengerWs.userKey });
      ws.matchId = matchId; challengerWs.matchId = matchId;
      wsSend(ws, { type: 'matched', matchId, opponent: { name: oppName, elo: challengerWs.elo || 500 }, side: white === meName ? 'white' : 'black' });
      wsSend(challengerWs, { type: 'matched', matchId, opponent: { name: meName, elo: ws.elo || 500 }, side: white === oppName ? 'white' : 'black' });
      console.log('[ws] challenge match ' + meName + ' vs ' + oppName);
      return;
    }
    if (msg.type === 'challengeDecline') {
      const challengerWs = sockets.get((msg.fromKey || msg.from || '').toLowerCase());
      if (challengerWs) wsSend(challengerWs, { type: 'challengeDeclined', by: ws.displayName });
      return;
    }

    if (msg.type === 'move') {
      const m = liveMatches.get(msg.matchId);
      if (!m) return;
      m.moves.push({ from: msg.from, to: msg.to, promo: msg.promo || null, by: ws.userKey });
      // Relay to the OTHER player
      const otherKey = m.a === ws.userKey ? m.b : m.a;
      const otherWs = sockets.get(otherKey);
      wsSend(otherWs, { type: 'move', matchId: msg.matchId, from: msg.from, to: msg.to, promo: msg.promo || null });
      return;
    }

    if (msg.type === 'gameover') {
      const m = liveMatches.get(msg.matchId);
      if (m) {
        const otherKey = m.a === ws.userKey ? m.b : m.a;
        wsSend(sockets.get(otherKey), { type: 'gameover', matchId: msg.matchId, status: msg.status, winner: msg.winner });
        liveMatches.delete(msg.matchId);
      }
      return;
    }

    if (msg.type === 'chat') {
      const m = liveMatches.get(msg.matchId);
      if (!m) return;
      const otherKey = m.a === ws.userKey ? m.b : m.a;
      wsSend(sockets.get(otherKey), { type: 'chat', from: ws.displayName, text: String(msg.text || '').slice(0, 200) });
      return;
    }
  });

  ws.on('close', () => {
    if (waiting && waiting.ws === ws) waiting = null;
    if (ws.userKey) sockets.delete(ws.userKey);
    // Notify opponent if in a live match
    if (ws.matchId) {
      const m = liveMatches.get(ws.matchId);
      if (m) {
        const otherKey = m.a === ws.userKey ? m.b : m.a;
        wsSend(sockets.get(otherKey), { type: 'opponentLeft', matchId: ws.matchId });
      }
    }
    });
  });
  console.log('[ws] real-time multiplayer enabled at /ws');
}

// Set up WebSockets if possible, but NEVER let it stop the HTTP server from starting
try { setupWebSockets(); } catch (e) { console.warn('[ws] setup failed, continuing without it: ' + e.message); }

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log('chess server listening on ' + port + (WebSocket ? ' (HTTP + WebSocket /ws)' : ' (HTTP only)'));
  console.log('users: ' + Object.keys(db.users).length + ' (' + SEED_AI.length + ' AI seeded)');
  console.log('data dir: ' + dataDir + (process.env.DATA_DIR ? ' (persistent volume)' : ' (EPHEMERAL — set DATA_DIR + add a Railway Volume to keep players across redeploys)'));
});

// Last-resort guard: don't let an unexpected error crash the whole process/site
process.on('uncaughtException', (e) => console.error('[uncaught]', e));
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
