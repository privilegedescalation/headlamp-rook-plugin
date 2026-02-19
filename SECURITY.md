# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✓         |

## Reporting a Vulnerability

Please report security vulnerabilities by opening a [GitHub Security Advisory](https://github.com/cpfarhood/headlamp-rook-plugin/security/advisories/new) rather than a public issue.

## Scope

This plugin is **read-only** — it does not modify any Kubernetes or Ceph resources. The only network requests made are to the Kubernetes API server via Headlamp's `ApiProxy` (which handles auth) and to Headlamp's own hooks.
