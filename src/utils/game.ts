import { Achievement, GameConfig, GameLevel, UserProfile } from '../types';

export const DEFAULT_GAME_CONFIG: GameConfig = {
  pointsPerWord: 10,
  levels: [
    { level: 1, name: 'Seeker',  icon: '🌱', minPoints: 0 },
    { level: 2, name: 'Student', icon: '⭐', minPoints: 100 },
    { level: 3, name: 'Reader',  icon: '📖', minPoints: 300 },
    { level: 4, name: 'Scholar', icon: '🎓', minPoints: 700 },
    { level: 5, name: 'Hafidh',  icon: '👑', minPoints: 1500 },
  ],
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first',  name: 'First Word!',   description: 'Listened to your first word',  icon: '🎯', wordsRequired: 1   },
  { id: 'w10',    name: '10 Words',       description: 'Listened to 10 words',          icon: '🔥', wordsRequired: 10  },
  { id: 'w25',    name: '25 Words',       description: 'Listened to 25 words',          icon: '✨', wordsRequired: 25  },
  { id: 'w50',    name: '50 Words',       description: 'Listened to 50 words',          icon: '🌟', wordsRequired: 50  },
  { id: 'w100',   name: '100 Words',      description: 'Listened to 100 words',         icon: '🏆', wordsRequired: 100 },
  { id: 'w250',   name: '250 Words',      description: '250 words heard!',              icon: '💫', wordsRequired: 250 },
  { id: 'w500',   name: 'Word Master',    description: '500 words — incredible!',       icon: '💎', wordsRequired: 500 },
];

export function getLevelForPoints(points: number, levels: GameLevel[]): GameLevel {
  const sorted = [...levels].sort((a, b) => b.minPoints - a.minPoints);
  return sorted.find(l => points >= l.minPoints) ?? levels[0];
}

export function getNextLevel(currentLevel: GameLevel, levels: GameLevel[]): GameLevel | null {
  const sorted = [...levels].sort((a, b) => a.minPoints - b.minPoints);
  return sorted.find(l => l.minPoints > currentLevel.minPoints) ?? null;
}

export function pointsToNextLevel(points: number, levels: GameLevel[]): { current: GameLevel; next: GameLevel | null; progress: number } {
  const current = getLevelForPoints(points, levels);
  const next = getNextLevel(current, levels);
  const progress = next
    ? (points - current.minPoints) / (next.minPoints - current.minPoints)
    : 1;
  return { current, next, progress };
}

export function checkNewAchievements(wordsHeard: number, unlocked: string[]): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.wordsRequired === wordsHeard && !unlocked.includes(a.id));
}

export function createProfile(name: string, avatar: string): UserProfile {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    avatar,
    createdAt: Date.now(),
    wordsHeard: 0,
    totalPoints: 0,
    level: 1,
    achievements: [],
  };
}

export const AVATARS = ['🐱', '🐶', '🦊', '🐸', '🐧', '🦁', '🐼', '🦄', '🐯', '🐨', '🐻', '🐰', '🦋', '🐝', '🌟', '🚀', '⚡', '🌈', '🎯', '🎪'];
