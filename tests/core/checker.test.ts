import { describe, expect, it } from 'vitest';
import { createPermissionChecker } from '../../src/core/checker';

describe('createPermissionChecker', () => {
  it('initializes with default empty permissions and roles when options are omitted', () => {
    const checker = createPermissionChecker();
    expect(checker.permissions).toEqual([]);
    expect(checker.roles).toEqual([]);
    expect(checker.can('user.view')).toBe(false);
    expect(checker.cannot('user.view')).toBe(true);
    expect(checker.hasRole('admin')).toBe(false);
  });

  describe('can and cannot', () => {
    const checker = createPermissionChecker({
      permissions: ['user.view', 'user.create'],
    });

    it('returns true for granted permissions and false for cannot', () => {
      expect(checker.can('user.view')).toBe(true);
      expect(checker.can('user.create')).toBe(true);
      expect(checker.cannot('user.view')).toBe(false);
      expect(checker.cannot('user.create')).toBe(false);
    });

    it('returns false for non-granted permissions and true for cannot', () => {
      expect(checker.can('user.delete')).toBe(false);
      expect(checker.cannot('user.delete')).toBe(true);
    });

    it('handles trimmed inputs and rejects non-strings or empty strings safely', () => {
      expect(checker.can('  user.view  ')).toBe(true);
      expect(checker.can('')).toBe(false);
      expect(checker.cannot('')).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(checker.can(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(checker.can(undefined as any)).toBe(false);
    });
  });

  describe('role checks (hasRole, hasAnyRole, hasAllRoles)', () => {
    const checker = createPermissionChecker({
      roles: ['admin', 'manager'],
    });

    it('checks single role', () => {
      expect(checker.hasRole('admin')).toBe(true);
      expect(checker.hasRole('manager')).toBe(true);
      expect(checker.hasRole('guest')).toBe(false);
    });

    it('evaluates hasAnyRole', () => {
      expect(checker.hasAnyRole(['admin', 'viewer'])).toBe(true);
      expect(checker.hasAnyRole(['viewer', 'guest'])).toBe(false);
      expect(checker.hasAnyRole([])).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(checker.hasAnyRole(undefined as any)).toBe(false);
    });

    it('evaluates hasAllRoles', () => {
      expect(checker.hasAllRoles(['admin', 'manager'])).toBe(true);
      expect(checker.hasAllRoles(['admin', 'guest'])).toBe(false);
      expect(checker.hasAllRoles([])).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(checker.hasAllRoles(null as any)).toBe(false);
    });
  });

  describe('multi-permission checks (hasAnyPermission, hasAllPermissions)', () => {
    const checker = createPermissionChecker({
      permissions: ['report.view', 'report.export'],
    });

    it('evaluates hasAnyPermission', () => {
      expect(checker.hasAnyPermission(['report.view', 'report.delete'])).toBe(
        true,
      );
      expect(
        checker.hasAnyPermission(['report.delete', 'billing.manage']),
      ).toBe(false);
      expect(checker.hasAnyPermission([])).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(checker.hasAnyPermission(undefined as any)).toBe(false);
    });

    it('evaluates hasAllPermissions', () => {
      expect(checker.hasAllPermissions(['report.view', 'report.export'])).toBe(
        true,
      );
      expect(checker.hasAllPermissions(['report.view', 'report.delete'])).toBe(
        false,
      );
      expect(checker.hasAllPermissions([])).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(checker.hasAllPermissions(null as any)).toBe(false);
    });
  });

  describe('custom predicate checking (check)', () => {
    const checker = createPermissionChecker({
      permissions: ['post.edit'],
      roles: ['author'],
    });

    it('executes custom predicate with context', () => {
      const allowed = checker.check(({ hasPermission, hasRole }) => {
        return hasRole('author') && hasPermission('post.edit');
      });
      expect(allowed).toBe(true);

      const denied = checker.check(({ hasPermission, hasRole }) => {
        return hasRole('admin') && hasPermission('post.edit');
      });
      expect(denied).toBe(false);
    });

    it('exposes permissions and roles arrays in context', () => {
      const result = checker.check(({ permissions, roles }) => {
        return permissions.includes('post.edit') && roles.includes('author');
      });
      expect(result).toBe(true);
    });

    it('safely catches errors in predicate functions and returns false', () => {
      const result = checker.check(() => {
        throw new Error('Unexpected runtime exception in check');
      });
      expect(result).toBe(false);
    });

    it('returns false if non-function is passed', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(checker.check(undefined as any)).toBe(false);
    });
  });
});
