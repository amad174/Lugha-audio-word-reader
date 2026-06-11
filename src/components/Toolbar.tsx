import React from 'react';
import {
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
  onPrevPage: () => void;
  onNextPage: () => void;
  onSetMode: (m: AppMode) => void;
  onImportPage: () => void;
  onAdminMenu: () => void;
  onAdminToggle: () => void;
  onSwitchProfile: () => void;
}

const ICON_SIZE = 18;

const ADMIN_MODES: { key: AppMode; Icon: LucideIcon; label: string; title: string }[] = [
  { key: 'draw', Icon: Pen, label: 'Draw', title: 'Drag to draw a box' },
  { key: 'assign', Icon: Pencil, label: 'Assign', title: 'Tap a box to re-assign audio' },
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

  return (
    <header className={styles.toolbar}>
      <div className={styles.row}>
        <div className={styles.navGroup}>
          <Button
            variant="icon"
            size="sm"
            className={styles.navBtn}
            onClick={onPrevPage}
            disabled={prevDisabled}
            aria-label="Previous page"
          >
            <ChevronLeft size={ICON_SIZE} aria-hidden />
          </Button>
          <span className={styles.pageLabel} aria-live="polite">
            {noPages ? '—' : currentPage} / {totalPages}
          </span>
          <Button
            variant="icon"
            size="sm"
            className={styles.navBtn}
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

      <div className={styles.row}>
        <div className={styles.actionsGroup}>
          {isAdmin ? (
            <>
              <Button
                variant="icon"
                size="sm"
                onClick={onImportPage}
                aria-label="Import PDF or images"
                title="Import PDF or images"
              >
                <FileUp size={ICON_SIZE} aria-hidden />
              </Button>
              <Button
                variant="icon"
                size="sm"
                onClick={onAdminMenu}
                aria-label="Admin actions"
                title="Admin actions"
              >
                <Settings size={ICON_SIZE} aria-hidden />
              </Button>
              <Button
                variant="icon"
                size="sm"
                active
                className={styles.adminActive}
                onClick={onAdminToggle}
                aria-label="Logout (switch to guest)"
                title="Logout (switch to guest)"
              >
                <User size={ICON_SIZE} aria-hidden />
              </Button>
            </>
          ) : (
            <>
              {currentProfile ? (
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
                <Button
                  variant="icon"
                  size="sm"
                  onClick={onSwitchProfile}
                  aria-label="Sign in"
                  title="Sign in"
                >
                  <User size={ICON_SIZE} aria-hidden />
                </Button>
              )}
              <Button
                variant="icon"
                size="sm"
                onClick={onAdminToggle}
                aria-label="Teacher login"
                title="Teacher login"
              >
                <Lock size={ICON_SIZE} aria-hidden />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
