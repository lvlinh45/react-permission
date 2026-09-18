import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PermissionProvider } from '../../src/context/PermissionProvider';
import { usePermission } from '../../src/hooks/usePermission';

function ConsumerComponent() {
  const { can, hasRole, permissions, roles } = usePermission();
  return (
    <div>
      <div data-testid="can-view">{can('user.view') ? 'YES' : 'NO'}</div>
      <div data-testid="can-edit">{can('user.edit') ? 'YES' : 'NO'}</div>
      <div data-testid="is-admin">{hasRole('admin') ? 'YES' : 'NO'}</div>
      <div data-testid="perms-count">{permissions.length}</div>
      <div data-testid="roles-count">{roles.length}</div>
    </div>
  );
}

describe('PermissionProvider', () => {
  it('supplies permissions and roles to child components', () => {
    render(
      <PermissionProvider
        permissions={['user.view']}
        roles={['admin']}
      >
        <ConsumerComponent />
      </PermissionProvider>,
    );

    expect(screen.getByTestId('can-view').textContent).toBe('YES');
    expect(screen.getByTestId('can-edit').textContent).toBe('NO');
    expect(screen.getByTestId('is-admin').textContent).toBe('YES');
    expect(screen.getByTestId('perms-count').textContent).toBe('1');
    expect(screen.getByTestId('roles-count').textContent).toBe('1');
  });

  it('updates consumers dynamically when permissions or roles change', () => {
    function ParentContainer() {
      const [permissions, setPermissions] = useState<string[]>(['user.view']);
      return (
        <div>
          <button
            onClick={() => setPermissions(['user.view', 'user.edit'])}
            data-testid="toggle-btn"
          >
            Grant Edit
          </button>
          <PermissionProvider permissions={permissions}>
            <ConsumerComponent />
          </PermissionProvider>
        </div>
      );
    }

    render(<ParentContainer />);

    expect(screen.getByTestId('can-edit').textContent).toBe('NO');
    act(() => {
      fireEvent.click(screen.getByTestId('toggle-btn'));
    });
    expect(screen.getByTestId('can-edit').textContent).toBe('YES');
  });

  it('supports nested providers with predictable scoping (inner overrides parent)', () => {
    render(
      <PermissionProvider permissions={['user.view']}>
        <div data-testid="parent-scope">
          <ConsumerComponent />
        </div>
        <PermissionProvider permissions={['user.edit']}>
          <div data-testid="nested-scope">
            <ConsumerComponent />
          </div>
        </PermissionProvider>
      </PermissionProvider>,
    );

    const parentScope = screen.getByTestId('parent-scope');
    const nestedScope = screen.getByTestId('nested-scope');

    expect(parentScope.querySelector('[data-testid="can-view"]')?.textContent).toBe(
      'YES',
    );
    expect(parentScope.querySelector('[data-testid="can-edit"]')?.textContent).toBe(
      'NO',
    );

    expect(nestedScope.querySelector('[data-testid="can-view"]')?.textContent).toBe(
      'NO',
    );
    expect(nestedScope.querySelector('[data-testid="can-edit"]')?.textContent).toBe(
      'YES',
    );
  });

  it('handles undefined and null gracefully without crashing', () => {
    render(
      <PermissionProvider permissions={null} roles={undefined}>
        <ConsumerComponent />
      </PermissionProvider>,
    );

    expect(screen.getByTestId('can-view').textContent).toBe('NO');
    expect(screen.getByTestId('is-admin').textContent).toBe('NO');
    expect(screen.getByTestId('perms-count').textContent).toBe('0');
  });
});
