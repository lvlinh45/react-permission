/**
 * Normalizes an array of permission or role identifiers defensively.
 *
 * Handles:
 * - null / undefined inputs
 * - Non-array inputs (returns empty array)
 * - Duplicate entries (deduplicates)
 * - Non-string elements (filtered out defensively)
 * - Empty string or whitespace-only elements (filtered out)
 *
 * @param items Raw collection of identifiers
 * @returns Tuple of [normalized unique array, Set for O(1) lookups]
 */
export function normalizeIdentifiers<T extends string>(
  items?: readonly (T | string | null | undefined)[] | null
): [readonly T[], ReadonlySet<T>] {
  if (!items || !Array.isArray(items)) {
    const emptyArray: readonly T[] = Object.freeze([]);
    const emptySet: ReadonlySet<T> = new Set<T>();
    return [emptyArray, emptySet];
  }

  const set = new Set<T>();
  const normalizedList: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.length > 0 && !set.has(trimmed as T)) {
        const value = trimmed as T;
        set.add(value);
        normalizedList.push(value);
      }
    }
  }

  return [Object.freeze(normalizedList), set];
}
