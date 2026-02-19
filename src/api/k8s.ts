/**
 * Kubernetes type definitions and helper functions for Rook-Ceph resources.
 *
 * All K8s resource types are typed at the fields we actually use.
 * External data from the API is validated at the boundary before use.
 */

// ---------------------------------------------------------------------------
// Provisioner constants (namespace-prefixed — default namespace: rook-ceph)
// ---------------------------------------------------------------------------

export const ROOK_CEPH_NAMESPACE = 'rook-ceph' as const;
export const ROOK_CEPH_API_GROUP = 'ceph.rook.io' as const;
export const ROOK_CEPH_API_VERSION = 'v1' as const;

/** RBD (block) provisioner — prefix matches operator namespace */
export const ROOK_CEPH_RBD_PROVISIONER = `${ROOK_CEPH_NAMESPACE}.rbd.csi.ceph.com` as const;
/** CephFS provisioner — prefix matches operator namespace */
export const ROOK_CEPH_CEPHFS_PROVISIONER = `${ROOK_CEPH_NAMESPACE}.cephfs.csi.ceph.com` as const;

/** Returns true if the provisioner string is a known Rook-Ceph provisioner. */
export function isRookCephProvisioner(provisioner: string): boolean {
  return (
    provisioner === ROOK_CEPH_RBD_PROVISIONER ||
    provisioner === ROOK_CEPH_CEPHFS_PROVISIONER ||
    // Handle non-default namespaces: ends with .rbd.csi.ceph.com or .cephfs.csi.ceph.com
    provisioner.endsWith('.rbd.csi.ceph.com') ||
    provisioner.endsWith('.cephfs.csi.ceph.com')
  );
}

// ---------------------------------------------------------------------------
// Pod label selectors
// ---------------------------------------------------------------------------

export const ROOK_OPERATOR_SELECTOR = 'app=rook-ceph-operator';
export const ROOK_MON_SELECTOR = 'app=rook-ceph-mon';
export const ROOK_OSD_SELECTOR = 'app=rook-ceph-osd';
export const ROOK_MGR_SELECTOR = 'app=rook-ceph-mgr';
export const ROOK_MDS_SELECTOR = 'app=rook-ceph-mds';
export const ROOK_RGW_SELECTOR = 'app=rook-ceph-rgw';
export const ROOK_CSI_RBD_SELECTOR = 'app=rook-ceph.rbd.csi.ceph.com-ctrlplugin';
export const ROOK_CSI_CEPHFS_SELECTOR = 'app=rook-ceph.cephfs.csi.ceph.com-ctrlplugin';

// ---------------------------------------------------------------------------
// Generic Kubernetes object base shapes
// ---------------------------------------------------------------------------

export interface KubeObjectMeta {
  name: string;
  namespace?: string;
  creationTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  uid?: string;
}

export interface KubeObject {
  apiVersion?: string;
  kind?: string;
  metadata: KubeObjectMeta;
}

// ---------------------------------------------------------------------------
// CephCluster
// ---------------------------------------------------------------------------

export interface CephClusterStatusCeph {
  health?: 'HEALTH_OK' | 'HEALTH_WARN' | 'HEALTH_ERR' | string;
  lastChecked?: string;
  capacity?: {
    bytesAvailable?: number;
    bytesTotal?: number;
    bytesUsed?: number;
    lastUpdated?: string;
  };
}

export interface CephClusterStatusStorage {
  deviceClasses?: Array<{ name: string }>;
  osd?: { storeType?: Record<string, number> };
}

export interface CephClusterStatusVersion {
  image?: string;
  version?: string;
}

export interface CephClusterCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
  lastHeartbeatTime?: string;
}

export interface CephClusterStatus {
  phase?: 'Ready' | 'Progressing' | 'Failed' | string;
  state?: 'Created' | 'Updating' | 'Deleting' | string;
  message?: string;
  ceph?: CephClusterStatusCeph;
  storage?: CephClusterStatusStorage;
  version?: CephClusterStatusVersion;
  conditions?: CephClusterCondition[];
}

export interface CephClusterSpec {
  cephVersion?: { image?: string; allowUnsupported?: boolean };
  dataDirHostPath?: string;
  mon?: { count?: number; allowMultiplePerNode?: boolean };
  mgr?: { count?: number };
  dashboard?: { enabled?: boolean; ssl?: boolean };
  monitoring?: { enabled?: boolean };
  storage?: {
    useAllNodes?: boolean;
    useAllDevices?: boolean;
    deviceFilter?: string;
    nodes?: unknown[];
  };
  network?: { hostNetwork?: boolean };
  resources?: Record<string, unknown>;
}

export interface CephCluster extends KubeObject {
  spec?: CephClusterSpec;
  status?: CephClusterStatus;
}

export function healthToStatus(health: string | undefined): 'success' | 'warning' | 'error' {
  switch (health) {
    case 'HEALTH_OK': return 'success';
    case 'HEALTH_WARN': return 'warning';
    default: return 'error';
  }
}

