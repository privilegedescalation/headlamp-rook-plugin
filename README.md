# Headlamp Rook Plugin

[![CI](https://github.com/cpfarhood/headlamp-rook-plugin/actions/workflows/ci.yaml/badge.svg)](https://github.com/cpfarhood/headlamp-rook-plugin/actions/workflows/ci.yaml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A [Headlamp](https://headlamp.dev/) plugin that surfaces [Rook-Ceph](https://rook.io/) cluster health, storage resources, and CSI driver status directly in the Headlamp UI.

**[Installation](#installing) | [Features](#what-it-does) | [Security](#rbac--security-setup) | [Development](#development)**

## What It Does

Adds a **Rook-Ceph** top-level sidebar section to Headlamp with full cluster observability:

### Main Views

- **Overview Dashboard** — CephCluster health (HEALTH_OK/WARN/ERR), cluster capacity bar, storage resource counts (block pools, filesystems, object stores, PVs), daemon pod health summary, non-Bound PVC alerts
- **Block Pools** — table of CephBlockPool resources with phase, replication factor, failure domain, and mirroring status; click a row for a slide-in detail panel
- **Pods** — all Rook-Ceph daemon pods grouped by role (Operator, MON, MGR, OSD, CSI RBD, CSI CephFS) with ready/total counts and restart counts

### Integrated Features (Native Headlamp Views)

- **StorageClass columns** — adds Rook Type (Block/Filesystem), Pool, and Cluster ID columns to the native `/storage-classes` table for Rook-Ceph StorageClasses; `—` for non-Rook rows
- **PV columns** — adds Rook Type and Pool columns to the native `/persistent-volumes` table
- **PVC Detail Injection** — Rook-Ceph section automatically injected into Headlamp's PVC detail view (driver, type, pool, volume handle, PV name)
- **PV Detail Injection** — Rook-Ceph section injected into PV detail view with full CSI volume attributes
- **Pod Detail Injection** — Ceph daemon role badge (Operator, MON, OSD, MGR, etc.) injected into matching Pod detail pages
- **App Bar Badge** — cluster health badge (`rook-ceph: HEALTH_OK`) in top nav bar, color-coded; hidden when no CephCluster is present

### Data Sources

- **CephCluster, CephBlockPool, CephFilesystem, CephObjectStore** CRDs fetched via `ApiProxy.request` from `ceph.rook.io/v1`
- **StorageClasses, PVs, PVCs** fetched via Headlamp's `K8s.ResourceClasses` hooks (live watch)
- **Daemon pods** (operator, mon, osd, mgr, csi-rbdplugin-provisioner, csi-cephfsplugin-provisioner) fetched via label selector

The plugin is **read-only** — no write operations.

## Prerequisites

| Requirement     | Minimum version |
|----------------|-----------------|
| Headlamp        | v0.20+          |
| Rook            | v1.12+          |
| Ceph            | v17 (Quincy)+   |
| Kubernetes      | v1.24+          |

Rook-Ceph must be deployed in the `rook-ceph` namespace with standard labels. The CephCluster, CephBlockPool, CephFilesystem, and CephObjectStore CRDs (`ceph.rook.io/v1`) must be installed.

## Installing

### Option 1: Manual Plugin Install

Download the latest release tarball and place it in your Headlamp plugins directory:

```bash
# Download the latest release
curl -L https://github.com/cpfarhood/headlamp-rook-plugin/releases/latest/download/headlamp-rook-plugin-<version>.tar.gz \
  -o headlamp-rook-plugin.tar.gz

# Extract to Headlamp plugins directory
tar -xzf headlamp-rook-plugin.tar.gz -C ~/.config/Headlamp/plugins/
```

### Option 2: Headlamp In-App Plugin Manager

Browse the Headlamp Plugin Manager (Settings → Plugins) and install **headlamp-rook-plugin** directly.

## RBAC & Security Setup

The plugin reads Rook-Ceph CRDs and Kubernetes resources. Your Headlamp service account needs:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: headlamp-rook-ceph-reader
rules:
  # Rook-Ceph CRDs
  - apiGroups: ["ceph.rook.io"]
    resources:
      - cephclusters
      - cephblockpools
      - cephfilesystems
      - cephobjectstores
    verbs: ["get", "list", "watch"]
  # Native K8s resources
  - apiGroups: [""]
    resources:
      - pods
      - persistentvolumes
      - persistentvolumeclaims
    verbs: ["get", "list", "watch"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: headlamp-rook-ceph-reader
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: headlamp-rook-ceph-reader
subjects:
  - kind: ServiceAccount
    name: headlamp
    namespace: headlamp
```

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/cpfarhood/headlamp-rook-plugin.git
cd headlamp-rook-plugin
npm install
```

### Commands

```bash
npm start          # dev server with hot reload
npm run build      # production build
npm run package    # package for headlamp
npm run tsc        # TypeScript type check (no emit)
npm run lint       # ESLint
npm test           # vitest run
npm run test:watch # vitest watch mode
```

### Architecture

```
src/
├── index.tsx                          # Plugin entry: registerRoute, registerSidebarEntry, etc.
├── api/
│   ├── k8s.ts                         # Types + filtering helpers (ceph.rook.io/v1)
│   └── RookCephDataContext.tsx         # Shared React context provider
└── components/
    ├── OverviewPage.tsx                # Dashboard: health, capacity, resource counts
    ├── BlockPoolsPage.tsx              # CephBlockPool table + detail panel
    ├── StorageClassesPage.tsx          # Rook-Ceph StorageClass table
    ├── VolumesPage.tsx                 # Rook-Ceph PV table + detail panel
    ├── PodsPage.tsx                    # Daemon pods grouped by role
    ├── ClusterStatusCard.tsx           # Reusable cluster health + capacity card
    ├── AppBarClusterBadge.tsx          # App bar health badge
    ├── PVCDetailSection.tsx            # Injected into Headlamp PVC detail view
    ├── PVDetailSection.tsx             # Injected into Headlamp PV detail view
    ├── CephPodDetailSection.tsx        # Injected into Headlamp Pod detail view
    └── integrations/
        └── StorageClassColumns.tsx     # Column processors for SC + PV tables
```

### Testing

```bash
npm test        # runs all unit tests
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

## License

Apache-2.0 — see [LICENSE](LICENSE) for details.
