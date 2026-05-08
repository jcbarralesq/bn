export const BASE_W = 1100;
export const BASE_H = 700;

let _scale = 1;
let _offsetX = 0;
let _offsetY = 0;

export function setTransform(s: number, ox: number, oy: number): void {
  _scale = s;
  _offsetX = ox;
  _offsetY = oy;
}

/** Convert screen coordinates to base (1100x700) coordinate space */
export function toBase(screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: (screenX - _offsetX) / _scale,
    y: (screenY - _offsetY) / _scale,
  };
}
