import { describe, expect, it } from 'vitest';
import { createPermissionChecker, matchesWildcard } from '../../src';

describe('Wildcard Engine', () => {
  describe('matchesWildcard()', () => {
    it('matches exact strings', () => {
      expect(matchesWildcard('posts.read', 'posts.read')).toBe(true);
      expect(matchesWildcard('posts.read', 'posts.write')).toBe(false);
    });

    it('matches asterisk super-wildcard', () => {
      expect(matchesWildcard('*', 'anything')).toBe(true);
      expect(matchesWildcard('*', 'users.create.admin')).toBe(true);
    });

    it('matches prefix wildcards with dots or colons', () => {
      expect(matchesWildcard('posts.*', 'posts.read')).toBe(true);
      expect(matchesWildcard('posts.*', 'posts.create.custom')).toBe(true);
      expect(matchesWildcard('posts.*', 'users.read')).toBe(false);

      expect(matchesWildcard('users:*', 'users:view')).toBe(true);
      expect(matchesWildcard('users:*', 'users:profile:edit')).toBe(true);
    });

    it('matches middle wildcards', () => {
      expect(matchesWildcard('users:*:view', 'users:admin:view')).toBe(true);
      expect(matchesWildcard('users:*:view', 'users:guest:edit')).toBe(false);
    });

    it('handles empty or non-string inputs safely', () => {
      expect(matchesWildcard('', 'test')).toBe(false);
      expect(matchesWildcard('test', '')).toBe(false);
      expect(matchesWildcard(null as unknown as string, 'test')).toBe(false);
    });
  });

  describe('createPermissionChecker with wildcards', () => {
    it('evaluates wildcard permissions correctly', () => {
      const checker = createPermissionChecker({
        permissions: ['posts.*', 'users:view:*'],
      });

      expect(checker.can('posts.create')).toBe(true);
      expect(checker.can('posts.edit')).toBe(true);
      expect(checker.can('users:view:details')).toBe(true);
      expect(checker.can('users:edit:details')).toBe(false);
      expect(checker.can('billing.manage')).toBe(false);
    });

    it('evaluates super wildcard *', () => {
      const checker = createPermissionChecker({
        permissions: ['*'],
      });

      expect(checker.can('any.permission')).toBe(true);
      expect(checker.can('admin.all')).toBe(true);
      expect(checker.cannot('admin.all')).toBe(false);
    });

    it('can disable wildcard matching when wildcard: false', () => {
      const checker = createPermissionChecker({
        permissions: ['posts.*'],
        wildcard: false,
      });

      // When wildcard is false, 'posts.*' only matches literal 'posts.*'
      expect(checker.can('posts.create')).toBe(false);
      expect(checker.can('posts.*')).toBe(true);
    });
  });
});
