/**
 * StorageClassesPage — lists Rook-Ceph StorageClasses.
 */

import {
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React, { useState } from 'react';
import { useRookCephContext } from '../api/RookCephDataContext';
import { formatAge, formatStorageType, RookCephStorageClass, storageClassType } from '../api/k8s';

function StorageClassDetail({ sc, pvCount, onClose }: { sc: RookCephStorageClass; pvCount: number; onClose: () => void }) {
  const type = storageClassType(sc);
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0, width: '480px',
        backgroundColor: 'var(--mui-palette-background-paper, #fff)',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
        zIndex: 1300,
        overflowY: 'auto',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <strong>{sc.metadata.name}</strong>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ✕
        </button>
      </div>
      <SectionBox title="StorageClass Details">
        <NameValueTable
          rows={[
            { name: 'Name', value: sc.metadata.name },
            { name: 'Provisioner', value: sc.provisioner },
            { name: 'Type', value: formatStorageType(type) },
            { name: 'Reclaim Policy', value: sc.reclaimPolicy ?? '—' },
            { name: 'Volume Binding Mode', value: sc.volumeBindingMode ?? '—' },
            { name: 'Volume Expansion', value: sc.allowVolumeExpansion ? 'Allowed' : 'Not allowed' },
            { name: 'Age', value: formatAge(sc.metadata.creationTimestamp) },
            { name: 'Bound PVs', value: String(pvCount) },
          ]}
        />
      </SectionBox>
      {sc.parameters && Object.keys(sc.parameters).length > 0 && (
        <SectionBox title="Parameters">
          <NameValueTable
            rows={Object.entries(sc.parameters).map(([k, v]) => ({ name: k, value: v ?? '—' }))}
          />
        </SectionBox>
      )}
    </div>
  );
}

export default function StorageClassesPage() {
  const { storageClasses, persistentVolumes, loading, error } = useRookCephContext();
  const [selected, setSelected] = useState<RookCephStorageClass | null>(null);

  if (loading) return <Loader title="Loading Rook-Ceph storage classes..." />;

  const pvCountByClass = new Map<string, number>();
  for (const pv of persistentVolumes) {
    const sc = pv.spec.storageClassName ?? '';
    pvCountByClass.set(sc, (pvCountByClass.get(sc) ?? 0) + 1);
  }

  return (
    <>
      <SectionHeader title="Rook-Ceph Storage Classes" />

      {error && (
        <SectionBox title="Error">
          <NameValueTable rows={[{ name: 'Status', value: <StatusLabel status="error">{error}</StatusLabel> }]} />
        </SectionBox>
      )}

      {storageClasses.length === 0 ? (
        <SectionBox title="No Storage Classes">
          <NameValueTable
            rows={[{ name: 'Status', value: 'No Rook-Ceph StorageClasses found. Ensure CephBlockPool and CephFilesystem resources exist.' }]}
          />
        </SectionBox>
      ) : (
        <SectionBox title={`Storage Classes (${storageClasses.length})`}>
          <SimpleTable
            columns={[
              {
                label: 'Name',
                getter: (sc: RookCephStorageClass) => (
                  <button
                    onClick={() => setSelected(sc)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--link-color, #1976d2)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                  >
                    {sc.metadata.name}
                  </button>
                ),
              },
              {
                label: 'Type',
                getter: (sc: RookCephStorageClass) => (
                  <StatusLabel status="success">
                    {formatStorageType(storageClassType(sc))}
                  </StatusLabel>
                ),
              },
              { label: 'Provisioner', getter: (sc: RookCephStorageClass) => sc.provisioner },
              { label: 'Pool', getter: (sc: RookCephStorageClass) => sc.parameters?.['pool'] ?? '—' },
              { label: 'Reclaim', getter: (sc: RookCephStorageClass) => sc.reclaimPolicy ?? '—' },
              { label: 'Expansion', getter: (sc: RookCephStorageClass) => sc.allowVolumeExpansion ? 'Yes' : 'No' },
              { label: 'PVs', getter: (sc: RookCephStorageClass) => String(pvCountByClass.get(sc.metadata.name) ?? 0) },
              { label: 'Age', getter: (sc: RookCephStorageClass) => formatAge(sc.metadata.creationTimestamp) },
            ]}
            data={storageClasses}
          />
        </SectionBox>
      )}

      {selected && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1299 }}
            onClick={() => setSelected(null)}
          />
          <StorageClassDetail
            sc={selected}
            pvCount={pvCountByClass.get(selected.metadata.name) ?? 0}
            onClose={() => setSelected(null)}
          />
        </>
      )}
    </>
  );
}
