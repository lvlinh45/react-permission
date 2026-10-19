import type {
  CustomCheckFn,
  PermissionChecker,
  PermissionMode,
  StringWithAutocomplete,
} from '../core/types';

export interface ConditionEvaluationProps<
  TPermission extends string = string,
  TRole extends string = string,
> {
  permission?: StringWithAutocomplete<TPermission>;
  permissions?: readonly StringWithAutocomplete<TPermission>[];
  role?: StringWithAutocomplete<TRole>;
  roles?: readonly StringWithAutocomplete<TRole>[];
  resource?: unknown;
  mode?: PermissionMode;
  not?: boolean;
  check?: CustomCheckFn<TPermission, TRole>;
}

/**
 * Shared evaluation logic for permission and role conditions.
 * Used by <Can />, <Cannot />, and <PermissionSwitch />.
 */
export function evaluateCondition<
  TPermission extends string = string,
  TRole extends string = string,
>(
  props: ConditionEvaluationProps<TPermission, TRole>,
  checker: PermissionChecker<TPermission, TRole>,
): boolean {
  const {
    permission,
    permissions,
    role,
    roles,
    resource,
    mode = 'all',
    not = false,
    check,
  } = props;

  let hasPermissionCondition = false;
  let permissionConditionMet = true;

  // Single permission evaluation
  if (typeof permission === 'string') {
    hasPermissionCondition = true;
    permissionConditionMet = checker.can(permission, resource);
  }

  // Multiple permissions evaluation
  if (Array.isArray(permissions) && permissions.length > 0) {
    hasPermissionCondition = true;
    const multiPermissionMet =
      mode === 'any'
        ? permissions.some((p) => checker.can(p, resource))
        : permissions.every((p) => checker.can(p, resource));

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

  const conditionPassed = hasAnyConditionSpecified
    ? permissionConditionMet && roleConditionMet && checkConditionMet
    : true;

  return not ? !conditionPassed : conditionPassed;
}
