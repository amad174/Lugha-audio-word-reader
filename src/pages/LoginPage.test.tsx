import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

jest.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: null }),
}));

jest.mock('../services/authService', () => ({
  signIn: jest.fn(),
  resetPassword: jest.fn(),
}));

describe('LoginPage', () => {
  test('renders sign in form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });
});
