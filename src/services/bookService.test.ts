import {
  isPdfFile,
  isImageFile,
  importFilesToBook,
} from './bookService';

jest.mock('../firebase/config', () => ({ db: {}, storage: {} }));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  writeBatch: jest.fn(),
}));

jest.mock('./storageService', () => ({
  uploadDataUrl: jest.fn(async (path: string) => `https://storage.example/${path}`),
  dataUrlFromFile: jest.fn(async () => 'data:image/png;base64,abc'),
  pageImagePath: jest.fn((orgId: string, bookId: string, pageId: string) =>
    `orgs/${orgId}/books/${bookId}/pages/${pageId}.jpg`
  ),
  audioPath: jest.fn(),
  deleteStoragePath: jest.fn(),
  deleteBookStorage: jest.fn(),
}));

jest.mock('./libraryService', () => ({
  updateBook: jest.fn(),
  newPageId: jest.fn(() => 'page-test-id'),
}));

jest.mock('../utils/pdf', () => ({
  pdfToDataUrls: jest.fn(async () => ['data:image/jpeg;base64,pdfpage']),
  countPdfPages: jest.fn(async () => 1),
}));

import { getDocs, setDoc } from 'firebase/firestore';
import { updateBook } from './libraryService';
import { pdfToDataUrls, countPdfPages } from '../utils/pdf';

const mockGetDocs = getDocs as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockUpdateBook = updateBook as jest.Mock;
const mockPdfToDataUrls = pdfToDataUrls as jest.Mock;
const mockCountPdfPages = countPdfPages as jest.Mock;

function makeFile(name: string, type: string): File {
  return new File(['content'], name, { type });
}

describe('bookService file detection', () => {
  test('isPdfFile accepts application/pdf MIME', () => {
    expect(isPdfFile(makeFile('book.pdf', 'application/pdf'))).toBe(true);
  });

  test('isPdfFile accepts .pdf extension when MIME is empty', () => {
    expect(isPdfFile(makeFile('book.pdf', ''))).toBe(true);
    expect(isPdfFile(makeFile('book.pdf', 'application/octet-stream'))).toBe(true);
  });

  test('isPdfFile rejects non-pdf', () => {
    expect(isPdfFile(makeFile('photo.jpg', 'image/jpeg'))).toBe(false);
  });

  test('isImageFile accepts image MIME and extensions', () => {
    expect(isImageFile(makeFile('a.png', 'image/png'))).toBe(true);
    expect(isImageFile(makeFile('a.jpg', ''))).toBe(true);
    expect(isImageFile(makeFile('a.webp', ''))).toBe(true);
  });

  test('isImageFile rejects non-images', () => {
    expect(isImageFile(makeFile('doc.txt', 'text/plain'))).toBe(false);
  });
});

describe('importFilesToBook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateBook.mockResolvedValue(undefined);
    mockPdfToDataUrls.mockResolvedValue(['data:image/jpeg;base64,pdfpage']);
    mockCountPdfPages.mockResolvedValue(1);
  });

  test('returns 0 for empty file list', async () => {
    expect(await importFilesToBook('org1', 'book1', [])).toBe(0);
  });

  test('throws when no supported files', async () => {
    await expect(
      importFilesToBook('org1', 'book1', [makeFile('notes.txt', 'text/plain')])
    ).rejects.toThrow(/no supported files/i);
  });

  test('throws when mix includes unsupported file', async () => {
    await expect(
      importFilesToBook('org1', 'book1', [
        makeFile('page.png', 'image/png'),
        makeFile('notes.txt', 'text/plain'),
      ])
    ).rejects.toThrow(/unsupported file type/i);
  });

  test('imports a single image and updates book metadata', async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({
        docs: [{
          id: 'page-test-id',
          data: () => ({
            name: 'page.png',
            sortOrder: 0,
            imageUrl: 'https://storage.example/x.jpg',
            boxes: [],
          }),
        }],
      });

    const added = await importFilesToBook('org1', 'book1', [
      makeFile('page.png', 'image/png'),
    ]);

    expect(added).toBe(1);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateBook).toHaveBeenCalledWith('org1', 'book1', {
      pageCount: 1,
      coverUrl: 'https://storage.example/x.jpg',
    });
  });

  test('imports PDF by extension and calls pdf utils', async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({
        docs: [{
          id: 'page-test-id',
          data: () => ({
            name: 'lesson.pdf p1',
            sortOrder: 0,
            imageUrl: 'https://storage.example/x.jpg',
            boxes: [],
          }),
        }],
      });

    const added = await importFilesToBook('org1', 'book1', [
      makeFile('lesson.pdf', 'application/octet-stream'),
    ]);

    expect(countPdfPages).toHaveBeenCalled();
    expect(pdfToDataUrls).toHaveBeenCalled();
    expect(added).toBe(1);
  });

  test('reports progress callbacks', async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    const progress: Array<[number, number]> = [];
    await importFilesToBook(
      'org1',
      'book1',
      [makeFile('a.png', 'image/png'), makeFile('b.png', 'image/png')],
      (cur, tot) => progress.push([cur, tot])
    );

    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]).toEqual([2, 2]);
  });

  test('appends pages after existing sort order', async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          { id: 'p0', data: () => ({ sortOrder: 0 }) },
          { id: 'p1', data: () => ({ sortOrder: 1 }) },
        ],
      })
      .mockResolvedValueOnce({ docs: [] });

    await importFilesToBook('org1', 'book1', [makeFile('new.png', 'image/png')]);

    const setCall = mockSetDoc.mock.calls[0][1];
    expect(setCall.sortOrder).toBe(2);
  });
});
