# Chess RNG — Project Documentation

> "A normal chess app, but it becomes not normal."

A single-page chess game with a full RNG meta-game layered on top: skin rolls, board & piece skins, ELO matchmaking, AI opponents, real-time multiplayer, a shop, music, upgrades, and admin tools.

**Live:** https://samsungrivals-totally-normal-chess-not-horror-production.up.railway.app/
**Repo:** https://github.com/samsungrivals/samsungrivals-totally-normal-chess-not-horror

---

## File structure

| File | Purpose |
|------|---------|
| `index.html` | The entire client — HTML, CSS, and game JS inline (chess engine, RNG meta-game, UI, WebSocket client). |
| `server.js` | Node/Express backend — static hosting + REST API + WebSocket multiplayer. |
| `package.json` | Dependencies (`express`, `ws`); `start` runs `node server.js`. |
| `db.json` | Server data store (auto-created). **Wiped on each Railway redeploy** — see Persistence below. |
| `music/track1.ogg`, `music/track2.ogg` | Custom uploaded music tracks. |
| `README.md` | Short public readme. |
| `PROJECT.md` | This document. |

---

## Chess engine (client)

- Full legal move generation: castling, en passant, promotion, check/checkmate/stalemate detection.
- Draw detection: 50-move rule, threefold repetition, insufficient material.
- Modes: Local pass-and-play, vs Computer (bots), Find Match (online), Friends challenges.
- Board is fixed at 72px squares ("1000" quality).

### AI opponents
Negamax + alpha-beta with piece-square tables.
- **Noob / Beginner** — random / capture-greedy
- **Casual / Skilled** — depth-1
- **Pros** (depth-2): Magnus Carlsen (2882), Hikaru Nakamura (2802), Bobby Fischer (2785), Garry Kasparov (2851), Fabiano Caruana (2820)
- **Stockfish 3200** (depth-3) — unlocked via the Stockfish upgrade

---

## RNG meta-game

### Currencies
- **£ money** (in-game, stored in pence) — earned per roll, spent in shop/upgrades.
- **Rolls** — counter; some upgrades cost rolls.
- **Luck** — global multiplier feeding roll odds (shown bottom-left).
- **ELO** — starts 500; changes on win/loss/draw.

### Board skins (rarities)
| Skin | Odds / Source | Rarity |
|------|---------------|--------|
| Poo | 1/3 | Garbage |
| Green & Yellow | 1/10 | Common |
| Rainbow | 1/100 | Rare |
| 67 | 1/1,000 (shows "67" graphic) | Cosmic |
| Nothing | 1/500 | Cosmic |
| Admin | 1/5,000 | Admin |
| Real Admin | jackpot/admin | Admin |
| Secret | 1/1,000,000 | SECRET |
| OMEGA | ultra-rare (mega cutscene) | OMEGA |
| INFINITY | 100th-roll @ luck≥1e10 (portal cutscene) | MEGA ADMIN |
| ROYAL | £1,000,000 in shop | Admin |
| VIP | auto-granted with NVP++ | NVP++ ONLY |
| **OWNER** | owner-exclusive command | OWNER |

### Cutscenes (skippable in Settings)
- Standard (1/500+), Ultra/yellow (1/100k+), Mega/chest+bangs (OMEGA), Infinity/portal+chime.
- Jackpot wheel: 1/1,000,000,000,000 chance → spins for Rainbow/Nothing/Real Admin.

### Piece skins
Bronze (ELO 750) · Silver (1200) · Gold (1500) · Diamond (2000), plus ELO money rewards at 600/1000/1800.

### Upgrades (permanent; each has a ✖ Stop = refund)
Dual Equip → 2x/4x/8x Luck → Stockfish 3200 → Auto-Open Packs → 124x Luck; Triple Roll; **Cash God** (62,978 rolls → ×1e9 cash); **Infinite Equip** (2e50 → every rank a different skin).

### Shop
Godly packs (1/3/10/100), Yearly free pack, Nothing gamepass, money packs, server-luck tiers (up to 1,048,576×), gamepasses: 2x Money, VIP, NVP, NVP+, NVP++, NVP=+++++.

---

## Server API (`server.js`)

### REST
- **Accounts:** `POST /api/signup`, `POST /api/login`
- **Leaderboard:** `GET /api/leaderboard` (top 50, real + 18 AI), `POST /api/elo`, `POST /api/elo/reset-all` (owner-only, skips owner)
- **Users/Friends:** `GET /api/users/search`, `GET /api/friends`, `POST /api/friends/add`, `POST /api/friends/remove`, `GET /api/friends/mycode`, `POST /api/friends/addByCode`
- **Announcements:** `POST /api/announce`, `GET /api/announce/since`
- **Matchmaking:** `POST /api/queue/join`, `POST /api/queue/leave`, `GET/POST /api/match/*`
- **Challenges:** `POST /api/challenge/*`
- **Admin:** `GET /api/admins/is`, `POST /api/admins/grant`, `POST /api/admins/revoke` (owner-only)
- **Global luck:** `GET /api/globalluck`, `POST /api/globalluck/multiply`
- **Music:** `POST /api/music/request`
- **Stats:** `GET /api/stats`

### WebSocket (`/ws`) — real-time multiplayer
Messages: `hello`, `queue`/`leaveQueue`, `matched`, `move`, `gameover`, `challenge`/`challengeAccept`/`challengeDecline`, `opponentLeft`. Wrapped in try/catch so the site still runs if `ws` is unavailable.

---

## Accounts & admin

- Accounts stored server-side **and** in browser localStorage (so login works offline / after a server reset).
- Friend codes: `CHESS-XXXXXX`, derived deterministically from username.
- **Owner:** `samsungrivals_owner_` — the only admin. Can grant/revoke admin to others.
- **👑 Owner button** (right of ELO): everyone sees it, only the owner can open it. Owner-only commands (Give Admin, Remove Admin, Give OWNER skin, Reset ALL ELO) appear **only** when opened via this button.

---

## Persistence — important limitation

The server stores everything in `db.json` on Railway's **ephemeral filesystem**, which is **wiped on every redeploy**. Effects:
- Real players vanish from the leaderboard after each deploy (AI are re-seeded in code, so they stay).
- Accounts survive locally (localStorage) but lose their server-side ELO/friends.

**Proper fix (not yet applied):** mount a Railway **Volume** and point `db.json` at it (e.g. `DATA_DIR=/data`). This makes data survive redeploys.

Client `localStorage` keys: `chessmeta` (progress), `chessaccts` (local accounts), `chesslb` (cached leaderboard).

---

## Deployment

GitHub `main` → Railway auto-deploys. Server serves static files with **no-cache headers on HTML** so updates appear without a hard refresh.

```bash
git add . && git commit -m "msg" && git push
```

### Local run
Requires Node 18+:
```bash
npm install
npm start   # http://localhost:3000
```

---

## Testing

No Node/Python on the dev machine, so each change is verified by an automated PowerShell suite against the **live deployment**: HTTP 200, presence of new code, brace/paren balance (catches page-breaking syntax errors), and API endpoint health (`ok:true`). Runtime/click-level logic isn't auto-covered — check the browser console (Ctrl+Shift+J) for red errors if a button misbehaves.

---

## Known limitations / future work

1. **Persistence** — add a Railway Volume so players survive redeploys (biggest item).
2. Numbers can exceed JS `Number` precision (e.g. 2e50 cash) — display only, not exact.
3. Matchmaking/challenges require both players online (real-time over WebSocket).
4. Music upload "request to feature" opens a Gmail compose; it can't auto-send or attach the file.
