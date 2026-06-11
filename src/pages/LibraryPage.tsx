import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Users, User, Upload } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Book, Category } from '../types';
import { listBooks, listCategories, createBook, createCategory } from '../services/libraryService';
import { getProgress, getGameConfig } from '../services/progressService';
import { getLevelForPoints, pointsToNextLevel, DEFAULT_GAME_CONFIG } from '../utils/game';
import { hasLocalData } from '../services/localMigrationService';
import styles from './LibraryPage.module.css';

export function LibraryPage() {
  const { user, org, isTeacher } = useAuthContext();
  const navigate = useNavigate();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBook, setShowNewBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [error, setError] = useState('');
  const [progressPts, setProgressPts] = useState(0);
  const [progressLevel, setProgressLevel] = useState('');
  const [localDataExists, setLocalDataExists] = useState(false);
  const [gameConfig, setGameConfig] = useState(DEFAULT_GAME_CONFIG);

  const orgId = user?.orgId ?? '';

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [b, c, gc] = await Promise.all([
        listBooks(orgId),
        listCategories(orgId),
        getGameConfig(orgId),
      ]);
      setBooks(b);
      setCategories(c);
      setGameConfig(gc);

      if (user?.role === 'student') {
        const p = await getProgress(orgId, user.uid);
        setProgressPts(p.totalPoints);
        const lvl = getLevelForPoints(p.totalPoints, gc.levels);
        setProgressLevel(`${lvl.icon} ${lvl.name}`);
      }

      if (isTeacher) {
        setLocalDataExists(await hasLocalData());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load library.');
    } finally {
      setLoading(false);
    }
  }, [orgId, user, isTeacher]);

  useEffect(() => { load(); }, [load]);

  const closeNewBook = useCallback(() => {
    setShowNewBook(false);
    setNewBookTitle('');
    setNewBookCategory('');
  }, []);

  const closeNewCategory = useCallback(() => {
    setShowNewCategory(false);
    setNewCategoryName('');
  }, []);

  const handleCreateBook = async () => {
    if (!user || !newBookTitle.trim()) return;
    setError('');
    try {
      const book = await createBook(
        orgId,
        newBookTitle.trim(),
        newBookCategory || null,
        user.uid
      );
      setShowNewBook(false);
      setNewBookTitle('');
      navigate(`/library/${book.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create book.');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createCategory(orgId, newCategoryName.trim());
      setShowNewCategory(false);
      setNewCategoryName('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create category.');
    }
  };

  const booksByCategory = (categoryId: string | null) =>
    books.filter(b => (categoryId ? b.categoryId === categoryId : !b.categoryId));

  const { progress } = user?.role === 'student'
    ? pointsToNextLevel(progressPts, gameConfig.levels)
    : { progress: 0 };

  if (loading) {
    return (
      <div className="loadingScreen">
        <span className="loadingWordmark">Lugha</span>
        <p className="loadingMessage">Loading library…</p>
        <div className="loadingSpinner" aria-hidden />
      </div>
    );
  }

  return (
    <div className={styles.library}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Lugha</h1>
          {org && <p className={styles.orgName}>{org.name}</p>}
        </div>
        <div className={styles.headerActions}>
          {isTeacher && (
            <>
              <Button variant="secondary" size="sm" onClick={() => navigate('/teacher/categories')}>
                <FolderOpen size={16} aria-hidden /> Categories
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/teacher/students')}>
                <Users size={16} aria-hidden /> Students
              </Button>
              {localDataExists && (
                <Button variant="secondary" size="sm" onClick={() => navigate('/import-local')}>
                  <Upload size={16} aria-hidden /> Import local
                </Button>
              )}
              <Button size="sm" onClick={() => setShowNewBook(true)}>
                <Plus size={16} aria-hidden /> Add book
              </Button>
            </>
          )}
          <Button variant="icon" size="sm" onClick={() => navigate('/account')} aria-label="Account">
            <User size={16} aria-hidden />
          </Button>
        </div>
      </header>

      {user?.role === 'student' && (
        <div className={styles.studentHud}>
          <div>
            <div className={styles.progressLabel}>{user.displayName}</div>
            <div className={styles.progressMeta}>{progressLevel} · {progressPts} pts</div>
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {error && <p className={styles.emptyDesc} role="alert">{error}</p>}

      {books.length === 0 ? (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>No books yet</h2>
          <p className={styles.emptyDesc}>
            {isTeacher
              ? 'Create your first book and import PDF pages to get started.'
              : 'Ask your teacher to add books to your library.'}
          </p>
          {isTeacher && (
            <Button onClick={() => setShowNewBook(true)}>
              <Plus size={16} aria-hidden /> Add book
            </Button>
          )}
        </div>
      ) : (
        <>
          {categories.map(cat => {
            const catBooks = booksByCategory(cat.id);
            if (catBooks.length === 0) return null;
            return (
              <section key={cat.id} className={styles.section}>
                <h2 className={styles.sectionTitle}>{cat.name}</h2>
                <div className={styles.bookGrid}>
                  {catBooks.map(book => (
                    <BookCard key={book.id} book={book} onOpen={() => navigate(`/library/${book.id}`)} />
                  ))}
                </div>
              </section>
            );
          })}

          {booksByCategory(null).length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {categories.length > 0 ? 'Uncategorized' : 'All books'}
              </h2>
              <div className={styles.bookGrid}>
                {booksByCategory(null).map(book => (
                  <BookCard key={book.id} book={book} onOpen={() => navigate(`/library/${book.id}`)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Modal open={showNewBook} onClose={closeNewBook} title="New book">
        <div className={styles.modalForm}>
          <Input
            placeholder="Book title"
            value={newBookTitle}
            onChange={e => setNewBookTitle(e.target.value)}
          />
          {categories.length > 0 && (
            <select
              value={newBookCategory}
              onChange={e => setNewBookCategory(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '9999px', border: '1px solid var(--color-muted)' }}
            >
              <option value="">Uncategorized</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={closeNewBook}>Cancel</Button>
            <Button onClick={handleCreateBook} disabled={!newBookTitle.trim()}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showNewCategory} onClose={closeNewCategory} title="New category">
        <div className={styles.modalForm}>
          <Input
            placeholder="Category name"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
          />
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={closeNewCategory}>Cancel</Button>
            <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BookCard({ book, onOpen }: { book: Book; onOpen: () => void }) {
  return (
    <button type="button" className={styles.bookCard} onClick={onOpen}>
      {book.coverUrl ? (
        <img src={book.coverUrl} alt="" className={styles.cover} />
      ) : (
        <div className={styles.coverPlaceholder}>📖</div>
      )}
      <div className={styles.bookTitle}>{book.title}</div>
      <div className={styles.bookMeta}>{book.pageCount} pages</div>
    </button>
  );
}