export function phaseToStatus(phase: string | undefined): 'success' | 'warning' | 'error' {
  switch (phase) {
    case 'Ready':
    case 'Bound':
    case 'Available':
    case 'Running':
    case 'Succeeded':
      return 'success';
    case 'Progressing':
    case 'Pending':
    case 'Released':
      return 'warning';
    default:
      return 'error';
  }
}

// ---------------------------------------------------------------------------
// CephBlockPool
// ---------------------------------------------------------------------------

export interface CephBlockPoolSpec {
  failureDomain?: string;
  replicated?: { size?: number; requireSafeReplicaSize?: boolean };
  erasureCoded?: { codingChunks?: number; dataChunks?: number };
  parameters?: Record<string, string>;
  mirroring?: { enabled?: boolean };
}

export interface CephBlockPoolStatus {
  phase?: string;
  info?: Record<string, string>;
  conditions?: CephClusterCondition[];
}

export interface CephBlockPool extends KubeObject {
  spec?: CephBlockPoolSpec;
  status?: CephBlockPoolStatus;
}

// ---------------------------------------------------------------------------
// CephFilesystem
// ---------------------------------------------------------------------------

export interface CephFilesystemSpec {
  metadataPool?: { replicated?: { size?: number } };
  dataPools?: Array<{ name?: string; replicated?: { size?: number } }>;
  metadataServer?: { activeCount?: number; activeStandby?: boolean };
}

export interface CephFilesystemStatus {
  phase?: string;
  conditions?: CephClusterCondition[];
  info?: Record<string, string>;
}

export interface CephFilesystem extends KubeObject {
  spec?: CephFilesystemSpec;
  status?: CephFilesystemStatus;
}

// ---------------------------------------------------------------------------
// CephObjectStore
// ---------------------------------------------------------------------------

export interface CephObjectStoreSpec {
  metadataPool?: { replicated?: { size?: number } };
  dataPool?: { replicated?: { size?: number } };
  gateway?: { port?: number; securePort?: number; instances?: number };
}

export interface CephObjectStoreStatus {
  phase?: string;
  conditions?: CephClusterCondition[];
  info?: Record<string, string>;
}

export interface CephObjectStore extends KubeObject {
  spec?: CephObjectStoreSpec;
  status?: CephObjectStoreStatus;
}

// ---------------------------------------------------------------------------
// StorageClass (Rook-Ceph provisioned)
// ---------------------------------------------------------------------------

export interface RookCephStorageClass extends KubeObject {
  provisioner: string;
  reclaimPolicy?: string;
  volumeBindingMode?: string;
  allowVolumeExpansion?: boolean;
  parameters?: Record<string, string>;
}

export function isRookCephStorageClass(sc: unknown): sc is RookCephStorageClass {
  if (!sc || typeof sc !== 'object') return false;
  const obj = sc as Record<string, unknown>;
  const provisioner = obj['provisioner'];
  return typeof provisioner === 'string' && isRookCephProvisioner(provisioner);
}

export function filterRookCephStorageClasses(items: unknown[]): RookCephStorageClass[] {
  return items.filter(isRookCephStorageClass);
}

