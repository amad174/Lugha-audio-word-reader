import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AccountPage } from './AccountPage';

const mockNavigate = jest.fn();
const mockSignOut = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
    expect(screen.getByText(/teacher · test school/i)).toBeInTheDocument();
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
