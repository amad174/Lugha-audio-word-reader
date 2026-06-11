import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { GameLevel, UserProfile, GameConfig } from '../types';
import { pointsToNextLevel } from '../utils/game';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import styles from './LevelUpModal.module.css';

interface Props {
  newLevel: GameLevel;
  profile: UserProfile;
  gameConfig: GameConfig;
  onContinue: () => void;
}

export const LevelUpModal: React.FC<Props> = ({ newLevel, profile, gameConfig, onContinue }) => {
  const { next } = pointsToNextLevel(profile.totalPoints, gameConfig.levels);

  useEffect(() => {
    const t = setTimeout(onContinue, 6000);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <Modal open onClose={onContinue} showClose={false} closeOnScrimClick>
      <div className={styles.celebration}>
        <Sparkles className={styles.sparkle} size={32} aria-hidden />
        <div className={styles.levelIcon}>{newLevel.icon}</div>
        <p className={styles.eyebrow}>Level up</p>
        <h2 className={styles.levelName}>{newLevel.name}</h2>
        <p className={styles.levelNum}>Level {newLevel.level}</p>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{profile.totalPoints}</div>
          <div className={styles.statLabel}>Total points</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <div className={styles.statValue}>{profile.wordsHeard}</div>
          <div className={styles.statLabel}>Words heard</div>
        </div>
      </div>

      {next && (
        <p className={styles.nextHint}>
          Next: {next.icon} {next.name} at {next.minPoints} pts
        </p>
      )}

      <Button fullWidth onClick={onContinue} className={styles.continueBtn}>
        Keep going
      </Button>
    </Modal>
  );
};
