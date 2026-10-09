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
 * Role-to-permissions mapping matrix.
 */
export type RolePermissionsMap<
  TRole extends string = string,
  TPermission extends string = string,
> = Partial<Record<TRole | string, readonly (TPermission | string)[]>>;

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

  /**
   * Enable wildcard / glob pattern matching for permissions (e.g. 'posts.*', '*').
   * Defaults to `true`.
   */
  wildcard?: boolean;

  /**
   * Role-to-Permissions mapping matrix.
   * Permissions mapped to the user's active roles will automatically be granted.
   */
  rolePermissions?: RolePermissionsMap<TRole, TPermission>;
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
   * Whether wildcard matching is active.
   */
  readonly wildcard: boolean;

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
   * Alias for `hasAnyPermission`.
   */
  canAny: (
    permissions: readonly StringWithAutocomplete<TPermission>[],
  ) => boolean;

  /**
   * Checks if ALL of the given permissions are granted.
   * Alias for `hasAllPermissions`.
   */
  canAll: (
    permissions: readonly StringWithAutocomplete<TPermission>[],
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
 * Render prop signature for the <Can> and <Cannot> components.
 */
export type CanRenderProp<
  TPermission extends string = string,
  TRole extends string = string,
> = (props: {
  allowed: boolean;
  checker: PermissionChecker<TPermission, TRole>;
}) => ReactNode;

/**
 * Props for the declarative <Can> and <Cannot> authorization components.
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
   * Invert authorization decision (renders when condition is NOT satisfied).
   * Defaults to false.
   */
  not?: boolean;

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
 * Options for Higher-Order Components (HOC).
 */
export interface WithPermissionOptions<
  TPermission extends string = string,
  TRole extends string = string,
> extends Omit<CanProps<TPermission, TRole>, 'children' | 'permission' | 'permissions'> {}

export interface WithRoleOptions<
  TPermission extends string = string,
  TRole extends string = string,
> extends Omit<CanProps<TPermission, TRole>, 'children' | 'role' | 'roles'> {}

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
   * Enable wildcard pattern matching for permissions (e.g. 'posts.*', '*').
   * Defaults to `true`.
   */
  wildcard?: boolean;

  /**
   * Role-to-Permissions mapping matrix.
   */
  rolePermissions?: RolePermissionsMap<TRole, TPermission>;

  /**
   * React children to render within the permission context.
   */
  children: ReactNode;
}
