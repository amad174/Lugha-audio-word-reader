export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  id: string;
}

export interface AudioMapping {
  [hash: string]: string;
}

export interface StoredPage {
  id: string;
  dataUrl: string;
  name: string;
  boxes: BoundingBox[];
}

export type AppMode = 'play' | 'assign' | 'draw' | 'delete';

// ── Game types ────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  wordsHeard: number;
  totalPoints: number;
  level: number;
  achievements: string[];
}

export interface GameLevel {
  level: number;
  name: string;
  icon: string;
  minPoints: number;
}

export interface GameConfig {
  pointsPerWord: number;
  levels: GameLevel[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  wordsRequired: number;
}
