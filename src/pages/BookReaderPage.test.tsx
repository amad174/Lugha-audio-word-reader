import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BookReaderPage } from './BookReaderPage';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ bookId: 'book1' }),
  useNavigate: () => jest.fn(),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('../services/libraryService', () => ({
  getBook: jest.fn(),
}));

jest.mock('../services/bookService', () => ({
  listPages: jest.fn(),
  loadAudioMapping: jest.fn(),
  importFilesToBook: jest.fn(),
  savePageBoxes: jest.fn(),
  assignAudio: jest.fn(),
  removeBoxAudio: jest.fn(),
}));

jest.mock('../services/progressService', () => ({
  getGameConfig: jest.fn(),
  recordWordHeard: jest.fn(),
}));

jest.mock('../components/PageViewer', () => ({
  PageViewer: () => <div data-testid="page-viewer">Page viewer</div>,
}));

jest.mock('../components/Toolbar', () => ({
  Toolbar: ({ onImportPage, bookTitle }: { onImportPage: () => void; bookTitle?: string }) => (
    <div>
      {bookTitle ? <h1>{bookTitle}</h1> : null}
      <button type="button" onClick={onImportPage}>Import pages</button>
    </div>
  ),
}));

import { useAuthContext } from '../contexts/AuthContext';
import { getBook } from '../services/libraryService';
import { listPages, loadAudioMapping } from '../services/bookService';
import { getGameConfig } from '../services/progressService';

const mockUseAuth = useAuthContext as jest.Mock;
const mockGetBook = getBook as jest.Mock;
const mockListPages = listPages as jest.Mock;
const mockLoadAudioMapping = loadAudioMapping as jest.Mock;
const mockGetGameConfig = getGameConfig as jest.Mock;

describe('BookReaderPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 't1', orgId: 'org1', role: 'teacher', displayName: 'T' },
      isTeacher: true,
    });
    mockGetBook.mockResolvedValue({ id: 'book1', title: 'Test Book' });
    mockLoadAudioMapping.mockResolvedValue({});
    mockGetGameConfig.mockResolvedValue({ levels: [] });
  });

  test('empty book shows import action for teacher', async () => {
    mockListPages.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <BookReaderPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/no pages yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import pdf\/images/i })).toBeInTheDocument();
  });

  test('renders page viewer when pages exist', async () => {
    mockListPages.mockResolvedValue([
      { id: 'p1', name: 'Page 1', sortOrder: 0, imageUrl: 'https://x/y.jpg', boxes: [] },
    ]);

    render(
      <MemoryRouter>
        <BookReaderPage />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('page-viewer')).toBeInTheDocument();
    expect(screen.getByText('Test Book')).toBeInTheDocument();
  });

  test('toolbar exposes import handler when book has pages', async () => {
    mockListPages.mockResolvedValue([
      { id: 'p1', name: 'Page 1', sortOrder: 0, imageUrl: 'https://x/y.jpg', boxes: [] },
    ]);

    render(
      <MemoryRouter>
        <BookReaderPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: /import pages/i })).toBeInTheDocument();
  });
});
