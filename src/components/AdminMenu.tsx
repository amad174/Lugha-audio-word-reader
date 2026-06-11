import React, { useState } from 'react';
import {
  Gamepad2,
  Download,
  Package,
  Trash2,
} from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import styles from './AdminMenu.module.css';

interface Props {
  hasPages: boolean;
  hasContent: boolean;
  onImportBundle: () => void;
  onExportBundle: () => void;
  onDeletePage: () => void;
  onGameSettings: () => void;
  onClose: () => void;
}

export const AdminMenu: React.FC<Props> = ({
  hasPages, hasContent, onImportBundle, onExportBundle, onDeletePage, onGameSettings, onClose,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Sheet open title="Admin actions" onClose={onClose}>
      <button type="button" className={styles.menuBtn} onClick={() => { onGameSettings(); onClose(); }}>
        <span className={styles.menuIcon} aria-hidden><Gamepad2 size={22} /></span>
        <div>
          <div className={styles.menuLabel}>Game settings</div>
          <div className={styles.menuDesc}>Configure levels, points, and view players</div>
        </div>
      </button>

      <div className={styles.divider} />

      <button type="button" className={styles.menuBtn} onClick={() => { onImportBundle(); onClose(); }}>
        <span className={styles.menuIcon} aria-hidden><Download size={22} /></span>
        <div>
          <div className={styles.menuLabel}>Import bundle</div>
          <div className={styles.menuDesc}>Load a saved bundle (replaces current content)</div>
        </div>
      </button>

      <button
        type="button"
        className={styles.menuBtn}
        onClick={() => { onExportBundle(); onClose(); }}
        disabled={!hasContent}
      >
        <span className={styles.menuIcon} aria-hidden><Package size={22} /></span>
        <div>
          <div className={styles.menuLabel}>Export bundle</div>
          <div className={styles.menuDesc}>Save all pages and audio to share with others</div>
        </div>
      </button>

      <div className={styles.divider} />

      {!confirmDelete ? (
        <button
          type="button"
          className={`${styles.menuBtn} ${styles.dangerBtn}`}
          onClick={() => setConfirmDelete(true)}
          disabled={!hasPages}
        >
          <span className={styles.menuIcon} aria-hidden><Trash2 size={22} /></span>
          <div>
            <div className={styles.menuLabelDanger}>Delete this page</div>
            <div className={styles.menuDesc}>Remove current page and all its boxes</div>
          </div>
        </button>
      ) : (
        <div className={styles.confirmArea}>
          <p className={styles.confirmText}>Delete this page permanently?</p>
          <div className={styles.confirmBtns}>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => { onDeletePage(); onClose(); }}>Delete</Button>
          </div>
        </div>
      )}
    </Sheet>
  );
};
