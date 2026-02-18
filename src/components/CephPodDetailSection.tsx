/**
 * CephPodDetailSection — injected into Headlamp's Pod detail view.
 *
 * Shown only for Rook-Ceph daemon pods (operator, mon, osd, mgr, csi).
 * Guards on rook-ceph label presence.
 */

import {
  NameValueTable,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { formatAge, getPodRestarts } from '../api/k8s';

interface CephPodDetailSectionProps {
  resource: {
    metadata?: {
      name?: string;
      namespace?: string;
      labels?: Record<string, string>;
      creationTimestamp?: string;
    };
    spec?: { nodeName?: string; containers?: Array<{ name: string; image?: string }> };
    status?: {
      phase?: string;
      conditions?: Array<{ type: string; status: string }>;
      containerStatuses?: Array<{
        name: string;
        ready: boolean;
        restartCount: number;
        state?: {
          running?: { startedAt?: string };
          waiting?: { reason?: string };
          terminated?: { reason?: string; exitCode?: number };
        };
      }>;
    };
    jsonData?: unknown;
  };
}

const ROOK_APP_LABELS = new Set([
  'rook-ceph-operator',
  'rook-ceph-mon',
  'rook-ceph-osd',
  'rook-ceph-mgr',
  'rook-ceph-mds',
  'rook-ceph-rgw',
  'csi-rbdplugin-provisioner',
  'csi-cephfsplugin-provisioner',
  'csi-rbdplugin',
  'csi-cephfsplugin',
]);

const ROLE_LABELS: Record<string, string> = {
  'rook-ceph-operator': 'Operator',
  'rook-ceph-mon': 'Monitor (MON)',
  'rook-ceph-osd': 'OSD',
  'rook-ceph-mgr': 'Manager (MGR)',
  'rook-ceph-mds': 'MDS (CephFS)',
  'rook-ceph-rgw': 'RGW (Object Gateway)',
  'csi-rbdplugin-provisioner': 'CSI RBD Provisioner',
  'csi-cephfsplugin-provisioner': 'CSI CephFS Provisioner',
  'csi-rbdplugin': 'CSI RBD Node Plugin',
  'csi-cephfsplugin': 'CSI CephFS Node Plugin',
};

export default function CephPodDetailSection({ resource }: CephPodDetailSectionProps) {
  const raw =
    resource.jsonData && typeof resource.jsonData === 'object'
      ? (resource.jsonData as typeof resource)
      : resource;

  const labels = raw.metadata?.labels ?? {};
  const appLabel = labels['app'] ?? '';

  if (!ROOK_APP_LABELS.has(appLabel)) return null;

  const role = ROLE_LABELS[appLabel] ?? appLabel;
  const phase = raw.status?.phase ?? 'Unknown';
  const isReady =
    raw.status?.conditions?.some((c) => c.type === 'Ready' && c.status === 'True') ?? false;
  const restarts =
    raw.status?.containerStatuses?.reduce((s, c) => s + c.restartCount, 0) ?? 0;

  const containerRows = (raw.status?.containerStatuses ?? []).map((cs) => {
    let stateStr = 'Unknown';
    if (cs.state?.running) stateStr = 'Running';
    else if (cs.state?.waiting) stateStr = `Waiting: ${cs.state.waiting.reason ?? ''}`;
    else if (cs.state?.terminated)
      stateStr = `Terminated: ${cs.state.terminated.reason ?? ''} (exit ${cs.state.terminated.exitCode ?? ''})`;

    return {
      name: cs.name,
      value: (
        <StatusLabel status={cs.ready ? 'success' : 'warning'}>
          {stateStr} | Restarts: {cs.restartCount}
        </StatusLabel>
      ),
    };
  });

  return (
    <SectionBox title="Rook-Ceph Daemon Info">
      <NameValueTable
        rows={[
          {
            name: 'Role',
            value: <StatusLabel status="success">{role}</StatusLabel>,
          },
          {
            name: 'Phase',
            value: (
              <StatusLabel status={isReady ? 'success' : 'error'}>
                {phase}
              </StatusLabel>
            ),
          },
          { name: 'Node', value: raw.spec?.nodeName ?? '—' },
          { name: 'Restarts', value: String(restarts) },
          { name: 'Age', value: formatAge(raw.metadata?.creationTimestamp) },
          ...containerRows,
        ]}
      />
    </SectionBox>
  );
}
