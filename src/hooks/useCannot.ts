import type {
  PermissionMode,
  StringWithAutocomplete,
} from '../core/types';
import { usePermissionContext } from './usePermissionContext';

/**
 * Direct hook to evaluate whether the current user DOES NOT have the specified permission(s),
 * optionally evaluated against an ABAC resource instance.
 *
 * @example
 * ```tsx
 * const cannotEdit = useCannot('posts.edit');
 * const cannotEditPost = useCannot('posts.edit', post);
 * ```
 */
export function useCannot<TPermission extends string = string>(
  permission:
    | StringWithAutocomplete<TPermission>
    | readonly StringWithAutocomplete<TPermission>[],
  mode?: PermissionMode,
): boolean;
export function useCannot<
  TPermission extends string = string,
  TResource = unknown,
>(
  permission:
    | StringWithAutocomplete<TPermission>
    | readonly StringWithAutocomplete<TPermission>[],
  resource: TResource,
  mode?: PermissionMode,
): boolean;
export function useCannot<
  TPermission extends string = string,
  TResource = unknown,
>(
  permission:
    | StringWithAutocomplete<TPermission>
    | readonly StringWithAutocomplete<TPermission>[],
  resourceOrMode?: TResource | PermissionMode,
  mode?: PermissionMode,
): boolean {
  const checker = usePermissionContext<TPermission, string>();

  let actualResource: unknown = undefined;
  let actualMode: PermissionMode = 'all';

  if (
    typeof resourceOrMode === 'string' &&
    (resourceOrMode === 'any' || resourceOrMode === 'all')
  ) {
    actualMode = resourceOrMode as PermissionMode;
  } else if (resourceOrMode !== undefined) {
    actualResource = resourceOrMode;
    if (mode === 'any' || mode === 'all') {
      actualMode = mode;
    }
  }

  if (Array.isArray(permission)) {
    const allowed =
      actualMode === 'any'
        ? permission.some((p) => checker.can(p, actualResource))
        : permission.every((p) => checker.can(p, actualResource));
    return !allowed;
  }

  return !checker.can(
    permission as StringWithAutocomplete<TPermission>,
    actualResource,
  );
}