/** Returns 'rbd' or 'cephfs' based on provisioner string, or 'unknown'. */
export function storageClassType(sc: RookCephStorageClass): 'rbd' | 'cephfs' | 'unknown' {
  if (sc.provisioner.includes('.rbd.')) return 'rbd';
  if (sc.provisioner.includes('.cephfs.')) return 'cephfs';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// PersistentVolume (Rook-Ceph provisioned)
// ---------------------------------------------------------------------------

export interface RookCsiSpec {
  driver: string;
  volumeHandle?: string;
  volumeAttributes?: Record<string, string>;
}

export interface ClaimRef {
  name: string;
  namespace: string;
}

export interface PersistentVolumeSpec {
  csi?: RookCsiSpec;
  capacity?: { storage?: string };
  accessModes?: string[];
  persistentVolumeReclaimPolicy?: string;
  storageClassName?: string;
  claimRef?: ClaimRef;
}

export interface RookCephPersistentVolume extends KubeObject {
  spec: PersistentVolumeSpec;
  status?: { phase?: string };
}

export function isRookCephPersistentVolume(pv: unknown): pv is RookCephPersistentVolume {
  if (!pv || typeof pv !== 'object') return false;
  const obj = pv as Record<string, unknown>;
  const spec = obj['spec'] as Record<string, unknown> | undefined;
  if (!spec) return false;
  const csi = spec['csi'] as Record<string, unknown> | undefined;
  const driver = csi?.['driver'];
  return typeof driver === 'string' && isRookCephProvisioner(driver);
}

export function filterRookCephPersistentVolumes(items: unknown[]): RookCephPersistentVolume[] {
  return items.filter(isRookCephPersistentVolume);
}

// ---------------------------------------------------------------------------
// PersistentVolumeClaim (Rook-Ceph)
// ---------------------------------------------------------------------------

export interface PVCSpec {
  storageClassName?: string;
  accessModes?: string[];
  resources?: { requests?: { storage?: string } };
  volumeName?: string;
}

export interface RookCephPVC extends KubeObject {
  spec: PVCSpec;
  status?: {
    phase?: string;
    capacity?: { storage?: string };
    accessModes?: string[];
  };
}

export function filterRookCephPVCs(
  pvcs: RookCephPVC[],
  rookPvs: RookCephPersistentVolume[]
): RookCephPVC[] {
  const boundSet = new Set<string>();
  for (const pv of rookPvs) {
    const ref = pv.spec.claimRef;
    if (ref) boundSet.add(`${ref.namespace}/${ref.name}`);
  }
  return pvcs.filter(pvc => {
    const ns = pvc.metadata.namespace ?? '';
    return boundSet.has(`${ns}/${pvc.metadata.name}`);
  });
}

export function findBoundPv(
  pvc: RookCephPVC,
  rookPvs: RookCephPersistentVolume[]
): RookCephPersistentVolume | undefined {
  const ns = pvc.metadata.namespace ?? '';
  const name = pvc.metadata.name;
  return rookPvs.find(
    pv => pv.spec.claimRef?.namespace === ns && pv.spec.claimRef?.name === name
  );
}

// ---------------------------------------------------------------------------
// Pod
// ---------------------------------------------------------------------------

export interface ContainerStatus {
  name: string;
  ready: boolean;
  restartCount: number;
  image?: string;
  state?: {
    running?: { startedAt?: string };
    waiting?: { reason?: string; message?: string };
    terminated?: { exitCode?: number; reason?: string };
  };
}

export interface PodStatus {
  phase?: string;
  conditions?: Array<{ type: string; status: string }>;
  containerStatuses?: ContainerStatus[];
}

export interface PodSpec {
  nodeName?: string;
}

export interface RookCephPod extends KubeObject {
  spec?: PodSpec;
  status?: PodStatus;
}

export function isPodReady(pod: RookCephPod): boolean {
  return (
    pod.status?.conditions?.some(c => c.type === 'Ready' && c.status === 'True') ?? false
  );
}

export function getPodRestarts(pod: RookCephPod): number {
  return (
    pod.status?.containerStatuses?.reduce((sum, c) => sum + c.restartCount, 0) ?? 0
  );
}

export function getPodImage(pod: RookCephPod): string {
  return pod.status?.containerStatuses?.[0]?.image ?? 'unknown';
}

// ---------------------------------------------------------------------------
// K8s API list response envelope
// ---------------------------------------------------------------------------

export interface KubeList<T> {
  items: T[];
  metadata?: { resourceVersion?: string };
}

export function isKubeList(value: unknown): value is KubeList<unknown> {
  if (!value || typeof value !== 'object') return false;
  return Array.isArray((value as Record<string, unknown>)['items']);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function formatAge(timestamp: string | undefined): string {
  if (!timestamp) return 'unknown';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const ACCESS_MODE_ABBREV: Record<string, string> = {
  ReadWriteOnce: 'RWO',
  ReadWriteMany: 'RWX',
  ReadOnlyMany: 'ROX',
  ReadWriteOncePod: 'RWOP',
};

export function formatAccessModes(modes: string[] | undefined): string {
  if (!modes || modes.length === 0) return '—';
  return modes.map(m => ACCESS_MODE_ABBREV[m] ?? m).join(', ');
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(1)} TiB`;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GiB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}

export function parseStorageToBytes(storage: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*(Ki|Mi|Gi|Ti|Pi|K|M|G|T|P)?$/.exec(storage.trim());
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const suffix = match[2] ?? '';
  const multipliers: Record<string, number> = {
    '': 1,
    K: 1e3, Ki: 1024,
    M: 1e6, Mi: 1024 ** 2,
    G: 1e9, Gi: 1024 ** 3,
    T: 1e12, Ti: 1024 ** 4,
    P: 1e15, Pi: 1024 ** 5,
  };
  return value * (multipliers[suffix] ?? 1);
}

/** Returns display label for storage type (rbd → Block, cephfs → Filesystem). */
export function formatStorageType(type: 'rbd' | 'cephfs' | 'unknown'): string {
  switch (type) {
    case 'rbd': return 'Block (RBD)';
    case 'cephfs': return 'Filesystem (CephFS)';
    default: return 'Unknown';
  }
}

/** Extracts pool/subvolume group name from a Rook-Ceph PV volumeHandle. */
export function extractPoolFromVolumeHandle(handle: string | undefined): string {
  if (!handle) return '—';
  // RBD format: "<csi-vol-id>-<pool>-..." — pool is in volumeAttributes
  // We rely on volumeAttributes.pool instead; this just provides a fallback.
  return handle;
}
