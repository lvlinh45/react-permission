import type { ReactNode } from 'react';

/**
 * Autocomplete-friendly string union helper.
 * Preserves IDE autocomplete for literal unions while accepting any string.
 */
export type StringWithAutocomplete<T extends string> = T | (string & {});

/**
 * Evaluation mode when checking multiple permissions or roles.
 * - 'all': Requires every specified permission or role to be granted (default).
 * - 'any': Requires at least one specified permission or role to be granted.
 */
export type PermissionMode = 'any' | 'all';

/**
 * Context provided to custom authorization predicate functions.
 */
export interface PermissionCheckContext<
  TPermission extends string = string,
  TRole extends string = string,
> {
  /**
   * The list of active normalized permissions.
   */
  readonly permissions: readonly TPermission[];

  /**
   * The list of active normalized roles.
   */
  readonly roles: readonly TRole[];

  /**
   * Checks if a single permission is granted.
   */
  hasPermission: (permission: StringWithAutocomplete<TPermission>) => boolean;

  /**
   * Checks if a single role is assigned.
   */
  hasRole: (role: StringWithAutocomplete<TRole>) => boolean;
}

/**
 * Custom predicate function for complex or dynamic authorization logic.
 */
export type CustomCheckFn<
  TPermission extends string = string,
  TRole extends string = string,
> = (context: PermissionCheckContext<TPermission, TRole>) => boolean;

/**
 * Options for initializing a permission checker instance.
 */
export interface PermissionCheckerOptions<
  TPermission extends string = string,
  TRole extends string = string,
> {
  /**
   * Permissions granted to the user or context.
   */
  permissions?: readonly (TPermission | string)[] | null;

  /**
   * Roles assigned to the user or context.
   */
  roles?: readonly (TRole | string)[] | null;
}

/**
 * Core permission checker engine instance.
 * Completely independent of React and suitable for programmatic authorization.
 */
export interface PermissionChecker<
  TPermission extends string = string,
  TRole extends string = string,
> {
  /**
   * Active list of normalized permissions.
   */
  readonly permissions: readonly TPermission[];

  /**
   * Active list of normalized roles.
   */
  readonly roles: readonly TRole[];

  /**
   * Checks if the given permission is granted.
   */
  can: (permission: StringWithAutocomplete<TPermission>) => boolean;

  /**
   * Checks if the given permission is NOT granted.
   * Equivalent to `!can(permission)`.
   */
  cannot: (permission: StringWithAutocomplete<TPermission>) => boolean;

  /**
   * Checks if a single role is assigned.
   */
  hasRole: (role: StringWithAutocomplete<TRole>) => boolean;

  /**
   * Checks if ANY of the given roles are assigned.
   */
  hasAnyRole: (
    roles: readonly StringWithAutocomplete<TRole>[],
  ) => boolean;

  /**
   * Checks if ALL of the given roles are assigned.
   */
  hasAllRoles: (
    roles: readonly StringWithAutocomplete<TRole>[],
  ) => boolean;

  /**
   * Checks if ANY of the given permissions are granted.
   */
  hasAnyPermission: (
    permissions: readonly StringWithAutocomplete<TPermission>[],
  ) => boolean;

  /**
   * Checks if ALL of the given permissions are granted.
   */
  hasAllPermissions: (
    permissions: readonly StringWithAutocomplete<TPermission>[],
  ) => boolean;

  /**
   * Runs a custom authorization predicate function.
   */
  check: (fn: CustomCheckFn<TPermission, TRole>) => boolean;
}

/**
 * Render prop signature for the <Can> component.
 */
export type CanRenderProp<
  TPermission extends string = string,
  TRole extends string = string,
> = (props: {
  allowed: boolean;
  checker: PermissionChecker<TPermission, TRole>;
}) => ReactNode;

/**
 * Props for the declarative <Can> authorization component.
 */
export interface CanProps<
  TPermission extends string = string,
  TRole extends string = string,
> {
  /**
   * Single permission required to render children.
   */
  permission?: StringWithAutocomplete<TPermission>;

  /**
   * Multiple permissions to check.
   */
  permissions?: readonly StringWithAutocomplete<TPermission>[];

  /**
   * Single role required to render children.
   */
  role?: StringWithAutocomplete<TRole>;

  /**
   * Multiple roles to check.
   */
  roles?: readonly StringWithAutocomplete<TRole>[];

  /**
   * Evaluation mode when multiple permissions or roles are specified.
   * Defaults to 'all'.
   */
  mode?: PermissionMode;

  /**
   * Custom authorization predicate function.
   */
  check?: CustomCheckFn<TPermission, TRole>;

  /**
   * Fallback UI to render if authorization fails. Defaults to null.
   */
  fallback?: ReactNode;

  /**
   * Child elements to render if authorized, or a render-prop function.
   */
  children?: ReactNode | CanRenderProp<TPermission, TRole>;
}

/**
 * Props for the <PermissionProvider> component.
 */
export interface PermissionProviderProps<
  TPermission extends string = string,
  TRole extends string = string,
> {
  /**
   * Permissions granted to the current user or context.
   */
  permissions?: readonly (TPermission | string)[] | null;

  /**
   * Roles assigned to the current user or context.
   */
  roles?: readonly (TRole | string)[] | null;

  /**
   * React children to render within the permission context.
   */
  children: ReactNode;
}
