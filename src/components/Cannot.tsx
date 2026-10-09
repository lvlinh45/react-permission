import React from 'react';
import type { CanProps } from '../core/types';
import { Can } from './Can';

/**
 * Inverse declarative component for rendering children when permissions/roles are NOT granted.
 *
 * Useful for notices, prompts to upgrade account, or alternative fallback UI.
 *
 * @example
 * ```tsx
 * <Cannot permission="premium.feature" fallback={<PremiumDashboard />}>
 *   <UpgradeBanner />
 * </Cannot>
 * ```
 */
export function Cannot<
  TPermission extends string = string,
  TRole extends string = string,
>(props: CanProps<TPermission, TRole>): React.ReactNode {
  return <Can {...props} not={props.not === undefined ? true : !props.not} />;
}

Cannot.displayName = 'Cannot';
