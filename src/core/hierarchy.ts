import type { RoleHierarchy } from './types';

export interface ResolvedRoleHierarchy<TRole extends string = string> {
  readonly effectiveRolesList: readonly TRole[];
  readonly effectiveRolesSet: ReadonlySet<TRole>;
  readonly inheritanceMap: ReadonlyMap<TRole, TRole[]>; // childRole -> parentRoles that granted it
}

/**
 * Resolves all direct and transitively inherited roles based on a role hierarchy map.
 * Safely detects and breaks cycles (e.g. A -> B -> A) to prevent infinite loops.
 * Protects against prototype pollution and invalid inputs.
 *
 * @param directRoles Initial direct roles assigned to the user
 * @param hierarchy Optional role hierarchy mapping (e.g. { superadmin: ['admin'], admin: ['user'] })
 * @returns Resolved list and set of all effective roles, plus an inheritance trace map
 */
export function resolveRoleHierarchy<TRole extends string = string>(
  directRoles: readonly TRole[],
  hierarchy?: RoleHierarchy<TRole> | null,
): ResolvedRoleHierarchy<TRole> {
  const effectiveRolesSet = new Set<TRole>();
  const inheritanceMap = new Map<TRole, TRole[]>();

  if (!directRoles || !Array.isArray(directRoles) || directRoles.length === 0) {
    return {
      effectiveRolesList: [],
      effectiveRolesSet,
      inheritanceMap,
    };
  }

  // Queue of roles to process: [currentRole, parentRole | null]
  const queue: Array<{ role: TRole; inheritedFrom: TRole | null }> = [];

  for (let i = 0; i < directRoles.length; i++) {
    const role = directRoles[i];
    if (role && typeof role === 'string') {
      const trimmed = role.trim() as TRole;
      if (trimmed.length > 0) {
        queue.push({ role: trimmed, inheritedFrom: null });
      }
    }
  }

  while (queue.length > 0) {
    const item = queue.shift()!;
    const { role, inheritedFrom } = item;

    if (inheritedFrom) {
      const parents = inheritanceMap.get(role) ?? [];
      if (!parents.includes(inheritedFrom)) {
        parents.push(inheritedFrom);
        inheritanceMap.set(role, parents);
      }
    }

    if (effectiveRolesSet.has(role)) {
      continue;
    }

    effectiveRolesSet.add(role);

    // Defensively check hierarchy object and avoid Object.prototype pollution
    if (
      hierarchy &&
      typeof hierarchy === 'object' &&
      Object.prototype.hasOwnProperty.call(hierarchy, role)
    ) {
      const subRoles = hierarchy[role];
      if (Array.isArray(subRoles)) {
        for (let j = 0; j < subRoles.length; j++) {
          const sub = subRoles[j];
          if (sub && typeof sub === 'string') {
            const trimmedSub = sub.trim() as TRole;
            if (trimmedSub.length > 0 && !effectiveRolesSet.has(trimmedSub)) {
              queue.push({ role: trimmedSub, inheritedFrom: role });
            }
          }
        }
      }
    }
  }

  const effectiveRolesList = Object.freeze(Array.from(effectiveRolesSet));

  return {
    effectiveRolesList,
    effectiveRolesSet,
    inheritanceMap,
  };
}
