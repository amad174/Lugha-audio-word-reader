import React, { useState } from 'react';
import styles from './AdminMenu.module.css';

interface Props {
  hasPages: boolean;
  hasContent: boolean;
  onImportBundle: () => void;
  onExportBundle: () => void;
  onDeletePage: () => void;
  onClose: () => void;
}

export const AdminMenu: React.FC<Props> = ({
  hasPages, hasContent, onImportBundle, onExportBundle, onDeletePage, onClose,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <h3 className={styles.title}>Admin Actions</h3>

        <button className={styles.menuBtn} onClick={() => { onImportBundle(); onClose(); }}>
          <span className={styles.menuIcon}>📥</span>
          <div>
            <div className={styles.menuLabel}>Import Bundle</div>
            <div className={styles.menuDesc}>Load a saved bundle (replaces current content)</div>
          </div>
        </button>

        <button
          className={styles.menuBtn}
          onClick={() => { onExportBundle(); onClose(); }}
          disabled={!hasContent}
        >
          <span className={styles.menuIcon}>📦</span>
          <div>
            <div className={styles.menuLabel}>Export Bundle</div>
            <div className={styles.menuDesc}>Save all pages and audio to share with others</div>
          </div>
        </button>

        <div className={styles.divider} />

        {!confirmDelete ? (
          <button
            className={`${styles.menuBtn} ${styles.dangerBtn}`}
            onClick={() => setConfirmDelete(true)}
            disabled={!hasPages}
          >
            <span className={styles.menuIcon}>🗑️</span>
            <div>
              <div className={styles.menuLabelDanger}>Delete This Page</div>
              <div className={styles.menuDesc}>Remove current page and all its boxes</div>
            </div>
          </button>
        ) : (
          <div className={styles.confirmArea}>
            <p className={styles.confirmText}>Delete this page permanently?</p>
            <div className={styles.confirmBtns}>
              <button className={styles.confirmCancel} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className={styles.confirmDelete} onClick={() => { onDeletePage(); onClose(); }}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
