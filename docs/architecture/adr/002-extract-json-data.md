# ADR 002: extractJsonData() Pattern for KubeObject Unwrapping

**Status**: Accepted

**Date**: 2026-03-05

**Deciders**: Development Team

---

## Context

Headlamp's `useList()` hooks return arrays of `KubeObject` class instances that wrap raw JSON under `.jsonData`. The plugin's type system defines plain TypeScript interfaces (e.g., `CephCluster`, `StorageClass`) matching the raw Kubernetes JSON structure.

To use these typed interfaces, the `KubeObject` wrapper must be unwrapped. This pattern appears in every plugin that uses `useList()` hooks.

---

## Decision

Implement an `extractJsonData()` utility function that takes a `KubeObject` instance and returns the unwrapped `.jsonData` property.

- Apply this consistently to all `useList()` results before storing in context state.
- All type guards (e.g., `isRookCephProvisioner()`, `isRookCephStorageClass()`) operate on the unwrapped plain objects, not on `KubeObject` wrappers.

---

## Consequences

- ✅ Clean separation between Headlamp's class instances and the plugin's typed interfaces
- ✅ Type guards work on plain objects, which are easier to test
- ✅ Consistent unwrapping pattern across all resources
- ⚠️ Extra mapping step on every `useList()` result
- ⚠️ Runtime cost of mapping arrays (negligible for typical cluster sizes of tens to hundreds of resources)

---

## Alternatives Considered

1. **Use `KubeObject` instances directly** — Rejected. Type guards and filters become harder to write and test with class wrappers.

2. **Type assertion (`as CephCluster`)** — Rejected. Unsafe with no runtime validation; silently masks shape mismatches.

3. **Custom hook wrapping `useList()` with auto-extraction** — Considered but `extractJsonData()` is simpler and more explicit. A wrapper hook would hide the unwrapping step, making the data flow less obvious.

---

## Changelog

- 2026-03-05: Initial decision accepted
