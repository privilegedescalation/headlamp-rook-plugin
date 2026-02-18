/**
 * PVDetailSection — injected into Headlamp's PV detail view.
 *
 * Shown only when the PV uses a Rook-Ceph CSI driver.
 */

import {
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { formatStorageType, isRookCephPersistentVolume } from '../api/k8s';

interface PVDetailSectionProps {
  resource: {
    metadata?: { name?: string };
    spec?: { csi?: { driver?: string; volumeHandle?: string; volumeAttributes?: Record<string, string> }; storageClassName?: string };
    jsonData?: unknown;
  };
}

export default function PVDetailSection({ resource }: PVDetailSectionProps) {
  // Accept both KubeObject instances (jsonData) and plain objects
  const raw =
    resource.jsonData && typeof resource.jsonData === 'object'
      ? (resource.jsonData as typeof resource)
      : resource;

  const spec = raw.spec;
  const driver = spec?.csi?.driver ?? '';

  if (!isRookCephPersistentVolume({ metadata: raw.metadata ?? { name: '' }, spec: spec ?? {} })) {
    return null;
  }

  const attrs = spec?.csi?.volumeAttributes ?? {};
  const type = driver.includes('.rbd.') ? 'rbd' : driver.includes('.cephfs.') ? 'cephfs' : 'unknown';

  return (
    <SectionBox title="Rook-Ceph Volume Details">
      <NameValueTable
        rows={[
          { name: 'Driver', value: driver || '—' },
          { name: 'Type', value: formatStorageType(type) },
          { name: 'Volume Handle', value: spec?.csi?.volumeHandle ?? '—' },
          { name: 'Pool', value: attrs['pool'] ?? '—' },
          { name: 'Storage Class', value: spec?.storageClassName ?? '—' },
          ...Object.entries(attrs)
            .filter(([k]) => k !== 'pool')
            .map(([k, v]) => ({ name: k, value: v ?? '—' })),
        ]}
      />
    </SectionBox>
  );
}
