#!/usr/bin/env bash
# deploy-e2e-headlamp.sh
#
# Deploys a stock Headlamp instance with the rook plugin loaded via
# a ConfigMap volume mount.
#
# E2E resources are deployed to the `headlamp-dev` namespace. Nothing
# persists beyond the test run — teardown cleans up all created resources.
#
# Prerequisites:
#   - Plugin built (dist/ exists with plugin-main.js + package.json)
#   - kubectl configured with cluster access
#
# Environment:
#   E2E_NAMESPACE     — namespace for E2E Headlamp (default: headlamp-dev)
#   E2E_RELEASE       — release/resource name prefix (default: headlamp-e2e)
#   HEADLAMP_VERSION  — Headlamp image tag (default: latest)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$REPO_ROOT/dist"

E2E_NAMESPACE="${E2E_NAMESPACE:-headlamp-dev}"
E2E_RELEASE="${E2E_RELEASE:-headlamp-e2e}"
HEADLAMP_VERSION="${HEADLAMP_VERSION:-latest}"

if [ ! -d "$DIST_DIR" ]; then
  echo "ERROR: dist/ not found. Run 'pnpm build' first." >&2
  exit 1
fi

echo "Checking RBAC permissions in namespace '${E2E_NAMESPACE}'..."
if ! kubectl auth can-i delete configmaps -n "$E2E_NAMESPACE" --quiet 2>/dev/null; then
  echo "ERROR: Missing RBAC — cannot delete configmaps in namespace '${E2E_NAMESPACE}'." >&2
  exit 1
fi

echo "=== E2E Headlamp Deployment ==="
echo "  Image:     ghcr.io/headlamp-k8s/headlamp:${HEADLAMP_VERSION}"
echo "  Namespace: $E2E_NAMESPACE"
echo "  Release:   $E2E_RELEASE"

echo ""
echo "Creating ConfigMap with plugin files..."

kubectl delete configmap headlamp-rook-plugin \
  -n "$E2E_NAMESPACE" --ignore-not-found

kubectl create configmap headlamp-rook-plugin \
  -n "$E2E_NAMESPACE" \
  --from-file="$DIST_DIR" \
  --from-file=package.json="$REPO_ROOT/package.json"

echo ""
echo "Removing any existing E2E deployment (clean-start)..."
kubectl delete deployment "${E2E_RELEASE}" -n "$E2E_NAMESPACE" --ignore-not-found --wait
kubectl delete service "${E2E_RELEASE}" -n "$E2E_NAMESPACE" --ignore-not-found --wait
kubectl delete serviceaccount "${E2E_RELEASE}" -n "$E2E_NAMESPACE" --ignore-not-found --wait

echo ""
echo "Deploying Headlamp E2E instance..."

kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${E2E_RELEASE}
  namespace: ${E2E_NAMESPACE}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${E2E_RELEASE}
  namespace: ${E2E_NAMESPACE}
  labels:
    app.kubernetes.io/name: headlamp
    app.kubernetes.io/instance: ${E2E_RELEASE}
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: headlamp
      app.kubernetes.io/instance: ${E2E_RELEASE}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: headlamp
        app.kubernetes.io/instance: ${E2E_RELEASE}
    spec:
      serviceAccountName: ${E2E_RELEASE}
      automountServiceAccountToken: true
      securityContext: {}
      containers:
        - name: headlamp
          image: ghcr.io/headlamp-k8s/headlamp:${HEADLAMP_VERSION}
          imagePullPolicy: IfNotPresent
          securityContext:
            runAsNonRoot: true
            privileged: false
            runAsUser: 100
            runAsGroup: 101
          args:
            - "-in-cluster"
            - "-in-cluster-context-name=main"
            - "-plugins-dir=/headlamp/plugins"
          ports:
            - name: http
              containerPort: 4466
              protocol: TCP
          readinessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 6
          livenessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
          volumeMounts:
            - name: rook-plugin
              mountPath: /headlamp/plugins/headlamp-rook
              readOnly: true
      volumes:
        - name: rook-plugin
          configMap:
            name: headlamp-rook-plugin
---
apiVersion: v1
kind: Service
metadata:
  name: ${E2E_RELEASE}
  namespace: ${E2E_NAMESPACE}
  labels:
    app.kubernetes.io/name: headlamp
    app.kubernetes.io/instance: ${E2E_RELEASE}
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: headlamp
    app.kubernetes.io/instance: ${E2E_RELEASE}
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
EOF

echo "Waiting for rollout..."
kubectl rollout status "deployment/${E2E_RELEASE}" \
  -n "$E2E_NAMESPACE" --timeout=120s

SVC_URL="http://${E2E_RELEASE}.${E2E_NAMESPACE}.svc.cluster.local"

echo ""
echo "Waiting for ${SVC_URL} to be reachable..."
ATTEMPTS=0
MAX_ATTEMPTS=24
until curl -sf --max-time 5 "${SVC_URL}" -o /dev/null 2>/dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "ERROR: ${SVC_URL} not reachable after $((MAX_ATTEMPTS * 5))s" >&2
    exit 1
  fi
  echo "  [${ATTEMPTS}/${MAX_ATTEMPTS}] not yet reachable, retrying in 5s..."
  sleep 5
done
echo ""
echo "E2E Headlamp is ready at: ${SVC_URL}"

echo ""
echo "Creating service account token for E2E auth..."
kubectl create serviceaccount headlamp-e2e-test \
  -n "$E2E_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

TOKEN=$(kubectl create token headlamp-e2e-test -n "$E2E_NAMESPACE" --duration=1h 2>/dev/null || echo "")
if [ -n "$TOKEN" ]; then
  echo "HEADLAMP_URL=${SVC_URL}" > "$REPO_ROOT/.env.e2e"
  echo "HEADLAMP_TOKEN=${TOKEN}" >> "$REPO_ROOT/.env.e2e"
  echo "Wrote .env.e2e with HEADLAMP_URL and HEADLAMP_TOKEN"
else
  echo "  WARNING: Could not generate token."
fi

echo ""
echo "E2E deployment complete."
