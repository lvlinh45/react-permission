import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Can } from '../../src/components/Can';
import {
  PermissionCase,
  PermissionDefault,
  PermissionSwitch,
} from '../../src/components/PermissionSwitch';
import { PermissionProvider } from '../../src/context/PermissionProvider';

describe('<PermissionSwitch /> and <Can.Switch />', () => {
  it('renders the first matching case sequentially', () => {
    render(
      <PermissionProvider roles={['editor']} permissions={['posts.create', 'posts.edit']}>
        <PermissionSwitch fallback={<p>Fallback Content</p>}>
          <PermissionCase role="superadmin">
            <p>SuperAdmin View</p>
          </PermissionCase>
          <PermissionCase role="editor" permission="posts.edit">
            <p>Editor View</p>
          </PermissionCase>
          <PermissionCase permission="posts.create">
            <p>Author View</p>
          </PermissionCase>
          <PermissionDefault>
            <p>Default View</p>
          </PermissionDefault>
        </PermissionSwitch>
      </PermissionProvider>,
    );

    expect(screen.getByText('Editor View')).toBeInTheDocument();
    expect(screen.queryByText('SuperAdmin View')).not.toBeInTheDocument();
    expect(screen.queryByText('Author View')).not.toBeInTheDocument();
    expect(screen.queryByText('Default View')).not.toBeInTheDocument();
  });

  it('works seamlessly with <Can.Switch>, <Can.Case>, and <Can.Default> syntax', () => {
    render(
      <PermissionProvider roles={['viewer']}>
        <Can.Switch fallback={<p>No Access</p>}>
          <Can.Case role="admin">
            <p>Admin Section</p>
          </Can.Case>
          <Can.Case role="viewer">
            <p>Viewer Section</p>
          </Can.Case>
          <Can.Default>
            <p>Public Section</p>
          </Can.Default>
        </Can.Switch>
      </PermissionProvider>,
    );

    expect(screen.getByText('Viewer Section')).toBeInTheDocument();
    expect(screen.queryByText('Admin Section')).not.toBeInTheDocument();
    expect(screen.queryByText('Public Section')).not.toBeInTheDocument();
  });

  it('renders <Can.Default> when no Case matches', () => {
    render(
      <PermissionProvider roles={['guest']}>
        <Can.Switch fallback={<p>Fallback Content</p>}>
          <Can.Case role="admin">
            <p>Admin Only</p>
          </Can.Case>
          <Can.Case role="editor">
            <p>Editor Only</p>
          </Can.Case>
          <Can.Default>
            <p>Default Guest UI</p>
          </Can.Default>
        </Can.Switch>
      </PermissionProvider>,
    );

    expect(screen.getByText('Default Guest UI')).toBeInTheDocument();
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
    expect(screen.queryByText('Fallback Content')).not.toBeInTheDocument();
  });

  it('renders fallback when no Case matches and no Default is present', () => {
    render(
      <PermissionProvider roles={['guest']}>
        <Can.Switch fallback={<p>Access Denied</p>}>
          <Can.Case role="admin">
            <p>Admin Only</p>
          </Can.Case>
        </Can.Switch>
      </PermissionProvider>,
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
  });

  it('renders loading fallback when switch is in loading state', () => {
    render(
      <PermissionProvider roles={['admin']} isLoading={true}>
        <Can.Switch
          loadingFallback={<p>Loading Switch...</p>}
          fallback={<p>Access Denied</p>}
        >
          <Can.Case role="admin">
            <p>Admin Only</p>
          </Can.Case>
        </Can.Switch>
      </PermissionProvider>,
    );

    expect(screen.getByText('Loading Switch...')).toBeInTheDocument();
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
  });

  it('ignores non-case child elements and still renders the matching Case or Default', () => {
    render(
      <PermissionProvider roles={['viewer']}>
        <Can.Switch fallback={<p>Fallback Content</p>}>
          <div data-testid="divider">Some Divider</div>
          <Can.Case role="admin">
            <p>Admin Only</p>
          </Can.Case>
          <Can.Case role="viewer">
            <p>Viewer Content</p>
          </Can.Case>
          <Can.Default>
            <p>Default Content</p>
          </Can.Default>
        </Can.Switch>
      </PermissionProvider>,
    );

    expect(screen.getByText('Viewer Content')).toBeInTheDocument();
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
  });
});
