import React from 'react';
import { Can } from '../components/Can';
import type { StringWithAutocomplete, WithRoleOptions } from '../core/types';

/**
 * Higher-Order Component (HOC) that wraps a component and only renders it
 * if the user has the required role(s).
 *
 * @param Component The React component to wrap
 * @param role The required role or array of roles
 * @param options Fallback UI, mode ('any' | 'all'), custom predicate check, not inversion
 * @returns Wrapped component
 *
 * @example
 * ```tsx
 * export const AdminPanel = withRole(BaseAdminPanel, 'admin', {
 *   fallback: <UnauthorizedNotice />
 * });
 * ```
 */
export function withRole<
  P extends object,
  TPermission extends string = string,
  TRole extends string = string,
>(
  Component: React.ComponentType<P>,
  role:
    | StringWithAutocomplete<TRole>
    | readonly StringWithAutocomplete<TRole>[],
  options?: WithRoleOptions<TPermission, TRole>,
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    const isArray = Array.isArray(role);

    return (
      <Can<TPermission, TRole>
        role={
          !isArray ? (role as StringWithAutocomplete<TRole>) : undefined
        }
        roles={
          isArray
            ? (role as readonly StringWithAutocomplete<TRole>[])
            : undefined
        }
        {...options}
      >
        <Component {...props} />
      </Can>
    );
  };

  const name = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withRole(${name})`;

  return WrappedComponent;
}
