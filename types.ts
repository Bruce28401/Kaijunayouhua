
export interface HandPosition {
  x: number;
  y: number;
}

export interface HandData {
  left: HandPosition | null;
  right: HandPosition | null;
}

export interface ScrollState {
  leftX: number;
  rightX: number;
}
