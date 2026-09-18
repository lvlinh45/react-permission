import { StrictMode, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Can } from '../../src/components/Can';
import { PermissionProvider } from '../../src/context/PermissionProvider';
import { createPermissionChecker } from '../../src/core/checker';
import { usePermission } from '../../src/hooks/usePermission';

describe('Edge Cases & Defensive Behaviors', () => {
  it('handles React StrictMode with no duplicate side-effects or errors', () => {
    function StrictTestComponent() {
      const { can } = usePermission();
      return <div>{can('user.view') ? 'VIEW_ALLOWED' : 'VIEW_DENIED'}</div>;
    }

    render(
      <StrictMode>
        <PermissionProvider permissions={['user.view']}>
          <StrictTestComponent />
        </PermissionProvider>
      </StrictMode>,
    );

    expect(screen.getByText('VIEW_ALLOWED')).toBeInTheDocument();
  });

  it('handles null children and null fallback cleanly in <Can>', () => {
    const { container: c1 } = render(
      <PermissionProvider permissions={['user.view']}>
        <Can permission="user.view">{null}</Can>
      </PermissionProvider>,
    );
    expect(c1.innerHTML).toBe('');

    const { container: c2 } = render(
      <PermissionProvider permissions={[]}>
        <Can permission="user.view" fallback={null}>
          <span>Content</span>
        </Can>
      </PermissionProvider>,
    );
    expect(c2.innerHTML).toBe('');
  });

  it('handles empty string and whitespace permissions/roles in <Can>', () => {
    render(
      <PermissionProvider permissions={['user.view']} roles={['admin']}>
        <Can permission="">
          <span data-testid="empty-perm">Empty Perm</span>
        </Can>
        <Can permission="   ">
          <span data-testid="whitespace-perm">Whitespace Perm</span>
        </Can>
        <Can role="">
          <span data-testid="empty-role">Empty Role</span>
        </Can>
      </PermissionProvider>,
    );

    expect(screen.queryByTestId('empty-perm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('whitespace-perm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('empty-role')).not.toBeInTheDocument();
  });

  it('handles rapid state transitions without stale closures', () => {
    function RapidSwitchApp() {
      const [role, setRole] = useState<'admin' | 'user' | 'guest'>('guest');
      const permissionsMap = {
        admin: ['user.view', 'user.create', 'user.delete'],
        user: ['user.view'],
        guest: [],
      };

      return (
        <div>
          <button
            onClick={() => setRole('admin')}
            data-testid="set-admin"
          >
            Admin
          </button>
          <button
            onClick={() => setRole('user')}
            data-testid="set-user"
          >
            User
          </button>
          <button
            onClick={() => setRole('guest')}
            data-testid="set-guest"
          >
            Guest
          </button>

          <PermissionProvider
            permissions={permissionsMap[role]}
            roles={[role]}
          >
            <Can permission="user.delete">
              <span data-testid="delete-badge">Can Delete</span>
            </Can>
            <Can permission="user.view">
              <span data-testid="view-badge">Can View</span>
            </Can>
          </PermissionProvider>
        </div>
      );
    }

    render(<RapidSwitchApp />);

    expect(screen.queryByTestId('delete-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('view-badge')).not.toBeInTheDocument();

    act(() => {
      screen.getByTestId('set-admin').click();
    });
    expect(screen.getByTestId('delete-badge')).toBeInTheDocument();
    expect(screen.getByTestId('view-badge')).toBeInTheDocument();

    act(() => {
      screen.getByTestId('set-user').click();
    });
    expect(screen.queryByTestId('delete-badge')).not.toBeInTheDocument();
    expect(screen.getByTestId('view-badge')).toBeInTheDocument();

    act(() => {
      screen.getByTestId('set-guest').click();
    });
    expect(screen.queryByTestId('delete-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('view-badge')).not.toBeInTheDocument();
  });

  it('guarantees SSR safety - standalone checker instantiates without window or document', () => {
    const standaloneChecker = createPermissionChecker({
      permissions: ['ssr.test'],
      roles: ['server'],
    });

    expect(standaloneChecker.can('ssr.test')).toBe(true);
    expect(standaloneChecker.hasRole('server')).toBe(true);
    expect(standaloneChecker.cannot('other')).toBe(true);
  });
});
