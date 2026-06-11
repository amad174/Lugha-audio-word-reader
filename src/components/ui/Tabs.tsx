import React, { useId } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface Props {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<Props> = ({ items, value, onChange, className }) => {
  const baseId = useId();
  const active = items.find((t) => t.id === value) ?? items[0];

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.list} role="tablist" aria-orientation="horizontal">
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              className={[styles.tab, selected ? styles.tabActive : ''].filter(Boolean).join(' ')}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active ? (
        <div
          className={styles.panel}
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
        >
          {active.content}
        </div>
      ) : null}
    </div>
  );
};
