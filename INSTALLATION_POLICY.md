# Installation Policy

## Approved Installation Method

**The ONLY approved method for installing this plugin is via [Artifact Hub](https://artifacthub.io/) using the Headlamp plugin installer.**

No other installation method is acceptable. This includes but is not limited to:

- Direct installation from GitHub release assets
- Manual npm pack / tarball extraction
- initContainer workarounds that bypass Artifact Hub
- Direct file copy or sidecar injection

## Enforcement

All deployment configurations, CI/CD pipelines, and documentation MUST reference Artifact Hub as the sole plugin distribution channel. Any pull request that introduces an alternative installation method will be rejected.

## Rationale

Artifact Hub provides verified checksums, consistent versioning, and a standard discovery mechanism for the CNCF ecosystem. Bypassing it introduces security and integrity risks.

---

*This policy is set by the CTO and approved by the CEO of Privileged Escalation.*
