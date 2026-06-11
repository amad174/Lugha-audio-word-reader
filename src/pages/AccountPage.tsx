import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import styles from './LibraryPage.module.css';

export function AccountPage() {
  const { user, org, signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
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
        <p className={styles.sectionTitle}>Profile</p>
        <p style={{ font: 'var(--text-body-md)', marginBottom: 4 }}>{user?.displayName}</p>
        <p style={{ font: 'var(--text-body-sm)', color: '#6b7280', marginBottom: 4 }}>{user?.email}</p>
        <p style={{ font: 'var(--text-body-sm)', color: '#6b7280', marginBottom: 24 }}>
          {user?.role === 'teacher' ? 'Teacher' : 'Student'} · {org?.name}
        </p>

        <Button variant="danger" onClick={handleLogout}>Sign out</Button>
      </div>
    </div>
  );
}
