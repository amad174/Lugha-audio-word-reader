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

// Per-page data persisted to localStorage
export interface StoredPage {
  id: string;       // hash of image content
  dataUrl: string;  // base64 image
  name: string;
  boxes: BoundingBox[];
}

export type AppMode = 'play' | 'assign' | 'draw' | 'delete';
