// Components
export { Can } from './components/Can';

// Context & Provider
export { PermissionContext } from './context/PermissionContext';
export { PermissionProvider } from './context/PermissionProvider';

// Hooks
export { usePermission } from './hooks/usePermission';
export { usePermissionContext } from './hooks/usePermissionContext';

// Core standalone engine
export { createPermissionChecker } from './core/checker';
export { normalizeIdentifiers } from './core/normalize';

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
} from './core/types';
