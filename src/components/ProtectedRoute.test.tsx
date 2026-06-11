import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

jest.mock('../contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

import { useAuthContext } from '../contexts/AuthContext';

const mockUseAuth = useAuthContext as jest.Mock;

function renderProtected(initialPath = '/library', requireTeacher = false) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/library" element={
          requireTeacher
            ? <ProtectedRoute requireTeacher><div>Teacher content</div></ProtectedRoute>
            : <ProtectedRoute><div>Library content</div></ProtectedRoute>
        } />
        <Route path="/teacher/edit" element={
          <ProtectedRoute requireTeacher><div>Teacher edit</div></ProtectedRoute>
        } />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows loading screen while auth loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, isTeacher: false });
    renderProtected();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  test('redirects unauthenticated users to login', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isTeacher: false });
    renderProtected();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('renders children for authenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '1', role: 'student', orgId: 'org1' },
      loading: false,
      isTeacher: false,
    });
    renderProtected();
    expect(screen.getByText('Library content')).toBeInTheDocument();
  });

  test('redirects students away from teacher-only routes', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '1', role: 'student', orgId: 'org1' },
      loading: false,
      isTeacher: false,
    });

    render(
      <MemoryRouter initialEntries={['/teacher/edit']}>
        <Routes>
          <Route path="/library" element={<div>Library fallback</div>} />
          <Route path="/teacher/edit" element={
            <ProtectedRoute requireTeacher><div>Teacher edit</div></ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Library fallback')).toBeInTheDocument();
  });

  test('allows teachers on teacher-only routes', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '1', role: 'teacher', orgId: 'org1' },
      loading: false,
      isTeacher: true,
    });

    render(
      <MemoryRouter initialEntries={['/teacher/edit']}>
        <Routes>
          <Route path="/library" element={<div>Library fallback</div>} />
          <Route path="/teacher/edit" element={
            <ProtectedRoute requireTeacher><div>Teacher edit</div></ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Teacher edit')).toBeInTheDocument();
  });
});
