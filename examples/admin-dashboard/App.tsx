import { useState } from 'react';
import {
  Can,
  createPermissionChecker,
  PermissionProvider,
  usePermission,
} from '../../src';
import {
  type AppPermission,
  type AppRole,
  PRESET_USERS,
  type UserProfile,
} from './types';

function UserManagementSection() {
  const { can, cannot, hasRole } = usePermission<AppPermission, AppRole>();

  const handleExport = () => {
    // Programmatic check before executing action
    if (cannot('reports.export')) {
      alert('Action Denied: You do not have permission to export reports.');
      return;
    }
    alert('Exporting user reports...');
  };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h3>User Management</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {/* 1. Declarative check with fallback */}
        <Can
          permission="user.create"
          fallback={
            <button disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              Create User (Locked)
            </button>
          }
        >
          <button
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4 }}
            onClick={() => alert('Opening Create User Dialog')}
          >
            + Create User
          </button>
        </Can>

        {/* 2. Multiple permissions with mode="any" */}
        <Can permissions={['user.update', 'user.delete']} mode="any">
          <button
            style={{ background: '#64748b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4 }}
            onClick={() => alert('Batch editing users')}
          >
            Batch Actions
          </button>
        </Can>

        {/* 3. Programmatic check via button handler */}
        <button
          style={{
            background: can('reports.export') ? '#10b981' : '#cbd5e1',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: 4,
          }}
          onClick={handleExport}
        >
          Export CSV {cannot('reports.export') ? '(Restricted)' : ''}
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
        <thead>
          <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>User</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: 8 }}>John Doe (john@example.com)</td>
            <td style={{ padding: 8 }}>Active</td>
            <td style={{ padding: 8, display: 'flex', gap: 6 }}>
              {/* 4. Render prop pattern */}
              <Can permission="user.update">
                {({ allowed }) => (
                  <button disabled={!allowed} title={allowed ? 'Edit user' : 'No edit permission'}>
                    Edit
                  </button>
                )}
              </Can>

              {/* 5. Role AND permission combined */}
              <Can role="admin" permissions={['user.delete']}>
                <button style={{ color: '#ef4444' }} onClick={() => alert('User deleted')}>
                  Delete
                </button>
              </Can>
            </td>
          </tr>
        </tbody>
      </table>

      {hasRole('admin') && (
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
          ⚡ Administrator privileges active.
        </p>
      )}
    </div>
  );
}

function SettingsSection() {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h3>System Settings</h3>

      {/* 6. Custom predicate function check */}
      <Can
        check={({ hasRole, hasPermission }) =>
          hasRole('admin') && hasPermission('settings.update')
        }
        fallback={
          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
            Only administrators with update permissions can modify settings.
          </p>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); alert('Settings saved'); }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Application Name: <input type="text" defaultValue="Production App" />
          </label>
          <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4 }}>
            Save Configuration
          </button>
        </form>
      </Can>
    </div>
  );
}

export function AdminDashboardApp() {
  const [activeRole, setActiveRole] = useState<AppRole>('admin');
  const currentUser: UserProfile = PRESET_USERS[activeRole];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <header style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 16, marginBottom: 24 }}>
        <h1>react-permission Showcase</h1>
        <p style={{ color: '#64748b' }}>
          Switch persona below to preview dynamic RBAC/ABAC authorization in action:
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {(['admin', 'manager', 'viewer'] as AppRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                fontWeight: activeRole === r ? 'bold' : 'normal',
                background: activeRole === r ? '#0f172a' : '#f1f5f9',
                color: activeRole === r ? '#fff' : '#0f172a',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
              }}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 6 }}>
          <strong>Current User:</strong> {currentUser.name} | <strong>Role:</strong> {currentUser.role}
          <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
            <strong>Granted Permissions:</strong> {currentUser.permissions.join(', ')}
          </div>
        </div>
      </header>

      {/* Wrapping the application tree in PermissionProvider */}
      <PermissionProvider<AppPermission, AppRole>
        permissions={currentUser.permissions}
        roles={[currentUser.role]}
      >
        <Can
          permission="dashboard.view"
          fallback={<p style={{ color: '#ef4444' }}>Unauthorized: You do not have access to the dashboard.</p>}
        >
          <UserManagementSection />
          <SettingsSection />
        </Can>
      </PermissionProvider>
    </div>
  );
}

// Standalone verification example outside React
export function runStandaloneVerification() {
  const checker = createPermissionChecker<AppPermission, AppRole>({
    permissions: PRESET_USERS.manager.permissions,
    roles: [PRESET_USERS.manager.role],
  });

  return {
    canCreateUser: checker.can('user.create'),
    canDeleteUser: checker.can('user.delete'),
    isManager: checker.hasRole('manager'),
    isAdmin: checker.hasRole('admin'),
  };
}
