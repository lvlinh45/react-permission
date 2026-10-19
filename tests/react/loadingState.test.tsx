import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Can } from '../../src/components/Can';
import { PermissionProvider } from '../../src/context/PermissionProvider';
import { usePermission } from '../../src/hooks/usePermission';

function TestStatusComponent() {
  const { isLoading, can } = usePermission();
  return (
    <div>
      <span data-testid="status">{isLoading ? 'Loading...' : 'Ready'}</span>
      <span data-testid="can-edit">{can('posts.edit') ? 'Yes' : 'No'}</span>
    </div>
  );
}

describe('Asynchronous Loading State Support', () => {
  it('renders provider loadingFallback inside <Can /> when isLoading is true', () => {
    render(
      <PermissionProvider
        permissions={[]}
        isLoading={true}
        loadingFallback={<p>Global Loading Skeleton...</p>}
      >
        <Can permission="posts.edit" fallback={<p>Access Denied</p>}>
          <p>Protected Content</p>
        </Can>
      </PermissionProvider>,
    );

    expect(screen.getByText('Global Loading Skeleton...')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('allows <Can /> to override loadingFallback at the component level', () => {
    render(
      <PermissionProvider permissions={[]} isLoading={true}>
        <Can
          permission="posts.edit"
          loadingFallback={<p>Component Custom Spinner...</p>}
          fallback={<p>Access Denied</p>}
        >
          <p>Protected Content</p>
        </Can>
      </PermissionProvider>,
    );

    expect(screen.getByText('Component Custom Spinner...')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('exposes isLoading in usePermission hook', () => {
    render(
      <PermissionProvider permissions={['posts.edit']} isLoading={true}>
        <TestStatusComponent />
      </PermissionProvider>,
    );

    expect(screen.getByTestId('status')).toHaveTextContent('Loading...');
    expect(screen.getByTestId('can-edit')).toHaveTextContent('Yes');
  });

  it('passes isLoading into <Can> render-props function', () => {
    render(
      <PermissionProvider permissions={['posts.view']} isLoading={true}>
        <Can permission="posts.view">
          {({ allowed, isLoading }) => (
            <div>
              <p>Allowed: {allowed ? 'true' : 'false'}</p>
              <p>Loading: {isLoading ? 'true' : 'false'}</p>
            </div>
          )}
        </Can>
      </PermissionProvider>,
    );

    expect(screen.getByText('Allowed: true')).toBeInTheDocument();
    expect(screen.getByText('Loading: true')).toBeInTheDocument();
  });
});
