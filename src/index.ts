// Components
export { Can } from './components/Can';
export { Cannot } from './components/Cannot';

// Higher-Order Components (HOC)
export { withPermission } from './hoc/withPermission';
export { withRole } from './hoc/withRole';

// Context & Provider
export { PermissionContext } from './context/PermissionContext';
export { PermissionProvider } from './context/PermissionProvider';

// Hooks
export { useCan } from './hooks/useCan';
export { useCannot } from './hooks/useCannot';
export { useHasRole } from './hooks/useHasRole';
export { usePermission } from './hooks/usePermission';
export { usePermissionContext } from './hooks/usePermissionContext';

// Core standalone engine
export { createPermissionChecker } from './core/checker';
export { normalizeIdentifiers } from './core/normalize';
export { matchesWildcard } from './core/wildcard';

// Types
export type {
  CanProps,
  CanRenderProp,
  CustomCheckFn,
  PermissionCheckContext,
  PermissionChecker,
  PermissionCheckerOptions,
  PermissionMode,
  PermissionProviderProps,
  RolePermissionsMap,
  StringWithAutocomplete,
  WithPermissionOptions,
  WithRoleOptions,
} from './core/types';
