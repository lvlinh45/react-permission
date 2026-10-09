import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Can, Cannot, PermissionProvider } from '../../src';

describe('Cannot Component and Can "not" Prop', () => {
  it('renders Cannot children when user lacks the permission', () => {
    render(
      <PermissionProvider permissions={['posts.read']}>
        <Cannot permission="posts.delete">
          <div>Deletion Not Allowed</div>
        </Cannot>
      </PermissionProvider>,
    );

    expect(screen.getByText('Deletion Not Allowed')).toBeInTheDocument();
  });

  it('renders fallback when user HAS the permission in Cannot', () => {
    render(
      <PermissionProvider permissions={['posts.delete']}>
        <Cannot
          permission="posts.delete"
          fallback={<div>Has Delete Access</div>}
        >
          <div>Deletion Not Allowed</div>
        </Cannot>
      </PermissionProvider>,
    );

    expect(screen.queryByText('Deletion Not Allowed')).not.toBeInTheDocument();
    expect(screen.getByText('Has Delete Access')).toBeInTheDocument();
  });

  it('supports <Can not={true} /> inversion', () => {
    render(
      <PermissionProvider permissions={['posts.read']}>
        <Can not permission="posts.delete">
          <div>Cannot Delete Notice</div>
        </Can>
      </PermissionProvider>,
    );

    expect(screen.getByText('Cannot Delete Notice')).toBeInTheDocument();
  });

  it('works with roles in Cannot', () => {
    render(
      <PermissionProvider roles={['viewer']}>
        <Cannot role="admin">
          <div>Viewer Only Mode</div>
        </Cannot>
      </PermissionProvider>,
    );

    expect(screen.getByText('Viewer Only Mode')).toBeInTheDocument();
  });
});
