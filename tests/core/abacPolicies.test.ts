import { describe, expect, it } from 'vitest';
import { createPermissionChecker } from '../../src/core/checker';

interface Post {
  id: string;
  authorId: string;
  status: 'draft' | 'published';
}

describe('ABAC / Resource-Based Policies', () => {
  it('evaluates resource-based policy against target resource instance', () => {
    const currentUserId = 'user-123';

    const checker = createPermissionChecker({
      roles: ['user'],
      policies: {
        'posts.edit': (resource: unknown, ctx) => {
          const post = resource as Post;
          // User can edit if they are the author or if they have admin role
          return post.authorId === currentUserId || ctx.hasRole('admin');
        },
      },
    });

    const ownPost: Post = { id: 'p1', authorId: 'user-123', status: 'draft' };
    const otherPost: Post = { id: 'p2', authorId: 'user-999', status: 'published' };

    expect(checker.can('posts.edit', ownPost)).toBe(true);
    expect(checker.cannot('posts.edit', ownPost)).toBe(false);

    expect(checker.can('posts.edit', otherPost)).toBe(false);
    expect(checker.cannot('posts.edit', otherPost)).toBe(true);
  });

  it('allows policies to match wildcard permission patterns', () => {
    const checker = createPermissionChecker({
      policies: {
        'documents.*': (resource: unknown) => {
          const doc = resource as { isPublic: boolean };
          return doc.isPublic === true;
        },
      },
    });

    const publicDoc = { isPublic: true };
    const privateDoc = { isPublic: false };

    expect(checker.can('documents.read', publicDoc)).toBe(true);
    expect(checker.can('documents.print', publicDoc)).toBe(true);
    expect(checker.can('documents.read', privateDoc)).toBe(false);
  });

  it('safely handles throwing exceptions inside policy functions', () => {
    const checker = createPermissionChecker({
      policies: {
        'posts.delete': () => {
          throw new Error('Database connection failed');
        },
      },
    });

    // Should catch the error and safely return false
    expect(checker.can('posts.delete', { id: '1' })).toBe(false);
  });

  it('falls back to standard permission check if no policy is registered for the resource', () => {
    const checker = createPermissionChecker({
      permissions: ['posts.view'],
    });

    // Resource provided, but no policy for 'posts.view' exists -> evaluates base permission
    expect(checker.can('posts.view', { id: '123' })).toBe(true);
    expect(checker.can('posts.delete', { id: '123' })).toBe(false);
  });
});
