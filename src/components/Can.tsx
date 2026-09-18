import React from 'react';
import type { CanProps, CanRenderProp } from '../core/types';
import { usePermissionContext } from '../hooks/usePermissionContext';

/**
 * Declarative component for conditional rendering based on permissions, roles, or custom checks.
 *
 * Supports:
 * - Single permission (`permission="user.create"`)
 * - Multiple permissions (`permissions={["user.edit", "user.delete"]}`)
 * - Single role (`role="admin"`)
 * - Multiple roles (`roles={["admin", "manager"]}`)
 * - Logical modes (`mode="any"` or `mode="all"`, defaults to `'all'`)
 * - Custom predicate (`check={({ hasRole }) => hasRole("admin")}`)
 * - Fallback UI (`fallback={<Unauthorized />}`)
 * - Render props pattern (`children={({ allowed }) => <Button disabled={!allowed} />}`)
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
  mode = 'all',
  check,
  fallback = null,
  children,
}: CanProps<TPermission, TRole>): React.ReactNode {
  const checker = usePermissionContext<TPermission, TRole>();

  let hasPermissionCondition = false;
  let permissionConditionMet = true;

  // Single permission evaluation
  if (typeof permission === 'string') {
    hasPermissionCondition = true;
    permissionConditionMet = checker.can(permission);
  }

  // Multiple permissions evaluation
  if (Array.isArray(permissions) && permissions.length > 0) {
    hasPermissionCondition = true;
    const multiPermissionMet =
      mode === 'any'
        ? checker.hasAnyPermission(permissions)
        : checker.hasAllPermissions(permissions);

    permissionConditionMet = permissionConditionMet && multiPermissionMet;
  }

  let hasRoleCondition = false;
  let roleConditionMet = true;

  // Single role evaluation
  if (typeof role === 'string') {
    hasRoleCondition = true;
    roleConditionMet = checker.hasRole(role);
  }

  // Multiple roles evaluation
  if (Array.isArray(roles) && roles.length > 0) {
    hasRoleCondition = true;
    const multiRoleMet =
      mode === 'any'
        ? checker.hasAnyRole(roles)
        : checker.hasAllRoles(roles);

    roleConditionMet = roleConditionMet && multiRoleMet;
  }

  let hasCheckCondition = false;
  let checkConditionMet = true;

  // Custom predicate check evaluation
  if (typeof check === 'function') {
    hasCheckCondition = true;
    checkConditionMet = checker.check(check);
  }

  // If no conditions were specified at all, allow by default
  const hasAnyConditionSpecified =
    hasPermissionCondition || hasRoleCondition || hasCheckCondition;

  const allowed = hasAnyConditionSpecified
    ? permissionConditionMet && roleConditionMet && checkConditionMet
    : true;

  // Render prop support
  if (typeof children === 'function') {
    return (children as CanRenderProp<TPermission, TRole>)({
      allowed,
      checker,
    });
  }

  if (allowed) {
    return children ?? null;
  }

  return fallback ?? null;
}

Can.displayName = 'Can';
