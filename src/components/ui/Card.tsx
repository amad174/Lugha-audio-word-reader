import React from 'react';
import styles from './Card.module.css';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  title?: string;
}

const paddingClass: Record<Padding, string> = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

export const Card: React.FC<Props> = ({
  padding = 'md',
  title,
  className,
  children,
  ...props
}) => {
  const classes = [styles.card, paddingClass[padding], className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {title ? <h3 className={styles.header}>{title}</h3> : null}
      {children}
    </div>
  );
};
