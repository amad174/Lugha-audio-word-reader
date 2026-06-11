import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SignupPage } from './SignupPage';

jest.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: null, refreshUser: jest.fn() }),
}));

jest.mock('../services/authService', () => ({
  signUpTeacher: jest.fn(),
  signUpStudent: jest.fn(),
}));

describe('SignupPage', () => {
  test('renders teacher and student tabs', () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /join lugha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Student' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Teacher' })).toBeInTheDocument();
  });

  test('shows invite code field for students', () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('ABC123')).toBeInTheDocument();
  });

  test('shows org name field for teachers', async () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Teacher' }));
    expect(screen.getByPlaceholderText('e.g. Al-Noor Academy')).toBeInTheDocument();
  });

  test('preselects teacher tab from query param', () => {
    render(
      <MemoryRouter initialEntries={['/signup?role=teacher']}>
        <SignupPage />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('e.g. Al-Noor Academy')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('ABC123')).not.toBeInTheDocument();
  });
});
