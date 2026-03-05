# ADR 001: React Context for Centralized Rook-Ceph State

**Status**: Accepted

**Date**: 2026-03-05

**Deciders**: Development Team

---

## Context

The Rook-Ceph plugin needs to fetch and share data from many sources:

- **4 Ceph CRDs** under `ceph.rook.io/v1`: CephCluster, CephBlockPool, CephFilesystem, CephObjectStore
- **Standard K8s resources**: StorageClasses, PersistentVolumes, PersistentVolumeClaims
- **6 pod label selectors**: operator, mon, osd, mgr, CSI RBD, CSI CephFS

This data is consumed by 7+ page views and 3 detail view sections. The context exposes 16+ fields.

Data fetching uses a two-track strategy:

1. **Headlamp's `K8s.ResourceClasses.*.useList()`** for standard resources (StorageClasses, PVs, PVCs)
2. **`ApiProxy.request()` in `useEffect`** for CRDs and pods

Each API call is wrapped in its own `try/catch` for independent failure isolation.

---

## Decision

Use a single `RookCephDataProvider` React Context that centralizes all data fetching.

- Standard K8s resources use Headlamp's reactive `useList()` hooks.
- CRDs and pods use `ApiProxy.request()` in a single `useEffect` keyed on `refreshKey`.
- Expose all data, loading, error, and refresh via context value.

---

## Consequences

- ✅ Single fetch point avoids duplicate API calls across 7+ views
- ✅ All views share consistent data snapshot
- ✅ Error isolation per API call prevents one failure from blocking others
- ✅ Refresh mechanism updates everything atomically via `refreshKey`
- ⚠️ Large context (16+ fields) causes all consumers to re-render on any update
- ⚠️ Monolithic provider is complex to maintain

Mitigated by infrequent update cadence — data changes only on cluster state changes, not on user interaction.

---

## Alternatives Considered

1. **Individual hooks per resource type** — Rejected. Would cause duplicate fetches across 7 pages, each independently calling the same APIs.

2. **Multiple specialized contexts** (CephContext, StorageContext, PodContext) — Rejected. Adds provider nesting complexity, and the data is cross-referenced (e.g., PVC filtering depends on PV data).

3. **Redux / Zustand** — Rejected. Not available as a plugin dependency; Headlamp does not expose external state management libraries.

---

## Changelog

- 2026-03-05: Initial decision accepted
