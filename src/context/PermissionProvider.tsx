import React, { useMemo } from 'react';
import { createPermissionChecker } from '../core/checker';
import type { PermissionProviderProps } from '../core/types';
import { PermissionContext } from './PermissionContext';

/**
 * Top-level provider that supplies authorization state and methods to React children.
 *
 * Supports:
 * - Direct permissions & roles
 * - Wildcard matching (e.g. `posts.*`, `*`)
 * - Role-to-permissions inheritance mapping
 * - Defensive normalization of inputs
 * - Optimized memoization preventing redundant re-renders
 *
 * @example
 * ```tsx
 * <PermissionProvider
 *   permissions={['user.view', 'user.create']}
 *   roles={['admin']}
 *   wildcard={true}
 *   rolePermissions={{
 *     admin: ['*'],
 *     editor: ['posts.*', 'comments.*']
 *   }}
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
  wildcard = true,
  rolePermissions,
  children,
}: PermissionProviderProps<TPermission, TRole>): React.JSX.Element {
  // Generate stable serialized keys for memoization dependencies
  const permissionsKey = Array.isArray(permissions)
    ? [...permissions].filter(Boolean).sort().join(',')
    : '';
  const rolesKey = Array.isArray(roles)
    ? [...roles].filter(Boolean).sort().join(',')
    : '';
  const rolePermissionsKey = rolePermissions
    ? JSON.stringify(rolePermissions)
    : '';

  const checker = useMemo(() => {
    return createPermissionChecker<TPermission, TRole>({
      permissions,
      roles,
      wildcard,
      rolePermissions,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsKey, rolesKey, wildcard, rolePermissionsKey]);

  return (
    <PermissionContext.Provider value={checker}>
      {children}
    </PermissionContext.Provider>
  );
}

PermissionProvider.displayName = 'PermissionProvider';
