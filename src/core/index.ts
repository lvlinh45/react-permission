export { createPermissionChecker } from './checker';
export { resolveRoleHierarchy } from './hierarchy';
export { normalizeIdentifiers } from './normalize';
export { matchesWildcard } from './wildcard';

export type {
  CanProps,
  CanRenderProp,
  CustomCheckFn,
  PermissionCaseProps,
  PermissionCheckContext,
  PermissionChecker,
  PermissionCheckerOptions,
  PermissionDefaultProps,
  PermissionExplanation,
  PermissionMode,
  PermissionProviderProps,
  PermissionSwitchProps,
  PoliciesMap,
  PolicyFn,
  RoleHierarchy,
  RolePermissionsMap,
  StringWithAutocomplete,
  WithPermissionOptions,
  WithRoleOptions,
} from './types';
