import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
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
    <Modal
      open
      onClose={onCancel}
      showClose={false}
      title={adminExists ? 'Admin login' : 'Create admin account'}
    >
      <div className={styles.iconWrap} aria-hidden>
        <Lock size={28} strokeWidth={1.5} />
      </div>
      <p className={styles.subtitle}>
        {adminExists
          ? 'Enter your admin password to manage pages and audio.'
          : 'Set a password for the admin account. Kids can still use the app without logging in.'}
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          type="password"
          label="Password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          autoFocus
          autoComplete={adminExists ? 'current-password' : 'new-password'}
        />
        {!adminExists && (
          <Input
            type="password"
            label="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit">{adminExists ? 'Login' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
};
