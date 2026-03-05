# Architecture Decision Records (ADRs)

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. ADRs are immutable once accepted — if a decision is reversed, a new ADR is created that supersedes the original.

## Format

This project uses the [Nygard-style ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions):

- **Title**: Short noun phrase describing the decision
- **Status**: Proposed, Accepted, Deprecated, or Superseded
- **Context**: Forces at play, including technical, political, and project-specific
- **Decision**: The change being proposed or enacted
- **Consequences**: What becomes easier or harder as a result

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-react-context-state.md) | React Context for Centralized Rook-Ceph State | Accepted | 2026-03-05 |
| [002](002-extract-json-data.md) | extractJsonData() Pattern for KubeObject Unwrapping | Accepted | 2026-03-05 |
| [003](003-common-components-only.md) | Strictly CommonComponents Only (No Direct MUI) | Accepted | 2026-03-05 |
| [004](004-read-only-cluster-scope.md) | Read-Only Plugin with Cluster-Wide RBAC Scope | Accepted | 2026-03-05 |

## Creating New ADRs

1. Copy an existing ADR as a template.
2. Assign the next sequential number (e.g., `005`).
3. Fill in all sections: Context, Decision, Consequences, Alternatives Considered.
4. Set the status to **Proposed** and submit a PR for review.
5. Once merged, update the status to **Accepted** and add the entry to the index table above.

Use the filename pattern `NNN-short-slug.md` (e.g., `005-new-decision.md`).

## References

- [Michael Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
