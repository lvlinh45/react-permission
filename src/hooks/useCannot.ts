import type {
  PermissionMode,
  StringWithAutocomplete,
} from '../core/types';
import { useCan } from './useCan';

/**
 * Direct hook to evaluate whether the current user DOES NOT have the specified permission(s).
 *
 * @param permission Single permission string or array of permission strings
 * @param mode Evaluation mode when an array is passed ('all' | 'any'). Defaults to 'all'.
 * @returns boolean (true if user does NOT satisfy permission requirement)
 *
 * @example
 * ```tsx
 * const cannotEdit = useCannot('posts.edit');
 * ```
 */
export function useCannot<TPermission extends string = string>(
  permission:
    | StringWithAutocomplete<TPermission>
    | readonly StringWithAutocomplete<TPermission>[],
  mode: PermissionMode = 'all',
): boolean {
  return !useCan<TPermission>(permission, mode);
}
