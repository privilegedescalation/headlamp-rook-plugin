/**
 * PodsPage — lists all Rook-Ceph daemon pods grouped by role.
 */

import {
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { formatAge, getPodRestarts, isPodReady, RookCephPod } from '../api/k8s';
import { useRookCephContext } from '../api/RookCephDataContext';

function PodTable({ pods, title }: { pods: RookCephPod[]; title: string }) {
  if (pods.length === 0) return null;
  return (
    <SectionBox title={`${title} (${pods.length})`}>
      <SimpleTable
        columns={[
          { label: 'Name', getter: (p) => p.metadata.name },
          {
            label: 'Status',
            getter: (p) => (
              <StatusLabel status={isPodReady(p) ? 'success' : 'error'}>
                {p.status?.phase ?? 'Unknown'}
              </StatusLabel>
            ),
          },
          { label: 'Node', getter: (p) => p.spec?.nodeName ?? '—' },
          { label: 'Restarts', getter: (p) => String(getPodRestarts(p)) },
          { label: 'Age', getter: (p) => formatAge(p.metadata.creationTimestamp) },
        ]}
        data={pods}
      />
    </SectionBox>
  );
}

function OsdTable({ pods }: { pods: RookCephPod[] }) {
  if (pods.length === 0) return null;
  return (
    <SectionBox title={`OSDs (${pods.length})`}>
      <SimpleTable
        columns={[
          { label: 'OSD ID', getter: (p) => p.metadata.labels?.['osd'] ?? p.metadata.name },
          {
            label: 'Status',
            getter: (p) => {
              const st = isPodReady(p) ? 'success' : p.status?.phase === 'Pending' ? 'warning' : 'error';
              return (
                <StatusLabel status={st}>
                  {p.status?.phase ?? 'Unknown'}
                </StatusLabel>
              );
            },
          },
          {
            label: 'Node',
            getter: (p) => p.spec?.nodeName ?? p.metadata.labels?.['topology-location-host'] ?? '—',
          },
          { label: 'Device Class', getter: (p) => p.metadata.labels?.['device-class'] ?? '—' },
          { label: 'Store', getter: (p) => p.metadata.labels?.['osd-store'] ?? '—' },
          { label: 'Failure Domain', getter: (p) => p.metadata.labels?.['failure-domain'] ?? '—' },
          { label: 'Restarts', getter: (p) => String(getPodRestarts(p)) },
          { label: 'Age', getter: (p) => formatAge(p.metadata.creationTimestamp) },
        ]}
        data={pods}
      />
    </SectionBox>
  );
}

export default function PodsPage() {
  const {
    operatorPods,
    monPods,
    osdPods,
    mgrPods,
    csiRbdPods,
    csiCephfsPods,
    loading,
    error,
  } = useRookCephContext();

  if (loading) return <Loader title="Loading Rook-Ceph pods..." />;

  const allPods = [...operatorPods, ...monPods, ...osdPods, ...mgrPods, ...csiRbdPods, ...csiCephfsPods];
  const totalReady = allPods.filter(isPodReady).length;

  return (
    <>
      <SectionHeader title="Rook-Ceph Pods" />

      {error && (
        <SectionBox title="Error">
          <NameValueTable rows={[{ name: 'Status', value: <StatusLabel status="error">{error}</StatusLabel> }]} />
        </SectionBox>
      )}

      <SectionBox title="Summary">
        <NameValueTable
          rows={[
            {
              name: 'Overall Health',
              value: (
                <StatusLabel status={totalReady === allPods.length && allPods.length > 0 ? 'success' : 'warning'}>
                  {totalReady}/{allPods.length} pods ready
                </StatusLabel>
              ),
            },
          ]}
        />
      </SectionBox>

      <PodTable pods={operatorPods} title="Operator" />
      <PodTable pods={monPods} title="Monitors (MON)" />
      <PodTable pods={mgrPods} title="Managers (MGR)" />
      <OsdTable pods={osdPods} />
      <PodTable pods={csiRbdPods} title="CSI RBD Provisioner" />
      <PodTable pods={csiCephfsPods} title="CSI CephFS Provisioner" />

      {allPods.length === 0 && (
        <SectionBox title="No Pods">
          <NameValueTable
            rows={[{ name: 'Status', value: 'No Rook-Ceph pods found in rook-ceph namespace.' }]}
          />
        </SectionBox>
      )}
    </>
  );
}
