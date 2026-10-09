import { normalizeIdentifiers } from './normalize';
import { matchesWildcard } from './wildcard';
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
 * All exact lookups operate in O(1) time complexity via internal Set data structures.
 * Wildcard expressions (e.g. `posts.*`, `*`) are supported and evaluated efficiently.
 *
 * @template TPermission Permission string literal or string
 * @template TRole Role string literal or string
 * @param options Initial permissions, roles, and configuration
 * @returns An immutable PermissionChecker instance
 */
export function createPermissionChecker<
  TPermission extends string = string,
  TRole extends string = string,
>(
  options?: PermissionCheckerOptions<TPermission, TRole>,
): PermissionChecker<TPermission, TRole> {
  const isWildcardEnabled = options?.wildcard !== false;

  // Normalize initial roles
  const [rolesList, roleSet] = normalizeIdentifiers<TRole>(options?.roles);

  // Collect direct permissions + inherited permissions from rolePermissions map
  const rawPermissions: (TPermission | string)[] = [];
  if (options?.permissions && Array.isArray(options.permissions)) {
    rawPermissions.push(...options.permissions);
  }

  if (options?.rolePermissions && typeof options.rolePermissions === 'object') {
    for (let i = 0; i < rolesList.length; i++) {
      const role = rolesList[i];
      const mapped = options.rolePermissions[role];
      if (mapped && Array.isArray(mapped)) {
        rawPermissions.push(...mapped);
      }
    }
  }

  // Normalize final list of permissions
  const [permissionsList, permissionSet] =
    normalizeIdentifiers<TPermission>(rawPermissions);

  // Pre-filter wildcard patterns to optimize evaluation
  const wildcardPatterns: string[] = [];
  if (isWildcardEnabled) {
    for (let i = 0; i < permissionsList.length; i++) {
      const p = permissionsList[i];
      if (typeof p === 'string' && p.includes('*')) {
        wildcardPatterns.push(p);
      }
    }
  }

  const hasSuperWildcard = wildcardPatterns.includes('*');

  const can = (permission: StringWithAutocomplete<TPermission>): boolean => {
    if (typeof permission !== 'string') return false;
    const trimmed = permission.trim();
    if (trimmed.length === 0) return false;

    // Fast O(1) exact match check
    if (permissionSet.has(trimmed as TPermission)) {
      return true;
    }

    // Wildcard matching check
    if (isWildcardEnabled && wildcardPatterns.length > 0) {
      if (hasSuperWildcard) return true;
      for (let i = 0; i < wildcardPatterns.length; i++) {
        if (matchesWildcard(wildcardPatterns[i], trimmed)) {
          return true;
        }
      }
    }

    return false;
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
    wildcard: isWildcardEnabled,
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
