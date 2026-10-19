import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Can } from '../../src/components/Can';
import { PermissionProvider } from '../../src/context/PermissionProvider';

describe('Scoped & Nested <PermissionProvider inherit={true}>', () => {
  it('inherits parent permissions and roles when inherit={true}', () => {
    render(
      <PermissionProvider roles={['user']} permissions={['profile.view']}>
        {/* Child workspace-scoped provider */}
        <PermissionProvider inherit={true} roles={['workspace_admin']} permissions={['workspace.edit']}>
          <Can role="user">
            <p>Has Parent Role User</p>
          </Can>
          <Can permission="profile.view">
            <p>Has Parent Permission</p>
          </Can>
          <Can role="workspace_admin">
            <p>Has Scoped Role Workspace Admin</p>
          </Can>
          <Can permission="workspace.edit">
            <p>Has Scoped Permission</p>
          </Can>
        </PermissionProvider>
      </PermissionProvider>,
    );

    expect(screen.getByText('Has Parent Role User')).toBeInTheDocument();
    expect(screen.getByText('Has Parent Permission')).toBeInTheDocument();
    expect(screen.getByText('Has Scoped Role Workspace Admin')).toBeInTheDocument();
    expect(screen.getByText('Has Scoped Permission')).toBeInTheDocument();
  });

  it('acts independently and does not inherit parent permissions when inherit={false}', () => {
    render(
      <PermissionProvider roles={['superadmin']} permissions={['system.all']}>
        <PermissionProvider inherit={false} roles={['guest']} permissions={['guest.read']}>
          <Can role="superadmin" fallback={<p>No SuperAdmin</p>}>
            <p>Has SuperAdmin</p>
          </Can>
          <Can permission="guest.read">
            <p>Has Guest Read</p>
          </Can>
        </PermissionProvider>
      </PermissionProvider>,
    );

    expect(screen.getByText('No SuperAdmin')).toBeInTheDocument();
    expect(screen.getByText('Has Guest Read')).toBeInTheDocument();
    expect(screen.queryByText('Has SuperAdmin')).not.toBeInTheDocument();
  });
});
