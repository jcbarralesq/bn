## Why

There is no playable multiplayer Battle Navy (Battleship) game in this project. Building a browser-based multiplayer version using p5.js with HTML5 Canvas on the client and Node.js + Socket.io on the server provides an interactive, real-time turn-based game that two players can play together online with matchmaking, anonymous authentication, and a 10-second-per-turn limit.

## What Changes

- Create a full-stack multiplayer Battle Navy web game with client and server
- TypeScript codebase shared between client and server where possible
- Anonymous authentication: players enter a nickname to join the matchmaking queue
- Matchmaking system that pairs two players automatically
- Private game rooms managed on the server with in-memory state (no database in MVP)
- Server-authoritative game engine that validates all moves to prevent cheating
- Classic 10×10 grid with 5 ships per player (carrier=5, battleship=4, cruiser=3, submarine=3, destroyer=2)
- 10-second turn timer: if a player doesn't attack in time, the server auto-attacks a random coordinate
- p5.js rendered boards on HTML5 Canvas with naval-themed CSS styling
- Real-time board updates via Socket.io events (no polling)
- Game phases: Lobby → Matchmaking → Ship Placement → Battle → Game Over

## Capabilities

### New Capabilities
- `game-core`: Shared core game engine — grid state, coordinate system, ship placement validation, attack resolution, turn management. Used by both client and server.
- `game-server`: Server-side game backend — Node.js + Express + Socket.io server, matchmaking queue, room management, authoritative game engine, timer management, event broadcasting.
- `game-client`: Client-side game frontend — Vite + TypeScript bundle, p5.js canvas rendering, lobby UI, ship placement with click-to-place, battle view with two boards, timer display, game over screen.
- `game-network`: Network protocol layer — Socket.io event definitions, message types, client-server contract shared between client and server.

### Modified Capabilities
<!-- No existing capabilities are being modified -->

## Impact

- New files created under `client/` (Vite frontend) and `server/` (Node.js backend) directories
- Shared types under `shared/` directory
- New npm dependencies: socket.io, socket.io-client, express, vite, typescript, p5.js (via CDN or npm)
- Server deployable to Railway or Fly.io
- Client deployable as static assets (can be served by the same Express server)
- No existing code is modified; all changes are additive
