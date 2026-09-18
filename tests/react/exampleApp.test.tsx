import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminDashboardApp, runStandaloneVerification } from '../../examples/admin-dashboard/App';

describe('AdminDashboard Example App', () => {
  it('renders correctly and allows role switching', () => {
    render(<AdminDashboardApp />);

    // Admin starts with Create User button and Delete button
    expect(screen.getByText('+ Create User')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();

    // Switch to Viewer
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'VIEWER' }));
    });

    // Viewer should have locked create user button and no delete button
    expect(screen.getByText('Create User (Locked)')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('runs standalone non-react verification accurately', () => {
    const results = runStandaloneVerification();
    expect(results.canCreateUser).toBe(true);
    expect(results.canDeleteUser).toBe(false);
    expect(results.isManager).toBe(true);
    expect(results.isAdmin).toBe(false);
  });
});
