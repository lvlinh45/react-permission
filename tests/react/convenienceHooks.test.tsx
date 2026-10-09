import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  PermissionProvider,
  useCan,
  useCannot,
  useHasRole,
} from '../../src';

function TestConsumer() {
  const canEdit = useCan('posts.edit');
  const canDelete = useCan('posts.delete');
  const canAny = useCan(['posts.edit', 'billing.export'], 'any');
  const cannotDelete = useCannot('posts.delete');
  const isAdmin = useHasRole('admin');
  const isEditorOrAdmin = useHasRole(['admin', 'editor'], 'any');

  return (
    <div>
      <div data-testid="canEdit">{String(canEdit)}</div>
      <div data-testid="canDelete">{String(canDelete)}</div>
      <div data-testid="canAny">{String(canAny)}</div>
      <div data-testid="cannotDelete">{String(cannotDelete)}</div>
      <div data-testid="isAdmin">{String(isAdmin)}</div>
      <div data-testid="isEditorOrAdmin">{String(isEditorOrAdmin)}</div>
    </div>
  );
}

describe('Convenience Hooks (useCan, useCannot, useHasRole)', () => {
  it('evaluates permissions and roles correctly', () => {
    render(
      <PermissionProvider
        permissions={['posts.edit']}
        roles={['editor']}
      >
        <TestConsumer />
      </PermissionProvider>,
    );

    expect(screen.getByTestId('canEdit')).toHaveTextContent('true');
    expect(screen.getByTestId('canDelete')).toHaveTextContent('false');
    expect(screen.getByTestId('canAny')).toHaveTextContent('true');
    expect(screen.getByTestId('cannotDelete')).toHaveTextContent('true');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
    expect(screen.getByTestId('isEditorOrAdmin')).toHaveTextContent('true');
  });
});
