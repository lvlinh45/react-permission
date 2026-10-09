import type {
  PermissionMode,
  StringWithAutocomplete,
} from '../core/types';
import { usePermissionContext } from './usePermissionContext';

/**
 * Direct hook to evaluate whether the current user has the specified role(s).
 *
 * @param role Single role string or array of role strings
 * @param mode Evaluation mode when an array is passed ('all' | 'any'). Defaults to 'all'.
 * @returns boolean
 *
 * @example
 * ```tsx
 * const isAdmin = useHasRole('admin');
 * const isStaff = useHasRole(['admin', 'manager'], 'any');
 * ```
 */
export function useHasRole<TRole extends string = string>(
  role:
    | StringWithAutocomplete<TRole>
    | readonly StringWithAutocomplete<TRole>[],
  mode: PermissionMode = 'all',
): boolean {
  const checker = usePermissionContext<string, TRole>();

  if (Array.isArray(role)) {
    return mode === 'any'
      ? checker.hasAnyRole(role)
      : checker.hasAllRoles(role);
  }

  return checker.hasRole(role as StringWithAutocomplete<TRole>);
}
