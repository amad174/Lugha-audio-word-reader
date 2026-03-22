import React from 'react';
import { exportMappings } from '../utils/storage';
import { AudioMapping, AppMode } from '../types';
import styles from './Toolbar.module.css';

interface Props {
  currentPage: number;
  totalPages: number;
  mode: AppMode;
  mappings: AudioMapping;
  isAdmin: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSetMode: (m: AppMode) => void;
  onImportPage: () => void;
  onAdminToggle: () => void; // open login or logout
}

const ADMIN_MODES: { key: AppMode; label: string; title: string }[] = [
  { key: 'draw',   label: '✒️ Draw',   title: 'Drag to draw a box' },
  { key: 'assign', label: '✏️ Assign', title: 'Tap a box to re-assign audio' },
  { key: 'delete', label: '🗑️ Delete', title: 'Tap a box to delete it' },
  { key: 'play',   label: '▶ Play',   title: 'Tap to hear audio' },
];

const GUEST_MODES: { key: AppMode; label: string; title: string }[] = [
  { key: 'play', label: '▶ Play', title: 'Tap to hear audio' },
];

export const Toolbar: React.FC<Props> = ({
  currentPage, totalPages, mode, mappings, isAdmin,
  onPrevPage, onNextPage, onSetMode, onImportPage, onAdminToggle,
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
            {m.label}
          </button>
        ))}
      </div>

      {/* Right actions */}
      <div className={styles.actionsGroup}>
        {isAdmin && (
          <>
            <button className={styles.iconBtn} onClick={onImportPage} title="Import image or PDF pages">📄</button>
            <button
              className={styles.iconBtn}
              onClick={() => exportMappings(mappings)}
              title="Export audio mappings"
              disabled={Object.keys(mappings).length === 0}
            >💾</button>
          </>
        )}
        <button
          className={`${styles.iconBtn} ${isAdmin ? styles.adminActive : ''}`}
          onClick={onAdminToggle}
          title={isAdmin ? 'Logout (switch to guest)' : 'Admin login'}
        >
          {isAdmin ? '👤' : '🔐'}
        </button>
      </div>
    </div>
  );
};
