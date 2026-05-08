import { ShipType, type ShipConfig } from './types';

export const GRID_SIZE = 10;

export const SHIPS: ShipConfig[] = [
  { type: ShipType.Carrier, size: 5, name: 'Portaaviones' },
  { type: ShipType.Battleship, size: 4, name: 'Acorazado' },
  { type: ShipType.Cruiser, size: 3, name: 'Crucero' },
  { type: ShipType.Submarine, size: 3, name: 'Submarino' },
  { type: ShipType.Destroyer, size: 2, name: 'Destructor' },
];

export const TURN_TIME_LIMIT = 10; // seconds
export const RECONNECT_GRACE_PERIOD = 30; // seconds
