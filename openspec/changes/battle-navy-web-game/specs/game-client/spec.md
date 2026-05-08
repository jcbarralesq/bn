## ADDED Requirements

### Requirement: Lobby screen
The client SHALL display a lobby screen with a nickname input field, a "Join Queue" button, and a status area showing "Waiting for opponent..." or "Match found!" based on server events.

#### Scenario: Player enters nickname and joins queue
- **WHEN** a player enters a valid nickname and clicks "Join Queue"
- **THEN** the client SHALL send the nickname to the server and show "Waiting for opponent..."

#### Scenario: Empty nickname rejected
- **WHEN** a player clicks "Join Queue" with an empty nickname
- **THEN** the client SHALL display an error message locally

#### Scenario: Match found
- **WHEN** the server emits a match-found event
- **THEN** the client SHALL display the opponent's nickname and transition to the placement screen

### Requirement: Ship placement screen
The client SHALL display a 10×10 board where the player can place ships by selecting a ship, clicking a starting cell, and choosing orientation (horizontal/vertical). Ships SHALL be listed with their remaining size. The client SHALL validate placement locally (bounds and overlap) before sending to the server but MUST defer to the server's final validation.

#### Scenario: Player places all ships
- **WHEN** the player successfully places all 5 ships and clicks "Ready"
- **THEN** the client SHALL send the placement to the server and wait for confirmation

#### Scenario: Placement rejected by server
- **WHEN** the server rejects a placement
- **THEN** the client SHALL return to placement mode with an error message

#### Scenario: Both players ready
- **WHEN** the server emits a game-start event (both players placed)
- **THEN** the client SHALL transition to the battle screen

### Requirement: Battle screen
The client SHALL display two 10×10 boards: the player's own board (showing all ships and attacks received) on the left, and the opponent's board (showing only player's attacks — hits in red, misses in white) on the right. A timer SHALL display remaining seconds for the current turn. A status bar SHALL show whose turn it is.

#### Scenario: Player's turn
- **WHEN** it is the player's turn
- **THEN** the opponent's board SHALL accept click input, a timer SHALL count down from 10, and the status SHALL display "Your turn"

#### Scenario: Opponent's turn
- **WHEN** it is the opponent's turn
- **THEN** the opponent's board SHALL be non-interactive, and the status SHALL display "Opponent's turn"

#### Scenario: Attack result displayed
- **WHEN** a player attacks a coordinate
- **THEN** the opponent's board SHALL show the result: red circle for hit, white circle for miss

#### Scenario: Ship sunk notification
- **WHEN** a ship is sunk
- **THEN** the client SHALL display "Ship sunk!" with the ship name and mark all its cells

#### Scenario: Timer expires
- **WHEN** the timer reaches 0
- **THEN** the client SHALL display "Time's up!" and wait for the server's auto-attack result

### Requirement: Game over screen
The client SHALL display a game over screen showing the result (Victory/Defeat), both final boards with all hits revealed, and a "Play Again" button that returns to the lobby.

#### Scenario: Player wins
- **WHEN** the server emits a game-over event with the player as winner
- **THEN** the client SHALL display "Victory!" with the final boards

#### Scenario: Player loses
- **WHEN** the server emits a game-over event with the opponent as winner
- **THEN** the client SHALL display "Defeat!" with the final boards

#### Scenario: Play again
- **WHEN** the player clicks "Play Again"
- **THEN** the client SHALL return to the lobby screen

### Requirement: Visual feedback
The client SHALL use visual feedback for game events: hit (red), miss (white), sinking (red with X), ship placement (blue highlight for valid, red for invalid), timer warning (yellow at 5s, red at 3s), and transition animations between phases.

#### Scenario: Timer visual warning
- **WHEN** the timer reaches 5 seconds
- **THEN** the timer SHALL turn yellow
- **WHEN** the timer reaches 3 seconds
- **THEN** the timer SHALL turn red
