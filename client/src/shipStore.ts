/** Almacenamiento compartido de posiciones de barcos — independiente del flujo de eventos */

let myShips: { shipType: string; cells: { x: number; y: number }[] }[] = [];

export function setMyShips(ships: { shipType: string; cells: { x: number; y: number }[] }[]): void {
  myShips = ships;
}

export function getMyShips(): { shipType: string; cells: { x: number; y: number }[] }[] {
  return myShips;
}
