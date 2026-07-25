import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail, Trash2, Check } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  changePassword,
  updateDisplayName,
  resetPassword,
  deleteAccount,
} from '../services/authService';
import styles from './LibraryPage.module.css';

export function AccountPage() {
  const { user, org, signOut, refreshUser } = useAuthContext();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const [resetSent, setResetSent] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const notify = (msg: string) => {
    setError('');
    setSuccess(msg);
  };

  const fail = (e: unknown, fallback: string) => {
    setSuccess('');
    setError(e instanceof Error ? e.message : fallback);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === user?.displayName) return;
    setSavingName(true);
    try {
      await updateDisplayName(name);
      await refreshUser();
      notify('Name updated.');
    } catch (e) {
      fail(e, 'Could not update name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw.length < 6) {
      fail(new Error('New password must be at least 6 characters.'), '');
      return;
    }
    if (newPw !== confirmPw) {
      fail(new Error('New passwords do not match.'), '');
      return;
    }
    setChangingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      notify('Password changed.');
    } catch (e) {
      fail(e, 'Could not change password.');
    } finally {
      setChangingPw(false);
    }
  };

  const handleResetEmail = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      setResetSent(true);
      notify(`Reset link sent to ${user.email}.`);
    } catch (e) {
      fail(e, 'Could not send reset email.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(deletePw);
      navigate('/');
    } catch (e) {
      fail(e, 'Could not delete account.');
      setDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <div className={styles.library}>
      <header className={styles.header}>
        <Button variant="icon" size="sm" onClick={() => navigate('/library')} aria-label="Back">
          <ArrowLeft size={18} />
        </Button>
        <h1 className={styles.title}>Account</h1>
      </header>

      <div className={styles.section}>
        {error && <p className={styles.emptyDesc} role="alert" style={{ color: 'var(--color-error)' }}>{error}</p>}
        {success && <p className={styles.successMsg} role="status">{success}</p>}

        <p className={styles.sectionTitle}>Profile</p>
        <p style={{ font: 'var(--text-body-sm)', color: '#6b7280', marginBottom: 4 }}>{user?.email}</p>
        <p style={{ font: 'var(--text-body-sm)', color: '#6b7280', marginBottom: 16 }}>
          {user?.role === 'teacher' ? 'Teacher' : 'Student'} · {org?.name}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', maxWidth: 420 }}>
          <Input
            label="Display name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Button
            size="sm"
            onClick={handleSaveName}
            disabled={savingName || !name.trim() || name.trim() === user?.displayName}
            style={{ marginTop: 26 }}
          >
            <Check size={16} aria-hidden /> Save
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Password</p>
        <div style={{ maxWidth: 420 }}>
          <Input
            label="Current password"
            type="password"
            value={currentPw}
            onChange={e => setCurrentPw(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            autoComplete="new-password"
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <Button
              onClick={handleChangePassword}
              disabled={changingPw || !currentPw || !newPw || !confirmPw}
            >
              <KeyRound size={16} aria-hidden /> {changingPw ? 'Changing…' : 'Change password'}
            </Button>
            <Button variant="secondary" onClick={handleResetEmail} disabled={resetSent}>
              <Mail size={16} aria-hidden /> {resetSent ? 'Reset link sent' : 'Email me a reset link'}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Session</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={handleLogout}>Sign out</Button>
          <Button variant="danger" onClick={() => setShowDelete(true)}>
            <Trash2 size={16} aria-hidden /> Delete account
          </Button>
        </div>
      </div>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete account?">
        <p className={styles.emptyDesc}>
          This permanently deletes your account
          {user?.role === 'teacher'
            ? '. Your books and organization are not deleted, but you will lose access to them.'
            : ' and your learning progress.'}{' '}
          Enter your password to confirm.
        </p>
        <Input
          label="Password"
          type="password"
          value={deletePw}
          onChange={e => setDeletePw(e.target.value)}
          autoComplete="current-password"
        />
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteAccount} disabled={!deletePw || deleting}>
            {deleting ? 'Deleting…' : 'Delete forever'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
