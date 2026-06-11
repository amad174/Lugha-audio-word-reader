import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { hasLocalData, importLocalLibraryToOrg } from '../services/localMigrationService';
import styles from './LibraryPage.module.css';

export function ImportLocalPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const orgId = user?.orgId ?? '';

  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    hasLocalData().then(setExists);
  }, []);

  const handleImport = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const bookId = await importLocalLibraryToOrg(orgId, user.uid);
      navigate(`/library/${bookId}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
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
        <h1 className={styles.title}>Import local library</h1>
      </header>

      <div className={styles.section}>
        {exists ? (
          <>
            <p className={styles.emptyDesc}>
              We found books saved locally in this browser. Import them into your organization as a new book.
            </p>
            {error && <p className={styles.emptyDesc} role="alert" style={{ color: 'var(--color-error)' }}>{error}</p>}
            <Button onClick={handleImport} disabled={loading}>
              <Upload size={16} aria-hidden />
              {loading ? 'Importing…' : 'Import to cloud'}
            </Button>
          </>
        ) : (
          <p className={styles.emptyDesc}>No local library data found on this device.</p>
        )}
      </div>
    </div>
  );
}
