import { normalizeIdentifiers } from './normalize';
import type {
  CustomCheckFn,
  PermissionCheckContext,
  PermissionChecker,
  PermissionCheckerOptions,
  StringWithAutocomplete,
} from './types';

/**
 * Creates an immutable, pure TypeScript permission checker instance.
 *
 * This function has zero dependencies on React and can be used in:
 * - Server / Node.js environments
 * - CLI utilities
 * - Route navigation guards
 * - Event handlers & services
 * - Unit tests
 *
 * All lookups operate in O(1) time complexity via internal Set data structures.
 *
 * @template TPermission Permission string literal or string
 * @template TRole Role string literal or string
 * @param options Initial permissions and roles configuration
 * @returns An immutable PermissionChecker instance
 */
export function createPermissionChecker<
  TPermission extends string = string,
  TRole extends string = string,
>(
  options?: PermissionCheckerOptions<TPermission, TRole>,
): PermissionChecker<TPermission, TRole> {
  const [permissionsList, permissionSet] = normalizeIdentifiers<TPermission>(
    options?.permissions,
  );
  const [rolesList, roleSet] = normalizeIdentifiers<TRole>(options?.roles);

  const can = (permission: StringWithAutocomplete<TPermission>): boolean => {
    if (typeof permission !== 'string') return false;
    const trimmed = permission.trim();
    if (trimmed.length === 0) return false;
    return permissionSet.has(trimmed as TPermission);
  };

  const cannot = (permission: StringWithAutocomplete<TPermission>): boolean => {
    return !can(permission);
  };

  const hasRole = (role: StringWithAutocomplete<TRole>): boolean => {
    if (typeof role !== 'string') return false;
    const trimmed = role.trim();
    if (trimmed.length === 0) return false;
    return roleSet.has(trimmed as TRole);
  };

  const hasAnyRole = (
    roles: readonly StringWithAutocomplete<TRole>[],
  ): boolean => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) return false;
    for (let i = 0; i < roles.length; i++) {
      if (hasRole(roles[i])) return true;
    }
    return false;
  };

  const hasAllRoles = (
    roles: readonly StringWithAutocomplete<TRole>[],
  ): boolean => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) return false;
    for (let i = 0; i < roles.length; i++) {
      if (!hasRole(roles[i])) return false;
    }
    return true;
  };

  const hasAnyPermission = (
    permissions: readonly StringWithAutocomplete<TPermission>[],
  ): boolean => {
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0)
      return false;
    for (let i = 0; i < permissions.length; i++) {
      if (can(permissions[i])) return true;
    }
    return false;
  };

  const hasAllPermissions = (
    permissions: readonly StringWithAutocomplete<TPermission>[],
  ): boolean => {
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0)
      return false;
    for (let i = 0; i < permissions.length; i++) {
      if (!can(permissions[i])) return false;
    }
    return true;
  };

  const checkContext: PermissionCheckContext<TPermission, TRole> =
    Object.freeze({
      permissions: permissionsList,
      roles: rolesList,
      hasPermission: can,
      hasRole,
    });

  const check = (fn: CustomCheckFn<TPermission, TRole>): boolean => {
    if (typeof fn !== 'function') return false;
    try {
      return Boolean(fn(checkContext));
    } catch {
      return false;
    }
  };

  return Object.freeze({
    permissions: permissionsList,
    roles: rolesList,
    can,
    cannot,
    canAny: hasAnyPermission,
    canAll: hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasAllPermissions,
    check,
  });
}
