# react-permission

> A lightweight, strongly-typed, framework-agnostic React authorization and access-control library.

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/react-permission)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

`react-permission` provides a complete, developer-friendly authorization toolkit for React applications. It allows you to control UI rendering and application behavior declaratively using permissions, roles, multi-role conditions, custom predicates, and programmatic checks.

---

## ✨ Features

- 🎯 **Declarative `<Can>` Component**: Render or hide elements based on permissions, roles, or custom logic with fallback UI support.
- ⚡ **Type-Safe & Autocomplete First**: Full TypeScript generics that provide IDE autocomplete for your application's specific permission and role union types.
- 🚀 **High Performance ($O(1)$)**: Fast Set-based lookups with zero redundant array allocations.
- 🪶 **Zero Runtime Dependencies**: Completely self-contained with only `react` as a peer dependency (`>=18.0.0`, React 19 fully compatible).
- 🌐 **SSR & Framework Agnostic**: Works seamlessly with Next.js (App & Pages Router), Remix, Vite SSR, React Router, Expo, and standard React apps. No access to browser-only globals on startup.
- 🛡️ **Standalone Engine**: Use `createPermissionChecker` anywhere outside React (Node.js, server actions, route guards, CLI utilities, and services).
- 🧩 **Render Prop & Fallback Support**: Easily pass `{ allowed, checker }` to children or render dedicated unauthorized components.
- 🌲 **Tree-Shakeable**: Configured with `sideEffects: false` and dual ESM/CJS outputs.

---

## 📦 Installation

```bash
npm install react-permission
```

or with yarn / pnpm / bun:

```bash
yarn add react-permission
# or
pnpm add react-permission
# or
bun add react-permission
```

---

## 🚀 Quick Start

### 1. Wrap your application in `PermissionProvider`

Supply active permissions and roles for the current user session:

```tsx
import React from 'react';
import { PermissionProvider } from 'react-permission';
import App from './App';

function Root() {
  const user = {
    roles: ['editor'],
    permissions: ['post.view', 'post.create', 'post.update']
  };

  return (
    <PermissionProvider
      permissions={user.permissions}
      roles={user.roles}
    >
      <App />
    </PermissionProvider>
  );
}
```

### 2. Guard UI elements with `<Can>`

```tsx
import { Can } from 'react-permission';

function Dashboard() {
  return (
    <div>
      <h1>Post Management</h1>

      {/* Render only if granted permission */}
      <Can permission="post.create">
        <button>Create New Post</button>
      </Can>

      {/* Render with fallback if unauthorized */}
      <Can
        permission="post.delete"
        fallback={<p className="text-gray-400">Deletion disabled for your account</p>}
      >
        <button className="btn-danger">Delete Post</button>
      </Can>
    </div>
  );
}
```

### 3. Use programmatic checks with `usePermission`

```tsx
import { usePermission } from 'react-permission';

function EditPostButton({ postId }: { postId: string }) {
  const { can, cannot, hasRole } = usePermission();

  const handleEdit = () => {
    if (cannot('post.update')) {
      alert('You do not have permission to edit posts.');
      return;
    }
    // execute edit logic...
  };

  return (
    <button onClick={handleEdit}>
      Edit Post {hasRole('admin') ? '(Admin Mode)' : ''}
    </button>
  );
}
```

---

## 📖 In-Depth Usage Guide

### Declarative Checks with `<Can>`

#### Multiple Permissions (`mode="any"` vs `mode="all"`)

By default, passing multiple permissions requires **all** of them to be granted (`mode="all"`). Use `mode="any"` to require at least one:

```tsx
// All permissions required (default)
<Can permissions={['user.view', 'user.edit']} mode="all">
  <EditUserProfile />
</Can>

// At least one permission required
<Can permissions={['user.edit', 'user.delete']} mode="any">
  <UserActionMenu />
</Can>
```

#### Role-Based Checks

```tsx
// Single role
<Can role="admin">
  <AdminDashboard />
</Can>

// Multiple roles (e.g. Any of admin or manager)
<Can roles={['admin', 'manager']} mode="any">
  <TeamReports />
</Can>
```

#### Combined Role & Permission Checks

When passing both `roles` and `permissions`, both conditions are evaluated with logical `AND`:

```tsx
<Can role="admin" permissions={['billing.view', 'billing.export']}>
  <BillingAuditPanel />
</Can>
```

#### Custom Predicates (`check`)

For complex authorization rules that depend on both roles and permissions or calculated context:

```tsx
<Can
  check={({ hasRole, hasPermission }) =>
    hasRole('admin') || (hasRole('editor') && hasPermission('post.publish'))
  }
>
  <PublishArticleButton />
</Can>
```

#### Render Prop Pattern

If you need access to the authorization state without hiding the element:

```tsx
<Can permission="user.delete">
  {({ allowed, checker }) => (
    <button
      disabled={!allowed}
      title={allowed ? 'Delete User' : 'You lack deletion permission'}
    >
      Delete User {checker.hasRole('admin') ? '(Admin)' : ''}
    </button>
  )}
</Can>
```

---

### Programmatic Authorization Outside React

`react-permission` is built on a decoupled core engine. You can instantiate and use permission checkers directly in server actions, CLI utilities, API clients, or router guards:

