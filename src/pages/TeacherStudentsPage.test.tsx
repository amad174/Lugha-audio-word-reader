import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TeacherStudentsPage } from './TeacherStudentsPage';

jest.mock('../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: { uid: 't1', orgId: 'org1', role: 'teacher' },
    org: { id: 'org1', name: 'Test School', inviteCode: 'XYZ789' },
    refreshUser: jest.fn(),
  }),
}));

jest.mock('../services/authService', () => ({
  listOrgStudents: jest.fn(),
  regenerateInviteCode: jest.fn(),
}));

import { listOrgStudents } from '../services/authService';

const mockListStudents = listOrgStudents as jest.Mock;

describe('TeacherStudentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListStudents.mockResolvedValue([]);
  });

  test('shows invite code and empty student list', async () => {
    render(
      <MemoryRouter>
        <TeacherStudentsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Students' })).toBeInTheDocument();
    expect(screen.getByText('XYZ789')).toBeInTheDocument();
    expect(screen.getByText(/no students have joined yet/i)).toBeInTheDocument();
  });

  test('lists enrolled students', async () => {
    mockListStudents.mockResolvedValue([
      {
        uid: 's1',
        role: 'student',
        displayName: 'Ali',
        email: 'ali@test.com',
        joinedAt: 1,
      },
    ]);

    render(
      <MemoryRouter>
        <TeacherStudentsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ali')).toBeInTheDocument();
    expect(screen.getByText('ali@test.com')).toBeInTheDocument();
    expect(screen.getByText(/enrolled students \(1\)/i)).toBeInTheDocument();
  });
});
