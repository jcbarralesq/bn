## Context

This project transforms the original single-player Battle Navy concept into a full-stack multiplayer game. The game follows the classic Battleship rules on a 10×10 grid with 5 ships per player. The server is authoritative, validating all actions and managing game state. The client is a Vite + p5.js frontend that renders the game and communicates with the server via WebSockets (Socket.io). Matchmaking is automatic — players enter a nickname and join a queue; the server pairs them when two are ready.

## Goals / Non-Goals

**Goals:**
- Anonymous multiplayer with nickname-based identity (session-scoped, no persistence)
- Automatic matchmaking that pairs two players from a queue
- Server-authoritative game engine: all placement, attack, and timer logic validated server-side
- Classic 10×10 grid, 5 ships with standard sizes (5, 4, 3, 3, 2)
- 10-second-per-turn timer with auto-attack on timeout
- Private rooms with in-memory state (no database needed for MVP)
- Reactivity via Socket.io — server pushes events, client renders

**Non-Goals:**
- Persistent accounts, authentication, or database storage (post-MVP)
- AI opponent (post-MVP)
- Chat system during games (post-MVP)
- Spectator mode (post-MVP)
- Mobile responsiveness beyond basic usability (nice-to-have)
- Leaderboards or ranked matchmaking (post-MVP)

## Decisions

### Client-Server Architecture with Server Authority

The server owns all game state and logic. Clients send intents (place ships here, attack here), the server validates and resolves them, then broadcasts results. This prevents the most common form of cheating (seeing opponent's board via client-side state).

**Alternatives considered:**
- **Peer-to-peer (WebRTC)**: No server cost, but no anti-cheat, harder to implement reconnection, more complex signaling. Rejected for MVP.
- **Serverless (functions + DynamoDB)**: Works for turn-based, but WebSocket management is awkward with Lambda. Rejected for MVP.

### Socket.io over Raw WebSockets

Socket.io provides rooms, automatic reconnection, fallback transports, and a clean event-based API. For a turn-based game where message ordering and delivery guarantees matter, this saves significant boilerplate.

**Alternatives considered:**
- **Raw WebSocket (ws)**: More control, fewer dependencies, but need to implement rooms, reconnection, and message routing manually. Rejected for MVP velocity.
- **HTTP long-polling**: Works but no server-push for real-time updates without polling. Rejected because turn-based play benefits from instant notification.

### In-Memory State over Database

For the MVP, all game rooms and matchmaking state live in server memory. A simple `Map<string, GameRoom>` is sufficient for a handful of concurrent games. If scale becomes a concern, Redis or PostgreSQL can be introduced later.

**Alternatives considered:**
- **PostgreSQL from day one**: Adds deployment complexity (need a database), slows iteration. Overkill for MVP.
- **Redis**: Great for pub/sub and state, but adds an infrastructure dependency. Deferred.

### Shared Types Package

A `shared/` directory contains TypeScript types and interfaces used by both client and server: `Coordinate`, `Ship`, `Board`, `GameState`, `GamePhase`, and the complete Socket.io event contract. This ensures type safety across the wire and prevents drift.

### Project Structure

```
/
├── server/
│   ├── src/
│   │   ├── index.ts          # Express + Socket.io server entry
│   │   ├── GameEngine.ts     # Authoritative game logic
│   │   ├── Matchmaker.ts     # Queue + pairing logic
│   │   ├── RoomManager.ts    # Room lifecycle management
│   │   └── TimerManager.ts   # Per-turn 10s timer
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── main.ts           # Entry point, p5.js sketch setup
│   │   ├── LobbyScene.ts     # Nickname input, matchmaking status
│   │   ├── PlacementScene.ts # Ship placement UI
│   │   ├── BattleScene.ts    # Main game view (two boards + timer)
│   │   ├── GameOverScene.ts  # Result screen
│   │   ├── BoardRenderer.ts  # p5.js board drawing utilities
│   │   └── NetworkClient.ts  # Socket.io client wrapper
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── shared/
│   ├── types.ts              # Coordinate, Ship, Board, GameState, etc.
│   └── events.ts             # Socket.io event name constants + payload types
└── package.json              # Root workspace (optional, for scripts)
```

### Deploy Strategy

The Express server serves both the Socket.io backend and the Vite-built static client files. A single `Dockerfile` or build command deploys to Railway/Fly.io. In development, Vite dev server proxies Socket.io requests to the backend.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| [In-memory state lost on server restart] | All active games would be lost. Acceptable for MVP. Add Redis persistence post-MVP. |
| [Player disconnects mid-game] | Socket.io reconnection with a grace period (e.g., 30s). If not reconnected, opponent gets a win. |
| [Timer drift between client and server] | Server is the single source of truth for time. Client only displays remaining time from server events. |
| [Race conditions in matchmaking] | Matchmaker uses a mutex/lock on the queue to prevent pairing the same player twice. |
| [CORS issues in development] | Vite config proxies `/socket.io` to the backend port. Production uses same-origin. |
