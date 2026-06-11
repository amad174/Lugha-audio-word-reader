import React from 'react';
import styles from './Input.module.css';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <div className={styles.field}>
        {label ? (
          <label className={styles.label} htmlFor={inputId}>
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={[
            styles.input,
            error ? styles.inputError : '',
            className,
          ].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {error ? (
          <span id={`${inputId}-error`} className={styles.error} role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={`${inputId}-hint`} className={styles.hint}>
            {hint}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
