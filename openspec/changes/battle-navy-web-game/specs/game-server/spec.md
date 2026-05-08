## ADDED Requirements

### Requirement: Anonymous authentication
The server SHALL accept a nickname string (1-20 characters, alphanumeric and spaces) from each connecting client. The server SHALL assign a unique session ID and register the player in the matchmaking queue upon receiving their nickname.

#### Scenario: Player joins with valid nickname
- **WHEN** a client connects and sends a valid nickname
- **THEN** the server SHALL register the player and add them to the matchmaking queue

#### Scenario: Player joins with empty nickname
- **WHEN** a client connects with an empty or whitespace-only nickname
- **THEN** the server SHALL reject the registration with an error

### Requirement: Matchmaking queue
The server SHALL maintain a queue of players waiting for a game. When at least 2 players are in the queue, the server SHALL pair the two earliest players and create a game room. Players SHALL be notified when a match is found.

#### Scenario: Two players in queue
- **WHEN** a second player joins the queue while one player is already waiting
- **THEN** both players SHALL be paired and notified of the match

#### Scenario: Single player waiting
- **WHEN** only one player is in the queue
- **THEN** the server SHALL display "waiting for opponent" status

### Requirement: Game room lifecycle
The server SHALL create a game room when two players are matched. The room SHALL progress through the following phases: PLACEMENT → BATTLE → GAME_OVER. The room SHALL be destroyed when both players acknowledge the game over or disconnect.

#### Scenario: Room created on match
- **WHEN** two players are matched
- **THEN** a game room SHALL be created in PLACEMENT phase with both players assigned

#### Scenario: Room cleanup on game over
- **WHEN** both players have acknowledged game over
- **THEN** the room SHALL be destroyed and memory released

### Requirement: Turn timer
The server SHALL enforce a 10-second turn timer. When a player's turn starts, the server SHALL start a 10-second countdown. If the player does not submit an attack within 10 seconds, the server SHALL execute an attack on a random valid coordinate on the opponent's board.

#### Scenario: Player attacks within time
- **WHEN** a player submits an attack within 10 seconds
- **THEN** the timer SHALL be cancelled and the opponent's turn SHALL start

#### Scenario: Timer expires
- **WHEN** 10 seconds pass without an attack
- **THEN** the server SHALL execute a random attack and notify both players

### Requirement: Authoritative game validation
The server SHALL be the single source of truth for all game state. The server SHALL validate every ship placement and every attack before applying it. Clients SHALL NOT compute game outcomes.

#### Scenario: Invalid placement rejected
- **WHEN** a player sends an invalid ship placement (out of bounds or overlapping)
- **THEN** the server SHALL reject it and request a valid placement

#### Scenario: Attack on already-attacked coordinate
- **WHEN** a player attacks a coordinate that was already attacked
- **THEN** the server SHALL reject the attack and the turn SHALL NOT pass

### Requirement: Disconnection handling
If a player disconnects during a game, the server SHALL start a 30-second reconnection grace period. If the player does not reconnect within 30 seconds, the disconnected player SHALL forfeit and the opponent SHALL win.

#### Scenario: Player reconnects in time
- **WHEN** a disconnected player reconnects within 30 seconds
- **THEN** the game SHALL resume from its current state

#### Scenario: Player does not reconnect
- **WHEN** 30 seconds pass without reconnection
- **THEN** the opponent SHALL be declared the winner
