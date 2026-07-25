import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TeacherCategoriesPage } from './TeacherCategoriesPage';

jest.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: { uid: 't1', orgId: 'org1', role: 'teacher' },
  }),
}));

jest.mock('../services/libraryService', () => ({
  listCategories: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  listBooks: jest.fn(),
}));

import { listCategories, createCategory, listBooks } from '../services/libraryService';

const mockListCategories = listCategories as jest.Mock;
const mockCreateCategory = createCategory as jest.Mock;
const mockListBooks = listBooks as jest.Mock;

describe('TeacherCategoriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListCategories.mockResolvedValue([]);
    mockListBooks.mockResolvedValue([]);
  });

  test('renders categories page', async () => {
    render(
      <MemoryRouter>
        <TeacherCategoriesPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /categories/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/new category name/i)).toBeInTheDocument();
  });

  test('add category calls service', async () => {
    mockCreateCategory.mockResolvedValue({ id: 'c1', name: 'Level 1', sortOrder: 0, createdAt: 1 });
    mockListCategories
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'c1', name: 'Level 1', sortOrder: 0, createdAt: 1 }]);

    render(
      <MemoryRouter>
        <TeacherCategoriesPage />
      </MemoryRouter>
    );

    await userEvent.type(await screen.findByPlaceholderText(/new category name/i), 'Level 1');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith('org1', 'Level 1');
    });
  });
});
