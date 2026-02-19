/**
 * RookCephDataContext — shared data provider for Rook-Ceph Kubernetes resources.
 *
 * Fetches CephCluster, CephBlockPool, CephFilesystem, CephObjectStore CRDs
 * plus StorageClasses, PVs, PVCs, and Rook-Ceph pods via Headlamp hooks and
 * ApiProxy. Provides filtered data to all child pages via React context.
 */

import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CephBlockPool,
  CephCluster,
  CephFilesystem,
  CephObjectStore,
  filterRookCephPersistentVolumes,
  filterRookCephPVCs,
  filterRookCephStorageClasses,
  isKubeList,
  ROOK_CEPH_NAMESPACE,
  ROOK_CSI_CEPHFS_SELECTOR,
  ROOK_CSI_RBD_SELECTOR,
  ROOK_MGR_SELECTOR,
  ROOK_MON_SELECTOR,
  ROOK_OPERATOR_SELECTOR,
  ROOK_OSD_SELECTOR,
  RookCephPersistentVolume,
  RookCephPod,
  RookCephPVC,
  RookCephStorageClass,
} from './k8s';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface RookCephContextValue {
  // Cluster presence
  cephClusters: CephCluster[];
  clusterInstalled: boolean;

  // Core CRD resources
  blockPools: CephBlockPool[];
  filesystems: CephFilesystem[];
  objectStores: CephObjectStore[];

  // Core K8s resources (filtered to Rook-Ceph only)
  storageClasses: RookCephStorageClass[];
  persistentVolumes: RookCephPersistentVolume[];
  persistentVolumeClaims: RookCephPVC[];

  // Operator / daemon pods
  operatorPods: RookCephPod[];
  monPods: RookCephPod[];
  osdPods: RookCephPod[];
  mgrPods: RookCephPod[];
  csiRbdPods: RookCephPod[];
  csiCephfsPods: RookCephPod[];

  // Loading / error state
  loading: boolean;
  error: string | null;

  // Manual refresh trigger
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const RookCephContext = createContext<RookCephContextValue | null>(null);

export function useRookCephContext(): RookCephContextValue {
  const ctx = useContext(RookCephContext);
  if (!ctx) {
    throw new Error('useRookCephContext must be used within a RookCephDataProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function RookCephDataProvider({ children }: { children: React.ReactNode }) {
  // K8s resource hooks — Headlamp re-fetches on cluster changes automatically
  const [allStorageClasses, scError] = K8s.ResourceClasses.StorageClass.useList();
  const [allPvs, pvError] = K8s.ResourceClasses.PersistentVolume.useList();
  const [allPvcs, pvcError] = K8s.ResourceClasses.PersistentVolumeClaim.useList({ namespace: '' });

  // Async-fetched resources (CRDs, pods)
  const [cephClusters, setCephClusters] = useState<CephCluster[]>([]);
  const [blockPools, setBlockPools] = useState<CephBlockPool[]>([]);
  const [filesystems, setFilesystems] = useState<CephFilesystem[]>([]);
  const [objectStores, setObjectStores] = useState<CephObjectStore[]>([]);
  const [operatorPods, setOperatorPods] = useState<RookCephPod[]>([]);
  const [monPods, setMonPods] = useState<RookCephPod[]>([]);
  const [osdPods, setOsdPods] = useState<RookCephPod[]>([]);
  const [mgrPods, setMgrPods] = useState<RookCephPod[]>([]);
  const [csiRbdPods, setCsiRbdPods] = useState<RookCephPod[]>([]);
  const [csiCephfsPods, setCsiCephfsPods] = useState<RookCephPod[]>([]);
  const [asyncLoading, setAsyncLoading] = useState(true);
  const [asyncError, setAsyncError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAsync() {
      setAsyncLoading(true);
      setAsyncError(null);
      try {
        // CephCluster CRDs
        try {
          const clusterList = await ApiProxy.request(
            `/apis/ceph.rook.io/v1/namespaces/${ROOK_CEPH_NAMESPACE}/cephclusters`
          );
          if (!cancelled && isKubeList(clusterList)) {
            setCephClusters(clusterList.items as CephCluster[]);
          }
        } catch {
          if (!cancelled) setCephClusters([]);
        }

        // CephBlockPool CRDs
        try {
          const poolList = await ApiProxy.request(
            `/apis/ceph.rook.io/v1/namespaces/${ROOK_CEPH_NAMESPACE}/cephblockpools`
          );
          if (!cancelled && isKubeList(poolList)) {
            setBlockPools(poolList.items as CephBlockPool[]);
          }
        } catch {
          if (!cancelled) setBlockPools([]);
        }

        // CephFilesystem CRDs
        try {
          const fsList = await ApiProxy.request(
            `/apis/ceph.rook.io/v1/namespaces/${ROOK_CEPH_NAMESPACE}/cephfilesystems`
          );
          if (!cancelled && isKubeList(fsList)) {
            setFilesystems(fsList.items as CephFilesystem[]);
          }
        } catch {
          if (!cancelled) setFilesystems([]);
        }

        // CephObjectStore CRDs
        try {
          const osList = await ApiProxy.request(
            `/apis/ceph.rook.io/v1/namespaces/${ROOK_CEPH_NAMESPACE}/cephobjectstores`
          );
          if (!cancelled && isKubeList(osList)) {
            setObjectStores(osList.items as CephObjectStore[]);
          }
        } catch {
          if (!cancelled) setObjectStores([]);
        }

        // Operator pods
        try {
          const opList = await ApiProxy.request(
            `/api/v1/namespaces/${ROOK_CEPH_NAMESPACE}/pods?labelSelector=${encodeURIComponent(ROOK_OPERATOR_SELECTOR)}`
          );
          if (!cancelled && isKubeList(opList)) setOperatorPods(opList.items as RookCephPod[]);
        } catch {
          if (!cancelled) setOperatorPods([]);
        }

        // MON pods
        try {
          const monList = await ApiProxy.request(
            `/api/v1/namespaces/${ROOK_CEPH_NAMESPACE}/pods?labelSelector=${encodeURIComponent(ROOK_MON_SELECTOR)}`
          );
          if (!cancelled && isKubeList(monList)) setMonPods(monList.items as RookCephPod[]);
        } catch {
          if (!cancelled) setMonPods([]);
        }

        // OSD pods
        try {
          const osdList = await ApiProxy.request(
            `/api/v1/namespaces/${ROOK_CEPH_NAMESPACE}/pods?labelSelector=${encodeURIComponent(ROOK_OSD_SELECTOR)}`
          );
          if (!cancelled && isKubeList(osdList)) setOsdPods(osdList.items as RookCephPod[]);
        } catch {
          if (!cancelled) setOsdPods([]);
        }

        // MGR pods
        try {
          const mgrList = await ApiProxy.request(
            `/api/v1/namespaces/${ROOK_CEPH_NAMESPACE}/pods?labelSelector=${encodeURIComponent(ROOK_MGR_SELECTOR)}`
          );
          if (!cancelled && isKubeList(mgrList)) setMgrPods(mgrList.items as RookCephPod[]);
        } catch {
          if (!cancelled) setMgrPods([]);
        }

        // CSI RBD provisioner pods
        try {
          const csiRbdList = await ApiProxy.request(
            `/api/v1/namespaces/${ROOK_CEPH_NAMESPACE}/pods?labelSelector=${encodeURIComponent(ROOK_CSI_RBD_SELECTOR)}`
          );
          if (!cancelled && isKubeList(csiRbdList)) setCsiRbdPods(csiRbdList.items as RookCephPod[]);
        } catch {
          if (!cancelled) setCsiRbdPods([]);
        }

        // CSI CephFS provisioner pods
        try {
          const csiCephfsList = await ApiProxy.request(
            `/api/v1/namespaces/${ROOK_CEPH_NAMESPACE}/pods?labelSelector=${encodeURIComponent(ROOK_CSI_CEPHFS_SELECTOR)}`
          );
          if (!cancelled && isKubeList(csiCephfsList)) setCsiCephfsPods(csiCephfsList.items as RookCephPod[]);
        } catch {
          if (!cancelled) setCsiCephfsPods([]);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setAsyncError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setAsyncLoading(false);
      }
    }

    void fetchAsync();
    return () => { cancelled = true; };
  }, [refreshKey]);

  // ---------------------------------------------------------------------------
  // Derived / filtered values — memoized to avoid recomputation on every render
  // ---------------------------------------------------------------------------

  // Headlamp useList() returns KubeObject class instances that store raw
  // Kubernetes JSON under `.jsonData`. Extract it so our plain-object helpers
  // work correctly.
  const extractJsonData = (items: unknown[]): unknown[] =>
    items.map(item =>
      item && typeof item === 'object' && 'jsonData' in item
        ? (item as { jsonData: unknown }).jsonData
        : item
    );

  const storageClasses = useMemo(() => {
    if (!allStorageClasses) return [];
    return filterRookCephStorageClasses(extractJsonData(allStorageClasses as unknown[]));
  }, [allStorageClasses]);

  const persistentVolumes = useMemo(() => {
    if (!allPvs) return [];
    return filterRookCephPersistentVolumes(extractJsonData(allPvs as unknown[]));
  }, [allPvs]);

  const persistentVolumeClaims = useMemo(() => {
    if (!allPvcs || persistentVolumes.length === 0) return [];
    return filterRookCephPVCs(
      extractJsonData(allPvcs as unknown[]) as RookCephPVC[],
      persistentVolumes
    );
  }, [allPvcs, persistentVolumes]);

  // ---------------------------------------------------------------------------
  // Combined loading / error state
  // ---------------------------------------------------------------------------

  const loading = asyncLoading || !allStorageClasses || !allPvs || !allPvcs;

  const errors: string[] = [];
  if (scError) errors.push(String(scError));
  if (pvError) errors.push(String(pvError));
  if (pvcError) errors.push(String(pvcError));
  if (asyncError) errors.push(asyncError);
  const error = errors.length > 0 ? errors.join('; ') : null;

  const clusterInstalled = cephClusters.length > 0;

  // ---------------------------------------------------------------------------
  // Memoized context value
  // ---------------------------------------------------------------------------

  const value = useMemo<RookCephContextValue>(
    () => ({
      cephClusters,
      clusterInstalled,
      blockPools,
      filesystems,
      objectStores,
      storageClasses,
      persistentVolumes,
      persistentVolumeClaims,
      operatorPods,
      monPods,
      osdPods,
      mgrPods,
      csiRbdPods,
      csiCephfsPods,
      loading,
      error,
      refresh,
    }),
    [
      cephClusters,
      clusterInstalled,
      blockPools,
      filesystems,
      objectStores,
      storageClasses,
      persistentVolumes,
      persistentVolumeClaims,
      operatorPods,
      monPods,
      osdPods,
      mgrPods,
      csiRbdPods,
      csiCephfsPods,
      loading,
      error,
      refresh,
    ]
  );

  return <RookCephContext.Provider value={value}>{children}</RookCephContext.Provider>;
}
