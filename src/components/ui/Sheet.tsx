import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Sheet.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeOnScrimClick?: boolean;
}

export const Sheet: React.FC<Props> = ({
  open,
  onClose,
  title,
  children,
  closeOnScrimClick = true,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.scrim}
      role="presentation"
      onClick={() => closeOnScrimClick && onClose()}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handle} aria-hidden />
        <div className={styles.inner}>
          <div className={styles.header}>
            {title ? (
              <h2 id="sheet-title" className={styles.title}>
                {title}
              </h2>
            ) : (
              <span />
            )}
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
