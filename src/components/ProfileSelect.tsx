import React, { useState } from 'react';
import { UserProfile, GameConfig } from '../types';
import { AVATARS, ACHIEVEMENTS, createProfile, pointsToNextLevel } from '../utils/game';
import styles from './ProfileSelect.module.css';

interface Props {
  profiles: UserProfile[];
  gameConfig: GameConfig;
  onSelect: (profile: UserProfile) => void;
  onGuest: () => void;
  onAdminLogin: () => void;
  onCreate: (profile: UserProfile) => void;
}

type View = 'select' | 'create';

export const ProfileSelect: React.FC<Props> = ({
  profiles, gameConfig, onSelect, onGuest, onAdminLogin, onCreate,
}) => {
  const [view, setView] = useState<View>('select');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [nameError, setNameError] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError('Enter your name'); return; }
    if (trimmed.length > 20) { setNameError('Name too long (max 20 chars)'); return; }
    onCreate(createProfile(trimmed, avatar));
    setName('');
    setAvatar(AVATARS[0]);
    setView('select');
  };

  if (view === 'create') {
    return (
      <div className={styles.screen}>
        <div className={styles.stars} aria-hidden />
        <div className={styles.createCard}>
          <button className={styles.backBtn} onClick={() => setView('select')}>← Back</button>
          <h2 className={styles.createTitle}>Create Your Profile</h2>

          <p className={styles.fieldLabel}>Your name</p>
          <input
            className={styles.nameInput}
            value={name}
            onChange={e => { setName(e.target.value); setNameError(''); }}
            placeholder="e.g. Ahmed"
            maxLength={20}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          {nameError && <p className={styles.nameError}>{nameError}</p>}

          <p className={styles.fieldLabel}>Pick your avatar</p>
          <div className={styles.avatarGrid}>
            {AVATARS.map(a => (
              <button
                key={a}
                className={`${styles.avatarBtn} ${avatar === a ? styles.avatarSelected : ''}`}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>

          <div className={styles.previewRow}>
            <span className={styles.previewAvatar}>{avatar}</span>
            <span className={styles.previewName}>{name || 'Your name'}</span>
          </div>

          <button className={styles.createBtn} onClick={handleCreate}>
            Let's go! 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.stars} aria-hidden />

      <div className={styles.header}>
        <div className={styles.logo}>📖</div>
        <h1 className={styles.appTitle}>Iqra Audio</h1>
        <p className={styles.subtitle}>Who's learning today?</p>
      </div>

      <div className={styles.profileGrid}>
        {profiles.map(p => {
          const { current, progress } = pointsToNextLevel(p.totalPoints, gameConfig.levels);
          return (
            <button key={p.id} className={styles.profileCard} onClick={() => onSelect(p)}>
              <div className={styles.cardAvatar}>{p.avatar}</div>
              <div className={styles.cardName}>{p.name}</div>
              <div className={styles.cardLevel}>
                {current.icon} <span>{current.name}</span>
              </div>
              <div className={styles.cardBar}>
                <div
                  className={styles.cardBarFill}
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <div className={styles.cardPoints}>{p.totalPoints} pts</div>
              {p.achievements.length > 0 && (
                <div className={styles.cardBadges}>
                  {p.achievements.slice(-3).map(id => {
                    const ach = ACHIEVEMENTS.find(a => a.id === id);
                    return ach ? <span key={id}>{ach.icon}</span> : null;
                  })}
                </div>
              )}
            </button>
          );
        })}

        <button className={styles.newProfileCard} onClick={() => setView('create')}>
          <span className={styles.newIcon}>+</span>
          <span className={styles.newLabel}>New Player</span>
        </button>
      </div>

      <div className={styles.footer}>
        <button className={styles.guestBtn} onClick={onGuest}>Play as Guest</button>
        <button className={styles.teacherBtn} onClick={onAdminLogin}>🔐 Teacher</button>
      </div>
    </div>
  );
};
