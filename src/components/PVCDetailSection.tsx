/**
 * PVCDetailSection — injected into Headlamp's PVC detail view.
 *
 * Shown only when the bound PV uses a Rook-Ceph CSI driver.
 * Uses registerDetailsViewSection in index.tsx.
 */

import {
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { findBoundPv, formatStorageType } from '../api/k8s';
import { useRookCephContext } from '../api/RookCephDataContext';

interface PVCDetailSectionProps {
  resource: {
    metadata?: { name?: string; namespace?: string };
    spec?: { volumeName?: string; storageClassName?: string };
  };
}

export default function PVCDetailSection({ resource }: PVCDetailSectionProps) {
  const { persistentVolumes, persistentVolumeClaims, loading } = useRookCephContext();

  if (loading) return null;

  const pvcName = resource.metadata?.name;
  const pvcNamespace = resource.metadata?.namespace;
  const matchedPvc = persistentVolumeClaims.find(
    pvc => pvc.metadata.name === pvcName && pvc.metadata.namespace === pvcNamespace
  );

  if (!matchedPvc) return null;

  const boundPv = findBoundPv(matchedPvc, persistentVolumes);
  if (!boundPv) return null;

  const attrs = boundPv.spec.csi?.volumeAttributes ?? {};

  // Determine storage type from driver name
  const driver = boundPv.spec.csi?.driver ?? '';
  const type = driver.includes('.rbd.') ? 'rbd' : driver.includes('.cephfs.') ? 'cephfs' : 'unknown';

  return (
    <SectionBox title="Rook-Ceph Storage Details">
      <NameValueTable
        rows={[
          { name: 'Driver', value: driver || '—' },
          { name: 'Type', value: formatStorageType(type) },
          { name: 'Pool', value: attrs['pool'] ?? '—' },
          { name: 'Storage Class', value: boundPv.spec.storageClassName ?? '—' },
          { name: 'Volume Handle', value: boundPv.spec.csi?.volumeHandle ?? '—' },
          { name: 'PV Name', value: boundPv.metadata.name },
          ...Object.entries(attrs)
            .filter(([k]) => k !== 'pool')
            .map(([k, v]) => ({ name: k, value: v ?? '—' })),
        ]}
      />
    </SectionBox>
  );
}
