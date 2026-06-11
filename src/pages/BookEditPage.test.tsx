import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BookEditPage } from './BookEditPage';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ bookId: 'book1' }),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: { uid: 't1', orgId: 'org1', role: 'teacher' },
  }),
}));

jest.mock('../services/libraryService', () => ({
  getBook: jest.fn(),
  listCategories: jest.fn(),
  updateBook: jest.fn(),
}));

jest.mock('../services/bookService', () => ({
  listPages: jest.fn(),
  importFilesToBook: jest.fn(),
  deleteBookWithStorage: jest.fn(),
  exportBookBundle: jest.fn(),
}));

import { getBook, listCategories, updateBook } from '../services/libraryService';
import { listPages } from '../services/bookService';

const mockGetBook = getBook as jest.Mock;
const mockListCategories = listCategories as jest.Mock;
const mockListPages = listPages as jest.Mock;
const mockUpdateBook = updateBook as jest.Mock;

const sampleBook = {
  id: 'book1',
  title: 'My Book',
  categoryId: null,
  coverUrl: null,
  pageCount: 0,
  sortOrder: 0,
  createdBy: 't1',
  createdAt: 1,
  updatedAt: 1,
};

describe('BookEditPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBook.mockResolvedValue(sampleBook);
    mockListCategories.mockResolvedValue([]);
    mockListPages.mockResolvedValue([]);
    mockUpdateBook.mockResolvedValue(undefined);
  });

  test('renders edit form with title input', async () => {
    render(
      <MemoryRouter>
        <BookEditPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /edit book/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('My Book')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import pdf\/images/i })).toBeInTheDocument();
  });

  test('save updates book without leaving page', async () => {
    render(
      <MemoryRouter>
        <BookEditPage />
      </MemoryRouter>
    );

    const titleInput = await screen.findByDisplayValue('My Book');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(mockUpdateBook).toHaveBeenCalledWith('org1', 'book1', {
        title: 'Updated Title',
        categoryId: null,
      });
    });
    expect(await screen.findByText(/saved/i)).toBeInTheDocument();
  });

  test('shows page thumbnails when pages exist', async () => {
    mockListPages.mockResolvedValue([
      {
        id: 'p1',
        name: 'Page 1',
        sortOrder: 0,
        imageUrl: 'https://example.com/page.jpg',
        boxes: [],
      },
    ]);
    mockGetBook.mockResolvedValue({ ...sampleBook, pageCount: 1 });

    render(
      <MemoryRouter>
        <BookEditPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('1 page')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open book/i })).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });
});
