import { describe, expect, it } from 'vitest';
import { createPermissionChecker } from '../../src/core/checker';
import { resolveRoleHierarchy } from '../../src/core/hierarchy';

describe('Role Hierarchy & Transitive RBAC', () => {
  it('resolves direct roles without hierarchy', () => {
    const { effectiveRolesList, effectiveRolesSet } = resolveRoleHierarchy(['admin', 'editor']);
    expect(effectiveRolesList).toEqual(['admin', 'editor']);
    expect(effectiveRolesSet.has('admin')).toBe(true);
    expect(effectiveRolesSet.has('editor')).toBe(true);
  });

  it('resolves multi-level transitive role inheritance', () => {
    const hierarchy = {
      superadmin: ['admin'],
      admin: ['manager', 'editor'],
      manager: ['user'],
      editor: ['user'],
    };

    const { effectiveRolesList, effectiveRolesSet, inheritanceMap } = resolveRoleHierarchy<string>(
      ['superadmin'],
      hierarchy,
    );

    expect(effectiveRolesSet.has('superadmin')).toBe(true);
    expect(effectiveRolesSet.has('admin')).toBe(true);
    expect(effectiveRolesSet.has('manager')).toBe(true);
    expect(effectiveRolesSet.has('editor')).toBe(true);
    expect(effectiveRolesSet.has('user')).toBe(true);
    expect(effectiveRolesList.length).toBe(5);

    // Verify inheritance mapping
    expect(inheritanceMap.get('admin')).toEqual(['superadmin']);
    expect(inheritanceMap.get('manager')).toEqual(['admin']);
  });

  it('safely handles circular / cyclic role dependencies without infinite loops', () => {
    const cyclicHierarchy = {
      admin: ['manager'],
      manager: ['supervisor'],
      supervisor: ['admin'], // Cycle
    };

    const { effectiveRolesList, effectiveRolesSet } = resolveRoleHierarchy<string>(
      ['admin'],
      cyclicHierarchy,
    );

    expect(effectiveRolesList.length).toBe(3);
    expect(effectiveRolesSet.has('admin')).toBe(true);
    expect(effectiveRolesSet.has('manager')).toBe(true);
    expect(effectiveRolesSet.has('supervisor')).toBe(true);
  });

  it('integrates hierarchy with createPermissionChecker and rolePermissions', () => {
    const checker = createPermissionChecker({
      roles: ['superadmin'],
      roleHierarchy: {
        superadmin: ['admin'],
        admin: ['editor'],
        editor: ['viewer'],
      },
      rolePermissions: {
        viewer: ['posts.read'],
        editor: ['posts.create', 'posts.edit'],
        admin: ['posts.delete', 'users.*'],
        superadmin: ['system.config'],
      },
    });

    // Check effective roles
    expect(checker.roles).toEqual(['superadmin']);
    expect(checker.effectiveRoles).toContain('superadmin');
    expect(checker.effectiveRoles).toContain('admin');
    expect(checker.effectiveRoles).toContain('editor');
    expect(checker.effectiveRoles).toContain('viewer');

    expect(checker.hasRole('superadmin')).toBe(true);
    expect(checker.hasRole('admin')).toBe(true);
    expect(checker.hasRole('editor')).toBe(true);
    expect(checker.hasRole('viewer')).toBe(true);
    expect(checker.hasRole('billing_manager')).toBe(false);

    // Check inherited permissions
    expect(checker.can('system.config')).toBe(true);
    expect(checker.can('posts.delete')).toBe(true);
    expect(checker.can('posts.edit')).toBe(true);
    expect(checker.can('posts.create')).toBe(true);
    expect(checker.can('posts.read')).toBe(true);
    expect(checker.can('users.manage')).toBe(true); // wildcard from admin
    expect(checker.can('billing.charge')).toBe(false);
  });
});
