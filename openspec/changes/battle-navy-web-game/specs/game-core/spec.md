## ADDED Requirements

### Requirement: Coordinate system
The game SHALL use a 10×10 grid where columns are labeled A-J and rows are labeled 1-10. A coordinate SHALL be represented as `{ col: number, row: number }` where both values are 0-indexed (0-9).

#### Scenario: Valid coordinate creation
- **WHEN** a coordinate is created with col=0 and row=0
- **THEN** it maps to board position A1

#### Scenario: Invalid coordinate rejection
- **WHEN** a coordinate is created with col=10 or row=10
- **THEN** the system SHALL reject it as out of bounds

### Requirement: Ship definition
The game SHALL define exactly 5 ships per player with the following sizes: Carrier (5), Battleship (4), Cruiser (3), Submarine (3), Destroyer (2). Each ship SHALL have an id, name, size, and orientation.

#### Scenario: All ships present
- **WHEN** a new game starts
- **THEN** each player SHALL have exactly 5 ships with the defined sizes

### Requirement: Ship placement validation
The system SHALL validate ship placement according to these rules: ships MUST be placed entirely within the 10×10 grid, ships MUST NOT overlap, ships SHALL be placed either horizontally or vertically (not diagonally).

#### Scenario: Ship placed out of bounds
- **WHEN** a player attempts to place a ship extending beyond column 9 or row 9
- **THEN** the system SHALL reject the placement

#### Scenario: Ships overlapping
- **WHEN** a player attempts to place a ship overlapping an already-placed ship
- **THEN** the system SHALL reject the placement

#### Scenario: Valid ship placement accepted
- **WHEN** a player places all 5 ships within bounds and without overlap
- **THEN** the system SHALL accept the placement and mark the player as ready

### Requirement: Attack resolution
When a player attacks a coordinate, the system SHALL resolve the attack as follows:
- **Miss**: No ship occupies the target coordinate
- **Hit**: A ship occupies the target coordinate but is not fully sunk
- **Sink**: The hit causes a ship's last remaining segment to be hit

#### Scenario: Attack misses
- **WHEN** Player A attacks an empty coordinate on Player B's board
- **THEN** the result SHALL be "miss" and the coordinate SHALL be marked

#### Scenario: Attack hits a ship
- **WHEN** Player A attacks a coordinate occupied by one of Player B's ships
- **THEN** the result SHALL be "hit" and the ship's hit count SHALL increment

#### Scenario: Attack sinks a ship
- **WHEN** Player A lands the last remaining hit on a ship
- **THEN** the result SHALL be "sink" with the ship id included

### Requirement: Win condition
The game SHALL detect when all 5 ships of a player have been fully sunk. The player who sinks all opponent ships SHALL be declared the winner.

#### Scenario: All ships sunk
- **WHEN** the last segment of the last remaining ship is hit
- **THEN** the game SHALL end and the attacking player SHALL win

#### Scenario: Game continues
- **WHEN** at least one ship still has remaining segments
- **THEN** the game SHALL continue

### Requirement: Turn sequencing
Turns SHALL alternate strictly between the two players. A player SHALL NOT be allowed to attack when it is not their turn. The player who did not place first SHALL attack first.

#### Scenario: Correct turn order
- **WHEN** both players have placed ships
- **THEN** the player who placed second SHALL receive the first attack turn

#### Scenario: Out-of-turn attack rejected
- **WHEN** a player attempts to attack when it is not their turn
- **THEN** the server SHALL reject the attack
