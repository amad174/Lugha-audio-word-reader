import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** When false, clicking the scrim does not close the modal. */
  closeOnScrimClick?: boolean;
  /** Show the default close button in the header. */
  showClose?: boolean;
}

export const Modal: React.FC<Props> = ({
  open,
  onClose,
  title,
  children,
  closeOnScrimClick = true,
  showClose = true,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const getFocusable = useCallback(() => {
    const root = panelRef.current;
    if (!root) return [] as HTMLElement[];
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }, []);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const frame = requestAnimationFrame(() => {
      const focusables = getFocusable();
      const preferred =
        focusables.find((el) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) ??
        focusables.find((el) => el.getAttribute('aria-label') !== 'Close');
      (preferred ?? focusables[0])?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, getFocusable]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      const nodes = getFocusable();
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = nodes[0];
      const lastEl = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        if (active === firstEl || !panelRef.current?.contains(active)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else if (active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open, getFocusable]);

  if (!open) return null;

  const handleScrimClick = () => {
    if (closeOnScrimClick) onClose();
  };

  return createPortal(
    <div
      className={styles.scrim}
      role="presentation"
      onClick={handleScrimClick}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.inner}>
          {(title || showClose) && (
            <div className={styles.header}>
              {title ? (
                <h2 id="modal-title" className={styles.title}>
                  {title}
                </h2>
              ) : (
                <span />
              )}
              {showClose ? (
                <button
                  type="button"
                  className={styles.close}
                  onClick={onClose}
                  aria-label="Close"
                >
                  ×
                </button>
              ) : null}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
