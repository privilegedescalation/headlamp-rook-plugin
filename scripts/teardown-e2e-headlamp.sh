#!/usr/bin/env bash
# teardown-e2e-headlamp.sh
#
# Tears down the dedicated E2E Headlamp instance deployed by deploy-e2e-headlamp.sh.
#
# Environment:
#   E2E_NAMESPACE  — namespace to clean up (default: headlamp-dev)
#   E2E_RELEASE    — release/resource name prefix (default: headlamp-e2e)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

E2E_NAMESPACE="${E2E_NAMESPACE:-headlamp-dev}"
E2E_RELEASE="${E2E_RELEASE:-headlamp-e2e}"

echo "=== E2E Headlamp Teardown ==="
echo "  Namespace: $E2E_NAMESPACE"
echo "  Release:   $E2E_RELEASE"

echo "Removing Headlamp Deployment, Service, and ServiceAccount..."
kubectl delete deployment "${E2E_RELEASE}" -n "$E2E_NAMESPACE" --ignore-not-found
kubectl delete service "${E2E_RELEASE}" -n "$E2E_NAMESPACE" --ignore-not-found
kubectl delete serviceaccount "${E2E_RELEASE}" -n "$E2E_NAMESPACE" --ignore-not-found

echo "Cleaning up ConfigMap..."
kubectl delete configmap headlamp-rook-plugin -n "$E2E_NAMESPACE" --ignore-not-found

echo "Cleaning up test service account..."
kubectl delete serviceaccount headlamp-e2e-test -n "$E2E_NAMESPACE" --ignore-not-found

if [ -f "$REPO_ROOT/.env.e2e" ]; then
  rm "$REPO_ROOT/.env.e2e"
  echo "Removed .env.e2e"
fi

echo ""
echo "E2E teardown complete."
