import React from 'react';
import { exportMappings } from '../utils/storage';
import { AudioMapping, AppMode } from '../types';
import styles from './Toolbar.module.css';

interface Props {
  currentPage: number;
  totalPages: number;
  mode: AppMode;
  mappings: AudioMapping;
  cvReady: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSetMode: (m: AppMode) => void;
  onImportPage: () => void;
}

const MODES: { key: AppMode; label: string; title: string }[] = [
  { key: 'play',   label: '▶ Play',   title: 'Tap boxes to play audio' },
  { key: 'assign', label: '✏️ Assign', title: 'Tap a box to assign audio' },
  { key: 'draw',   label: '✒️ Draw',   title: 'Drag to draw a new box' },
];

export const Toolbar: React.FC<Props> = ({
  currentPage, totalPages, mode, mappings, cvReady,
  onPrevPage, onNextPage, onSetMode, onImportPage,
}) => {
  const mappedCount = Object.keys(mappings).length;

  return (
    <div className={styles.toolbar}>
      {/* Page navigation */}
      <div className={styles.navGroup}>
        <button className={styles.navBtn} onClick={onPrevPage} disabled={currentPage <= 1}>‹</button>
        <span className={styles.pageLabel}>{currentPage} / {totalPages}</span>
        <button className={styles.navBtn} onClick={onNextPage} disabled={currentPage >= totalPages}>›</button>
      </div>

      {/* Mode selector */}
      <div className={styles.modeGroup}>
        {MODES.map(m => (
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

      {/* Actions */}
      <div className={styles.actionsGroup}>
        {!cvReady && <span className={styles.cvLoading} title="OpenCV loading…">⏳</span>}
        <button className={styles.iconBtn} onClick={onImportPage} title="Add page image">📄</button>
        <button
          className={styles.iconBtn}
          onClick={() => exportMappings(mappings)}
          title={`Export ${mappedCount} mappings`}
          disabled={mappedCount === 0}
        >
          💾
        </button>
      </div>
    </div>
  );
};
