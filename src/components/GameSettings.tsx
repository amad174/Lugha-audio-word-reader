import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { GameConfig, GameLevel, UserProfile } from '../types';
import { getLevelForPoints } from '../utils/game';
import { Sheet } from './ui/Sheet';
import { Tabs, TabItem } from './ui/Tabs';
import { Button } from './ui/Button';
import styles from './GameSettings.module.css';

interface Props {
  gameConfig: GameConfig;
  profiles: UserProfile[];
  onSave: (cfg: GameConfig) => void;
  onResetProfiles: () => void;
  onClose: () => void;
}

const LEVEL_ICONS = ['🌱', '⭐', '📖', '🎓', '👑', '💎', '🔥', '🚀', '🌈', '⚡'];

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
    const sorted = [...cfg.levels].sort((a, b) => a.minPoints - b.minPoints)
      .map((l, i) => ({ ...l, level: i + 1 }));
    onSave({ ...cfg, levels: sorted });
    onClose();
  };

  const levelsContent = (
    <div className={styles.tabContent}>
      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel} htmlFor="points-per-word">Points per word heard</label>
        <input
          id="points-per-word"
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
              aria-label="Level icon"
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
              <Button variant="icon" size="sm" onClick={() => removeLevel(idx)} aria-label="Remove level">
                <Trash2 size={16} aria-hidden />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button variant="secondary" fullWidth onClick={addLevel}>
        <Plus size={18} aria-hidden />
        Add level
      </Button>
    </div>
  );

  const playersContent = (
    <div className={styles.tabContent}>
      {profiles.length === 0 ? (
        <p className={styles.emptyPlayers}>No players yet.</p>
      ) : (
        <div className={styles.playerList}>
          {profiles.map(p => {
            const level = getLevelForPoints(p.totalPoints, cfg.levels);
            return (
              <div key={p.id} className={styles.playerRow}>
                <span className={styles.playerAvatar}>{p.avatar}</span>
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>{p.name}</div>
                  <div className={styles.playerStats}>
                    {p.totalPoints} pts · {p.wordsHeard} words · Level {level.level} {level.icon}
                  </div>
                </div>
                <div className={styles.playerAchs}>{p.achievements.length} 🏆</div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.divider} />

      {!confirmReset ? (
        <Button variant="danger" fullWidth onClick={() => setConfirmReset(true)}>
          <Trash2 size={18} aria-hidden />
          Reset all player data
        </Button>
      ) : (
        <div className={styles.confirmArea}>
          <p className={styles.confirmText}>Delete all player profiles and scores?</p>
          <div className={styles.confirmBtns}>
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => { onResetProfiles(); onClose(); }}>Delete all</Button>
          </div>
        </div>
      )}
    </div>
  );

  const tabItems: TabItem[] = [
    { id: 'levels', label: 'Levels & points', content: levelsContent },
    { id: 'players', label: `Players (${profiles.length})`, content: playersContent },
  ];

  return (
    <Sheet open title="Game settings" onClose={onClose}>
      <Tabs items={tabItems} value={tab} onChange={(id) => setTab(id as 'levels' | 'players')} />

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </Sheet>
  );
};
