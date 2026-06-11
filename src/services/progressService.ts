import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { StudentProgress, GameConfig } from '../types';
import {
  DEFAULT_GAME_CONFIG,
  getLevelForPoints,
  checkNewAchievements,
} from '../utils/game';

const defaultProgress = (): Omit<StudentProgress, 'uid'> => ({
  wordsHeard: 0,
  totalPoints: 0,
  level: 1,
  achievements: [],
  heardBoxes: {},
  updatedAt: Date.now(),
});

export async function getProgress(orgId: string, uid: string): Promise<StudentProgress> {
  const snap = await getDoc(doc(db, 'orgs', orgId, 'progress', uid));
  if (!snap.exists()) {
    const p = { uid, ...defaultProgress() };
    await setDoc(doc(db, 'orgs', orgId, 'progress', uid), p);
    return p;
  }
  return { uid, ...snap.data() } as StudentProgress;
}

export async function recordWordHeard(
  orgId: string,
  uid: string,
  bookId: string,
  boxId: string,
  gameConfig: GameConfig = DEFAULT_GAME_CONFIG
): Promise<{
  progress: StudentProgress;
  newAchievements: import('../types').Achievement[];
  leveledUp: boolean;
  newLevel: import('../types').GameLevel | null;
}> {
  const progress = await getProgress(orgId, uid);
  const heardKey = `${bookId}:${boxId}`;

  if (progress.heardBoxes[heardKey]) {
    return { progress, newAchievements: [], leveledUp: false, newLevel: null };
  }

  const newWordsHeard = progress.wordsHeard + 1;
  const newPoints = progress.totalPoints + gameConfig.pointsPerWord;
  const oldLevel = getLevelForPoints(progress.totalPoints, gameConfig.levels);
  const newLevel = getLevelForPoints(newPoints, gameConfig.levels);
  const newAchs = checkNewAchievements(newWordsHeard, progress.achievements);

  const updated: StudentProgress = {
    ...progress,
    wordsHeard: newWordsHeard,
    totalPoints: newPoints,
    level: newLevel.level,
    achievements: [...progress.achievements, ...newAchs.map(a => a.id)],
    heardBoxes: { ...progress.heardBoxes, [heardKey]: true },
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, 'orgs', orgId, 'progress', uid), updated);

  return {
    progress: updated,
    newAchievements: newAchs,
    leveledUp: newLevel.level > oldLevel.level,
    newLevel: newLevel.level > oldLevel.level ? newLevel : null,
  };
}

export async function saveGameConfig(orgId: string, config: GameConfig): Promise<void> {
  await setDoc(doc(db, 'orgs', orgId, 'settings', 'game'), config);
}

export async function getGameConfig(orgId: string): Promise<GameConfig> {
  const snap = await getDoc(doc(db, 'orgs', orgId, 'settings', 'game'));
  if (!snap.exists()) return DEFAULT_GAME_CONFIG;
  return snap.data() as GameConfig;
}
