# ADR 004: Read-Only Plugin with Cluster-Wide RBAC Scope

**Status**: Accepted

**Date**: 2026-03-05

**Deciders**: Development Team

---

## Context

Rook-Ceph manages cluster-wide storage infrastructure. The plugin needs to display:

- **Ceph CRDs**: CephClusters, CephBlockPools, CephFilesystems, CephObjectStores (all cluster-scoped or in the `rook-ceph` namespace)
- **Cluster-scoped K8s resources**: StorageClasses, PersistentVolumes
- **Namespace-spanning resources**: PersistentVolumeClaims (all namespaces)

The plugin could offer write operations (create/delete storage classes, manage pools) or remain strictly read-only. RBAC must cover all namespaces for PVCs to show complete storage utilization.

---

## Decision

The plugin is strictly read-only — no create, update, delete, or patch operations.

- RBAC requires only `get` and `list` verbs across cluster scope.
- PVCs are fetched with `{namespace: ''}` (all namespaces).
- This minimizes the RBAC footprint while providing comprehensive visibility.

---

## Consequences

- ✅ Minimal RBAC requirements (read-only `get` and `list` only)
- ✅ No risk of accidental mutation of storage infrastructure
- ✅ Safe for monitoring and observability use cases
- ✅ Can be deployed in restrictive environments with minimal permissions
- ⚠️ Users cannot manage Rook resources from the UI
- ⚠️ Must use `kubectl` or the Rook toolbox for operational tasks

Mitigated by the plugin's purpose being observability, not management. Storage infrastructure changes are high-risk and better suited to GitOps or controlled `kubectl` workflows.

---

## Alternatives Considered

1. **Full CRUD operations** — Rejected. Storage infrastructure changes are high-risk and better suited to GitOps/kubectl workflows with proper review processes.

2. **Read-only with namespace-scoped PVC filtering** — Rejected. Would miss cross-namespace storage utilization data, providing an incomplete picture of cluster storage usage.

3. **Optional write mode via RBAC detection** — Rejected. Adds significant complexity (capability detection, conditional UI) for unclear benefit given the observability focus.

---

## Changelog

- 2026-03-05: Initial decision accepted
