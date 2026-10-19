import React, { useContext } from 'react';
import { PermissionLoadingFallbackContext } from '../context/PermissionContext';
import type { CanProps, CanRenderProp } from '../core/types';
import { usePermissionContext } from '../hooks/usePermissionContext';
import { evaluateCondition } from './condition';
import {
  PermissionCase,
  PermissionDefault,
  PermissionSwitch,
} from './PermissionSwitch';

/**
 * Declarative component for conditional rendering based on permissions, roles, ABAC policies, or custom checks.
 *
 * Supports:
 * - Single permission (`permission="user.create"`)
 * - Multiple permissions (`permissions={["user.edit", "user.delete"]}`)
 * - Wildcard patterns (`permission="users.*"`)
 * - Single role (`role="admin"`)
 * - Multiple roles (`roles={["admin", "manager"]}`)
 * - ABAC Resource policies (`permission="posts.edit" resource={post}`)
 * - Logical modes (`mode="any"` or `mode="all"`, defaults to `'all'`)
 * - Inversion (`not={true}`)
 * - Custom predicate (`check={({ hasRole }) => hasRole("admin")}`)
 * - Loading state & fallback (`isLoading`, `loadingFallback={<Skeleton />}`)
 * - Fallback UI (`fallback={<Unauthorized />}`)
 * - Render props pattern (`children={({ allowed, isLoading }) => <Button disabled={!allowed} />}`)
 * - Switch-case syntax (`<Can.Switch>`, `<Can.Case>`, `<Can.Default>`)
 *
 * @example
 * ```tsx
 * <Can permission="user.create" fallback={<p>Not allowed</p>}>
 *   <CreateUserButton />
 * </Can>
 * ```
 */
export function Can<
  TPermission extends string = string,
  TRole extends string = string,
>({
  permission,
  permissions,
  role,
  roles,
  resource,
  mode = 'all',
  not = false,
  check,
  fallback = null,
  isLoading,
  loadingFallback,
  children,
}: CanProps<TPermission, TRole>): React.ReactNode {
  const checker = usePermissionContext<TPermission, TRole>();
  const parentLoadingFallback = useContext(PermissionLoadingFallbackContext);

  const effectiveLoading =
    isLoading !== undefined ? Boolean(isLoading) : checker.isLoading;
  const effectiveFallback =
    loadingFallback !== undefined ? loadingFallback : parentLoadingFallback;

  // If loading is active and children is not a render function, render loadingFallback
  if (effectiveLoading && typeof children !== 'function') {
    return effectiveFallback ?? null;
  }

  const allowed = evaluateCondition(
    {
      permission,
      permissions,
      role,
      roles,
      resource,
      mode,
      not,
      check,
    },
    checker,
  );

  // Render prop support
  if (typeof children === 'function') {
    return (children as CanRenderProp<TPermission, TRole>)({
      allowed,
      checker,
      isLoading: effectiveLoading,
    });
  }

  if (allowed) {
    return children ?? null;
  }

  return fallback ?? null;
}

Can.displayName = 'Can';

// Attach Switch, Case, and Default subcomponents for intuitive declarative syntax
Can.Switch = PermissionSwitch;
Can.Case = PermissionCase;
Can.Default = PermissionDefault;
