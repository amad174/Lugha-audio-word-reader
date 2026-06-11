import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Category, Book } from '../types';
import { slugifyId } from '../utils/validation';

function categoriesRef(orgId: string) {
  return collection(db, 'orgs', orgId, 'categories');
}

function booksRef(orgId: string) {
  return collection(db, 'orgs', orgId, 'books');
}

export async function listCategories(orgId: string): Promise<Category[]> {
  const q = query(categoriesRef(orgId), orderBy('sortOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
}

export async function createCategory(orgId: string, name: string): Promise<Category> {
  const existing = await listCategories(orgId);
  const now = Date.now();
  const ref = await addDoc(categoriesRef(orgId), {
    name: name.trim(),
    sortOrder: existing.length,
    createdAt: now,
  });
  return { id: ref.id, name: name.trim(), sortOrder: existing.length, createdAt: now };
}

export async function updateCategory(orgId: string, categoryId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'orgs', orgId, 'categories', categoryId), {
    name: name.trim(),
  });
}

export async function deleteCategory(orgId: string, categoryId: string): Promise<void> {
  const booksQ = query(booksRef(orgId), where('categoryId', '==', categoryId));
  const booksSnap = await getDocs(booksQ);
  const batch = writeBatch(db);
  booksSnap.docs.forEach(b => {
    batch.update(b.ref, { categoryId: null, updatedAt: Date.now() });
  });
  batch.delete(doc(db, 'orgs', orgId, 'categories', categoryId));
  await batch.commit();
}

export async function listBooks(orgId: string): Promise<Book[]> {
  const q = query(booksRef(orgId), orderBy('sortOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Book));
}

export async function getBook(orgId: string, bookId: string): Promise<Book | null> {
  const snap = await getDoc(doc(db, 'orgs', orgId, 'books', bookId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Book;
}

export async function createBook(
  orgId: string,
  title: string,
  categoryId: string | null,
  createdBy: string
): Promise<Book> {
  const existing = await listBooks(orgId);
  const now = Date.now();
  const ref = await addDoc(booksRef(orgId), {
    title: title.trim(),
    categoryId,
    coverUrl: null,
    pageCount: 0,
    sortOrder: existing.length,
    createdBy,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: ref.id,
    title: title.trim(),
    categoryId,
    coverUrl: null,
    pageCount: 0,
    sortOrder: existing.length,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateBook(
  orgId: string,
  bookId: string,
  updates: Partial<Pick<Book, 'title' | 'categoryId' | 'coverUrl' | 'pageCount' | 'sortOrder'>>
): Promise<void> {
  await updateDoc(doc(db, 'orgs', orgId, 'books', bookId), {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteBook(orgId: string, bookId: string): Promise<void> {
  const pagesSnap = await getDocs(collection(db, 'orgs', orgId, 'books', bookId, 'pages'));
  const audioSnap = await getDocs(collection(db, 'orgs', orgId, 'books', bookId, 'audio'));
  const batch = writeBatch(db);
  pagesSnap.docs.forEach(d => batch.delete(d.ref));
  audioSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'orgs', orgId, 'books', bookId));
  await batch.commit();
}

export function newPageId(): string {
  return slugifyId();
}
