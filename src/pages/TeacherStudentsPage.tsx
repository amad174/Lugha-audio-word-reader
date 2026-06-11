import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { listOrgStudents, regenerateInviteCode } from '../services/authService';
import { OrgMember } from '../types';
import styles from './LibraryPage.module.css';

export function TeacherStudentsPage() {
  const { user, org, refreshUser } = useAuthContext();
  const navigate = useNavigate();
  const orgId = user?.orgId ?? '';

  const [students, setStudents] = useState<OrgMember[]>([]);
  const [inviteCode, setInviteCode] = useState(org?.inviteCode ?? '');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setStudents(await listOrgStudents(orgId));
  }, [orgId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (org) setInviteCode(org.inviteCode); }, [org]);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const code = await regenerateInviteCode(orgId);
      setInviteCode(code);
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.library}>
      <header className={styles.header}>
        <Button variant="icon" size="sm" onClick={() => navigate('/library')} aria-label="Back">
          <ArrowLeft size={18} />
        </Button>
        <h1 className={styles.title}>Students</h1>
      </header>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Invite code</h2>
        <p className={styles.bookMeta} style={{ marginBottom: 8 }}>
          Share this code so students can join {org?.name}.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32 }}>
          <code style={{ font: 'var(--text-headline-sm)', letterSpacing: '0.2em', padding: '8px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-muted)', borderRadius: 8 }}>
            {inviteCode}
          </code>
          <Button variant="secondary" size="sm" onClick={handleRegenerate} disabled={loading}>
            <RefreshCw size={16} aria-hidden /> Regenerate
          </Button>
        </div>

        <h2 className={styles.sectionTitle}>Enrolled students ({students.length})</h2>
        {students.length === 0 ? (
          <p className={styles.emptyDesc}>No students have joined yet.</p>
        ) : (
          students.map(s => (
            <div key={s.uid} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-muted)' }}>
              <div style={{ font: 'var(--text-label-md)' }}>{s.displayName}</div>
              <div style={{ font: 'var(--text-body-sm)', color: '#6b7280' }}>{s.email}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
