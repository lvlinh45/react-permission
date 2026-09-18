import React, { useMemo } from 'react';
import { createPermissionChecker } from '../core/checker';
import type { PermissionProviderProps } from '../core/types';
import { PermissionContext } from './PermissionContext';

/**
 * Top-level provider that supplies authorization state and methods to React children.
 *
 * Normalizes permissions and roles defensively (handling null, undefined, empty, or duplicate values).
 * Updates dynamically and efficiently when permissions or roles change without stale closures.
 *
 * @example
 * ```tsx
 * <PermissionProvider
 *   permissions={['user.view', 'user.create']}
 *   roles={['admin']}
 * >
 *   <App />
 * </PermissionProvider>
 * ```
 */
export function PermissionProvider<
  TPermission extends string = string,
  TRole extends string = string,
>({
  permissions,
  roles,
  children,
}: PermissionProviderProps<TPermission, TRole>): React.JSX.Element {
  // Join normalized strings for a stable memo dependency key
  const permissionsKey = Array.isArray(permissions)
    ? permissions.filter(Boolean).join(',')
    : '';
  const rolesKey = Array.isArray(roles) ? roles.filter(Boolean).join(',') : '';

  const checker = useMemo(() => {
    return createPermissionChecker<TPermission, TRole>({
      permissions,
      roles,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsKey, rolesKey]);

  return (
    <PermissionContext.Provider value={checker}>
      {children}
    </PermissionContext.Provider>
  );
}

PermissionProvider.displayName = 'PermissionProvider';
