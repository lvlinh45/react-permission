import { describe, expect, it } from 'vitest';
import { normalizeIdentifiers } from '../../src/core/normalize';

describe('normalizeIdentifiers', () => {
  it('returns empty frozen array and empty Set for undefined or null', () => {
    const [arr1, set1] = normalizeIdentifiers(undefined);
    expect(arr1).toEqual([]);
    expect(Object.isFrozen(arr1)).toBe(true);
    expect(set1.size).toBe(0);

    const [arr2, set2] = normalizeIdentifiers(null);
    expect(arr2).toEqual([]);
    expect(Object.isFrozen(arr2)).toBe(true);
    expect(set2.size).toBe(0);
  });

  it('returns empty frozen array for non-array input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [arr, set] = normalizeIdentifiers('not an array' as any);
    expect(arr).toEqual([]);
    expect(set.size).toBe(0);
  });

  it('deduplicates entries and preserves first-seen order', () => {
    const [arr, set] = normalizeIdentifiers([
      'user.create',
      'user.view',
      'user.create',
      'user.delete',
      'user.view',
    ]);
    expect(arr).toEqual(['user.create', 'user.view', 'user.delete']);
    expect(set.has('user.create')).toBe(true);
    expect(set.has('user.view')).toBe(true);
    expect(set.has('user.delete')).toBe(true);
    expect(set.size).toBe(3);
  });

  it('filters out null, undefined, empty strings, and whitespace-only strings', () => {
    const [arr, set] = normalizeIdentifiers([
      'valid.permission',
      '',
      '   ',
      null,
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      123 as any,
      '  spaced.permission  ',
    ]);
    expect(arr).toEqual(['valid.permission', 'spaced.permission']);
    expect(set.size).toBe(2);
    expect(set.has('spaced.permission')).toBe(true);
  });
});
