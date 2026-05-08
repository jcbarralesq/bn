## ADDED Requirements

### Requirement: Client-to-server events
The client SHALL emit the following events to the server, each with typed payloads:

| Event | Payload | Description |
|---|---|---|
| `player:join` | `{ nickname: string }` | Register player and join matchmaking |
| `player:leave_queue` | `{}` | Remove player from matchmaking queue |
| `game:place_ships` | `{ ships: ShipPlacement[] }` | Submit ship placement positions |
| `game:attack` | `{ x: number, y: number }` | Attack a coordinate |
| `game:acknowledge_over` | `{}` | Acknowledge game over screen seen |

#### Scenario: Player sends join event
- **WHEN** a player submits their nickname
- **THEN** the client SHALL emit `player:join` with the nickname

#### Scenario: Player attacks
- **WHEN** a player clicks a cell on the opponent's board
- **THEN** the client SHALL emit `game:attack` with the x, y coordinates

### Requirement: Server-to-client events
The server SHALL emit the following events to clients, each with typed payloads:

| Event | Payload | Description |
|---|---|---|
| `player:joined` | `{ id: string, nickname: string }` | Confirmation of registration |
| `player:error` | `{ message: string }` | Error message (invalid nickname, etc.) |
| `match:found` | `{ roomId: string, opponent: { id: string, nickname: string }, youStartPlacing: boolean }` | Opponent found, game starting |
| `match:queue_status` | `{ position: number }` | Queue position update (optional) |
| `game:start_placement` | `{}` | Begin ship placement phase |
| `game:opponent_ready` | `{}` | Opponent has placed ships |
| `game:start` | `{ yourTurn: boolean }` | Battle phase begins |
| `game:your_turn` | `{ timeLimit: number }` | It's your turn to attack |
| `game:opponent_turn` | `{}` | Opponent is thinking |
| `game:attack_result` | `{ x: number, y: number, result: 'hit' | 'miss' | 'sink', shipId?: string, shipName?: string }` | Result of your attack |
| `game:opponent_attack` | `{ x: number, y: number, result: 'hit' | 'miss' | 'sink', shipId?: string, shipName?: string }` | Opponent attacked you |
| `game:timer_tick` | `{ remaining: number }` | Timer sync (every second) |
| `game:timer_expired` | `{ x: number, y: number, result: 'hit' | 'miss' }` | Timer ran out, auto-attack executed |
| `game:over` | `{ winner: string, loser: string, reason: 'all_sunk' | 'disconnect' | 'forfeit' }` | Game ended |
| `game:opponent_disconnected` | `{ waitTime: number }` | Opponent disconnected, waiting for reconnection |
| `game:opponent_reconnected` | `{}` | Opponent reconnected |
| `game:opponent_forfeit` | `{}` | Opponent's reconnection time expired |

#### Scenario: Match found notification
- **WHEN** a match is found
- **THEN** the server SHALL emit `match:found` to both players with opponent info

#### Scenario: Attack result broadcast
- **WHEN** a player attacks
- **THEN** the server SHALL emit `game:attack_result` to the attacker and `game:opponent_attack` to the defender

### Requirement: Event validation
The server SHALL validate all incoming events. Events with invalid payloads (wrong types, missing fields, out-of-bounds values) SHALL be rejected with a `player:error` response. The client SHALL handle errors gracefully by displaying the error message.

#### Scenario: Invalid attack coordinates
- **WHEN** a player sends `game:attack` with x=15, y=15
- **THEN** the server SHALL emit `player:error` with message "Invalid coordinates"

#### Scenario: Missing ship data
- **WHEN** a player sends `game:place_ships` without a ships array
- **THEN** the server SHALL emit `player:error` with message "Missing ship data"

### Requirement: TypeScript types
All event payloads SHALL be defined as TypeScript interfaces in the shared package. Both client and server SHALL import these types to ensure compile-time type safety.

#### Scenario: Type safety across client and server
- **WHEN** an event payload type is changed in the shared package
- **THEN** both client and server SHOULD produce a TypeScript compilation error if their usage is inconsistent
