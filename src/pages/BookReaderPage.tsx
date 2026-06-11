import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Settings, Upload } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { PageViewer } from '../components/PageViewer';
import { AudioModal } from '../components/AudioModal';
import { Toolbar } from '../components/Toolbar';
import { LevelUpModal } from '../components/LevelUpModal';
import { AchievementToast } from '../components/AchievementToast';
import { Button } from '../components/ui/Button';
import { AppMode, BoundingBox, BookPage, AudioMapping, GameLevel, Achievement } from '../types';
import { getBook } from '../services/libraryService';
import {
  listPages,
  loadAudioMapping,
  savePageBoxes,
  assignAudio,
  removeBoxAudio,
  importFilesToBook,
} from '../services/bookService';
import { recordWordHeard, getGameConfig } from '../services/progressService';
import { DEFAULT_GAME_CONFIG } from '../utils/game';
import '../App.css';

export function BookReaderPage() {
  const { bookId = '' } = useParams();
  const navigate = useNavigate();
  const { user, isTeacher } = useAuthContext();
  const orgId = user?.orgId ?? '';

  const [bookTitle, setBookTitle] = useState('');
  const [pages, setPages] = useState<BookPage[]>([]);
  const [mappings, setMappings] = useState<AudioMapping>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mode, setMode] = useState<AppMode>(() => (isTeacher ? 'draw' : 'play'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingBox, setPendingBox] = useState<BoundingBox | null>(null);
  const [levelUpData, setLevelUpData] = useState<GameLevel | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [gameConfig, setGameConfig] = useState(DEFAULT_GAME_CONFIG);
  const [studentProgress, setStudentProgress] = useState({ totalPoints: 0, wordsHeard: 0 });
  const [importing, setImporting] = useState<{ current: number; total: number } | null>(null);

  const heardThisSession = useRef(new Set<string>());
  const fileRef = useRef<HTMLInputElement>(null);
  const currentPage = pages[currentIdx] ?? null;

  const loadBook = useCallback(async () => {
    if (!orgId || !bookId) return;
    setLoading(true);
    try {
      const [book, p, m, gc] = await Promise.all([
        getBook(orgId, bookId),
        listPages(orgId, bookId),
        loadAudioMapping(orgId, bookId),
        getGameConfig(orgId),
      ]);
      if (!book) {
        setError('Book not found.');
        return;
      }
      setBookTitle(book.title);
      setPages(p);
      setMappings(m);
      setGameConfig(gc);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load book.');
    } finally {
      setLoading(false);
    }
  }, [orgId, bookId]);

  useEffect(() => { loadBook(); }, [loadBook]);
  useEffect(() => { heardThisSession.current.clear(); }, [currentIdx]);
  useEffect(() => { if (!isTeacher) setMode('play'); }, [isTeacher]);

  const goToPage = (idx: number) => {
    setCurrentIdx(Math.max(0, Math.min(pages.length - 1, idx)));
  };

  const handleBoxAdd = useCallback(async (box: BoundingBox) => {
    if (!currentPage) return;
    const updated = [...currentPage.boxes.filter(b => b.id !== box.id), box];
    setPages(prev => prev.map(p => p.id === currentPage.id ? { ...p, boxes: updated } : p));
    await savePageBoxes(orgId, bookId, currentPage.id, updated);
  }, [currentPage, orgId, bookId]);

  const handleBoxDelete = useCallback(async (id: string) => {
    if (!currentPage) return;
    const updated = currentPage.boxes.filter(b => b.id !== id);
    setPages(prev => prev.map(p => p.id === currentPage.id ? { ...p, boxes: updated } : p));
    await savePageBoxes(orgId, bookId, currentPage.id, updated);
    if (mappings[id]) {
      await removeBoxAudio(orgId, bookId, id);
      setMappings(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [currentPage, orgId, bookId, mappings]);

  const handleAssign = useCallback(async (dataUrl: string) => {
    if (!pendingBox) return;
    const url = await assignAudio(orgId, bookId, pendingBox.id, dataUrl);
    setMappings(prev => ({ ...prev, [pendingBox.id]: url }));
    setPendingBox(null);
  }, [pendingBox, orgId, bookId]);

  const handleWordHeard = useCallback(async (boxId: string) => {
    if (!user || user.role !== 'student') return;
    if (heardThisSession.current.has(boxId)) return;
    heardThisSession.current.add(boxId);

    const result = await recordWordHeard(orgId, user.uid, bookId, boxId, gameConfig);
    setStudentProgress({
      totalPoints: result.progress.totalPoints,
      wordsHeard: result.progress.wordsHeard,
    });
    if (result.newAchievements.length > 0) {
      setPendingAchievements(prev => [...prev, ...result.newAchievements]);
    }
    if (result.leveledUp && result.newLevel) {
      setLevelUpData(result.newLevel);
    }
  }, [user, orgId, bookId, gameConfig]);

  const handleImportPages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !isTeacher) return;
    setError(null);
    setImporting({ current: 0, total: files.length });
    try {
      await importFilesToBook(orgId, bookId, files, (cur, tot) =>
        setImporting({ current: cur, total: tot })
      );
      await loadBook();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(null);
    }
  };

  const openImportPicker = useCallback(() => {
    fileRef.current?.click();
  }, []);

  if (loading) {
    return (
      <div className="loadingScreen">
        <span className="loadingWordmark">Lugha</span>
        <p className="loadingMessage">Loading book…</p>
        <div className="loadingSpinner" aria-hidden />
      </div>
    );
  }

  if (error || pages.length === 0) {
    return (
      <div className="emptyState">
        <p>{error ?? (importing ? `Importing page ${importing.current} of ${importing.total}…` : 'This book has no pages yet.')}</p>
        <div className="emptyStateActions">
          {isTeacher && (
            <Button onClick={openImportPicker} disabled={!!importing}>
              <Upload size={16} aria-hidden /> Import PDF/images
            </Button>
          )}
          {isTeacher && (
            <Button variant="secondary" onClick={() => navigate(`/library/${bookId}/edit`)}>
              Book settings
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/library')}>
            Back to library
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" multiple hidden onChange={handleImportPages} />
      </div>
    );
  }

  return (
    <div className="app">
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-muted)' }}>
        <Button variant="icon" size="sm" onClick={() => navigate('/library')} aria-label="Back to library">
          <ArrowLeft size={18} />
        </Button>
        <span style={{ font: 'var(--text-label-md)', flex: 1 }}>{bookTitle}</span>
        {isTeacher && (
          <Button variant="icon" size="sm" onClick={() => navigate(`/library/${bookId}/edit`)} aria-label="Book settings">
            <Settings size={18} />
          </Button>
        )}
      </header>

      <Toolbar
        currentPage={pages.length ? currentIdx + 1 : 0}
        totalPages={pages.length}
        mode={mode}
        isAdmin={isTeacher}
        currentProfile={user?.role === 'student' ? {
          id: user.uid,
          name: user.displayName,
          avatar: '👤',
          createdAt: user.createdAt,
          wordsHeard: studentProgress.wordsHeard,
          totalPoints: studentProgress.totalPoints,
          level: 1,
          achievements: [],
        } : null}
        onPrevPage={() => goToPage(currentIdx - 1)}
        onNextPage={() => goToPage(currentIdx + 1)}
        onSetMode={setMode}
        onImportPage={openImportPicker}
        onAdminMenu={() => navigate(`/library/${bookId}/edit`)}
        onAdminToggle={() => navigate('/account')}
        onSwitchProfile={() => navigate('/account')}
      />

      {importing && (
        <div className="importProgress" role="status">
          Importing page {importing.current} of {importing.total}…
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" multiple hidden onChange={handleImportPages} />

      <main className="main">
        {currentPage && (
          <PageViewer
            imageSrc={currentPage.imageUrl}
            mappings={mappings}
            mode={mode}
            boxes={currentPage.boxes}
            isAdmin={isTeacher}
            onBoxClick={box => setPendingBox(box)}
            onBoxAdd={handleBoxAdd}
            onBoxDelete={handleBoxDelete}
            onWordHeard={handleWordHeard}
            onSwipe={dir => goToPage(currentIdx + (dir === 'left' ? 1 : -1))}
          />
        )}
      </main>

      {pendingBox && (
        <AudioModal
          onAssign={handleAssign}
          onCancel={() => setPendingBox(null)}
          existingAudio={mappings[pendingBox.id]}
        />
      )}

      {levelUpData && user && (
        <LevelUpModal
          newLevel={levelUpData}
          profile={{
            id: user.uid,
            name: user.displayName,
            avatar: '👤',
            createdAt: user.createdAt,
            wordsHeard: studentProgress.wordsHeard,
            totalPoints: studentProgress.totalPoints,
            level: levelUpData.level,
            achievements: [],
          }}
          gameConfig={gameConfig}
          onContinue={() => setLevelUpData(null)}
        />
      )}

      {pendingAchievements.length > 0 && (
        <AchievementToast
          achievement={pendingAchievements[0]}
          onDismiss={() => setPendingAchievements(prev => prev.slice(1))}
        />
      )}
    </div>
  );
}
