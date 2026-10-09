import type {
  PermissionMode,
  StringWithAutocomplete,
} from '../core/types';
import { usePermissionContext } from './usePermissionContext';

/**
 * Direct hook to evaluate whether the current user has the specified permission(s).
 *
 * @param permission Single permission string or array of permission strings
 * @param mode Evaluation mode when an array is passed ('all' | 'any'). Defaults to 'all'.
 * @returns boolean
 *
 * @example
 * ```tsx
 * const canEdit = useCan('posts.edit');
 * const canManage = useCan(['posts.edit', 'posts.delete'], 'any');
 * ```
 */
export function useCan<TPermission extends string = string>(
  permission:
    | StringWithAutocomplete<TPermission>
    | readonly StringWithAutocomplete<TPermission>[],
  mode: PermissionMode = 'all',
): boolean {
  const checker = usePermissionContext<TPermission, string>();

  if (Array.isArray(permission)) {
    return mode === 'any'
      ? checker.hasAnyPermission(permission)
      : checker.hasAllPermissions(permission);
  }

  return checker.can(permission as StringWithAutocomplete<TPermission>);
}
