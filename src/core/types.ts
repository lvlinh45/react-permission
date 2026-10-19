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
   * The list of direct assigned roles.
   */
  readonly roles: readonly TRole[];

  /**
   * The list of all effective roles (direct + transitively inherited).
   */
  readonly effectiveRoles: readonly TRole[];

  /**
   * Checks if a single permission is granted.
   */
  hasPermission: (
    permission: StringWithAutocomplete<TPermission>,
    resource?: unknown,
  ) => boolean;

  /**
   * Checks if a single role is assigned (direct or inherited).
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
 * Attribute-Based Access Control (ABAC) / Resource policy function.
 * Evaluates whether an action on a specific resource instance is permitted.
 */
export type PolicyFn<
  TResource = unknown,
  TPermission extends string = string,
  TRole extends string = string,
> = (
  resource: TResource,
  context: PermissionCheckContext<TPermission, TRole>,
) => boolean;

/**
 * Map of permissions/actions to their ABAC resource policy evaluator functions.
 */
export type PoliciesMap<
  TPermission extends string = string,
  TRole extends string = string,
> = Partial<
  Record<
    TPermission | string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PolicyFn<any, TPermission, TRole>
  >
>;

/**
 * Role-to-permissions mapping matrix.
 */
export type RolePermissionsMap<
  TRole extends string = string,
  TPermission extends string = string,
> = Partial<Record<TRole | string, readonly (TPermission | string)[]>>;

/**
 * Hierarchical role inheritance mapping.
 * Each role inherits all permissions and sub-roles of the mapped roles.
 *
 * @example
 * ```ts
 * const roleHierarchy = {
 *   superadmin: ['admin'],
 *   admin: ['editor', 'viewer'],
 *   editor: ['viewer'],
 * };
 * ```
 */
export type RoleHierarchy<TRole extends string = string> = Partial<
  Record<TRole | string, readonly (TRole | string)[]>
>;

/**
 * Detailed diagnostic information explaining why a permission check was allowed or denied.
 */
export interface PermissionExplanation {
  /**
   * Whether access was granted.
   */
  readonly allowed: boolean;

  /**
   * Human-readable diagnostic description of the decision.
   */
  readonly reason: string;

  /**
   * Type of mechanism that determined the outcome.
   */
  readonly matchedType:
    | 'direct'
    | 'wildcard'
    | 'role_permission'
    | 'policy'
    | 'none';

  /**
   * Wildcard pattern that matched (if applicable).
   */
  readonly matchedPattern?: string;

  /**
   * Role that granted the permission (if applicable).
   */
  readonly role?: string;

