import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload } from 'lucide-react';
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
import { getCache, setCache } from '../utils/cache';
import { preloadAudio } from '../utils/audio';
import '../App.css';

interface ReaderCache {
  bookTitle: string;
  pages: BookPage[];
  mappings: AudioMapping;
}

const TAP_HINT_KEY = 'lugha_tap_hint_dismissed';

export function BookReaderPage() {
  const { bookId = '' } = useParams();
  const navigate = useNavigate();
  const { user, isTeacher } = useAuthContext();
  const orgId = user?.orgId ?? '';

  const cached = getCache<ReaderCache>(`book:${bookId}`);

  const [bookTitle, setBookTitle] = useState(cached?.bookTitle ?? '');
  const [pages, setPages] = useState<BookPage[]>(cached?.pages ?? []);
  const [mappings, setMappings] = useState<AudioMapping>(cached?.mappings ?? {});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mode, setMode] = useState<AppMode>(() => (isTeacher ? 'draw' : 'play'));
  const [loading, setLoading] = useState(!cached);
  const [showTapHint, setShowTapHint] = useState(false);
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
    if (!getCache<ReaderCache>(`book:${bookId}`)) setLoading(true);
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
      setCache<ReaderCache>(`book:${bookId}`, { bookTitle: book.title, pages: p, mappings: m });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load book.');
    } finally {
      setLoading(false);
    }
  }, [orgId, bookId]);

  useEffect(() => { loadBook(); }, [loadBook]);
  useEffect(() => { heardThisSession.current.clear(); }, [currentIdx]);
  useEffect(() => { if (!isTeacher) setMode('play'); }, [isTeacher]);

  // Preload the current page's recordings so tapping a word plays instantly,
  // and warm up neighbouring page images so page turns feel immediate.
  useEffect(() => {
    const page = pages[currentIdx];
    if (!page) return;
    preloadAudio(page.boxes.map(b => mappings[b.id]).filter(Boolean));
    [pages[currentIdx + 1], pages[currentIdx - 1]].forEach(p => {
      if (p?.imageUrl) {
        const img = new Image();
        img.src = p.imageUrl;
      }
    });
  }, [pages, currentIdx, mappings]);

  // One-time student hint: shows once per device when a page has tappable audio.
  useEffect(() => {
    if (isTeacher || mode !== 'play') return;
    const page = pages[currentIdx];
    if (!page || !page.boxes.some(b => mappings[b.id])) return;
    try {
      if (localStorage.getItem(TAP_HINT_KEY)) return;
    } catch {
      return;
    }
    setShowTapHint(true);
  }, [isTeacher, mode, pages, currentIdx, mappings]);

  const dismissTapHint = useCallback(() => {
    setShowTapHint(false);
    try {
      localStorage.setItem(TAP_HINT_KEY, '1');
    } catch {
      // localStorage unavailable — hint may show again, which is harmless
    }
  }, []);

  const goToPage = (idx: number) => {
    setCurrentIdx(Math.max(0, Math.min(pages.length - 1, idx)));
  };

  const handleBoxAdd = useCallback(async (box: BoundingBox) => {
    if (!currentPage) return;
    const updated = [...currentPage.boxes.filter(b => b.id !== box.id), box];
    setPages(prev => prev.map(p => p.id === currentPage.id ? { ...p, boxes: updated } : p));
    try {
      await savePageBoxes(orgId, bookId, currentPage.id, updated);
    } catch (e) {
      setPages(prev => prev.map(p => p.id === currentPage.id ? { ...p, boxes: currentPage.boxes } : p));
      setError(e instanceof Error ? e.message : 'Could not save box.');
    }
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
      <Toolbar
        bookTitle={bookTitle}
        onBack={() => navigate('/library')}
        onBookSettings={isTeacher ? () => navigate(`/library/${bookId}/edit`) : undefined}
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

      {error && (
        <div className="errorBanner" role="alert" onClick={() => setError(null)}>
          {error}
          <span className="errorDismiss">Dismiss</span>
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
            onPrevPage={currentIdx > 0 ? () => goToPage(currentIdx - 1) : undefined}
            onNextPage={currentIdx < pages.length - 1 ? () => goToPage(currentIdx + 1) : undefined}
          />
        )}
      </main>

      {showTapHint && (
        <div className="tapHintOverlay" role="dialog" aria-label="How to listen">
          <div className="tapHintCard">
            <div className="tapHintIcon" aria-hidden>🔊</div>
            <h2 className="tapHintTitle">Tap a word to hear it</h2>
            <p className="tapHintBody">
              Words with a soft green highlight have audio. Tap one and listen — you earn points for every new word you hear.
            </p>
            <Button onClick={dismissTapHint} fullWidth>Got it</Button>
          </div>
        </div>
      )}

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
