<div align="center">

# 🛡️ react-permission-control

**The lightweight, type-safe authorization library for React applications.**

[![npm version](https://img.shields.io/npm/v/react-permission-control.svg?style=flat-square)](https://www.npmjs.com/package/react-permission-control)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-permission-control?style=flat-square&color=success)](https://bundlephobia.com/package/react-permission-control)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Types-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/lvlinh45/react-permission/pulls)

<p align="center">
  Control UI rendering, component visibility, and application logic declaratively with RBAC/ABAC rules, permission guards, and hooks.
</p>

[Installation](#-installation) • [Quick Start](#-quick-start) • [Features](#-why-react-permission-control) • [Usage Recipes](#-usage-recipes) • [TypeScript Guide](#-typescript-guide) • [API Reference](#-api-reference)

</div>

---

## 🚀 Why react-permission-control?

Most access-control solutions in React are either **too heavyweight and complex** (requiring extensive policy DSLs and boilerplate) or **too primitive** (custom context wrappers that cause unnecessary re-renders and lack type safety).

`react-permission-control` strikes the sweet spot:

| Feature | `react-permission-control` | CASL (`@casl/react`) | Custom Context Boilerplate |
| :--- | :---: | :---: | :---: |
| **Bundle Size** | **< 1.5 KB** (gzipped) | ~8 KB | Varies |
| **Dependencies** | **0** (Only React peer) | Multiple | 0 |
| **TypeScript Autocomplete** | **Native Generics** | Requires complex types | Manual |
| **Lookup Speed** | **$O(1)$ Hash Set** | Rule iteration | $O(N)$ Array scans |
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

## ⚡ 60-Second Quick Start

### 1. Setup Provider

Wrap your app with `<PermissionProvider />` and pass the authenticated user's permissions and roles:

```tsx
import React from 'react';
import { PermissionProvider } from 'react-permission-control';
import App from './App';

export function Root() {
  const user = {
    roles: ['editor'],
    permissions: ['post.view', 'post.create', 'post.update'],
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

### 2. Declarative UI with `<Can />`

```tsx
import { Can } from 'react-permission-control';

export function Dashboard() {
  return (
    <div>
      {/* 1. Basic permission guard */}
      <Can permission="post.create">
        <button>+ New Post</button>
      </Can>

      {/* 2. With fallback UI */}
      <Can
        permission="post.delete"
        fallback={<p className="text-muted">Deletion requires admin approval.</p>}
      >
        <button className="btn-danger">Delete Post</button>
      </Can>
    </div>
  );
}
```

### 3. Programmatic Checks with `usePermission()`

```tsx
import { usePermission } from 'react-permission-control';

export function EditButton({ postId }: { postId: string }) {
  const { can, cannot, hasRole } = usePermission();

  const handleEdit = () => {
    if (cannot('post.update')) {
      alert('Access Denied: You do not have permission to edit posts.');
      return;
    }
    // Perform update action...
  };

  return (
    <button onClick={handleEdit}>
      Edit {hasRole('admin') ? '(Admin)' : ''}
    </button>
  );
}
```

---

## 📖 Usage Recipes

### 1. Multi-Permission Evaluation (`mode="any"` vs `mode="all"`)

By default, passing multiple permissions requires **all** of them to be granted (`mode="all"`). Use `mode="any"` if having at least one permission is sufficient:

```tsx
// Requires BOTH permissions (default)
<Can permissions={['user.view', 'user.update']} mode="all">
  <EditUserForm />
</Can>

// Requires AT LEAST ONE permission
<Can permissions={['post.edit', 'post.delete']} mode="any">
  <PostActionToolbar />
</Can>
```

### 2. Role-Based Access Control (RBAC)

```tsx
// Single role check
<Can role="admin">
  <AdminConsole />
</Can>

// Multi-role check (Any role matches)
<Can roles={['admin', 'team_lead']} mode="any">
  <TeamAnalytics />
</Can>
```

### 3. Combined Role AND Permission Rules

When combining `role`/`roles` with `permission`/`permissions`, `<Can />` evaluates with a strict logical `AND`:

```tsx
<Can role="admin" permissions={['billing.view', 'billing.export']}>
  <BillingAuditReport />
</Can>
```

### 4. Custom Predicate Logic (ABAC / Attribute-Based)

For dynamic rules depending on runtime variables or state:

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

### 5. Render Prop Pattern

Pass `{ allowed, checker }` to children for fine-grained UI customization (e.g. disabling a button instead of hiding it):

```tsx
<Can permission="billing.export">
  {({ allowed, checker }) => (
    <button
      disabled={!allowed}
      title={allowed ? 'Export billing report' : 'Permission missing'}
    >
      Export CSV {checker.hasRole('admin') ? '(Priority Queue)' : ''}
    </button>
  )}
</Can>
```

### 6. Standalone Engine (Outside React)

Use `createPermissionChecker` in Node.js, CLI utilities, API clients, or router navigation guards:

```ts
import { createPermissionChecker } from 'react-permission-control';

const checker = createPermissionChecker({
  permissions: ['user.view', 'user.create'],
  roles: ['manager'],
});

checker.can('user.create'); // true
checker.cannot('user.delete'); // true
checker.canAny(['user.create', 'billing.manage']); // true
checker.canAll(['user.create', 'user.view']); // true
checker.hasRole('manager'); // true
checker.hasAnyRole(['admin', 'manager']); // true
```

---

## 💡 TypeScript Guide

`react-permission-control` is built with a **TypeScript-first** philosophy. You can define your union types once and get full IDE autocomplete across all components and hooks.

```tsx
// types/auth.ts
export type AppPermission =
  | 'user.view'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'settings.manage';

export type AppRole = 'admin' | 'editor' | 'viewer';
```

Pass generics to `<PermissionProvider />` and `usePermission()`:

```tsx
import { PermissionProvider, usePermission, Can } from 'react-permission-control';
import type { AppPermission, AppRole } from './types/auth';

function App() {
  return (
    <PermissionProvider<AppPermission, AppRole>
      permissions={['user.view', 'user.create']}
      roles={['editor']}
    >
      <Main />
    </PermissionProvider>
  );
}

function Main() {
  // IDE autocompletes 'user.create', 'user.update', etc.
  const { can, cannot, hasRole } = usePermission<AppPermission, AppRole>();

  return (
    <Can<AppPermission, AppRole> permission="user.create">
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
> Hiding buttons or routes improves UX and prevents unauthorized clicks, but client code can be modified by the user.
>
> **You MUST always enforce authorization checks on your backend server / API endpoints independently.**
>
> ```
> Frontend (react-permission-control):
> Has "user.delete"? ──▶ Show / Hide Delete Button
> 
> Backend (API / Database):
> Session validation ──▶ Verify database role/permission ──▶ Allow / Return HTTP 403
> ```

---

## 📚 API Reference

### `<PermissionProvider />`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `permissions` | `readonly (string)[] \| null` | `[]` | List of permissions granted. Normalizes null/undefined/duplicates defensively. |
| `roles` | `readonly (string)[] \| null` | `[]` | List of roles assigned to the user. |
| `children` | `ReactNode` | *(Required)* | Child component subtree. |

### `<Can />`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `permission` | `string` | `undefined` | Single required permission. |
| `permissions` | `readonly string[]` | `undefined` | Array of permissions to check. |
| `role` | `string` | `undefined` | Single required role. |
| `roles` | `readonly string[]` | `undefined` | Array of roles to check. |
| `mode` | `'any' \| 'all'` | `'all'` | Mode used when evaluating multiple permissions or roles. |
| `check` | `(context) => boolean` | `undefined` | Custom authorization predicate function. |
| `fallback` | `ReactNode` | `null` | Element to render when authorization fails. |
| `children` | `ReactNode \| CanRenderProp` | `null` | Rendered when authorized, or render prop function `({ allowed, checker }) => ReactNode`. |

### `usePermission()` / `usePermissionContext()`

```ts
const {
  permissions,        // readonly string[]
  roles,              // readonly string[]
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

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/lvlinh45/react-permission/issues).

---

## 📄 License

MIT © [lvlinh45](https://github.com/lvlinh45)
