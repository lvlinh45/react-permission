import React from 'react';
import { Can } from '../components/Can';
import type { StringWithAutocomplete, WithPermissionOptions } from '../core/types';

/**
 * Higher-Order Component (HOC) that wraps a component and only renders it
 * if the user has the required permission(s).
 *
 * @param Component The React component to wrap
 * @param permission The required permission or array of permissions
 * @param options Fallback UI, mode ('any' | 'all'), custom predicate check, not inversion
 * @returns Wrapped component
 *
 * @example
 * ```tsx
 * export const EditButton = withPermission(BaseEditButton, 'posts.edit', {
 *   fallback: <DisabledPlaceholder />
 * });
 * ```
 */
export function withPermission<
  P extends object,
  TPermission extends string = string,
  TRole extends string = string,
>(
  Component: React.ComponentType<P>,
  permission:
    | StringWithAutocomplete<TPermission>
    | readonly StringWithAutocomplete<TPermission>[],
  options?: WithPermissionOptions<TPermission, TRole>,
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    const isArray = Array.isArray(permission);

    return (
      <Can<TPermission, TRole>
        permission={
          !isArray
            ? (permission as StringWithAutocomplete<TPermission>)
            : undefined
        }
        permissions={
          isArray
            ? (permission as readonly StringWithAutocomplete<TPermission>[])
            : undefined
        }
        {...options}
      >
        <Component {...props} />
      </Can>
    );
  };

  const name = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withPermission(${name})`;

  return WrappedComponent;
}
