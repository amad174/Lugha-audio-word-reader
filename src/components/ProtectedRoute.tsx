import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  requireTeacher?: boolean;
}

export function ProtectedRoute({ children, requireTeacher = false }: Props) {
  const { user, loading, isTeacher } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loadingScreen">
        <span className="loadingWordmark">Lugha</span>
        <p className="loadingMessage">Loading…</p>
        <div className="loadingSpinner" aria-hidden />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireTeacher && !isTeacher) {
    return <Navigate to="/library" replace />;
  }

  return <>{children}</>;
}