  /**
   * Originating parent role that granted the role via hierarchy (if applicable).
   */
  readonly inheritedViaRole?: string;
}

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

  /**
   * Role-to-Role inheritance hierarchy.
   */
  roleHierarchy?: RoleHierarchy<TRole>;

  /**
   * ABAC Resource-based policy evaluation functions.
   */
  policies?: PoliciesMap<TPermission, TRole>;

  /**
   * Flag indicating whether permissions are currently being loaded/fetched asynchronously.
   * Defaults to `false`.
   */
  isLoading?: boolean;
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
   * Active list of normalized direct permissions.
   */
  readonly permissions: readonly TPermission[];

  /**
   * Active list of normalized direct roles.
   */
  readonly roles: readonly TRole[];

  /**
   * Active list of all effective roles (direct + inherited).
   */
  readonly effectiveRoles: readonly TRole[];

  /**
   * Whether wildcard matching is active.
   */
  readonly wildcard: boolean;

  /**
   * Whether authorization state is currently loading.
   */
  readonly isLoading: boolean;

  /**
   * Active role hierarchy configuration.
   */
  readonly roleHierarchy?: RoleHierarchy<TRole>;

  /**
   * Active resource policies configuration.
   */
  readonly policies?: PoliciesMap<TPermission, TRole>;

  /**
   * Active role permissions configuration.
   */
  readonly rolePermissions?: RolePermissionsMap<TRole, TPermission>;

  /**
   * Checks if the given permission (and optional resource) is granted.
   */
  can: (
    permission: StringWithAutocomplete<TPermission>,
    resource?: unknown,
  ) => boolean;

  /**
   * Checks if the given permission is NOT granted.
   * Equivalent to `!can(permission, resource)`.
   */
  cannot: (
    permission: StringWithAutocomplete<TPermission>,
    resource?: unknown,
  ) => boolean;

  /**
   * Provides detailed diagnostics on why a permission was allowed or denied.
   */
  explain: (
    permission: StringWithAutocomplete<TPermission>,
    resource?: unknown,
  ) => PermissionExplanation;

  /**
   * Checks if a single role is assigned (direct or inherited).
   */
  hasRole: (role: StringWithAutocomplete<TRole>) => boolean;

  /**
   * Checks if ANY of the given roles are assigned.
   */
  hasAnyRole: (roles: readonly StringWithAutocomplete<TRole>[]) => boolean;

  /**
   * Checks if ALL of the given roles are assigned.
   */
  hasAllRoles: (roles: readonly StringWithAutocomplete<TRole>[]) => boolean;

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
  isLoading: boolean;
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
   * Target resource object to evaluate against ABAC policies.
   */
  resource?: unknown;

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
   * Override loading status for this component.
   */
  isLoading?: boolean;

  /**
   * Fallback UI to render while loading.
   */
  loadingFallback?: ReactNode;

  /**
   * Child elements to render if authorized, or a render-prop function.
   */
  children?: ReactNode | CanRenderProp<TPermission, TRole>;
}

/**
 * Props for <PermissionSwitch.Case> and <Can.Case>.
 */
export interface PermissionCaseProps<
  TPermission extends string = string,
  TRole extends string = string,
> extends Omit<
    CanProps<TPermission, TRole>,
    'fallback' | 'loadingFallback' | 'children'
  > {
  /**
   * Child elements to render if this case matches.
   */
  children?: ReactNode;
}

/**
 * Props for <PermissionSwitch.Default> and <Can.Default>.
 */
export interface PermissionDefaultProps {
  children?: ReactNode;
}

/**
 * Props for <PermissionSwitch> and <Can.Switch>.
 */
export interface PermissionSwitchProps {
  /**
   * Fallback UI to render if none of the cases match.
   */
  fallback?: ReactNode;

  /**
   * Override loading status for the switch block.
   */
  isLoading?: boolean;

  /**
   * Fallback UI to render while loading.
   */
  loadingFallback?: ReactNode;

  /**
   * List of <PermissionSwitch.Case> or <PermissionSwitch.Default> children.
   */
  children?: ReactNode;
}

/**
 * Options for Higher-Order Components (HOC).
 */
export interface WithPermissionOptions<
  TPermission extends string = string,
  TRole extends string = string,
> extends Omit<
    CanProps<TPermission, TRole>,
    'children' | 'permission' | 'permissions'
  > {}

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
   * Role-to-Role inheritance hierarchy.
   */
  roleHierarchy?: RoleHierarchy<TRole>;

  /**
   * ABAC Resource-based policy evaluation functions.
   */
  policies?: PoliciesMap<TPermission, TRole>;

  /**
   * Whether authorization data is currently being fetched asynchronously.
   * When true, child `<Can>` elements render `loadingFallback` instead of failing.
   */
  isLoading?: boolean;

  /**
   * Default loading fallback component (e.g. Skeleton loader, Spinner).
   */
  loadingFallback?: ReactNode;

  /**
   * If true, inherits roles, permissions, policies, and role mappings from a parent <PermissionProvider>.
   * Ideal for scoped sub-modules, tenants, or nested route guards. Defaults to false.
   */
  inherit?: boolean;

  /**
   * React children to render within the permission context.
   */
  children: ReactNode;
}
