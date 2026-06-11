import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthContext } from '../contexts/AuthContext';
import { signUpTeacher, signUpStudent } from '../services/authService';
import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateOrgName,
  validateInviteCode,
} from '../utils/validation';
import styles from './AuthPages.module.css';

type Role = 'teacher' | 'student';

export function SignupPage() {
  const { user, refreshUser } = useAuthContext();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<Role>(() =>
    searchParams.get('role') === 'teacher' ? 'teacher' : 'student'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/library" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) return setError('Enter a valid email.');
    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);
    const nameErr = validateDisplayName(displayName);
    if (nameErr) return setError(nameErr);

    if (role === 'teacher') {
      const orgErr = validateOrgName(orgName);
      if (orgErr) return setError(orgErr);
    } else {
      const codeErr = validateInviteCode(inviteCode);
      if (codeErr) return setError(codeErr);
    }

    setLoading(true);
    try {
      if (role === 'teacher') {
        await signUpTeacher(email, password, displayName, orgName);
      } else {
        await signUpStudent(email, password, displayName, inviteCode);
      }
      await refreshUser();
      navigate('/library', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>Join Lugha</h1>
        <p className={styles.subtitle}>Create your account</p>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${role === 'student' ? styles.tabActive : ''}`}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button
            type="button"
            className={`${styles.tab} ${role === 'teacher' ? styles.tabActive : ''}`}
            onClick={() => setRole('teacher')}
          >
            Teacher
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.fieldLabel}>Name</label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} autoComplete="name" />

          <label className={styles.fieldLabel}>Email</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />

          <label className={styles.fieldLabel}>Password</label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />

          {role === 'teacher' ? (
            <>
              <label className={styles.fieldLabel}>Organization name</label>
              <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Al-Noor Academy" />
            </>
          ) : (
            <>
              <label className={styles.fieldLabel}>Invite code</label>
              <Input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} />
            </>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}

          <div className={styles.actions}>
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </div>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
