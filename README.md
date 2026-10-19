<div align="center">

# 🛡️ react-permission-control

**The lightweight, type-safe authorization library for React applications.**

[![npm version](https://img.shields.io/npm/v/react-permission-control.svg?style=flat-square)](https://www.npmjs.com/package/react-permission-control)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-permission-control?style=flat-square&color=success)](https://bundlephobia.com/package/react-permission-control)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Types-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/lvlinh45/react-permission/pulls)

<p align="center">
  Control UI rendering, component visibility, and application logic declaratively with RBAC/ABAC rules, transitive role hierarchies, fine-grained resource policies, switch-case guards, wildcards, and async loading state.
</p>

[Installation](#-installation) • [Quick Start](#-quick-start) • [What's New in v1.1.0](#-whats-new-in-v110) • [Usage Recipes](#-usage-recipes) • [TypeScript Guide](#-typescript-guide) • [API Reference](#-api-reference) • [Release Workflow](#-automated-git-tagging--release-workflow)

</div>

---

## 🚀 Why react-permission-control?

Most access-control solutions in React are either **too heavyweight and complex** (requiring extensive policy DSLs and boilerplate) or **too primitive** (custom context wrappers that cause unnecessary re-renders and lack type safety).

`react-permission-control` strikes the sweet spot:

| Feature | `react-permission-control` | CASL (`@casl/react`) | Custom Context Boilerplate |
| :--- | :---: | :---: | :---: |
| **Bundle Size** | **< 2.0 KB** (gzipped) | ~8 KB | Varies |
| **Dependencies** | **0** (Only React peer) | Multiple | 0 |
| **TypeScript Autocomplete** | **Native Generics** | Requires complex types | Manual |
| **Lookup Speed** | **$O(1)$ Hash Set + Fast Wildcard** | Rule iteration | $O(N)$ Array scans |
| **Role Hierarchy** | **Built-in Transitive RBAC** | Manual | Manual |
| **ABAC Resource Policies** | **Built-in (`policies` + `resource`)** | Complex rule DSL | Manual |
| **Switch-Case Authorization** | **`<Can.Switch>` & `<PermissionSwitch>`** | None | Manual |
| **Async Loading Handling** | **First-class (`isLoading`, `loadingFallback`)** | Manual | Manual |
| **Diagnostics & Explanations**| **`checker.explain()`** | Complex | Manual |
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

## ✨ What's New in v1.1.0

- 👑 **Multi-Level Transitive Role Hierarchy (`roleHierarchy`)**: Define role inheritance graphs (e.g., `superadmin` -> `admin` -> `editor` -> `user`) with automatic cycle protection and inherited permission propagation.
- 🛡️ **ABAC / Resource-Based Policies (`policies` & `resource`)**: Evaluate fine-grained rules on resource data instances (e.g., `<Can permission="posts.edit" resource={post} />` and `useCan('posts.edit', post)`).
- 🔀 **Declarative Switch-Case Authorization (`<Can.Switch>` / `<PermissionSwitch>`)**: Cleanly render the first matching branch with `<Can.Case>` and `<Can.Default>`, eliminating nested ternaries.
- 🌐 **Scoped Nested Providers (`inherit={true}`)**: Effortlessly cascade and merge roles, permissions, policies, and hierarchies across workspaces, organizations, and sub-modules.
- ⏳ **First-Class Async & Loading Support (`isLoading`, `loadingFallback`)**: Seamlessly handle API token fetches without flashing unauthorized fallbacks.
- 🔍 **Diagnostics & Explain Engine (`checker.explain()`)**: Detailed reasons and matched rule origins for instant debugging and developer tooling.

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
    roles: ['superadmin'],
    permissions: ['analytics.view'],
  };

  return (
    <PermissionProvider
      permissions={user.permissions}
      roles={user.roles}
      // 1. Role hierarchy (superadmin automatically inherits admin & editor)
      roleHierarchy={{
        superadmin: ['admin'],
        admin: ['editor'],
        editor: ['viewer'],
      }}
      // 2. Role-to-permissions matrix
      rolePermissions={{
        admin: ['users.*', 'posts.delete'],
        editor: ['posts.create', 'posts.edit'],
        viewer: ['posts.read'],
      }}
      // 3. ABAC resource policies
      policies={{
        'posts.edit': (post, { hasRole }) =>
          post.authorId === user.id || hasRole('admin'),
      }}
    >
      <App />
    </PermissionProvider>
  );
}
```

### 2. Declarative UI with `<Can />`, `<Cannot />`, and `<Can.Switch />`

```tsx
import { Can, Cannot } from 'react-permission-control';

export function Dashboard({ post }) {
  return (
    <div>
      {/* 1. Wildcard matching (matches 'posts.*' or 'posts.create') */}
      <Can permission="posts.create">
        <button>+ New Post</button>
      </Can>

      {/* 2. ABAC Resource check */}
      <Can permission="posts.edit" resource={post}>
        <button>Edit This Post</button>
      </Can>

      {/* 3. With fallback UI */}
      <Can
        permission="posts.delete"
        fallback={<p className="text-muted">Deletion requires admin privileges.</p>}
      >
        <button className="btn-danger">Delete Post</button>
      </Can>

      {/* 4. Switch-Case Authorization */}
      <Can.Switch fallback={<GuestBanner />}>
        <Can.Case role="superadmin">
          <SuperAdminConsole />
        </Can.Case>
        <Can.Case role="editor">
          <EditorWorkspace />
        </Can.Case>
        <Can.Default>
          <StandardUserView />
        </Can.Default>
      </Can.Switch>

      {/* 5. Inverse rendering with <Cannot /> */}
      <Cannot permission="billing.manage">
        <div className="banner">Upgrade to Pro to unlock billing reports.</div>
      </Cannot>
    </div>
  );
}
```

### 3. Clean Checks with Hooks

```tsx
import { useCan, useCannot, useHasRole, usePermission } from 'react-permission-control';

export function ActionToolbar({ post }) {
  // Direct checks with optional ABAC resource evaluation
  const canEdit = useCan('posts.edit', post);
  const cannotDelete = useCannot('posts.delete');
  const isAdmin = useHasRole('admin');

  // Full checker engine
  const { explain, isLoading } = usePermission();

  if (isLoading) return <div>Loading permissions...</div>;

  // Diagnostics / debugging:
  console.log(explain('posts.edit', post));
  // => { allowed: true, reason: 'Granted by resource policy for "posts.edit"', matchedType: 'policy' }

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

### 1. Multi-Level Role Hierarchy (`roleHierarchy`)

In real-world applications, roles form a hierarchy: a `superadmin` possesses all permissions of an `admin`, who possesses all permissions of an `editor`.

```tsx
<PermissionProvider
  roles={['superadmin']}
  roleHierarchy={{
    superadmin: ['admin'],
    admin: ['editor', 'support'],
    editor: ['viewer'],
  }}
  rolePermissions={{
    viewer: ['posts.read'],
    editor: ['posts.create', 'posts.edit'],
    admin: ['posts.delete', 'users.manage'],
    superadmin: ['system.config'],
  }}
>
  {/* Allowed! Automatically inherited across the hierarchy */}
  <Can role="viewer"><ViewerToolbar /></Can>
  <Can permission="posts.edit"><EditPostButton /></Can>
</PermissionProvider>
```

### 2. ABAC & Resource-Based Policies (`policies` + `resource`)

Attribute-Based Access Control (ABAC) allows conditional access based on instance attributes (e.g. checking whether `post.authorId === currentUser.id` or checking document visibility).

```tsx
<PermissionProvider
  policies={{
    'posts.edit': (post, { hasRole }) =>
      post.authorId === currentUserId || hasRole('admin'),
    'documents.read': (doc, { hasRole }) =>
      doc.isPublic || doc.department === userDepartment || hasRole('manager'),
  }}
>
  {/* Evaluates the policy on the specific post object */}
  <Can permission="posts.edit" resource={post}>
    <EditPostForm post={post} />
  </Can>
</PermissionProvider>
```

### 3. Switch-Case Authorization (`<Can.Switch>` / `<PermissionSwitch>`)

Avoid cumbersome nested ternaries when presenting different UI tiers based on user rank:

```tsx
import { Can } from 'react-permission-control';

<Can.Switch fallback={<AccessDenied />}>
  <Can.Case role="superadmin">
    <SuperAdminPanel />
  </Can.Case>
  <Can.Case role="manager" permission="reports.view">
    <ManagerDashboard />
  </Can.Case>
  <Can.Case permission="posts.read">
    <ReaderDashboard />
  </Can.Case>
  <Can.Default>
    <PublicLandingPage />
  </Can.Default>
</Can.Switch>
```

### 4. Scoped Nested Providers (`inherit={true}`)

Ideal for multi-tenant, workspace-oriented SaaS applications. Inner modules can inherit organization-wide permissions and inject workspace-specific roles:

```tsx
{/* Global Organization Provider */}
<PermissionProvider roles={['member']} permissions={['org.view']}>
  <Navigation />

  {/* Scoped Project Provider */}
  <PermissionProvider
    inherit={true}
    roles={['project_lead']}
    permissions={['project.billing.view']}
  >
    {/* Has BOTH 'member' AND 'project_lead' roles! */}
    <ProjectSettings />
  </PermissionProvider>
</PermissionProvider>
```

### 5. Async & Loading State Handling

When user permissions are loaded asynchronously from an authentication API, `<Can>` will render `loadingFallback` instead of flashing forbidden `fallback`:

```tsx
<PermissionProvider
  isLoading={isUserLoading}
  loadingFallback={<SkeletonLoader />}
  permissions={user?.permissions}
  roles={user?.roles}
>
  {/* Shows SkeletonLoader until isUserLoading is false */}
  <Can permission="dashboard.view" fallback={<Navigate to="/login" />}>
    <Dashboard />
  </Can>
</PermissionProvider>
```

### 6. Diagnostics & Debugging with `explain()`

Understand exactly why a permission check allowed or denied access:

```ts
const { explain } = usePermission();

console.log(explain('posts.delete'));
// {
//   allowed: true,
//   reason: 'Granted by role "admin" (inherited via role "superadmin") for permission "posts.delete"',
//   matchedType: 'role_permission',
//   role: 'admin',
//   inheritedViaRole: 'superadmin'
// }
```

### 7. Wildcard & Scope Patterns

`react-permission-control` allows flexible globbing:
- `*` - Superuser (matches everything).
- `posts.*` - Matches `posts.read`, `posts.create`, `posts.delete`.
- `users:*:view` - Matches `users:profile:view`, `users:settings:view`.

```tsx
<PermissionProvider permissions={['posts.*', 'billing:view:*']}>
  <Can permission="posts.export">
    <ExportButton />
  </Can>
</PermissionProvider>
```

### 8. Higher-Order Components (HOC)

Protect components or route elements cleanly:

```tsx
import { withPermission, withRole } from 'react-permission-control';

export const AdminOnlyPanel = withRole(SettingsPanel, 'admin', {
  fallback: <AccessDeniedPage />,
});

export const EditUserPage = withPermission(UserEditor, 'users.edit', {
  fallback: <Navigate to="/unauthorized" />,
});
```

---

## 🛠️ TypeScript Guide

### Defining Strict Permission & Role Unions

Take full advantage of type safety and autocomplete throughout your codebase:

```tsx
export type AppPermission =
  | 'posts.read'
  | 'posts.create'
  | 'posts.edit'
  | 'posts.delete'
  | 'users.view'
  | 'users.manage'
  | 'billing.view'
  | 'billing.manage';

export type AppRole = 'superadmin' | 'admin' | 'editor' | 'viewer';

export function MyComponent() {
  const { can, hasRole } = usePermission<AppPermission, AppRole>();

  // Full IDE autocomplete for your permissions and roles!
  const canEdit = can('posts.edit');
  const isAdmin = hasRole('admin');

  return (
    <Can<AppPermission, AppRole> permission="posts.delete">
      <DeleteButton />
    </Can>
  );
}
```

---

## 📚 API Reference

### `<PermissionProvider />`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `permissions` | `readonly string[]` | `[]` | User permissions. |
| `roles` | `readonly string[]` | `[]` | User roles. |
| `roleHierarchy` | `RoleHierarchy` | `undefined` | Role inheritance graph (`{ admin: ['editor'] }`). |
| `rolePermissions`| `RolePermissionsMap` | `undefined` | Role-to-permission mappings. |
| `policies` | `PoliciesMap` | `undefined` | ABAC resource evaluation functions. |
| `wildcard` | `boolean` | `true` | Enable wildcard glob matching (`*`, `posts.*`). |
| `isLoading` | `boolean` | `false` | Asynchronous loading flag. |
| `loadingFallback`| `ReactNode` | `null` | Default UI while loading. |
| `inherit` | `boolean` | `false` | Inherit and merge parent context. |
| `children` | `ReactNode` | *(Required)* | Child component subtree. |

### `<Can />` and `<Cannot />`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `permission` | `string` | `undefined` | Single required permission. |
| `permissions` | `readonly string[]` | `undefined` | Array of permissions to check. |
| `role` | `string` | `undefined` | Single required role. |
| `roles` | `readonly string[]` | `undefined` | Array of roles to check. |
| `resource` | `unknown` | `undefined` | Resource instance evaluated against ABAC policies. |
| `mode` | `'any' \| 'all'` | `'all'` | Evaluation mode when multiple permissions/roles are passed. |
| `not` | `boolean` | `false` (`true` on `<Cannot>`) | Inverts the authorization decision. |
| `check` | `(context) => boolean` | `undefined` | Custom authorization predicate function. |
| `isLoading` | `boolean` | `context.isLoading` | Override loading state. |
| `loadingFallback`| `ReactNode` | `context.loadingFallback` | Rendered while loading. |
| `fallback` | `ReactNode` | `null` | Element rendered when authorization fails. |
| `children` | `ReactNode \| CanRenderProp` | `null` | Rendered when allowed, or render prop function. |

### `<Can.Switch />` / `<PermissionSwitch />`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `fallback` | `ReactNode` | `null` | Rendered if no case matches and no Default is present. |
| `isLoading` | `boolean` | `context.isLoading` | Loading state override. |
| `loadingFallback`| `ReactNode` | `context.loadingFallback` | Rendered while loading. |
| `children` | `ReactNode` | `null` | `<Can.Case>` and `<Can.Default>` elements. |

### Hooks

```ts
// Direct Hooks
const canEdit = useCan('posts.edit', resource?);
const cannotDelete = useCannot('posts.delete', resource?);
const isAdmin = useHasRole('admin');

// Comprehensive Engine Hook
const {
  permissions,        // readonly string[] (direct permissions)
  roles,              // readonly string[] (direct roles)
  effectiveRoles,     // readonly string[] (direct + inherited roles)
  isLoading,          // boolean
  wildcard,           // boolean
  can,                // (permission, resource?) => boolean
  cannot,             // (permission, resource?) => boolean
  explain,            // (permission, resource?) => PermissionExplanation
  canAny,             // (permissions[]) => boolean
  canAll,             // (permissions[]) => boolean
  hasRole,            // (role) => boolean
  hasAnyRole,         // (roles[]) => boolean
  hasAllRoles,        // (roles[]) => boolean
  hasAnyPermission,   // (permissions[]) => boolean
  hasAllPermissions,  // (permissions[]) => boolean
  check,              // (predicateFn) => boolean
} = usePermission();
```

---

## 🏷️ Automated Git Tagging & Release Workflow

Dự án đã cấu hình sẵn cơ chế tự động hóa quy trình kiểm tra chất lượng code, đánh Git Tag và đẩy lên GitHub bằng lệnh chuẩn của `npm`:

### 1. Đánh Git Tag tự động & Push lên GitHub
Khi bạn muốn tạo một version mới và tự động đánh tag đẩy lên GitHub, chỉ cần chạy **1 lệnh duy nhất**:

```bash
# Tăng patch version (ví dụ: 1.1.0 -> 1.1.1):
npm version patch

# Hoặc tăng minor version (ví dụ: 1.1.0 -> 1.2.0):
npm version minor

# Hoặc tăng major version (ví dụ: 1.1.0 -> 2.0.0):
npm version major
```

Lệnh trên sẽ tự động:
1. Chạy quy trình kiểm tra toàn diện (`clean`, `typecheck`, `lint`, `test`, `build`).
2. Tăng số version trong `package.json` và `package-lock.json`.
3. Tự động tạo một Git commit với message là tên version.
4. Tự động tạo **Git Tag** (ví dụ `v1.1.1`).
5. Tự động `git push` cả commit và tag lên GitHub (`git push origin --follow-tags`)!

---

### 2. Tự động đánh Tag + Publish lên NPM (Trọn gói 1 bước)
Nếu bạn muốn vừa tự động đánh tag đẩy GitHub, vừa publish luôn gói lên NPM trong 1 bước duy nhất:

```bash
npm run release:patch   # Tự bump patch, tạo tag, push GitHub và publish npm
npm run release:minor   # Tự bump minor, tạo tag, push GitHub và publish npm
npm run release:major   # Tự bump major, tạo tag, push GitHub và publish npm
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/lvlinh45/react-permission/issues).

---

## 📄 License

MIT © [lvlinh45](https://github.com/lvlinh45)
