import React, { useState } from 'react';
import { GameConfig, GameLevel, UserProfile } from '../types';
import styles from './GameSettings.module.css';

interface Props {
  gameConfig: GameConfig;
  profiles: UserProfile[];
  onSave: (cfg: GameConfig) => void;
  onResetProfiles: () => void;
  onClose: () => void;
}

const LEVEL_ICONS = ['🌱','⭐','📖','🎓','👑','💎','🔥','🚀','🌈','⚡'];

export const GameSettings: React.FC<Props> = ({
  gameConfig, profiles, onSave, onResetProfiles, onClose,
}) => {
  const [cfg, setCfg] = useState<GameConfig>(() => JSON.parse(JSON.stringify(gameConfig)));
  const [confirmReset, setConfirmReset] = useState(false);
  const [tab, setTab] = useState<'levels' | 'players'>('levels');

  const updateLevel = (idx: number, field: keyof GameLevel, value: string | number) => {
    setCfg(prev => {
      const levels = prev.levels.map((l, i) => i === idx ? { ...l, [field]: value } : l);
      return { ...prev, levels };
    });
  };

  const addLevel = () => {
    const maxLevel = Math.max(...cfg.levels.map(l => l.level));
    const maxPts = Math.max(...cfg.levels.map(l => l.minPoints));
    setCfg(prev => ({
      ...prev,
      levels: [...prev.levels, { level: maxLevel + 1, name: 'New Level', icon: '🌟', minPoints: maxPts + 200 }],
    }));
  };

  const removeLevel = (idx: number) => {
    if (cfg.levels.length <= 1) return;
    setCfg(prev => ({ ...prev, levels: prev.levels.filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    // Re-number levels in order of minPoints
    const sorted = [...cfg.levels].sort((a, b) => a.minPoints - b.minPoints)
      .map((l, i) => ({ ...l, level: i + 1 }));
    onSave({ ...cfg, levels: sorted });
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <h2 className={styles.title}>Game Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'levels' ? styles.activeTab : ''}`} onClick={() => setTab('levels')}>Levels & Points</button>
          <button className={`${styles.tab} ${tab === 'players' ? styles.activeTab : ''}`} onClick={() => setTab('players')}>
            Players ({profiles.length})
          </button>
        </div>

        {tab === 'levels' && (
          <div className={styles.tabContent}>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>Points per word heard</label>
              <input
                type="number"
                className={styles.numInput}
                value={cfg.pointsPerWord}
                min={1}
                max={100}
                onChange={e => setCfg(prev => ({ ...prev, pointsPerWord: Math.max(1, parseInt(e.target.value) || 1) }))}
              />
            </div>

            <p className={styles.sectionLabel}>Levels</p>
            <div className={styles.levelsList}>
              {cfg.levels.map((level, idx) => (
                <div key={idx} className={styles.levelRow}>
                  <select
                    className={styles.iconSelect}
                    value={level.icon}
                    onChange={e => updateLevel(idx, 'icon', e.target.value)}
                  >
                    {LEVEL_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <input
                    className={styles.levelNameInput}
                    value={level.name}
                    onChange={e => updateLevel(idx, 'name', e.target.value)}
                    placeholder="Level name"
                    maxLength={16}
                  />
                  <div className={styles.levelPtsRow}>
                    <span className={styles.levelPtsLabel}>from</span>
                    <input
                      type="number"
                      className={styles.ptsInput}
                      value={level.minPoints}
                      min={0}
                      onChange={e => updateLevel(idx, 'minPoints', Math.max(0, parseInt(e.target.value) || 0))}
                      disabled={idx === 0}
                    />
                    <span className={styles.levelPtsLabel}>pts</span>
                  </div>
                  {cfg.levels.length > 1 && (
                    <button className={styles.removeLevelBtn} onClick={() => removeLevel(idx)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button className={styles.addLevelBtn} onClick={addLevel}>+ Add Level</button>
          </div>
        )}

        {tab === 'players' && (
          <div className={styles.tabContent}>
            {profiles.length === 0 ? (
              <p className={styles.emptyPlayers}>No players yet.</p>
            ) : (
              <div className={styles.playerList}>
                {profiles.map(p => (
                  <div key={p.id} className={styles.playerRow}>
                    <span className={styles.playerAvatar}>{p.avatar}</span>
                    <div className={styles.playerInfo}>
                      <div className={styles.playerName}>{p.name}</div>
                      <div className={styles.playerStats}>
                        {p.totalPoints} pts · {p.wordsHeard} words · Level {p.level}
                      </div>
                    </div>
                    <div className={styles.playerAchs}>{p.achievements.length} 🏆</div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.divider} />

            {!confirmReset ? (
              <button className={styles.resetBtn} onClick={() => setConfirmReset(true)}>
                🗑️ Reset All Player Data
              </button>
            ) : (
              <div className={styles.confirmArea}>
                <p className={styles.confirmText}>Delete all player profiles and scores?</p>
                <div className={styles.confirmBtns}>
                  <button className={styles.cancelBtn} onClick={() => setConfirmReset(false)}>Cancel</button>
                  <button className={styles.confirmDeleteBtn} onClick={() => { onResetProfiles(); onClose(); }}>Delete All</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.cancelFooterBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};
