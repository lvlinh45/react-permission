import { useContext } from 'react';
import { PermissionContext } from '../context/PermissionContext';
import type { PermissionChecker } from '../core/types';

/**
 * Accesses the internal PermissionChecker instance from React Context.
 * Throws a descriptive error if called outside a <PermissionProvider>.
 *
 * @template TPermission Permission string literal type
 * @template TRole Role string literal type
 * @returns The active PermissionChecker instance
 */
export function usePermissionContext<
  TPermission extends string = string,
  TRole extends string = string,
>(): PermissionChecker<TPermission, TRole> {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error(
      '[react-permission-control] usePermission must be used within a <PermissionProvider>. ' +
        'Please ensure your component tree is wrapped in <PermissionProvider>.',
    );
  }

  return context as PermissionChecker<TPermission, TRole>;
}
