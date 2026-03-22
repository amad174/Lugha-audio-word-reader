import React, { useEffect } from 'react';
import { GameLevel, UserProfile, GameConfig } from '../types';
import { pointsToNextLevel } from '../utils/game';
import styles from './LevelUpModal.module.css';

interface Props {
  newLevel: GameLevel;
  profile: UserProfile;
  gameConfig: GameConfig;
  onContinue: () => void;
}

export const LevelUpModal: React.FC<Props> = ({ newLevel, profile, gameConfig, onContinue }) => {
  const { next } = pointsToNextLevel(profile.totalPoints, gameConfig.levels);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const t = setTimeout(onContinue, 6000);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <div className={styles.backdrop} onClick={onContinue}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.confetti} aria-hidden>
          {['🎊','🎉','⭐','✨','🌟','💫'].map((e, i) => (
            <span key={i} className={styles.confettiPiece} style={{ '--i': i } as React.CSSProperties}>{e}</span>
          ))}
        </div>

        <div className={styles.levelIcon}>{newLevel.icon}</div>
        <div className={styles.levelUpText}>Level Up!</div>
        <div className={styles.levelName}>{newLevel.name}</div>
        <div className={styles.levelNum}>Level {newLevel.level}</div>

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

        <button className={styles.continueBtn} onClick={onContinue}>
          Keep going! ▶
        </button>
      </div>
    </div>
  );
};
