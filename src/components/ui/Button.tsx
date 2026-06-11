import React from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'link' | 'danger' | 'icon';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  active?: boolean;
  fullWidth?: boolean;
  size?: 'default' | 'sm';
}

export const Button: React.FC<Props> = ({
  variant = 'primary',
  active = false,
  fullWidth = false,
  size = 'default',
  className,
  children,
  ...props
}) => {
  const classes = [
    styles.btn,
    styles[variant],
    active && variant === 'icon' ? styles.iconActive : '',
    size === 'sm' ? styles.sm : '',
    fullWidth ? styles.fullWidth : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
