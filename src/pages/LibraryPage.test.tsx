import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LibraryPage } from './LibraryPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('../services/libraryService', () => ({
  listBooks: jest.fn(),
  listCategories: jest.fn(),
  createBook: jest.fn(),
  createCategory: jest.fn(),
}));

jest.mock('../services/progressService', () => ({
  getProgress: jest.fn(),
  getGameConfig: jest.fn(),
}));

jest.mock('../services/localMigrationService', () => ({
  hasLocalData: jest.fn(),
}));

import { useAuthContext } from '../contexts/AuthContext';
import { listBooks, listCategories, createBook } from '../services/libraryService';
import { getGameConfig } from '../services/progressService';
import { hasLocalData } from '../services/localMigrationService';

const mockUseAuth = useAuthContext as jest.Mock;
const mockListBooks = listBooks as jest.Mock;
const mockListCategories = listCategories as jest.Mock;
const mockCreateBook = createBook as jest.Mock;
const mockGetGameConfig = getGameConfig as jest.Mock;
const mockHasLocalData = hasLocalData as jest.Mock;

const teacherUser = {
  uid: 't1',
  email: 'teacher@test.com',
  displayName: 'Teacher',
  role: 'teacher' as const,
  orgId: 'org1',
  createdAt: 1,
};

const studentUser = {
  ...teacherUser,
  uid: 's1',
  role: 'student' as const,
  displayName: 'Student',
};

function renderLibrary() {
  return render(
    <MemoryRouter>
      <LibraryPage />
    </MemoryRouter>
  );
}

describe('LibraryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGameConfig.mockResolvedValue({ levels: [] });
    mockHasLocalData.mockResolvedValue(false);
    mockListCategories.mockResolvedValue([]);
  });

  test('teacher sees empty state and can type full book title in modal', async () => {
    mockUseAuth.mockReturnValue({
      user: teacherUser,
      org: { id: 'org1', name: 'Test Org', inviteCode: 'ABC123' },
      isTeacher: true,
    });
    mockListBooks.mockResolvedValue([]);

    renderLibrary();

    expect(await screen.findByRole('heading', { name: /no books yet/i })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: /add book/i })[0]);

    const titleInput = screen.getByPlaceholderText('Book title');
    await userEvent.type(titleInput, 'Alphabet Book');

    expect(titleInput).toHaveValue('Alphabet Book');
  });

  test('teacher create book calls service and navigates to edit', async () => {
    mockUseAuth.mockReturnValue({
      user: teacherUser,
      org: { id: 'org1', name: 'Test Org', inviteCode: 'ABC123' },
      isTeacher: true,
    });
    mockListBooks.mockResolvedValue([]);
    mockCreateBook.mockResolvedValue({ id: 'book-new', title: 'Test Book', pageCount: 0 });

    renderLibrary();

    await screen.findByRole('heading', { name: /no books yet/i });
    await userEvent.click(screen.getAllByRole('button', { name: /add book/i })[0]);
    await userEvent.type(screen.getByPlaceholderText('Book title'), 'Test Book');
    await userEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(mockCreateBook).toHaveBeenCalledWith('org1', 'Test Book', null, 't1');
      expect(mockNavigate).toHaveBeenCalledWith('/library/book-new/edit');
    });
  });

  test('student sees empty library without add book action in header', async () => {
    mockUseAuth.mockReturnValue({
      user: studentUser,
      org: { id: 'org1', name: 'Test Org', inviteCode: 'ABC123' },
      isTeacher: false,
    });
    mockListBooks.mockResolvedValue([]);

    renderLibrary();

    expect(await screen.findByText(/ask your teacher/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add book/i })).not.toBeInTheDocument();
  });

  test('student sees progress HUD', async () => {
    mockUseAuth.mockReturnValue({
      user: studentUser,
      org: { id: 'org1', name: 'Test Org', inviteCode: 'ABC123' },
      isTeacher: false,
    });
    mockListBooks.mockResolvedValue([{
      id: 'b1',
      title: 'Book 1',
      categoryId: null,
      coverUrl: null,
      pageCount: 3,
      sortOrder: 0,
      createdBy: 't1',
      createdAt: 1,
      updatedAt: 1,
    }]);

    const { getProgress } = require('../services/progressService');
    getProgress.mockResolvedValue({ totalPoints: 42, wordsHeard: 10, level: 1, achievements: [], heardBoxes: {} });
    mockGetGameConfig.mockResolvedValue({
      levels: [{ level: 1, name: 'Beginner', icon: '🌱', minPoints: 0 }],
    });

    renderLibrary();

    expect(await screen.findByText('Student')).toBeInTheDocument();
    expect(screen.getByText(/42 pts/i)).toBeInTheDocument();
  });
});
