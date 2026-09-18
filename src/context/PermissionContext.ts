import { createContext } from 'react';
import type { PermissionChecker } from '../core/types';

/**
 * Internal React context for holding the PermissionChecker instance.
 * Defaults to null so hooks can detect usage outside PermissionProvider and throw a helpful error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PermissionContext = createContext<PermissionChecker<any, any> | null>(
  null,
);

PermissionContext.displayName = 'PermissionContext';
