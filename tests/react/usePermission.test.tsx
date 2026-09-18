import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PermissionProvider } from '../../src/context/PermissionProvider';
import { usePermission } from '../../src/hooks/usePermission';

describe('usePermission', () => {
  it('throws descriptive error when called outside PermissionProvider', () => {
    // Suppress console.error from React error boundary during test
    const consoleError = console.error;
    console.error = () => {};

    expect(() => {
      renderHook(() => usePermission());
    }).toThrowError(
      /\[react-permission-control\] usePermission must be used within a <PermissionProvider>/,
    );

    console.error = consoleError;
  });

  it('provides all checking methods inside a provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PermissionProvider
        permissions={['user.view', 'user.update']}
        roles={['editor']}
      >
        {children}
      </PermissionProvider>
    );

    const { result } = renderHook(() => usePermission(), { wrapper });

    expect(result.current.can('user.view')).toBe(true);
    expect(result.current.can('user.delete')).toBe(false);
    expect(result.current.cannot('user.delete')).toBe(true);
    expect(result.current.hasRole('editor')).toBe(true);
    expect(result.current.hasRole('admin')).toBe(false);
    expect(result.current.hasAnyRole(['admin', 'editor'])).toBe(true);
    expect(result.current.hasAllRoles(['admin', 'editor'])).toBe(false);
    expect(
      result.current.hasAnyPermission(['user.delete', 'user.view']),
    ).toBe(true);
    expect(
      result.current.hasAllPermissions(['user.view', 'user.update']),
    ).toBe(true);
    expect(result.current.check(({ hasRole }) => hasRole('editor'))).toBe(
      true,
    );
  });
});
