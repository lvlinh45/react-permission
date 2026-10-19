import { describe, expect, it } from 'vitest';
import { createPermissionChecker } from '../../src/core/checker';

describe('Diagnostic explain() Engine', () => {
  it('explains direct permissions correctly', () => {
    const checker = createPermissionChecker({
      permissions: ['posts.view'],
    });

    const exp = checker.explain('posts.view');
    expect(exp.allowed).toBe(true);
    expect(exp.matchedType).toBe('direct');
    expect(exp.reason).toContain('Granted by direct permission "posts.view"');
  });

  it('explains wildcard pattern matching correctly', () => {
    const checker = createPermissionChecker({
      permissions: ['posts.*'],
    });

    const exp = checker.explain('posts.delete');
    expect(exp.allowed).toBe(true);
    expect(exp.matchedType).toBe('wildcard');
    expect(exp.matchedPattern).toBe('posts.*');
    expect(exp.reason).toContain('Granted by wildcard pattern "posts.*"');
  });

  it('explains role permissions and inherited role hierarchy', () => {
    const checker = createPermissionChecker({
      roles: ['superadmin'],
      roleHierarchy: {
        superadmin: ['admin'],
      },
      rolePermissions: {
        admin: ['users.delete'],
      },
    });

    const exp = checker.explain('users.delete');
    expect(exp.allowed).toBe(true);
    expect(exp.matchedType).toBe('role_permission');
    expect(exp.role).toBe('admin');
    expect(exp.inheritedViaRole).toBe('superadmin');
    expect(exp.reason).toContain('Granted by role "admin" (inherited via role "superadmin")');
  });

  it('explains ABAC resource policies (allowed & denied)', () => {
    const checker = createPermissionChecker({
      policies: {
        'orders.cancel': (resource: unknown) => {
          const order = resource as { status: string };
          return order.status === 'pending';
        },
      },
    });

    const pendingOrder = { status: 'pending' };
    const shippedOrder = { status: 'shipped' };

    const expAllowed = checker.explain('orders.cancel', pendingOrder);
    expect(expAllowed.allowed).toBe(true);
    expect(expAllowed.matchedType).toBe('policy');
    expect(expAllowed.reason).toContain('Granted by resource policy for "orders.cancel"');

    const expDenied = checker.explain('orders.cancel', shippedOrder);
    expect(expDenied.allowed).toBe(false);
    expect(expDenied.matchedType).toBe('policy');
    expect(expDenied.reason).toContain('Denied by resource policy for "orders.cancel"');
  });

  it('explains permission denied when not granted', () => {
    const checker = createPermissionChecker({
      permissions: ['posts.view'],
    });

    const exp = checker.explain('billing.refund');
    expect(exp.allowed).toBe(false);
    expect(exp.matchedType).toBe('none');
    expect(exp.reason).toContain('Permission "billing.refund" is not granted to user');
  });

  it('handles invalid or empty inputs gracefully', () => {
    const checker = createPermissionChecker();
    // @ts-expect-error Testing runtime invalid input
    expect(checker.explain(null).allowed).toBe(false);
    expect(checker.explain('   ').allowed).toBe(false);
  });
});
