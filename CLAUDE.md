# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Headlamp plugin for Rook-Ceph cluster visibility.

- **Plugin name**: `headlamp-rook-plugin`
- **Rook-Ceph API group**: `ceph.rook.io/v1`
- **Default namespace**: `rook-ceph`
- **Reference plugin**: `../headlamp-tns-csi-plugin`

## Commands

```bash
npm start              # dev server with hot reload
npm run build          # production build
npm run package        # package for headlamp
npm run tsc            # TypeScript type check (no emit)
npm run lint           # ESLint
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier write
npm run format:check   # Prettier check
npm test               # vitest run (all tests)
npm run test:watch     # vitest watch mode
npx vitest run src/api/k8s.test.ts  # run a single test file
```

All tests and `tsc` must pass before committing.

## Architecture

```
src/
├── index.tsx                          # Plugin entry: registerRoute, registerSidebarEntry, etc.
├── api/
│   ├── k8s.ts                         # Types + filtering helpers (ceph.rook.io)
│   └── RookCephDataContext.tsx         # Shared React context provider
└── components/
    ├── OverviewPage.tsx
    ├── BlockPoolsPage.tsx
    ├── StorageClassesPage.tsx
    ├── VolumesPage.tsx
    ├── PodsPage.tsx
    ├── ClusterStatusCard.tsx
    ├── AppBarClusterBadge.tsx
    ├── PVCDetailSection.tsx            # Injected into Headlamp PVC detail view
    ├── PVDetailSection.tsx             # Injected into Headlamp PV detail view
    ├── CephPodDetailSection.tsx        # Injected into Headlamp Pod detail view
    └── integrations/
        └── StorageClassColumns.tsx     # Column processors for SC + PV tables
```

## Data flow

`RookCephDataContext.tsx` uses **two fetching strategies**:

1. **Headlamp hooks** (`K8s.ResourceClasses.*.useList()`) — for StorageClasses, PVs, PVCs. These return Headlamp `KubeObject` class instances whose raw JSON is stored under `.jsonData`. The `extractJsonData()` helper in the context provider unwraps them to plain objects before passing to the type-guard filters in `k8s.ts`.

2. **`ApiProxy.request()`** — for Rook CRDs (`cephclusters`, `cephblockpools`, `cephfilesystems`, `cephobjectstores`) and daemon pods, since these aren't in Headlamp's built-in resource classes. Fetched in a single `useEffect` keyed on `refreshKey`.

All pages consume data exclusively via `useRookCephContext()`. The provider is re-wrapped per route and per detail-section registration in `index.tsx`.

## Key constants (src/api/k8s.ts)

- Namespace: `rook-ceph`
- API group: `ceph.rook.io/v1`
- RBD provisioner: `rook-ceph.rbd.csi.ceph.com`
- CephFS provisioner: `rook-ceph.cephfs.csi.ceph.com`
- Custom namespace provisioners: any string ending in `.rbd.csi.ceph.com` or `.cephfs.csi.ceph.com`
- Pod selectors: `app=rook-ceph-operator`, `app=rook-ceph-mon`, `app=rook-ceph-osd`, `app=rook-ceph-mgr`, `app=csi-rbdplugin-provisioner`, `app=csi-cephfsplugin-provisioner`

## Code conventions

- Functional React components only — no class components
- All imports from `@kinvolk/headlamp-plugin/lib` and `@kinvolk/headlamp-plugin/lib/CommonComponents`
- No additional UI libraries (no MUI direct imports, no Ant Design, etc.)
- TypeScript strict mode — no `any`, use `unknown` + type guards at API boundaries
- Context provider (`RookCephDataProvider`) wraps each route component in `index.tsx`
- Tests: vitest + @testing-library/react, mock with `vi.mock('@kinvolk/headlamp-plugin/lib', ...)`
- `vitest.setup.ts` provides a spec-compliant `localStorage` shim for Node 22+ compatibility

## Testing

Mock pattern for headlamp APIs:
```typescript
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: vi.fn().mockResolvedValue({ items: [] }) },
  K8s: {
    ResourceClasses: {
      StorageClass: { useList: vi.fn(() => [[], null]) },
      PersistentVolume: { useList: vi.fn(() => [[], null]) },
      PersistentVolumeClaim: { useList: vi.fn(() => [[], null]) },
    },
  },
}));
```

The mock import must appear **before** the module under test is imported (see `RookCephDataContext.test.tsx`).
