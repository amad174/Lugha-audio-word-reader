import React, { useEffect } from 'react';
import { Achievement } from '../types';
import styles from './AchievementToast.module.css';

interface Props {
  achievement: Achievement;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<Props> = ({ achievement, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={styles.toast} onClick={onDismiss}>
      <div className={styles.icon}>{achievement.icon}</div>
      <div className={styles.text}>
        <div className={styles.label}>Achievement Unlocked!</div>
        <div className={styles.name}>{achievement.name}</div>
      </div>
    </div>
  );
};
