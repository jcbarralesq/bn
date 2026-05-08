## 1. Project scaffolding

- [x] 1.1 Initialize root workspace with npm workspaces (server, client, shared)
- [x] 1.2 Create `shared/` package with TypeScript config and types
- [x] 1.3 Create `server/` package with Express + Socket.io + TypeScript config
- [x] 1.4 Create `client/` package with Vite + TypeScript + p5.js config
- [x] 1.5 Add shared npm scripts (dev, build, start) in root package.json

## 2. Shared types and constants

- [x] 2.1 Define Coordinate, Ship, ShipType, Board, GamePhase types in shared/types.ts
- [x] 2.2 Define all Socket.io event name constants and payload interfaces in shared/events.ts
- [x] 2.3 Define game constants (GRID_SIZE=10, SHIPS config, TURN_TIME_LIMIT=10, RECONNECT_GRACE=30)
- [x] 2.4 Define ShipPlacement, AttackResult, GameState, Player types

## 3. Server: Core game engine

- [x] 3.1 Implement Board class with ship placement validation (bounds, overlap)
- [x] 3.2 Implement Ship class with hit tracking and sunk detection
- [x] 3.3 Implement GameEngine class: attack resolution, turn management, win condition
- [x] 3.4 Implement random coordinate generator for auto-attack on timeout
- [x] 3.5 Write unit tests for game engine logic (placement, attack, sinking, win)

## 4. Server: Matchmaking and rooms

- [x] 4.1 Implement Matchmaker class: queue management, pair logic, mutex locking
- [x] 4.2 Implement RoomManager class: room creation, phase tracking, cleanup
- [x] 4.3 Implement TimerManager class: per-turn 10s countdown, auto-attack trigger
- [x] 4.4 Wire Socket.io server with Express in server/src/index.ts
- [x] 4.5 Handle player:join event with nickname validation
- [x] 4.6 Handle game:place_ships event with server validation
- [x] 4.7 Handle game:attack event with server validation and broadcast
- [x] 4.8 Handle disconnection with 30s grace period and forfeit logic

## 5. Client: Lobby and matchmaking UI

- [x] 5.1 Create index.html with canvas container and lobby HTML elements
- [x] 5.2 Implement NetworkClient class wrapping Socket.io client connection
- [x] 5.3 Implement LobbyScene: nickname input, join queue, status display
- [x] 5.4 Handle match:found event and transition to placement scene

## 6. Client: Ship placement

- [x] 6.1 Render 10×10 board with grid lines and coordinate labels
- [x] 6.2 Implement PlacementScene: ship selection, click-to-place, orientation toggle
- [x] 6.3 Add local validation highlighting (valid/invalid position preview)
- [x] 6.4 Implement "Ready" button that sends placement to server
- [x] 6.5 Handle server placement rejection with error display

## 7. Client: Battle scene

- [x] 7.1 Render player's board (own ships + received attacks)
- [x] 7.2 Render opponent's board (player's attacks only)
- [x] 7.3 Implement click-to-attack on opponent's board during player turn
- [x] 7.4 Implement timer display with color warning (yellow at 5s, red at 3s)
- [x] 7.5 Handle game:attack_result and game:opponent_attack events
- [x] 7.6 Animate hit (red circle) and miss (white dot) results
- [x] 7.7 Show sunk ship notification with ship name

## 8. Client: Game over and transitions

- [x] 8.1 Implement GameOverScene: victory/defeat display, final boards revealed
- [x] 8.2 Add "Play Again" button that returns to lobby
- [x] 8.3 Handle disconnection notifications during game
- [x] 8.4 Add phase transition animations (lobby → placement → battle → result)

## 9. CSS and visual polish

- [x] 9.1 Create naval-themed CSS (dark blues, grays, naval typography)
- [x] 9.2 Style lobby elements, buttons, and status messages
- [x] 9.3 Style game boards, grid cells, and coordinate labels
- [x] 9.4 Style timer, notifications, and game over screen
- [x] 9.5 Ensure basic responsiveness for different screen sizes

## 10. Integration and deployment

- [x] 10.1 Configure Express server to serve built client static files
- [x] 10.2 Add CORS configuration for development mode
- [x] 10.3 Create production build script (build shared → build client)
- [x] 10.4 Create Dockerfile or Railway/Fly.io deployment config
- [x] 10.5 Write end-to-end test: two browser clients play a full game
- [ ] 10.6 Deploy to Railway/Fly.io and verify
