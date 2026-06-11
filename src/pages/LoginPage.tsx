import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthContext } from '../contexts/AuthContext';
import { signIn, resetPassword } from '../services/authService';
import { validateEmail } from '../utils/validation';
import styles from './AuthPages.module.css';

export function LoginPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/library';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!validateEmail(email)) {
      setError('Enter your email to reset password.');
      return;
    }
    try {
      await resetPassword(email);
      setMessage('Password reset email sent.');
      setError('');
    } catch {
      setError('Could not send reset email.');
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your Lugha account</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.fieldLabel}>Email</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          <label className={styles.fieldLabel}>Password</label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          {error && <p className={styles.error} role="alert">{error}</p>}
          {message && <p className={styles.subtitle}>{message}</p>}
          <div className={styles.actions}>
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button type="button" variant="link" onClick={handleReset}>
              Forgot password?
            </Button>
          </div>
        </form>

        <p className={styles.footer}>
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
