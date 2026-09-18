export type AppPermission =
  | 'dashboard.view'
  | 'user.view'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'settings.view'
  | 'settings.update'
  | 'reports.export'
  | 'audit.view';

export type AppRole = 'admin' | 'manager' | 'viewer';

export interface UserProfile {
  name: string;
  role: AppRole;
  permissions: AppPermission[];
}

export const PRESET_USERS: Record<AppRole, UserProfile> = {
  admin: {
    name: 'Alice (Administrator)',
    role: 'admin',
    permissions: [
      'dashboard.view',
      'user.view',
      'user.create',
      'user.update',
      'user.delete',
      'settings.view',
      'settings.update',
      'reports.export',
      'audit.view',
    ],
  },
  manager: {
    name: 'Bob (Team Manager)',
    role: 'manager',
    permissions: [
      'dashboard.view',
      'user.view',
      'user.create',
      'user.update',
      'reports.export',
    ],
  },
  viewer: {
    name: 'Charlie (Read-only Viewer)',
    role: 'viewer',
    permissions: ['dashboard.view', 'user.view'],
  },
};
