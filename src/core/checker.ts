import { resolveRoleHierarchy } from './hierarchy';
import { normalizeIdentifiers } from './normalize';
import type {
  CustomCheckFn,
  PermissionCheckContext,
  PermissionChecker,
  PermissionCheckerOptions,
  PermissionExplanation,
  PolicyFn,
  StringWithAutocomplete,
} from './types';
import { matchesWildcard } from './wildcard';

/**
 * Creates an immutable, pure TypeScript permission checker engine.
 *
 * This function has zero dependencies on React and can be used in:
 * - Server / Node.js environments (Next.js SSR, Express, NestJS)
 * - Route navigation guards & middleware
 * - CLI utilities & worker threads
 * - Unit tests
 *
 * Features in v1.1.0:
 * - O(1) hash set lookup for permissions and roles
 * - Wildcard/glob pattern matching (`*`, `posts.*`, `users:*:view`) with precompiled regexes
 * - Role-to-permissions inheritance matrix
 * - Multi-level transitive role hierarchy resolution with cycle detection
 * - ABAC / Resource-based policy evaluation
 * - Full diagnostics & explanation engine (`checker.explain()`)
 *
 * @template TPermission Permission string literal or string
 * @template TRole Role string literal or string
 * @param options Initial permissions, roles, hierarchy, and policies
 * @returns An immutable PermissionChecker instance
 */
export function createPermissionChecker<
  TPermission extends string = string,
  TRole extends string = string,
