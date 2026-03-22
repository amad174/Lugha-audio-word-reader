import React from 'react';
import { AppMode, UserProfile } from '../types';
import styles from './Toolbar.module.css';

interface Props {
  currentPage: number;
  totalPages: number;
  mode: AppMode;
  isAdmin: boolean;
  currentProfile: UserProfile | null;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSetMode: (m: AppMode) => void;
  onImportPage: () => void;
  onAdminMenu: () => void;
  onAdminToggle: () => void;
  onSwitchProfile: () => void;
}

const ADMIN_MODES: { key: AppMode; icon: string; label: string; title: string }[] = [
  { key: 'draw',   icon: '✒️', label: 'Draw',   title: 'Drag to draw a box' },
  { key: 'assign', icon: '✏️', label: 'Assign', title: 'Tap a box to re-assign audio' },
  { key: 'delete', icon: '🗑️', label: 'Delete', title: 'Tap a box to delete it' },
  { key: 'play',   icon: '▶',  label: 'Play',   title: 'Tap to hear audio' },
];

const GUEST_MODES: { key: AppMode; icon: string; label: string; title: string }[] = [
  { key: 'play', icon: '▶', label: 'Play', title: 'Tap to hear audio' },
];

export const Toolbar: React.FC<Props> = ({
  currentPage, totalPages, mode, isAdmin, currentProfile,
  onPrevPage, onNextPage, onSetMode, onImportPage, onAdminMenu, onAdminToggle, onSwitchProfile,
}) => {
  const modes = isAdmin ? ADMIN_MODES : GUEST_MODES;

  return (
    <div className={styles.toolbar}>
      {/* Page navigation */}
      <div className={styles.navGroup}>
        <button className={styles.navBtn} onClick={onPrevPage} disabled={currentPage <= 1}>‹</button>
        <span className={styles.pageLabel}>{currentPage} / {totalPages}</span>
        <button className={styles.navBtn} onClick={onNextPage} disabled={currentPage >= totalPages}>›</button>
      </div>

      {/* Mode buttons */}
      <div className={styles.modeGroup}>
        {modes.map(m => (
          <button
            key={m.key}
            className={`${styles.modeBtn} ${mode === m.key ? styles[m.key] : ''}`}
            onClick={() => onSetMode(m.key)}
            title={m.title}
          >
            {m.icon}<span className={styles.modeBtnLabel}> {m.label}</span>
          </button>
        ))}
      </div>

      {/* Right actions */}
      <div className={styles.actionsGroup}>
        {isAdmin ? (
          <>
            <button className={styles.iconBtn} onClick={onImportPage} title="Import PDF or images">📄</button>
            <button className={styles.iconBtn} onClick={onAdminMenu} title="Admin actions">⚙️</button>
            <button
              className={`${styles.iconBtn} ${styles.adminActive}`}
              onClick={onAdminToggle}
              title="Logout (switch to guest)"
            >
              👤
            </button>
          </>
        ) : (
          <>
            {currentProfile ? (
              <button
                className={styles.profileBtn}
                onClick={onSwitchProfile}
                title="Switch profile"
              >
                {currentProfile.avatar}
              </button>
            ) : (
              <button className={styles.iconBtn} onClick={onSwitchProfile} title="Sign in">
                👤
              </button>
            )}
            <button
              className={styles.iconBtn}
              onClick={onAdminToggle}
              title="Teacher login"
            >
              🔐
            </button>
          </>
        )}
      </div>
    </div>
  );
};
