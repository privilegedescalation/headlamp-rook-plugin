/**
 * ClusterStatusCard — reusable component showing Rook-Ceph cluster health.
 * Displays CephCluster health, phase, capacity, version, and daemon pod counts.
 */

import {
  NameValueTable,
  PercentageBar,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import type { CephCluster, RookCephPod } from '../api/k8s';
import { formatAge, formatBytes, getPodImage, getPodRestarts, healthToStatus, isPodReady, phaseToStatus } from '../api/k8s';

interface ClusterStatusCardProps {
  cephClusters: CephCluster[];
  operatorPods: RookCephPod[];
  monPods: RookCephPod[];
  osdPods: RookCephPod[];
  mgrPods: RookCephPod[];
  csiRbdPods: RookCephPod[];
  csiCephfsPods: RookCephPod[];
}

function PodStatusBadge({ pod }: { pod: RookCephPod }) {
  const ready = isPodReady(pod);
  const phase = pod.status?.phase ?? 'Unknown';
  return (
    <StatusLabel status={ready ? 'success' : 'error'}>
      {phase}
    </StatusLabel>
  );
}

function PodSummaryRow({ pods, label }: { pods: RookCephPod[]; label: string }) {
  const ready = pods.filter(isPodReady).length;
  const total = pods.length;
  const status = total === 0 ? 'error' : ready === total ? 'success' : ready > 0 ? 'warning' : 'error';
  return {
    name: label,
    value: (
      <StatusLabel status={status}>
        {total === 0 ? 'None found' : `${ready}/${total} ready`}
      </StatusLabel>
    ),
  };
}

export default function ClusterStatusCard({
  cephClusters,
  operatorPods,
  monPods,
  osdPods,
  mgrPods,
  csiRbdPods,
  csiCephfsPods,
}: ClusterStatusCardProps) {
  return (
    <>
      {cephClusters.map(cluster => {
        const health = cluster.status?.ceph?.health;
        const phase = cluster.status?.phase;
        const capacity = cluster.status?.ceph?.capacity;
        const version = cluster.status?.version?.version ?? '—';
        const bytesTotal = capacity?.bytesTotal ?? 0;
        const bytesUsed = capacity?.bytesUsed ?? 0;
        const bytesAvail = capacity?.bytesAvailable ?? 0;
        const usedPct = bytesTotal > 0 ? Math.round((bytesUsed / bytesTotal) * 100) : 0;

        return (
          <React.Fragment key={cluster.metadata.name}>
            <SectionBox title={`CephCluster: ${cluster.metadata.name}`}>
              <NameValueTable
                rows={[
                  {
                    name: 'Health',
                    value: (
                      <StatusLabel status={healthToStatus(health)}>
                        {health ?? 'Unknown'}
                      </StatusLabel>
                    ),
                  },
                  {
                    name: 'Phase',
                    value: (
                      <StatusLabel status={phaseToStatus(phase)}>
                        {phase ?? 'Unknown'}
                      </StatusLabel>
                    ),
                  },
                  ...(cluster.status?.message ? [{ name: 'Message', value: cluster.status.message }] : []),
                  { name: 'Ceph Version', value: version },
                  { name: 'Namespace', value: cluster.metadata.namespace ?? '—' },
                  { name: 'Age', value: formatAge(cluster.metadata.creationTimestamp) },
                ]}
              />
            </SectionBox>

            {bytesTotal > 0 && (
              <SectionBox title="Cluster Capacity">
                <div style={{ marginBottom: '12px' }}>
                  <PercentageBar
                    data={[
                      { name: 'Used', value: bytesUsed, fill: usedPct > 80 ? '#f44336' : '#1976d2' },
                      { name: 'Free', value: bytesAvail, fill: '#e0e0e0' },
                    ]}
                    total={bytesTotal}
                  />
                </div>
                <NameValueTable
                  rows={[
                    { name: 'Total', value: formatBytes(bytesTotal) },
                    { name: 'Used', value: `${formatBytes(bytesUsed)} (${usedPct}%)` },
                    { name: 'Available', value: formatBytes(bytesAvail) },
                  ]}
                />
              </SectionBox>
            )}
          </React.Fragment>
        );
      })}

      <SectionBox title="Daemon Health">
        <NameValueTable
          rows={[
            PodSummaryRow({ pods: operatorPods, label: 'Operator' }),
            PodSummaryRow({ pods: monPods, label: 'Monitors (MON)' }),
            PodSummaryRow({ pods: osdPods, label: 'OSDs' }),
            PodSummaryRow({ pods: mgrPods, label: 'Managers (MGR)' }),
            PodSummaryRow({ pods: csiRbdPods, label: 'CSI RBD Provisioner' }),
            PodSummaryRow({ pods: csiCephfsPods, label: 'CSI CephFS Provisioner' }),
          ]}
        />
      </SectionBox>
    </>
  );
}

export function PodDetailRows({ pods, label }: { pods: RookCephPod[]; label: string }) {
  if (pods.length === 0) {
    return (
      <SectionBox title={label}>
        <NameValueTable
          rows={[{ name: 'Status', value: <StatusLabel status="error">No pods found</StatusLabel> }]}
        />
      </SectionBox>
    );
  }

  return (
    <SectionBox title={`${label} (${pods.length})`}>
      {pods.map(pod => (
        <NameValueTable
          key={pod.metadata.name}
          rows={[
            { name: 'Pod', value: pod.metadata.name },
            { name: 'Node', value: pod.spec?.nodeName ?? '—' },
            { name: 'Status', value: <PodStatusBadge pod={pod} /> },
            { name: 'Restarts', value: String(getPodRestarts(pod)) },
            { name: 'Image', value: getPodImage(pod) },
            { name: 'Age', value: formatAge(pod.metadata.creationTimestamp) },
          ]}
        />
      ))}
    </SectionBox>
  );
}
