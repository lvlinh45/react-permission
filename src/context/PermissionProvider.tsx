import React, { useContext, useMemo } from 'react';
import { createPermissionChecker } from '../core/checker';
import type {
  PermissionChecker,
  PermissionProviderProps,
  PoliciesMap,
  RoleHierarchy,
  RolePermissionsMap,
} from '../core/types';
import {
  PermissionContext,
  PermissionLoadingFallbackContext,
} from './PermissionContext';

/**
 * Top-level or scoped provider that supplies authorization state and methods to React children.
 *
 * Supports:
 * - Direct permissions & roles
 * - Wildcard matching (e.g. `posts.*`, `*`)
 * - Role-to-permissions inheritance mapping
 * - Multi-level role hierarchy (`roleHierarchy`)
 * - ABAC / Resource-based policies (`policies`)
 * - Asynchronous loading state (`isLoading`, `loadingFallback`)
 * - Scoped inheritance from parent provider (`inherit={true}`)
 *
 * @example
 * ```tsx
 * <PermissionProvider
 *   permissions={['user.view', 'user.create']}
 *   roles={['admin']}
 *   roleHierarchy={{ superadmin: ['admin'], admin: ['editor'] }}
 *   rolePermissions={{
 *     admin: ['*'],
 *     editor: ['posts.*', 'comments.*']
 *   }}
 *   policies={{
 *     'posts.edit': (post, ctx) => post.authorId === userId || ctx.hasRole('admin')
 *   }}
 *   isLoading={isAuthLoading}
 *   loadingFallback={<Spinner />}
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
  roleHierarchy,
  policies,
  isLoading,
  loadingFallback,
  inherit = false,
  children,
}: PermissionProviderProps<TPermission, TRole>): React.JSX.Element {
  const parentChecker = useContext(PermissionContext) as PermissionChecker<
    TPermission,
    TRole
  > | null;
  const parentLoadingFallback = useContext(PermissionLoadingFallbackContext);

  // Compute merged options if inherit is requested and parent context is available
  const effectivePermissions = useMemo(() => {
    if (inherit && parentChecker && Array.isArray(parentChecker.permissions)) {
      return [...parentChecker.permissions, ...(permissions || [])];
    }
    return permissions;
  }, [inherit, parentChecker, permissions]);

  const effectiveRoles = useMemo(() => {
    if (inherit && parentChecker && Array.isArray(parentChecker.roles)) {
      return [...parentChecker.roles, ...(roles || [])];
    }
    return roles;
  }, [inherit, parentChecker, roles]);

  const effectiveRolePermissions = useMemo(() => {
    if (inherit && parentChecker && parentChecker.rolePermissions) {
      const merged: RolePermissionsMap<TRole, TPermission> = {
        ...parentChecker.rolePermissions,
      };
      if (rolePermissions) {
        const keys = Object.keys(rolePermissions) as (TRole | string)[];
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const existing = merged[key] || [];
          const incoming = rolePermissions[key] || [];
          merged[key] = [...existing, ...incoming];
        }
      }
      return merged;
    }
    return rolePermissions;
  }, [inherit, parentChecker, rolePermissions]);

  const effectiveRoleHierarchy = useMemo(() => {
    if (inherit && parentChecker && parentChecker.roleHierarchy) {
      const merged: RoleHierarchy<TRole> = {
        ...parentChecker.roleHierarchy,
      };
      if (roleHierarchy) {
        const keys = Object.keys(roleHierarchy) as (TRole | string)[];
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const existing = merged[key] || [];
          const incoming = roleHierarchy[key] || [];
          merged[key] = [...existing, ...incoming];
        }
      }
      return merged;
    }
    return roleHierarchy;
  }, [inherit, parentChecker, roleHierarchy]);

  const effectivePolicies = useMemo(() => {
    if (inherit && parentChecker && parentChecker.policies) {
      return {
        ...parentChecker.policies,
        ...policies,
      } as PoliciesMap<TPermission, TRole>;
    }
    return policies;
  }, [inherit, parentChecker, policies]);

  const effectiveIsLoading =
    isLoading !== undefined
      ? Boolean(isLoading)
      : inherit && parentChecker
        ? parentChecker.isLoading
        : false;

  const effectiveLoadingFallback =
    loadingFallback !== undefined
      ? loadingFallback
      : inherit
        ? parentLoadingFallback
        : null;

  // Generate serialized keys for stable memoization
  const permissionsKey = Array.isArray(effectivePermissions)
    ? [...effectivePermissions].filter(Boolean).sort().join(',')
    : '';
  const rolesKey = Array.isArray(effectiveRoles)
    ? [...effectiveRoles].filter(Boolean).sort().join(',')
    : '';
  const rolePermissionsKey = effectiveRolePermissions
    ? JSON.stringify(effectiveRolePermissions)
    : '';
  const roleHierarchyKey = effectiveRoleHierarchy
    ? JSON.stringify(effectiveRoleHierarchy)
    : '';

  const checker = useMemo(() => {
    return createPermissionChecker<TPermission, TRole>({
      permissions: effectivePermissions,
      roles: effectiveRoles,
      wildcard,
      rolePermissions: effectiveRolePermissions,
      roleHierarchy: effectiveRoleHierarchy,
      policies: effectivePolicies,
      isLoading: effectiveIsLoading,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    permissionsKey,
    rolesKey,
    wildcard,
    rolePermissionsKey,
    roleHierarchyKey,
    effectivePolicies,
    effectiveIsLoading,
  ]);

  return (
    <PermissionContext.Provider value={checker}>
      <PermissionLoadingFallbackContext.Provider value={effectiveLoadingFallback}>
        {children}
      </PermissionLoadingFallbackContext.Provider>
    </PermissionContext.Provider>
  );
}

PermissionProvider.displayName = 'PermissionProvider';
