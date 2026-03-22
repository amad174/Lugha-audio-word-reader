import React from 'react';
import { exportMappings } from '../utils/storage';
import { AudioMapping } from '../types';
import styles from './Toolbar.module.css';

interface Props {
  currentPage: number;
  totalPages: number;
  isAssignMode: boolean;
  mappings: AudioMapping;
  cvReady: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleMode: () => void;
  onImportPage: () => void;
}

export const Toolbar: React.FC<Props> = ({
  currentPage,
  totalPages,
  isAssignMode,
  mappings,
  cvReady,
  onPrevPage,
  onNextPage,
  onToggleMode,
  onImportPage,
}) => {
  const mappedCount = Object.keys(mappings).length;

  return (
    <div className={styles.toolbar}>
      {/* Left: page navigation */}
      <div className={styles.navGroup}>
        <button
          className={styles.navBtn}
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className={styles.pageLabel}>
          {currentPage} / {totalPages}
        </span>
        <button
          className={styles.navBtn}
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      {/* Center: mode toggle */}
      <button
        className={`${styles.modeBtn} ${isAssignMode ? styles.assignActive : styles.playActive}`}
        onClick={onToggleMode}
        title={isAssignMode ? 'Switch to Play mode' : 'Switch to Assign mode'}
      >
        {isAssignMode ? '✏️ Assign' : '▶ Play'}
      </button>

      {/* Right: actions */}
      <div className={styles.actionsGroup}>
        {!cvReady && (
          <span className={styles.cvLoading} title="OpenCV loading…">⏳</span>
        )}
        <button
          className={styles.iconBtn}
          onClick={onImportPage}
          title="Add page image"
        >
          📄
        </button>
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
