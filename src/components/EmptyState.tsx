import React from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import styles from './EmptyState.module.css';

interface Props {
  isAdmin: boolean;
  onImport: () => void;
  onImportBundle: () => void;
  onAdminLogin: () => void;
}

export const EmptyState: React.FC<Props> = ({
  isAdmin, onImport, onImportBundle, onAdminLogin,
}) => (
  <div className={styles.root}>
    <h1 className={styles.title}>Lugha</h1>
    {isAdmin ? (
      <>
        <p className={styles.desc}>
          Import a PDF or load a saved bundle to get started.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={onImport}>
            Import PDF / Images
          </Button>
          <Button variant="secondary" onClick={onImportBundle}>
            Load bundle
          </Button>
        </div>
        <Card className={styles.guide} padding="md" title="Admin setup">
          <ol className={styles.steps}>
            <li>Import PDF or images <strong>(📄)</strong></li>
            <li>Use <strong>✒️ Draw</strong> — drag over each letter/word</li>
            <li>Record or upload audio for each box</li>
            <li>Export bundle via <strong>⚙️</strong> to share with learners</li>
            <li>Learners load the bundle, sign in, and tap to listen</li>
          </ol>
        </Card>
      </>
    ) : (
      <>
        <p className={styles.desc}>
          Load a bundle from your teacher to start learning.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={onImportBundle}>
            Load bundle
          </Button>
          <Button variant="link" onClick={onAdminLogin}>
            Teacher login
          </Button>
        </div>
      </>
    )}
  </div>
);
