import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AccountPage } from './AccountPage';

const mockNavigate = jest.fn();
const mockSignOut = jest.fn();
const mockRefreshUser = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../services/authService', () => ({
  changePassword: jest.fn(),
  updateDisplayName: jest.fn(),
  resetPassword: jest.fn(),
  deleteAccount: jest.fn(),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: {
      uid: 'u1',
      email: 'user@test.com',
      displayName: 'Test User',
      role: 'teacher',
      orgId: 'org1',
    },
    org: { id: 'org1', name: 'Test School', inviteCode: 'ABC123' },
    signOut: mockSignOut,
    refreshUser: mockRefreshUser,
  }),
}));

describe('AccountPage', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows profile info', () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /account/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
    expect(screen.getByText(/teacher · test school/i)).toBeInTheDocument();
  });

  test('shows password and account management options', () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /email me a reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
  });

  test('sign out navigates home', async () => {
    mockSignOut.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
