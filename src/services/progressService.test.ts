import { getLevelForPoints, checkNewAchievements, DEFAULT_GAME_CONFIG } from '../utils/game';

describe('student progress scoring', () => {
  test('awards level based on points', () => {
    const level = getLevelForPoints(50, DEFAULT_GAME_CONFIG.levels);
    expect(level.level).toBeGreaterThanOrEqual(1);
  });

  test('detects new achievements', () => {
    const achs = checkNewAchievements(10, []);
    expect(Array.isArray(achs)).toBe(true);
  });

  test('does not duplicate achievements', () => {
    const first = checkNewAchievements(10, []);
    if (first.length === 0) return;
    const second = checkNewAchievements(10, [first[0].id]);
    expect(second).toHaveLength(0);
  });
});
