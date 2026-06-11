import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Category } from '../types';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/libraryService';
import styles from './LibraryPage.module.css';

export function TeacherCategoriesPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const orgId = user?.orgId ?? '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    setCategories(await listCategories(orgId));
  }, [orgId]);

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
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <Input placeholder="New category name" value={newName} onChange={e => setNewName(e.target.value)} />
          <Button onClick={handleAdd}>Add</Button>
        </div>

        {categories.length === 0 ? (
          <p className={styles.emptyDesc}>No categories yet.</p>
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
                  <span style={{ flex: 1, font: 'var(--text-body-md)' }}>{cat.name}</span>
                  <Button size="sm" variant="secondary" onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(cat.id)}>
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
