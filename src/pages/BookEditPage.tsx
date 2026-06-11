import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Download, Upload, BookOpen } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Book, BookPage, Category } from '../types';
import {
  getBook,
  updateBook,
  listCategories,
} from '../services/libraryService';
import {
  importFilesToBook,
  deleteBookWithStorage,
  exportBookBundle,
  listPages,
} from '../services/bookService';
import styles from './LibraryPage.module.css';

export function BookEditPage() {
  const { bookId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const orgId = user?.orgId ?? '';

  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [importing, setImporting] = useState<{ current: number; total: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!orgId || !bookId) return;
    setLoading(true);
    setError('');
    try {
      const [b, c, p] = await Promise.all([
        getBook(orgId, bookId),
        listCategories(orgId),
        listPages(orgId, bookId),
      ]);
      if (!b) {
        setError('Book not found.');
        setBook(null);
        return;
      }
      setBook(b);
      setTitle(b.title);
      setCategoryId(b.categoryId ?? '');
      setCategories(c);
      setPages(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book.');
    } finally {
      setLoading(false);
    }
  }, [orgId, bookId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveMeta = async () => {
    if (!title.trim()) {
      setError('Book title is required.');
      return;
    }
    setError('');
    try {
      await updateBook(orgId, bookId, {
        title: title.trim(),
        categoryId: categoryId || null,
      });
      setSuccess('Saved.');
      setBook(prev => prev ? { ...prev, title: title.trim(), categoryId: categoryId || null } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setError('');
    setSuccess('');
    setImporting({ current: 0, total: files.length });
    try {
      const count = await importFilesToBook(orgId, bookId, files, (cur, tot) =>
        setImporting({ current: cur, total: tot })
      );
      await load();
      setSuccess(`Added ${count} page${count === 1 ? '' : 's'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(null);
    }
  };

  const handleDeleteBook = async () => {
    await deleteBookWithStorage(orgId, bookId);
    navigate('/library');
  };

  const handleExport = async () => {
    if (book) await exportBookBundle(orgId, bookId, book.title);
  };

  const closeDeleteModal = useCallback(() => setConfirmDelete(false), []);

  if (loading) {
    return (
      <div className="loadingScreen">
        <span className="loadingWordmark">Lugha</span>
        <div className="loadingSpinner" aria-hidden />
      </div>
    );
  }

  if (!book && error) {
    return (
      <div className={styles.library}>
        <header className={styles.header}>
          <Button variant="icon" size="sm" onClick={() => navigate('/library')} aria-label="Back">
            <ArrowLeft size={18} />
          </Button>
          <h1 className={styles.title}>Edit book</h1>
        </header>
        <div className={styles.section}>
          <p className={styles.emptyDesc} role="alert">{error}</p>
          <Button onClick={() => navigate('/library')}>Back to library</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.library}>
      <header className={styles.header}>
        <Button variant="icon" size="sm" onClick={() => navigate('/library')} aria-label="Back">
          <ArrowLeft size={18} />
        </Button>
        <h1 className={styles.title}>Edit book</h1>
      </header>

      <div className={styles.section}>
        {error && <p className={styles.emptyDesc} role="alert">{error}</p>}
        {success && <p className={styles.successMsg} role="status">{success}</p>}

        <label className={styles.sectionTitle} htmlFor="book-title">Title</label>
        <Input id="book-title" value={title} onChange={e => setTitle(e.target.value)} />

        {categories.length > 0 && (
          <>
            <label className={styles.sectionTitle} style={{ marginTop: 16 }} htmlFor="book-category">Category</label>
            <select
              id="book-category"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '9999px', border: '1px solid var(--color-muted)', marginBottom: 16 }}
            >
              <option value="">Uncategorized</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </>
        )}

        <div className={styles.editActions}>
          <Button onClick={handleSaveMeta}>Save</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={!!importing}>
            <Upload size={16} aria-hidden /> {pages.length ? 'Add pages' : 'Import PDF/images'}
          </Button>
          {pages.length > 0 && (
            <Button variant="primary" onClick={() => navigate(`/library/${bookId}`)}>
              <BookOpen size={16} aria-hidden /> Open book
            </Button>
          )}
          <Button variant="secondary" onClick={handleExport} disabled={pages.length === 0}>
            <Download size={16} aria-hidden /> Export
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} aria-hidden /> Delete book
          </Button>
        </div>

        {importing && (
          <p className={styles.bookMeta} role="status">
            Importing page {importing.current} of {importing.total}…
          </p>
        )}

        <p className={styles.bookMeta}>{pages.length} page{pages.length === 1 ? '' : 's'}</p>

        {pages.length > 0 && (
          <div className={styles.pageGrid}>
            {pages.map((page, idx) => (
              <div key={page.id} className={styles.pageThumb}>
                <img src={page.imageUrl} alt="" />
                <span className={styles.pageThumbLabel}>Page {idx + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" multiple hidden onChange={handleImport} />

      <Modal open={confirmDelete} onClose={closeDeleteModal} title="Delete book?">
        <p className={styles.emptyDesc}>This permanently deletes the book, all pages, and audio.</p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={closeDeleteModal}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteBook}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
