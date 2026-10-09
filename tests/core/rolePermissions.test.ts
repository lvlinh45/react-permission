import { describe, expect, it } from 'vitest';
import { createPermissionChecker } from '../../src';

describe('RolePermissions Matrix Inheritance', () => {
  it('inherits permissions from assigned roles', () => {
    const checker = createPermissionChecker({
      roles: ['editor'],
      rolePermissions: {
        admin: ['*'],
        editor: ['posts.*', 'comments.create'],
        viewer: ['posts.read'],
      },
    });

    expect(checker.hasRole('editor')).toBe(true);
    expect(checker.hasRole('admin')).toBe(false);

    // Inherited from 'editor'
    expect(checker.can('posts.create')).toBe(true);
    expect(checker.can('posts.edit')).toBe(true);
    expect(checker.can('comments.create')).toBe(true);

    // Not assigned to editor
    expect(checker.can('billing.manage')).toBe(false);
  });

  it('combines direct permissions with inherited role permissions', () => {
    const checker = createPermissionChecker({
      permissions: ['billing.view'],
      roles: ['viewer'],
      rolePermissions: {
        viewer: ['posts.read'],
      },
    });

    expect(checker.can('billing.view')).toBe(true);
    expect(checker.can('posts.read')).toBe(true);
    expect(checker.can('posts.write')).toBe(false);
  });

  it('handles admin role with wildcard * mapping', () => {
    const checker = createPermissionChecker({
      roles: ['admin'],
      rolePermissions: {
        admin: ['*'],
      },
    });

    expect(checker.can('system.shutdown')).toBe(true);
    expect(checker.can('user.delete')).toBe(true);
  });
});