>(
  options?: PermissionCheckerOptions<TPermission, TRole>,
): PermissionChecker<TPermission, TRole> {
  const isWildcardEnabled = options?.wildcard !== false;
  const isLoading = Boolean(options?.isLoading);

  // Normalize direct roles
  const [directRolesList] = normalizeIdentifiers<TRole>(options?.roles);

  // Resolve transitive role hierarchy (direct + inherited roles)
  const {
    effectiveRolesList,
    effectiveRolesSet,
    inheritanceMap,
  } = resolveRoleHierarchy<TRole>(directRolesList, options?.roleHierarchy);

  // Track direct permissions vs role-inherited permissions for diagnostic explain()
  const [directPermissionsList, directPermissionSet] =
    normalizeIdentifiers<TPermission>(options?.permissions);

  const rolePermissionOriginMap = new Map<
    TPermission,
    { role: TRole; inheritedVia?: TRole }
  >();
  const roleInheritedPermissions: TPermission[] = [];

  if (options?.rolePermissions && typeof options.rolePermissions === 'object') {
    for (let i = 0; i < effectiveRolesList.length; i++) {
      const role = effectiveRolesList[i];
      if (Object.prototype.hasOwnProperty.call(options.rolePermissions, role)) {
        const mapped = options.rolePermissions[role];
        if (mapped && Array.isArray(mapped)) {
          const parents = inheritanceMap.get(role);
          const inheritedVia =
            parents && parents.length > 0 ? parents[0] : undefined;

          for (let j = 0; j < mapped.length; j++) {
            const item = mapped[j];
            if (item && typeof item === 'string') {
              const trimmed = item.trim() as TPermission;
              if (trimmed.length > 0) {
                roleInheritedPermissions.push(trimmed);
                if (!rolePermissionOriginMap.has(trimmed)) {
                  rolePermissionOriginMap.set(trimmed, { role, inheritedVia });
                }
              }
            }
          }
        }
      }
    }
  }

  // Combined permissions: direct + role-inherited
  const rawCombinedPermissions: (TPermission | string)[] = [
    ...directPermissionsList,
    ...roleInheritedPermissions,
  ];

  const [permissionsList, permissionSet] =
    normalizeIdentifiers<TPermission>(rawCombinedPermissions);

  // Precompile wildcard patterns to regexes for optimal O(1) performance without runtime regex recompilations
  const compiledWildcards: Array<{ pattern: string; regex: RegExp }> = [];
  let hasSuperWildcard = false;

  if (isWildcardEnabled) {
    for (let i = 0; i < permissionsList.length; i++) {
      const p = permissionsList[i];
      if (typeof p === 'string' && p.includes('*')) {
        if (p === '*') {
          hasSuperWildcard = true;
        } else {
          const escaped = p
            .split('*')
            .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('.*');
          compiledWildcards.push({
            pattern: p,
            regex: new RegExp(`^${escaped}$`),
          });
        }
      }
    }
  }

  // Fast base permission check (without resource policy)
  const baseCan = (permission: StringWithAutocomplete<TPermission>): boolean => {
    if (typeof permission !== 'string') return false;
    const trimmed = permission.trim();
    if (trimmed.length === 0) return false;

    // Fast O(1) exact match check
    if (permissionSet.has(trimmed as TPermission)) {
      return true;
    }

    // Precompiled wildcard matching check
    if (isWildcardEnabled) {
      if (hasSuperWildcard) return true;
      for (let i = 0; i < compiledWildcards.length; i++) {
        if (compiledWildcards[i].regex.test(trimmed)) {
          return true;
        }
      }
    }

    return false;
  };

  const hasRole = (role: StringWithAutocomplete<TRole>): boolean => {
    if (typeof role !== 'string') return false;
    const trimmed = role.trim();
    if (trimmed.length === 0) return false;
    return effectiveRolesSet.has(trimmed as TRole);
  };

  const checkContext: PermissionCheckContext<TPermission, TRole> =
    Object.freeze({
      permissions: permissionsList,
      roles: directRolesList,
      effectiveRoles: effectiveRolesList,
      hasPermission: (
        p: StringWithAutocomplete<TPermission>,
        resource?: unknown,
      ) => can(p, resource),
      hasRole,
    });

  // Find applicable policy for permission
  const findPolicy = (
    permission: string,
  ): PolicyFn<unknown, TPermission, TRole> | undefined => {
    if (!options?.policies || typeof options.policies !== 'object') {
      return undefined;
    }

    // Exact policy match (defensively checking hasOwnProperty)
    if (Object.prototype.hasOwnProperty.call(options.policies, permission)) {
      const fn = options.policies[permission];
      if (typeof fn === 'function') return fn;
    }

    // Wildcard policy match (e.g. policy for 'posts.*')
    if (isWildcardEnabled) {
      const policyKeys = Object.keys(options.policies);
      for (let i = 0; i < policyKeys.length; i++) {
        const key = policyKeys[i];
        if (
          key.includes('*') &&
          matchesWildcard(key, permission) &&
          Object.prototype.hasOwnProperty.call(options.policies, key)
        ) {
          const fn = options.policies[key];
          if (typeof fn === 'function') return fn;
        }
      }
    }

    return undefined;
  };

  const can = (
    permission: StringWithAutocomplete<TPermission>,
    resource?: unknown,
  ): boolean => {
    if (typeof permission !== 'string') return false;
    const trimmed = permission.trim();
    if (trimmed.length === 0) return false;

    // ABAC Resource Policy check
    if (resource !== undefined) {
      const policy = findPolicy(trimmed);
      if (policy) {
        try {
          return Boolean(policy(resource, checkContext));
        } catch {
          return false;
        }
      }
    }

    // Standard RBAC check
    return baseCan(trimmed as StringWithAutocomplete<TPermission>);
  };

  const cannot = (
    permission: StringWithAutocomplete<TPermission>,
    resource?: unknown,
  ): boolean => {
    return !can(permission, resource);
  };

  const explain = (
    permission: StringWithAutocomplete<TPermission>,
    resource?: unknown,
  ): PermissionExplanation => {
    if (typeof permission !== 'string') {
      return {
        allowed: false,
        reason: 'Invalid permission provided: must be a non-empty string',
        matchedType: 'none',
      };
    }

    const trimmed = permission.trim();
    if (trimmed.length === 0) {
      return {
        allowed: false,
        reason: 'Empty permission string provided',
        matchedType: 'none',
      };
    }

    // 1. Evaluate ABAC Resource Policy if resource is provided
    if (resource !== undefined) {
      const policy = findPolicy(trimmed);
      if (policy) {
        try {
          const policyPassed = Boolean(policy(resource, checkContext));
          if (policyPassed) {
            return {
              allowed: true,
              reason: `Granted by resource policy for "${trimmed}"`,
              matchedType: 'policy',
            };
          }
          return {
            allowed: false,
            reason: `Denied by resource policy for "${trimmed}" on the provided resource`,
            matchedType: 'policy',
          };
        } catch (err) {
          return {
            allowed: false,
            reason: `Error during resource policy evaluation for "${trimmed}": ${String(err)}`,
            matchedType: 'policy',
          };
        }
      }
    }

    // 2. Direct permission match
    if (directPermissionSet.has(trimmed as TPermission)) {
      return {
        allowed: true,
        reason: `Granted by direct permission "${trimmed}"`,
        matchedType: 'direct',
      };
    }

    // 3. Inherited via role permissions (exact)
    const roleOrigin = rolePermissionOriginMap.get(trimmed as TPermission);
    if (roleOrigin) {
      const inheritedText = roleOrigin.inheritedVia
        ? ` (inherited via role "${roleOrigin.inheritedVia}")`
        : '';
      return {
        allowed: true,
        reason: `Granted by role "${roleOrigin.role}"${inheritedText} for permission "${trimmed}"`,
        matchedType: 'role_permission',
        role: roleOrigin.role,
        inheritedViaRole: roleOrigin.inheritedVia,
      };
    }

    // 4. Wildcard matching
    if (isWildcardEnabled) {
      if (hasSuperWildcard) {
        const superOrigin = rolePermissionOriginMap.get('*' as TPermission);
        return {
          allowed: true,
          reason: superOrigin
            ? `Granted by super wildcard pattern "*" (via role "${superOrigin.role}")`
            : 'Granted by super wildcard pattern "*"',
          matchedType: 'wildcard',
          matchedPattern: '*',
          role: superOrigin?.role,
          inheritedViaRole: superOrigin?.inheritedVia,
        };
      }

      for (let i = 0; i < compiledWildcards.length; i++) {
        const item = compiledWildcards[i];
        if (item.regex.test(trimmed)) {
          const wildOrigin = rolePermissionOriginMap.get(
            item.pattern as TPermission,
          );
          return {
            allowed: true,
            reason: `Granted by wildcard pattern "${item.pattern}"`,
            matchedType: 'wildcard',
            matchedPattern: item.pattern,
            role: wildOrigin?.role,
            inheritedViaRole: wildOrigin?.inheritedVia,
          };
        }
      }
    }

    // 5. Denied
    return {
      allowed: false,
      reason: `Permission "${trimmed}" is not granted to user`,
      matchedType: 'none',
    };
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
    roles: directRolesList,
    effectiveRoles: effectiveRolesList,
    wildcard: isWildcardEnabled,
    isLoading,
    roleHierarchy: options?.roleHierarchy,
    rolePermissions: options?.rolePermissions,
    policies: options?.policies,
    can,
    cannot,
    explain,
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
