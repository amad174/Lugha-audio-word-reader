export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  id: string;
}

export interface AudioMapping {
  [boxId: string]: string;
}

export interface StoredPage {
  id: string;
  dataUrl: string;
  name: string;
  boxes: BoundingBox[];
}

export type AppMode = 'play' | 'assign' | 'draw' | 'delete';

export type UserRole = 'teacher' | 'student';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  orgId: string;
  createdAt: number;
}

export interface Organization {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  inviteCode: string;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  categoryId: string | null;
  coverUrl: string | null;
  pageCount: number;
  sortOrder: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface BookPage {
  id: string;
  name: string;
  sortOrder: number;
  imageUrl: string;
  boxes: BoundingBox[];
}

export interface BookAudio {
  boxId: string;
  url: string;
  updatedAt: number;
}

export interface OrgMember {
  uid: string;
  role: UserRole;
  displayName: string;
  email: string;
  joinedAt: number;
}

export interface StudentProgress {
  uid: string;
  wordsHeard: number;
  totalPoints: number;
  level: number;
  achievements: string[];
  heardBoxes: Record<string, boolean>;
  updatedAt: number;
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

/** @deprecated Local-only profile — replaced by StudentProgress in cloud mode */
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

export interface BookBundle {
  version: number;
  title: string;
  pages: StoredPage[];
  mappings: AudioMapping;
}
