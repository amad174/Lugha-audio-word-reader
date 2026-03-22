import React from 'react';
import { UserProfile, GameConfig } from '../types';
import { pointsToNextLevel } from '../utils/game';
import styles from './PlayerHUD.module.css';

interface Props {
  profile: UserProfile;
  gameConfig: GameConfig;
  onClick: () => void;
}

export const PlayerHUD: React.FC<Props> = ({ profile, gameConfig, onClick }) => {
  const { current, next, progress } = pointsToNextLevel(profile.totalPoints, gameConfig.levels);

  return (
    <button className={styles.hud} onClick={onClick} title="View profile">
      <span className={styles.avatar}>{profile.avatar}</span>
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{profile.name}</span>
          <span className={styles.levelBadge}>{current.icon} {current.name}</span>
        </div>
        <div className={styles.barWrap}>
          <div className={styles.bar}>
            <div className={styles.barFill} style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <span className={styles.pts}>
            {profile.totalPoints}{next ? ` / ${next.minPoints}` : ''} pts
          </span>
        </div>
      </div>
    </button>
  );
};
