/**
 * Evaluates whether a target permission string matches a pattern (which may contain wildcards).
 *
 * Supports:
 * - `*` (matches everything)
 * - `users.*` / `users:*` (matches `users.view`, `users.edit`, `users.settings.update`)
 * - `users.*.delete` (matches `users.123.delete`)
 * - Exact string matching
 *
 * @param pattern The pattern containing optional `*` wildcards
 * @param permission The target permission string to test
 * @returns boolean indicating if the permission matches the pattern
 */
export function matchesWildcard(pattern: string, permission: string): boolean {
  if (typeof pattern !== 'string' || typeof permission !== 'string') {
    return false;
  }

  const p = pattern.trim();
  const target = permission.trim();

  if (p.length === 0 || target.length === 0) {
    return false;
  }

  if (p === '*' || p === target) {
    return true;
  }

  if (!p.includes('*')) {
    return p === target;
  }

  // Convert pattern to regex
  // Escape regex characters except '*'
  const escaped = p
    .split('*')
    .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');

  const regex = new RegExp(`^${escaped}$`);
  return regex.test(target);
}
