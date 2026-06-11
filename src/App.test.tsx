import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './components/EmptyState';

/** @deprecated EmptyState kept for reference; app now uses Firebase library flow */
test('empty state shows Lugha title', () => {
  render(
    <EmptyState
      isAdmin={false}
      onImport={jest.fn()}
      onImportBundle={jest.fn()}
      onAdminLogin={jest.fn()}
    />
  );
  expect(screen.getByRole('heading', { name: 'Lugha' })).toBeInTheDocument();
});
