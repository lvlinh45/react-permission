import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Can } from '../../src/components/Can';
import { PermissionProvider } from '../../src/context/PermissionProvider';

function renderWithProvider(
  ui: React.ReactNode,
  permissions: string[] = [],
  roles: string[] = [],
) {
  return render(
    <PermissionProvider permissions={permissions} roles={roles}>
      {ui}
    </PermissionProvider>,
  );
}

describe('<Can /> Component', () => {
  describe('Single Permission', () => {
    it('renders children when single permission is granted', () => {
      renderWithProvider(
        <Can permission="user.create">
          <button data-testid="btn">Create User</button>
        </Can>,
        ['user.create'],
      );

      expect(screen.getByTestId('btn')).toBeInTheDocument();
    });

    it('renders null when single permission is not granted and no fallback is passed', () => {
      renderWithProvider(
        <Can permission="user.delete">
          <button data-testid="btn">Delete User</button>
        </Can>,
        ['user.create'],
      );

      expect(screen.queryByTestId('btn')).not.toBeInTheDocument();
    });

    it('renders fallback when single permission is not granted', () => {
      renderWithProvider(
        <Can
          permission="user.delete"
          fallback={<div data-testid="fallback">Access Denied</div>}
        >
          <button data-testid="btn">Delete User</button>
        </Can>,
        ['user.create'],
      );

      expect(screen.queryByTestId('btn')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  describe('Multiple Permissions & Modes', () => {
    it('renders with mode="all" only when ALL permissions are granted', () => {
      const { unmount } = renderWithProvider(
        <Can
          permissions={['user.view', 'user.edit']}
          mode="all"
        >
          <span data-testid="content">Edit Area</span>
        </Can>,
        ['user.view', 'user.edit'],
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
      unmount();

      renderWithProvider(
        <Can
          permissions={['user.view', 'user.delete']}
          mode="all"
        >
          <span data-testid="content">Delete Area</span>
        </Can>,
        ['user.view', 'user.edit'],
      );
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('renders with mode="any" when AT LEAST ONE permission is granted', () => {
      renderWithProvider(
        <Can
          permissions={['user.create', 'user.delete']}
          mode="any"
        >
          <span data-testid="content">Actions</span>
        </Can>,
        ['user.create'],
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('defaults mode to "all"', () => {
      renderWithProvider(
        <Can permissions={['user.view', 'user.delete']}>
          <span data-testid="content">Default Mode</span>
        </Can>,
        ['user.view'],
      );
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });

  describe('Role-based Authorization', () => {
    it('renders when single role is present', () => {
      renderWithProvider(
        <Can role="admin">
          <span data-testid="admin-panel">Admin Panel</span>
        </Can>,
        [],
        ['admin'],
      );
      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
    });

    it('renders when roles array matches with mode="any"', () => {
      renderWithProvider(
        <Can roles={['manager', 'supervisor']} mode="any">
          <span data-testid="manager-panel">Management Panel</span>
        </Can>,
        [],
        ['manager'],
      );
      expect(screen.getByTestId('manager-panel')).toBeInTheDocument();
    });

    it('renders when roles array matches with mode="all"', () => {
      renderWithProvider(
        <Can roles={['admin', 'finance']} mode="all">
          <span data-testid="finance-panel">Finance Audit</span>
        </Can>,
        [],
        ['admin', 'finance'],
      );
      expect(screen.getByTestId('finance-panel')).toBeInTheDocument();
    });
  });

  describe('Combined Permissions and Roles', () => {
    it('requires BOTH role condition AND permission condition to be met', () => {
      renderWithProvider(
        <Can
          role="admin"
          permissions={['settings.view', 'settings.edit']}
          mode="all"
        >
          <span data-testid="settings">Settings Edit</span>
        </Can>,
        ['settings.view', 'settings.edit'],
        ['admin'],
      );
      expect(screen.getByTestId('settings')).toBeInTheDocument();
    });

    it('denies access if role matches but permissions do not', () => {
      renderWithProvider(
        <Can
          role="admin"
          permissions={['settings.delete']}
        >
          <span data-testid="settings">Delete Settings</span>
        </Can>,
        ['settings.view'],
        ['admin'],
      );
      expect(screen.queryByTestId('settings')).not.toBeInTheDocument();
    });
  });

  describe('Custom Predicate Function (check)', () => {
    it('renders when check returns true', () => {
      renderWithProvider(
        <Can
          check={({ hasPermission, hasRole }) =>
            hasRole('billing_admin') || hasPermission('invoice.pay')
          }
        >
          <span data-testid="pay-btn">Pay Invoice</span>
        </Can>,
        ['invoice.pay'],
        ['user'],
      );
      expect(screen.getByTestId('pay-btn')).toBeInTheDocument();
    });

    it('hides when check returns false', () => {
      renderWithProvider(
        <Can
          check={({ hasRole }) => hasRole('superadmin')}
        >
          <span data-testid="secret">Super Secret</span>
        </Can>,
        [],
        ['admin'],
      );
      expect(screen.queryByTestId('secret')).not.toBeInTheDocument();
    });
  });

  describe('Render Prop Pattern', () => {
    it('passes allowed boolean and checker instance to render function', () => {
      renderWithProvider(
        <Can permission="user.create">
          {({ allowed, checker }) => (
            <div>
              <button data-testid="btn" disabled={!allowed}>
                Create
              </button>
              <span data-testid="cannot-delete">
                {checker.cannot('user.delete') ? 'CANNOT_DELETE' : 'CAN_DELETE'}
              </span>
            </div>
          )}
        </Can>,
        ['user.create'],
      );

      const btn = screen.getByTestId('btn');
      expect(btn).not.toBeDisabled();
      expect(screen.getByTestId('cannot-delete').textContent).toBe(
        'CANNOT_DELETE',
      );
    });

    it('passes allowed=false to render function when unauthorized', () => {
      renderWithProvider(
        <Can permission="user.delete">
          {({ allowed }) => (
            <button data-testid="btn" disabled={!allowed}>
              Delete
            </button>
          )}
        </Can>,
        ['user.create'],
      );

      const btn = screen.getByTestId('btn');
      expect(btn).toBeDisabled();
    });
  });

  describe('Edge cases and defaults', () => {
    it('renders children if no conditions are specified', () => {
      renderWithProvider(
        <Can>
          <span data-testid="unconditioned">Public Content</span>
        </Can>,
      );
      expect(screen.getByTestId('unconditioned')).toBeInTheDocument();
    });
  });
});
