# headlamp-rook-ceph-plugin

Headlamp plugin for Rook-Ceph cluster visibility.

## Project

- **Plugin name**: `headlamp-rook-ceph-plugin`
- **Rook-Ceph API group**: `ceph.rook.io/v1`
- **Default namespace**: `rook-ceph`
- **RBD provisioner**: `rook-ceph.rbd.csi.ceph.com`
- **CephFS provisioner**: `rook-ceph.cephfs.csi.ceph.com`
- **Reference plugin**: `../headlamp-tns-csi-plugin`

## Commands

```bash
npm start          # dev server with hot reload
npm run build      # production build
npm run package    # package for headlamp
npm run tsc        # TypeScript type check (no emit)
npm run lint       # ESLint
npm test           # vitest run
npm run test:watch # vitest watch mode
```

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

## Testing

All tests must pass before committing:

```bash
npm test        # tests across test files
npm run tsc     # must exit 0
```

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
