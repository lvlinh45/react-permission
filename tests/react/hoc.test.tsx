import { render, screen } from '@testing-library/react';
import type { FC } from 'react';
import { describe, expect, it } from 'vitest';
import {
  PermissionProvider,
  withPermission,
  withRole,
} from '../../src';

interface ButtonProps {
  title: string;
}

const SimpleButton: FC<ButtonProps> = ({ title }) => (
  <button>{title}</button>
);

const ProtectedEditButton = withPermission(SimpleButton, 'posts.edit', {
  fallback: <span>No Edit Permission</span>,
});

const ProtectedAdminButton = withRole(SimpleButton, 'admin', {
  fallback: <span>Admin Only</span>,
});

describe('Higher-Order Components (withPermission, withRole)', () => {
  it('renders wrapped component when permission is present', () => {
    render(
      <PermissionProvider permissions={['posts.edit']}>
        <ProtectedEditButton title="Edit Post" />
      </PermissionProvider>,
    );

    expect(screen.getByText('Edit Post')).toBeInTheDocument();
  });

  it('renders fallback when permission is missing', () => {
    render(
      <PermissionProvider permissions={['posts.view']}>
        <ProtectedEditButton title="Edit Post" />
      </PermissionProvider>,
    );

    expect(screen.queryByText('Edit Post')).not.toBeInTheDocument();
    expect(screen.getByText('No Edit Permission')).toBeInTheDocument();
  });

  it('renders wrapped component when role matches', () => {
    render(
      <PermissionProvider roles={['admin']}>
        <ProtectedAdminButton title="Manage Server" />
      </PermissionProvider>,
    );

    expect(screen.getByText('Manage Server')).toBeInTheDocument();
  });

  it('renders fallback when role does not match', () => {
    render(
      <PermissionProvider roles={['viewer']}>
        <ProtectedAdminButton title="Manage Server" />
      </PermissionProvider>,
    );

    expect(screen.queryByText('Manage Server')).not.toBeInTheDocument();
    expect(screen.getByText('Admin Only')).toBeInTheDocument();
  });
});
