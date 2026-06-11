import { dbGetPages, dbGetMappings } from '../utils/db';
import { createBook } from './libraryService';
import { importBundleToBook } from './bookService';
import { importBundle } from '../utils/storage';
import { StoredPage, AudioMapping } from '../types';

export async function hasLocalData(): Promise<boolean> {
  const pages = await dbGetPages();
  return pages.length > 0;
}

export async function getLocalLibrary(): Promise<{ pages: StoredPage[]; mappings: AudioMapping }> {
  const [pages, mappings] = await Promise.all([dbGetPages(), dbGetMappings()]);
  return { pages, mappings };
}

export async function importLocalLibraryToOrg(
  orgId: string,
  userId: string,
  title = 'Imported Library'
): Promise<string> {
  const { pages, mappings } = await getLocalLibrary();
  const book = await createBook(orgId, title, null, userId);
  await importBundleToBook(orgId, book.id, pages, mappings);
  return book.id;
}

export async function importBundleFileToOrg(
  orgId: string,
  userId: string,
  file: File,
  title?: string
): Promise<string> {
  const { pages, mappings } = await importBundle(file);
  const bookTitle = title ?? file.name.replace(/\.json$/i, '') ?? 'Imported Book';
  const book = await createBook(orgId, bookTitle, null, userId);
  await importBundleToBook(orgId, book.id, pages, mappings);
  return book.id;
}
