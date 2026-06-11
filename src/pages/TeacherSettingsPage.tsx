import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { GameSettings } from '../components/GameSettings';
import { getGameConfig, saveGameConfig } from '../services/progressService';
import { DEFAULT_GAME_CONFIG } from '../utils/game';
import { GameConfig } from '../types';
import styles from './LibraryPage.module.css';

export function TeacherSettingsPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const orgId = user?.orgId ?? '';
  const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getGameConfig(orgId).then(setConfig);
  }, [orgId]);

  if (!open) {
    return (
      <div className={styles.library}>
        <header className={styles.header}>
          <Button variant="icon" size="sm" onClick={() => navigate('/library')} aria-label="Back">
            <ArrowLeft size={18} />
          </Button>
          <h1 className={styles.title}>Settings</h1>
        </header>
        <div className={styles.section}>
          <Button onClick={() => setOpen(true)}>Game settings</Button>
        </div>
      </div>
    );
  }

  return (
    <GameSettings
      gameConfig={config}
      profiles={[]}
      onSave={async cfg => {
        await saveGameConfig(orgId, cfg);
        setConfig(cfg);
        setOpen(false);
      }}
      onResetProfiles={() => {}}
      onClose={() => setOpen(false)}
    />
  );
}
