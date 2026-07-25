import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Category, Book } from '../types';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listBooks,
} from '../services/libraryService';
import styles from './LibraryPage.module.css';

export function TeacherCategoriesPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const orgId = user?.orgId ?? '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    const [c, b] = await Promise.all([listCategories(orgId), listBooks(orgId)]);
    setCategories(c);
    setBooks(b);
  }, [orgId]);

  const bookCount = (categoryId: string) =>
    books.filter(b => b.categoryId === categoryId).length;

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createCategory(orgId, newName.trim());
    setNewName('');
    await load();
  };

  const handleSaveEdit = async (id: string) => {
    await updateCategory(orgId, id, editName);
    setEditingId(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(orgId, id);
    await load();
  };

  return (
    <div className={styles.library}>
      <header className={styles.header}>
        <Button variant="icon" size="sm" onClick={() => navigate('/library')} aria-label="Back">
          <ArrowLeft size={18} />
        </Button>
        <h1 className={styles.title}>Categories</h1>
      </header>

      <div className={styles.section}>
        <p className={styles.emptyDesc} style={{ marginBottom: 20 }}>
          Categories are the shelves of your library. Books grouped under a category appear
          under that heading for you and your students — for example “Qaida”, “Level 1”, or
          “Stories”. Assign a book to a category from its settings page.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <Input placeholder="New category name, e.g. Level 1" value={newName} onChange={e => setNewName(e.target.value)} />
          <Button onClick={handleAdd}>Add</Button>
        </div>

        {categories.length === 0 ? (
          <p className={styles.emptyDesc}>
            No categories yet. Add your first one above — you can rename or remove it at any time.
          </p>
        ) : (
          categories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              {editingId === cat.id ? (
                <>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} />
                  <Button size="sm" onClick={() => handleSaveEdit(cat.id)}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, font: 'var(--text-body-md)' }}>
                    {cat.name}
                    <span style={{ font: 'var(--text-body-sm)', color: '#6b7280', marginLeft: 8 }}>
                      {bookCount(cat.id)} book{bookCount(cat.id) === 1 ? '' : 's'}
                    </span>
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(cat.id)} aria-label={`Delete ${cat.name}`}>
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
