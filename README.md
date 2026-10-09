<div align="center">

# 🛡️ react-permission-control

**The lightweight, type-safe authorization library for React applications.**

[![npm version](https://img.shields.io/npm/v/react-permission-control.svg?style=flat-square)](https://www.npmjs.com/package/react-permission-control)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-permission-control?style=flat-square&color=success)](https://bundlephobia.com/package/react-permission-control)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Types-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/lvlinh45/react-permission/pulls)

<p align="center">
  Control UI rendering, component visibility, and application logic declaratively with RBAC/ABAC rules, wildcard permissions, permission guards, HOCs, and hooks.
</p>

[Installation](#-installation) • [Quick Start](#-quick-start) • [What's New in v1.0.2](#-whats-new-in-v102) • [Usage Recipes](#-usage-recipes) • [TypeScript Guide](#-typescript-guide) • [API Reference](#-api-reference)

</div>

---

## 🚀 Why react-permission-control?

Most access-control solutions in React are either **too heavyweight and complex** (requiring extensive policy DSLs and boilerplate) or **too primitive** (custom context wrappers that cause unnecessary re-renders and lack type safety).

`react-permission-control` strikes the sweet spot:

| Feature | `react-permission-control` | CASL (`@casl/react`) | Custom Context Boilerplate |
| :--- | :---: | :---: | :---: |
| **Bundle Size** | **< 1.6 KB** (gzipped) | ~8 KB | Varies |
| **Dependencies** | **0** (Only React peer) | Multiple | 0 |
| **TypeScript Autocomplete** | **Native Generics** | Requires complex types | Manual |
| **Lookup Speed** | **$O(1)$ Hash Set + Fast Wildcard** | Rule iteration | $O(N)$ Array scans |
| **Wildcards & Globbing** | **Built-in (`*`, `posts.*`)** | Custom matcher | Manual |
| **Role-Permission Matrix** | **Built-in (`rolePermissions`)** | Custom definitions | Manual |
| **HOCs & Direct Hooks** | **`withPermission`, `useCan`, etc.** | Limited | Manual |
| **Standalone Engine** | **Included** (`createPermissionChecker`) | Included | Manual |
| **Render Prop & Fallback** | **First-class** | Component wrapper | Manual |
| **React 18 & 19 Ready** | **Yes** | Yes | Depends |
| **SSR / Next.js / Remix Safe** | **Yes (Zero Browser Globals)** | Yes | Depends |

---

## 📦 Installation

```bash
# npm
npm install react-permission-control

# yarn
yarn add react-permission-control

# pnpm
pnpm add react-permission-control

# bun
bun add react-permission-control
```

---

## ✨ What's New in v1.0.2

- 🌟 **Wildcard & Pattern Matching**: Support for `*` (superuser), `posts.*` (prefix scopes), and `users:*:view` (glob tokens).
- 🏷️ **Role-to-Permissions Inheritance Matrix**: Pass `rolePermissions` to automatically grant permissions based on active roles.
- 🚫 **`<Cannot />` Component & `not` Prop**: Easily declare inverse access logic for banners, upgrade buttons, or notices.
- 🎣 **Direct Convenience Hooks**: `useCan()`, `useCannot()`, and `useHasRole()` for cleaner, single-line component checks.
- 🧩 **Higher-Order Components (HOC)**: `withPermission()` and `withRole()` for wrapping routes, pages, or components.

---

## ⚡ Quick Start

### 1. Setup Provider

Wrap your app with `<PermissionProvider />`:

```tsx
import React from 'react';
import { PermissionProvider } from 'react-permission-control';
import App from './App';

export function Root() {
  const user = {
    roles: ['editor'],
    permissions: ['posts.*', 'comments.create'],
  };

  return (
    <PermissionProvider
      permissions={user.permissions}
      roles={user.roles}
      rolePermissions={{
        admin: ['*'],
        editor: ['posts.*', 'comments.*'],
        viewer: ['posts.read'],
      }}
    >
      <App />
    </PermissionProvider>
  );
}
```

### 2. Declarative UI with `<Can />` & `<Cannot />`

```tsx
import { Can, Cannot } from 'react-permission-control';

export function Dashboard() {
  return (
    <div>
      {/* 1. Wildcard matching (matches 'posts.*') */}
      <Can permission="posts.create">
        <button>+ New Post</button>
      </Can>

      {/* 2. With fallback UI */}
      <Can
        permission="posts.delete"
        fallback={<p className="text-muted">Deletion requires admin privileges.</p>}
      >
        <button className="btn-danger">Delete Post</button>
      </Can>

      {/* 3. Inverse rendering with <Cannot /> */}
      <Cannot permission="billing.manage">
        <div className="banner">Upgrade to Pro to unlock billing reports.</div>
      </Cannot>
    </div>
  );
}
```

### 3. Clean Checks with Hooks

```tsx
import { useCan, useCannot, useHasRole } from 'react-permission-control';

export function ActionToolbar() {
  const canEdit = useCan('posts.edit');
  const cannotDelete = useCannot('posts.delete');
  const isAdmin = useHasRole('admin');

  return (
    <div>
      {canEdit && <button>Edit Post</button>}
      {cannotDelete && <small>Read-only mode active</small>}
      {isAdmin && <span className="badge">Admin</span>}
    </div>
  );
}
```

---

## 📖 Usage Recipes

### 1. Wildcard & Scope Patterns

`react-permission-control` allows permission hierarchy via wildcards:

- `*` - Grants all permissions (e.g. Superadmin).
- `posts.*` or `posts:*` - Grants all sub-actions under `posts` (`posts.read`, `posts.create`, `posts.delete`).
- `users:*:view` - Matches any token in that slot (`users:profile:view`, `users:settings:view`).

```tsx
<PermissionProvider permissions={['posts.*', 'billing:view:*']}>
  {/* Allowed because user has 'posts.*' */}
  <Can permission="posts.export">
    <ExportButton />
  </Can>
</PermissionProvider>
```

### 2. Role-to-Permission Matrix (`rolePermissions`)

Avoid duplicating permissions per user by mapping roles to their permission sets:

```tsx
<PermissionProvider
  roles={['editor']}
  rolePermissions={{
    admin: ['*'],
    editor: ['posts.*', 'comments.manage'],
    viewer: ['posts.read'],
  }}
>
  {/* Automatically allowed for 'editor' role */}
  <Can permission="posts.create">
    <CreatePost />
  </Can>
</PermissionProvider>
```

### 3. Higher-Order Components (HOC)

Protect entire page or view components using `withPermission` or `withRole`:

```tsx
import { withPermission, withRole } from 'react-permission-control';

const AdminOnlyPanel = withRole(SettingsPanel, 'admin', {
  fallback: <AccessDeniedPage />,
});

const EditUserPage = withPermission(UserEditor, 'users.edit', {
  fallback: <Navigate to="/unauthorized" />,
});
```

### 4. Multi-Permission Evaluation (`mode="any"` vs `mode="all"`)

By default, passing multiple permissions requires **all** of them (`mode="all"`). Use `mode="any"` if at least one is sufficient:

```tsx
// Requires BOTH permissions (default)
<Can permissions={['users.view', 'users.update']} mode="all">
  <EditUserForm />
</Can>

// Requires AT LEAST ONE permission
<Can permissions={['posts.edit', 'posts.delete']} mode="any">
  <PostActionToolbar />
</Can>
```

### 5. Custom Predicate Logic (ABAC / Attribute-Based)

For dynamic rules depending on runtime parameters or context:

```tsx
<Can
  check={({ hasRole, hasPermission }) =>
    hasRole('superadmin') ||
    (hasRole('manager') && hasPermission('payroll.approve'))
  }
>
  <ApprovePayrollButton />
</Can>
```

### 6. Render Prop Pattern

Pass `{ allowed, checker }` to children for fine-grained UI customization:

```tsx
<Can permission="billing.export">
  {({ allowed, checker }) => (
    <button
      disabled={!allowed}
      title={allowed ? 'Export report' : 'Permission missing'}
    >
      Export CSV {checker.hasRole('admin') ? '(Priority Queue)' : ''}
    </button>
  )}
</Can>
```

### 7. Standalone Engine (Outside React)

Use `createPermissionChecker` in Node.js, CLI utilities, API clients, or router navigation guards:

```ts
import { createPermissionChecker } from 'react-permission-control';

const checker = createPermissionChecker({
  roles: ['editor'],
  rolePermissions: {
    editor: ['posts.*'],
  },
});

checker.can('posts.create'); // true (via wildcard)
checker.cannot('users.delete'); // true
checker.canAny(['posts.create', 'billing.manage']); // true
checker.canAll(['posts.create', 'posts.read']); // true
checker.hasRole('editor'); // true
```

---

## 💡 TypeScript Guide

`react-permission-control` is built with a **TypeScript-first** philosophy:

```tsx
// types/auth.ts
export type AppPermission =
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'posts.*'
  | 'settings.manage';

export type AppRole = 'admin' | 'editor' | 'viewer';
```

Pass generics to `<PermissionProvider />`, `<Can />`, and hooks:

```tsx
import { PermissionProvider, useCan, Can } from 'react-permission-control';
import type { AppPermission, AppRole } from './types/auth';

function App() {
  return (
    <PermissionProvider<AppPermission, AppRole>
      permissions={['posts.*']}
      roles={['editor']}
    >
      <Main />
    </PermissionProvider>
  );
}

function Main() {
  const canEdit = useCan<AppPermission>('users.update');

  return (
    <Can<AppPermission, AppRole> permission="users.create">
      <CreateUserButton />
    </Can>
  );
}
```

---

## 🔒 Security Best Practice

> [!IMPORTANT]
> **Client-side authorization is for User Experience (UX), NOT application security.**
>
> Hiding buttons or routes improves UX and prevents unauthorized clicks, but client code can be inspected or bypassed by users.
>
> **You MUST always enforce authorization checks on your backend server / API endpoints independently.**

---

## 📚 API Reference

### `<PermissionProvider />`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `permissions` | `readonly (string)[] \| null` | `[]` | List of permissions granted. |
| `roles` | `readonly (string)[] \| null` | `[]` | List of roles assigned to the user. |
| `wildcard` | `boolean` | `true` | Enable wildcard glob matching (`*`, `posts.*`). |
| `rolePermissions`| `RolePermissionsMap` | `undefined` | Map of roles to inherited permissions. |
| `children` | `ReactNode` | *(Required)* | Child component subtree. |

### `<Can />` and `<Cannot />`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `permission` | `string` | `undefined` | Single required permission. |
| `permissions` | `readonly string[]` | `undefined` | Array of permissions to check. |
| `role` | `string` | `undefined` | Single required role. |
| `roles` | `readonly string[]` | `undefined` | Array of roles to check. |
| `mode` | `'any' \| 'all'` | `'all'` | Evaluation mode when multiple permissions/roles are passed. |
| `not` | `boolean` | `false` (`true` on `<Cannot>`) | Inverts the authorization decision. |
| `check` | `(context) => boolean` | `undefined` | Custom authorization predicate function. |
| `fallback` | `ReactNode` | `null` | Element to render when authorization condition is not met. |
| `children` | `ReactNode \| CanRenderProp` | `null` | Rendered when allowed, or render prop function. |

### Hooks

```ts
// Standalone Direct Hooks
const canEdit = useCan(permission | permissions[], mode?);
const cannotDelete = useCannot(permission | permissions[], mode?);
const isAdmin = useHasRole(role | roles[], mode?);

// Full Engine Hook
const {
  permissions,        // readonly string[]
  roles,              // readonly string[]
  wildcard,           // boolean
  can,                // (permission: string) => boolean
  cannot,             // (permission: string) => boolean
  canAny,             // (permissions: string[]) => boolean
  canAll,             // (permissions: string[]) => boolean
  hasRole,            // (role: string) => boolean
  hasAnyRole,         // (roles: string[]) => boolean
  hasAllRoles,        // (roles: string[]) => boolean
  hasAnyPermission,   // (permissions: string[]) => boolean
  hasAllPermissions,  // (permissions: string[]) => boolean
  check               // (predicateFn) => boolean
} = usePermission();
```

### Higher-Order Components (HOC)

```tsx
const ProtectedComponent = withPermission(Component, permission, options);
const ProtectedByRole = withRole(Component, role, options);
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/lvlinh45/react-permission/issues).

---

## 📄 License

MIT © [lvlinh45](https://github.com/lvlinh45)
