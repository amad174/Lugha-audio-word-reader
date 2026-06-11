import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';
import { AuthProvider } from '../contexts/AuthContext';

jest.mock('../firebase/config', () => ({
  auth: {},
}));

jest.mock('../services/authService', () => ({
  mapFirebaseUser: jest.fn(),
  logOut: jest.fn(),
  getOrganization: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (user: null) => void) => {
    cb(null);
    return jest.fn();
  },
}));

test('home page shows hero and sign-up actions', async () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: /learn to read with every tap/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /create free account/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /from page to pronunciation in three steps/i })).toBeInTheDocument();
});
