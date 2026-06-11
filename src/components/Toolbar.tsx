import React from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pen,
  Pencil,
  Trash2,
  Play,
  FileUp,
  Settings,
  User,
  Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AppMode, UserProfile } from '../types';
import { Button } from './ui/Button';
import styles from './Toolbar.module.css';

interface Props {
  currentPage: number;
  totalPages: number;
  mode: AppMode;
  isAdmin: boolean;
  currentProfile: UserProfile | null;
  bookTitle?: string;
  onBack?: () => void;
  onBookSettings?: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSetMode: (m: AppMode) => void;
  onImportPage: () => void;
  onAdminMenu: () => void;
  onAdminToggle: () => void;
  onSwitchProfile: () => void;
}

const ICON_SIZE = 20;

const ADMIN_MODES: { key: AppMode; Icon: LucideIcon; label: string; title: string }[] = [
  { key: 'draw', Icon: Pen, label: 'Draw', title: 'Drag to draw a box' },
  { key: 'assign', Icon: Pencil, label: 'Assign', title: 'Tap a box to assign audio' },
  { key: 'delete', Icon: Trash2, label: 'Delete', title: 'Tap a box to delete it' },
  { key: 'play', Icon: Play, label: 'Play', title: 'Tap to hear audio' },
];

const GUEST_MODES: { key: AppMode; Icon: LucideIcon; label: string; title: string }[] = [
  { key: 'play', Icon: Play, label: 'Play', title: 'Tap to hear audio' },
];

export const Toolbar: React.FC<Props> = ({
  currentPage,
  totalPages,
  mode,
  isAdmin,
  currentProfile,
  bookTitle,
  onBack,
  onBookSettings,
  onPrevPage,
  onNextPage,
  onSetMode,
  onImportPage,
  onAdminMenu,
  onAdminToggle,
  onSwitchProfile,
}) => {
  const modes = isAdmin ? ADMIN_MODES : GUEST_MODES;
  const noPages = totalPages <= 0;
  const prevDisabled = noPages || currentPage <= 1;
  const nextDisabled = noPages || currentPage >= totalPages;
  const inReader = Boolean(bookTitle);

  return (
    <header className={`${styles.toolbar} ${inReader ? styles.readerToolbar : ''}`}>
      {inReader && (
        <div className={styles.titleRow}>
          {onBack && (
            <Button variant="icon" size="sm" className={styles.touchBtn} onClick={onBack} aria-label="Back">
              <ArrowLeft size={ICON_SIZE} aria-hidden />
            </Button>
          )}
          <h1 className={styles.bookTitle}>{bookTitle}</h1>
          <div className={styles.titleActions}>
            {isAdmin ? (
              <>
                <Button variant="icon" size="sm" className={styles.touchBtn} onClick={onImportPage} aria-label="Import pages" title="Import">
                  <FileUp size={ICON_SIZE} aria-hidden />
                </Button>
                <Button
                  variant="icon"
                  size="sm"
                  className={styles.touchBtn}
                  onClick={onBookSettings ?? onAdminMenu}
                  aria-label="Book settings"
                  title="Book settings"
                >
                  <Settings size={ICON_SIZE} aria-hidden />
                </Button>
                <Button
                  variant="icon"
                  size="sm"
                  active
                  className={`${styles.touchBtn} ${styles.adminActive}`}
                  onClick={onAdminToggle}
                  aria-label="Account"
                  title="Account"
                >
                  <User size={ICON_SIZE} aria-hidden />
                </Button>
              </>
            ) : currentProfile ? (
              <button
                type="button"
                className={styles.profileBtn}
                onClick={onSwitchProfile}
                aria-label="Switch profile"
                title="Switch profile"
              >
                {currentProfile.avatar}
              </button>
            ) : (
              <>
                <Button variant="icon" size="sm" className={styles.touchBtn} onClick={onSwitchProfile} aria-label="Sign in">
                  <User size={ICON_SIZE} aria-hidden />
                </Button>
                <Button variant="icon" size="sm" className={styles.touchBtn} onClick={onAdminToggle} aria-label="Teacher login">
                  <Lock size={ICON_SIZE} aria-hidden />
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <div className={styles.controlsRow}>
        <div className={styles.navGroup}>
          <Button
            variant="icon"
            size="sm"
            className={styles.touchBtn}
            onClick={onPrevPage}
            disabled={prevDisabled}
            aria-label="Previous page"
          >
            <ChevronLeft size={ICON_SIZE} aria-hidden />
          </Button>
          <span className={styles.pageLabel} aria-live="polite">
            {noPages ? '—' : `${currentPage} / ${totalPages}`}
          </span>
          <Button
            variant="icon"
            size="sm"
            className={styles.touchBtn}
            onClick={onNextPage}
            disabled={nextDisabled}
            aria-label="Next page"
          >
            <ChevronRight size={ICON_SIZE} aria-hidden />
          </Button>
        </div>

        <div className={styles.modeGroup} role="group" aria-label="Interaction mode">
          {modes.map((m) => (
            <Button
              key={m.key}
              variant="icon"
              size="sm"
              active={mode === m.key}
              className={styles.modeBtn}
              onClick={() => onSetMode(m.key)}
              title={m.title}
              aria-label={m.label}
              aria-pressed={mode === m.key}
            >
              <m.Icon size={ICON_SIZE} aria-hidden />
              <span className={styles.modeBtnLabel}>{m.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {!inReader && (
        <div className={styles.actionsRow}>
          <div className={styles.actionsGroup}>
            {isAdmin ? (
              <>
                <Button variant="icon" size="sm" className={styles.touchBtn} onClick={onImportPage} aria-label="Import PDF or images">
                  <FileUp size={ICON_SIZE} aria-hidden />
                </Button>
                <Button variant="icon" size="sm" className={styles.touchBtn} onClick={onAdminMenu} aria-label="Admin actions">
                  <Settings size={ICON_SIZE} aria-hidden />
                </Button>
                <Button variant="icon" size="sm" active className={`${styles.touchBtn} ${styles.adminActive}`} onClick={onAdminToggle} aria-label="Account">
                  <User size={ICON_SIZE} aria-hidden />
                </Button>
              </>
            ) : currentProfile ? (
              <button type="button" className={styles.profileBtn} onClick={onSwitchProfile} aria-label="Switch profile">
                {currentProfile.avatar}
              </button>
            ) : (
              <>
                <Button variant="icon" size="sm" className={styles.touchBtn} onClick={onSwitchProfile} aria-label="Sign in">
                  <User size={ICON_SIZE} aria-hidden />
                </Button>
                <Button variant="icon" size="sm" className={styles.touchBtn} onClick={onAdminToggle} aria-label="Teacher login">
                  <Lock size={ICON_SIZE} aria-hidden />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