```ts
import { createPermissionChecker } from 'react-permission';

const checker = createPermissionChecker({
  permissions: ['user.view', 'user.create'],
  roles: ['manager']
});

checker.can('user.create'); // true
checker.cannot('user.delete'); // true
checker.hasRole('manager'); // true
checker.hasAnyRole(['admin', 'manager']); // true
checker.hasAllRoles(['admin', 'manager']); // false
checker.hasAnyPermission(['user.create', 'billing.view']); // true
checker.hasAllPermissions(['user.create', 'user.view']); // true
```

---

### 💡 TypeScript Autocomplete

Define application-specific permission and role types for full IDE autocomplete:

```tsx
// types/auth.ts
export type AppPermission =
  | 'user.view'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'billing.view'
  | 'billing.manage';

export type AppRole = 'admin' | 'manager' | 'viewer';
```

Pass the types as generics to `<PermissionProvider>` and `usePermission()`:

```tsx
import { PermissionProvider, usePermission, Can } from 'react-permission';
import type { AppPermission, AppRole } from './types/auth';

function Root() {
  return (
    <PermissionProvider<AppPermission, AppRole>
      permissions={['user.view', 'user.create']}
      roles={['admin']}
    >
      <App />
    </PermissionProvider>
  );
}

function Profile() {
  // Full IDE autocomplete for can('...') and hasRole('...')!
  const { can, hasRole } = usePermission<AppPermission, AppRole>();

  return (
    <Can<AppPermission, AppRole> permission="user.create">
      <CreateUserButton />
    </Can>
  );
}
```

---

## 🔒 Security Model & Best Practices

> [!IMPORTANT]
> **Client-Side Authorization is for User Experience (UX), NOT Security.**
>
> Hiding a button or page on the frontend prevents confusion and improves UX. However, tech-savvy users can modify client code or inspect network requests.
>
> **You MUST always enforce authorization checks on your backend server / API endpoints independently.**
>
> ```
> Frontend (react-permission):
> User has "user.delete"? ──▶ Show / Hide Delete Button
> 
> Backend (API / Database):
> Authenticated Request ──▶ Verify session permissions ──▶ Allow / Reject 403
> ```

---

## 📚 API Reference

### `<PermissionProvider>`

Top-level context provider.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `permissions` | `readonly (string)[] \| null` | `[]` | List of permissions granted to the user. Normalizes `null`, `undefined`, and duplicates defensively. |
| `roles` | `readonly (string)[] \| null` | `[]` | List of roles assigned to the user. |
| `children` | `ReactNode` | *(Required)* | Child component tree. |

---

### `<Can>`

Declarative conditional rendering component.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `permission` | `string` | `undefined` | Single required permission. |
| `permissions` | `readonly string[]` | `undefined` | Array of permissions to check. |
| `role` | `string` | `undefined` | Single required role. |
| `roles` | `readonly string[]` | `undefined` | Array of roles to check. |
| `mode` | `'any' \| 'all'` | `'all'` | Mode used when evaluating multiple permissions or roles. |
| `check` | `(context) => boolean` | `undefined` | Custom predicate function. |
| `fallback` | `ReactNode` | `null` | UI to render when unauthorized. |
| `children` | `ReactNode \| CanRenderProp` | `null` | Elements to render when authorized, or a render prop function `({ allowed, checker }) => ReactNode`. |

---

### `usePermission()` / `usePermissionContext()`

Hook returning the active `PermissionChecker` instance.

```ts
const {
  permissions,        // readonly string[]
  roles,              // readonly string[]
  can,                // (permission: string) => boolean
  cannot,             // (permission: string) => boolean
  hasRole,            // (role: string) => boolean
  hasAnyRole,         // (roles: string[]) => boolean
  hasAllRoles,        // (roles: string[]) => boolean
  hasAnyPermission,   // (permissions: string[]) => boolean
  hasAllPermissions,  // (permissions: string[]) => boolean
  check               // (predicateFn: (context) => boolean) => boolean
} = usePermission();
```

*Note: Throws a clear runtime error if invoked outside `<PermissionProvider>`.*

---

### `createPermissionChecker(options)`

Standalone factory function to construct a `PermissionChecker` outside React.

```ts
const checker = createPermissionChecker({
  permissions: ['user.view'],
  roles: ['admin']
});
```

---

## ❓ Frequently Asked Questions (FAQ)

### Does `react-permission` support Server-Side Rendering (SSR)?
**Yes.** `react-permission` has zero references to browser globals (`window`, `document`, `localStorage`) during module load and render. It runs deterministically in Next.js (App & Pages Router), Remix, and Vite SSR.

### Does `react-permission` integrate with React Router?
**Yes.** Because `react-permission` is router-agnostic, you can guard routes in React Router, TanStack Router, or Next.js middleware with `usePermission()` or `createPermissionChecker()`:

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { cannot } = usePermission();
  if (cannot('admin.access')) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
```

### Can permissions update dynamically at runtime?
**Yes.** When `permissions` or `roles` state updates in the parent component, `<PermissionProvider>` recomputes its internal state efficiently without stale closures.

### How are nested providers handled?
Nested `<PermissionProvider>` instances override their parent context predictably, making it straightforward to scope permissions to specific sections or widgets.

---

## 📄 License

MIT © 2026 react-permission contributors.
