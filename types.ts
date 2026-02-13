export interface RouletteItem {
  id: string;
  text: string;
  color: string; // Hex code or Tailwind class
  played?: boolean; // Whether the item has been selected previously
}

export enum GameState {
  IDLE = 'IDLE',
  SPINNING = 'SPINNING',
  STOPPING = 'STOPPING',
  WON = 'WON'
}

export interface RouletteConfig {
  itemHeight: number;
  visibleItems: number;
  spinSpeed: number; // Pixels per frame
  friction: number; // 0.9 to 0.99
}