import React, { isValidElement, useContext } from 'react';
import { PermissionLoadingFallbackContext } from '../context/PermissionContext';
import type {
  PermissionCaseProps,
  PermissionDefaultProps,
  PermissionSwitchProps,
} from '../core/types';
import { usePermissionContext } from '../hooks/usePermissionContext';
import { evaluateCondition } from './condition';

/**
 * Declares a conditional case inside a <PermissionSwitch /> or <Can.Switch /> block.
 */
export function PermissionCase<
  TPermission extends string = string,
  TRole extends string = string,
>(props: PermissionCaseProps<TPermission, TRole>): React.ReactNode {
  return props.children ?? null;
}
PermissionCase.displayName = 'PermissionCase';

/**
 * Declares the default fallback case inside a <PermissionSwitch /> or <Can.Switch /> block.
 * Rendered when none of the preceding cases match.
 */
export function PermissionDefault(
  props: PermissionDefaultProps,
): React.ReactNode {
  return props.children ?? null;
}
PermissionDefault.displayName = 'PermissionDefault';

/**
 * Declarative switch-case authorization component.
 * Evaluates child Cases sequentially and renders the first matching case.
 *
 * @example
 * ```tsx
 * <PermissionSwitch fallback={<AccessDenied />}>
 *   <PermissionSwitch.Case role="superadmin">
 *     <SuperAdminDashboard />
 *   </PermissionSwitch.Case>
 *   <PermissionSwitch.Case role="editor" permission="posts.edit">
 *     <EditorDashboard />
 *   </PermissionSwitch.Case>
 *   <PermissionSwitch.Case permission="posts.view">
 *     <ViewerDashboard />
 *   </PermissionSwitch.Case>
 *   <PermissionSwitch.Default>
 *     <GuestView />
 *   </PermissionSwitch.Default>
 * </PermissionSwitch>
 * ```
 */
export function PermissionSwitch({
  fallback = null,
  isLoading,
  loadingFallback,
  children,
}: PermissionSwitchProps): React.ReactNode {
  const checker = usePermissionContext();
  const parentLoadingFallback = useContext(PermissionLoadingFallbackContext);

  const effectiveLoading =
    isLoading !== undefined ? Boolean(isLoading) : checker.isLoading;
  const effectiveFallback =
    loadingFallback !== undefined ? loadingFallback : parentLoadingFallback;

  if (effectiveLoading) {
    return effectiveFallback ?? null;
  }

  const childArray = React.Children.toArray(children);
  let defaultChild: React.ReactElement<PermissionDefaultProps> | null = null;

  for (let i = 0; i < childArray.length; i++) {
    const child = childArray[i];
    if (!isValidElement(child)) continue;

    const childType = child.type as {
      displayName?: string;
      name?: string;
    };
    const displayName = childType.displayName || childType.name;

    // Check if this is the Default branch
    if (
      childType === PermissionDefault ||
      displayName === 'PermissionDefault' ||
      displayName === 'Can.Default'
    ) {
      if (!defaultChild) {
        defaultChild = child as React.ReactElement<PermissionDefaultProps>;
      }
      continue;
    }

    // Check if this is a Case branch
    const isCase =
      childType === PermissionCase ||
      displayName === 'PermissionCase' ||
      displayName === 'Can.Case';

    if (isCase) {
      const caseProps = child.props as PermissionCaseProps;
      if (evaluateCondition(caseProps, checker)) {
        return (caseProps.children as React.ReactNode) ?? null;
      }
    }
  }

  // If no case matched, render default child if present
  if (defaultChild) {
    return defaultChild.props.children ?? null;
  }

  return fallback ?? null;
}

PermissionSwitch.displayName = 'PermissionSwitch';
PermissionSwitch.Case = PermissionCase;
PermissionSwitch.Default = PermissionDefault;
