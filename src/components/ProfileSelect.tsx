import React, { useState } from 'react';
import { ArrowLeft, Lock, Plus } from 'lucide-react';
import { UserProfile, GameConfig } from '../types';
import { AVATARS, ACHIEVEMENTS, createProfile, pointsToNextLevel } from '../utils/game';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
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
        <Card className={styles.createCard} padding="lg">
          <Button variant="link" className={styles.backBtn} onClick={() => setView('select')}>
            <ArrowLeft size={18} aria-hidden />
            Back
          </Button>
          <h2 className={styles.createTitle}>Create Your Profile</h2>

          <Input
            label="Your name"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(''); }}
            placeholder="e.g. Ahmed"
            maxLength={20}
            autoFocus
            error={nameError || undefined}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />

          <p className={styles.fieldLabel}>Pick your avatar</p>
          <div className={styles.avatarGrid}>
            {AVATARS.map(a => (
              <button
                key={a}
                type="button"
                className={`${styles.avatarBtn} ${avatar === a ? styles.avatarSelected : ''}`}
                onClick={() => setAvatar(a)}
                aria-label={`Avatar ${a}`}
                aria-pressed={avatar === a}
              >
                {a}
              </button>
            ))}
          </div>

          <div className={styles.previewRow}>
            <span className={styles.previewAvatar}>{avatar}</span>
            <span className={styles.previewName}>{name || 'Your name'}</span>
          </div>

          <Button fullWidth onClick={handleCreate}>
            Let&apos;s go!
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <header className={styles.hero}>
        <h1 className={styles.appTitle}>Lugha</h1>
        <p className={styles.subtitle}>Who&apos;s learning today?</p>
      </header>

      <div className={styles.profileGrid}>
        {profiles.map(p => {
          const { current, progress } = pointsToNextLevel(p.totalPoints, gameConfig.levels);
          return (
            <button key={p.id} type="button" className={styles.profileCard} onClick={() => onSelect(p)}>
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

        <button type="button" className={styles.newProfileCard} onClick={() => setView('create')}>
          <Plus size={28} strokeWidth={1.5} aria-hidden />
          <span className={styles.newLabel}>New Player</span>
        </button>
      </div>

      <footer className={styles.footer}>
        <Button variant="secondary" onClick={onGuest}>Play as Guest</Button>
        <Button variant="link" onClick={onAdminLogin}>
          <Lock size={16} aria-hidden />
          Teacher
        </Button>
      </footer>
    </div>
  );
};
