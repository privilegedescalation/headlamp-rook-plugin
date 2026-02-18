/**
 * OverviewPage — main dashboard for the Rook-Ceph plugin.
 *
 * Shows: cluster health, capacity overview, storage resource counts,
 * daemon pod summary, and non-Bound PVC alerts.
 */

import {
  Loader,
  NameValueTable,
  PercentageBar,
  SectionBox,
  SectionHeader,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useRookCephContext } from '../api/RookCephDataContext';
import { formatAge, formatBytes, healthToStatus, phaseToStatus, storageClassType } from '../api/k8s';
import ClusterStatusCard from './ClusterStatusCard';

export default function OverviewPage() {
  const {
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
  } = useRookCephContext();

  if (loading) {
    return <Loader title="Loading Rook-Ceph data..." />;
  }

  // Storage summary
  const rbdClasses = storageClasses.filter(sc => storageClassType(sc) === 'rbd');
  const cephfsClasses = storageClasses.filter(sc => storageClassType(sc) === 'cephfs');

  const totalCapacityBytes = persistentVolumes.reduce((sum, pv) => {
    const cap = pv.spec.capacity?.storage ?? '0';
    return sum + parseStorageToBytes(cap);
  }, 0);

  const pvcStatusCounts = { Bound: 0, Pending: 0, Lost: 0, Other: 0 };
  for (const pvc of persistentVolumeClaims) {
    const phase = pvc.status?.phase ?? 'Other';
    if (phase === 'Bound') pvcStatusCounts.Bound++;
    else if (phase === 'Pending') pvcStatusCounts.Pending++;
    else if (phase === 'Lost') pvcStatusCounts.Lost++;
    else pvcStatusCounts.Other++;
  }

  const nonBoundPvcs = persistentVolumeClaims.filter(pvc => pvc.status?.phase !== 'Bound');

  // Primary cluster health (first cluster)
  const primaryCluster = cephClusters[0];
  const primaryHealth = primaryCluster?.status?.ceph?.health;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <SectionHeader title="Rook-Ceph — Overview" />
        <button
          onClick={refresh}
          aria-label="Refresh Rook-Ceph data"
          style={{
            padding: '6px 16px',
            backgroundColor: 'transparent',
            color: 'var(--mui-palette-primary-main, #1976d2)',
            border: '1px solid var(--mui-palette-primary-main, #1976d2)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Refresh
        </button>
      </div>

      {/* Cluster not detected */}
      {!clusterInstalled && !loading && (
        <SectionBox title="Rook-Ceph Not Detected">
          <NameValueTable
            rows={[
              {
                name: 'Status',
                value: <StatusLabel status="error">No CephCluster found in namespace rook-ceph</StatusLabel>,
              },
              {
                name: 'Install',
                value: 'helm install rook-ceph rook-release/rook-ceph -n rook-ceph --create-namespace',
              },
              {
                name: 'Docs',
                value: 'https://rook.io/docs/rook/latest/Getting-Started/quickstart/',
              },
            ]}
          />
        </SectionBox>
      )}

      {/* Error state */}
      {error && (
        <SectionBox title="Error">
          <NameValueTable
            rows={[{ name: 'Status', value: <StatusLabel status="error">{error}</StatusLabel> }]}
          />
        </SectionBox>
      )}

      {/* Quick health summary banner when cluster is installed */}
      {clusterInstalled && primaryHealth && (
        <SectionBox title="Cluster Health">
          <NameValueTable
            rows={[
              {
                name: 'Health',
                value: (
                  <StatusLabel status={healthToStatus(primaryHealth)}>
                    {primaryHealth}
                  </StatusLabel>
                ),
              },
              {
                name: 'Clusters',
                value: String(cephClusters.length),
              },
            ]}
          />
        </SectionBox>
      )}

      {/* Storage type distribution */}
      {storageClasses.length > 0 && (
        <SectionBox title="Storage Summary">
          {storageClasses.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--mui-palette-text-secondary)' }}>
                StorageClass Type Distribution
              </div>
              <PercentageBar
                data={[
                  ...(rbdClasses.length > 0
                    ? [{ name: 'Block (RBD)', value: rbdClasses.length, fill: '#1976d2' }]
                    : []),
                  ...(cephfsClasses.length > 0
                    ? [{ name: 'Filesystem (CephFS)', value: cephfsClasses.length, fill: '#9c27b0' }]
                    : []),
                ]}
                total={storageClasses.length}
              />
            </div>
          )}
          <NameValueTable
            rows={[
              { name: 'Storage Classes', value: `${storageClasses.length} (${rbdClasses.length} RBD, ${cephfsClasses.length} CephFS)` },
              { name: 'Block Pools', value: String(blockPools.length) },
              { name: 'Filesystems', value: String(filesystems.length) },
              { name: 'Object Stores', value: String(objectStores.length) },
              { name: 'Persistent Volumes', value: String(persistentVolumes.length) },
              { name: 'Total PV Capacity', value: formatBytes(totalCapacityBytes) },
              {
                name: 'PVCs (Bound)',
                value: <StatusLabel status="success">{pvcStatusCounts.Bound}</StatusLabel>,
              },
              ...(pvcStatusCounts.Pending > 0
                ? [{ name: 'PVCs (Pending)', value: <StatusLabel status="warning">{pvcStatusCounts.Pending}</StatusLabel> }]
                : []),
              ...(pvcStatusCounts.Lost > 0
                ? [{ name: 'PVCs (Lost)', value: <StatusLabel status="error">{pvcStatusCounts.Lost}</StatusLabel> }]
                : []),
            ]}
          />
        </SectionBox>
      )}

      {/* Cluster status + capacity + daemon health */}
      <ClusterStatusCard
        cephClusters={cephClusters}
        operatorPods={operatorPods}
        monPods={monPods}
        osdPods={osdPods}
        mgrPods={mgrPods}
        csiRbdPods={csiRbdPods}
        csiCephfsPods={csiCephfsPods}
      />

      {/* Block pools table */}
      {blockPools.length > 0 && (
        <SectionBox title="Block Pools">
          <SimpleTable
            columns={[
              { label: 'Name', getter: (p) => p.metadata.name },
              {
                label: 'Phase',
                getter: (p) => (
                  <StatusLabel status={phaseToStatus(p.status?.phase)}>
                    {p.status?.phase ?? 'Unknown'}
                  </StatusLabel>
                ),
              },
              { label: 'Replicas', getter: (p) => String(p.spec?.replicated?.size ?? '—') },
              { label: 'Failure Domain', getter: (p) => p.spec?.failureDomain ?? '—' },
              { label: 'Age', getter: (p) => formatAge(p.metadata.creationTimestamp) },
            ]}
            data={blockPools}
          />
        </SectionBox>
      )}

      {/* Filesystems table */}
      {filesystems.length > 0 && (
        <SectionBox title="Filesystems">
          <SimpleTable
            columns={[
              { label: 'Name', getter: (f) => f.metadata.name },
              {
                label: 'Phase',
                getter: (f) => (
                  <StatusLabel status={phaseToStatus(f.status?.phase)}>
                    {f.status?.phase ?? 'Unknown'}
                  </StatusLabel>
                ),
              },
              { label: 'Active MDS', getter: (f) => String(f.spec?.metadataServer?.activeCount ?? '—') },
              { label: 'Age', getter: (f) => formatAge(f.metadata.creationTimestamp) },
            ]}
            data={filesystems}
          />
        </SectionBox>
      )}

      {/* Object stores table */}
      {objectStores.length > 0 && (
        <SectionBox title="Object Stores">
          <SimpleTable
            columns={[
              { label: 'Name', getter: (o) => o.metadata.name },
              {
                label: 'Phase',
                getter: (o) => (
                  <StatusLabel status={phaseToStatus(o.status?.phase)}>
                    {o.status?.phase ?? 'Unknown'}
                  </StatusLabel>
                ),
              },
              { label: 'Gateway Port', getter: (o) => String(o.spec?.gateway?.port ?? '—') },
              { label: 'Instances', getter: (o) => String(o.spec?.gateway?.instances ?? '—') },
              { label: 'Age', getter: (o) => formatAge(o.metadata.creationTimestamp) },
            ]}
            data={objectStores}
          />
        </SectionBox>
      )}

      {/* Non-bound PVCs warning */}
      {nonBoundPvcs.length > 0 && (
        <SectionBox title="Attention: Non-Bound PVCs">
          <SimpleTable
            columns={[
              { label: 'Name', getter: (pvc) => pvc.metadata.name },
              { label: 'Namespace', getter: (pvc) => pvc.metadata.namespace ?? '—' },
              {
                label: 'Status',
                getter: (pvc) => (
                  <StatusLabel status={phaseToStatus(pvc.status?.phase)}>
                    {pvc.status?.phase ?? 'Unknown'}
                  </StatusLabel>
                ),
              },
              { label: 'Age', getter: (pvc) => formatAge(pvc.metadata.creationTimestamp) },
            ]}
            data={nonBoundPvcs}
          />
        </SectionBox>
      )}
    </>
  );
}

function parseStorageToBytes(storage: string): number {
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
