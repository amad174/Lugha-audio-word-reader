import React, { useState } from 'react';
import styles from './AdminLogin.module.css';

interface Props {
  adminExists: boolean;
  onLogin: (pw: string) => boolean;
  onCreate: (pw: string) => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<Props> = ({ adminExists, onLogin, onCreate, onCancel }) => {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!adminExists) {
      if (pw.length < 4) { setError('Password must be at least 4 characters.'); return; }
      if (pw !== confirm) { setError('Passwords do not match.'); return; }
      onCreate(pw);
    } else {
      if (!onLogin(pw)) setError('Incorrect password.');
    }
  };

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.icon}>🔐</div>
        <h2 className={styles.title}>{adminExists ? 'Admin Login' : 'Create Admin Account'}</h2>
        <p className={styles.subtitle}>
          {adminExists
            ? 'Enter your admin password to manage pages and audio.'
            : 'Set a password for the admin account. Kids can still use the app without logging in.'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            className={styles.input}
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            autoFocus
          />
          {!adminExists && (
            <input
              type="password"
              className={styles.input}
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          )}
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>
              {adminExists ? 'Login' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
