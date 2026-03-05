# ADR 003: Strictly CommonComponents Only (No Direct MUI)

**Status**: Accepted

**Date**: 2026-03-05

**Deciders**: Development Team

---

## Context

Headlamp exports UI primitives through `@kinvolk/headlamp-plugin/lib/CommonComponents`:

- `SectionBox`, `SimpleTable`, `StatusLabel`, `NameValueTable`, and others

Headlamp also bundles MUI (`@mui/material`) as a shared external, making it technically accessible to plugins. Some plugins (e.g., polaris, sealed-secrets) directly use MUI components such as `Drawer`, `Alert`, and `useTheme`.

The Rook plugin must decide whether to use CommonComponents exclusively or mix in direct MUI usage.

---

## Decision

Use CommonComponents exclusively. No direct imports from `@mui/material`.

- All tables use `SimpleTable`
- All layout uses `SectionBox`
- All status indicators use `StatusLabel`

This creates a hard dependency only on Headlamp's public component API, not on MUI internals.

---

## Consequences

- ✅ Insulated from MUI version changes in Headlamp (e.g., MUI v5 to v6 migration)
- ✅ Consistent look-and-feel guaranteed by Headlamp's own components
- ✅ Simpler imports with a smaller effective API surface to learn
- ⚠️ Limited UI expressiveness — cannot use MUI `Drawer`, `Dialog`, `Stepper`, or other components not exposed by CommonComponents
- ⚠️ Some layouts require workarounds when CommonComponents lack needed primitives

Mitigated by the plugin's read-only nature, which reduces the need for complex interactive UI patterns (modals, steppers, drawers).

---

## Alternatives Considered

1. **Mix CommonComponents with direct MUI** — Rejected for this plugin. Adds coupling risk to MUI internals, and the read-only UI does not need advanced MUI components.

2. **Use only MUI directly (skip CommonComponents)** — Rejected. Would miss Headlamp's styled wrappers and risk visual inconsistency with the rest of the Headlamp UI.

---

## Changelog

- 2026-03-05: Initial decision accepted
