# Changelog

All notable changes to the Headlamp Rook-Ceph Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-02-18

### Changed

- Transferred repository to `privilegedescalation` GitHub organization
- Updated all repo URLs in `package.json` to new organization
- Expanded `CLAUDE.md` with data flow architecture, additional dev commands, and test notes

## [0.1.0] - 2026-02-18

### Added

- **Overview Dashboard** — CephCluster health (HEALTH_OK/WARN/ERR), cluster capacity PercentageBar, storage resource counts (block pools, filesystems, object stores, PVs, PVCs), daemon pod health summary, non-Bound PVC alert table
- **Block Pools page** — CephBlockPool table with phase, replication, failure domain, mirroring; slide-in detail panel with erasure coding and status info
- **Storage Classes page** — Rook-Ceph StorageClass table with type (Block/Filesystem), pool, provisioner, reclaim policy, expansion; slide-in detail panel with parameters
- **Volumes page** — Rook-Ceph PV table with capacity, access modes, reclaim, pool, claim; slide-in detail panel with full CSI volume attributes
- **Pods page** — all Rook-Ceph daemon pods grouped by role with ready/total counts and restart tracking
- **StorageClass column injection** — adds Rook Type, Pool, and Cluster ID columns to native Headlamp StorageClass table
- **PV column injection** — adds Rook Type and Pool columns to native Headlamp PV table
- **PVC Detail Injection** — Rook-Ceph section automatically injected into Headlamp's PVC detail view showing driver, type, pool, volume handle, and PV name
- **PV Detail Injection** — Rook-Ceph section injected into PV detail view with full CSI volume attributes
- **Pod Detail Injection** — Ceph daemon role badge (Operator, MON, OSD, MGR, etc.) injected into matching Pod detail pages
- **App Bar Badge** — cluster health badge in top nav bar, color-coded green/orange/red; hidden when no CephCluster present
- **RookCephDataContext** — shared React context provider for all plugin pages; fetches CephCluster, CephBlockPool, CephFilesystem, CephObjectStore CRDs plus daemon pods
- **Multi-provisioner support** — handles both default `rook-ceph.*` and custom-namespace provisioner strings

### Infrastructure

- GitHub repository with CI (lint + type-check + test) and release workflows
- Unit tests with Vitest + @testing-library/react
- TypeScript strict mode with zero `any` types
- ESLint + Prettier code quality tooling

[Unreleased]: https://github.com/privilegedescalation/headlamp-rook-ceph-plugin/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/privilegedescalation/headlamp-rook-ceph-plugin/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/privilegedescalation/headlamp-rook-ceph-plugin/releases/tag/v0.1.0
