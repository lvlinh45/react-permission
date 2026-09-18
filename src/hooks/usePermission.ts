import type { PermissionChecker } from '../core/types';
import { usePermissionContext } from './usePermissionContext';

/**
 * Primary hook for evaluating permissions and roles in React components.
 *
 * Provides:
 * - `can(permission)`
 * - `cannot(permission)`
 * - `hasRole(role)`
 * - `hasAnyRole(roles)`
 * - `hasAllRoles(roles)`
 * - `hasAnyPermission(permissions)`
 * - `hasAllPermissions(permissions)`
 * - `check(predicateFn)`
 * - `permissions` (active normalized list)
 * - `roles` (active normalized list)
 *
 * @template TPermission Permission string literal or string
 * @template TRole Role string literal or string
 * @returns The active PermissionChecker instance
 *
 * @example
 * ```tsx
 * const { can, cannot, hasRole } = usePermission<'user.create' | 'user.delete', 'admin'>();
 *
 * if (can('user.create')) {
 *   // render create button
 * }
 * ```
 */
export function usePermission<
  TPermission extends string = string,
  TRole extends string = string,
>(): PermissionChecker<TPermission, TRole> {
  return usePermissionContext<TPermission, TRole>();
}
