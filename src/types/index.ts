export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  id: string; // hash of the cropped region
}

export interface AudioMapping {
  [hash: string]: string; // hash -> audio data URL or file path
}

export interface PageData {
  pageNumber: number;
  imageSrc: string;
  boxes: BoundingBox[];
}

export type AppMode = 'play' | 'assign' | 'draw';
