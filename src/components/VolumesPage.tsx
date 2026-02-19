/**
 * VolumesPage — lists Rook-Ceph PersistentVolumes.
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
import { formatAccessModes, formatAge, phaseToStatus, RookCephPersistentVolume } from '../api/k8s';
import { useRookCephContext } from '../api/RookCephDataContext';

function PVDetail({ pv, onClose }: { pv: RookCephPersistentVolume; onClose: () => void }) {
  const attrs = pv.spec.csi?.volumeAttributes ?? {};
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0, width: '520px',
        backgroundColor: 'var(--mui-palette-background-paper, #fff)',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
        zIndex: 1300,
        overflowY: 'auto',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <strong>{pv.metadata.name}</strong>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ✕
        </button>
      </div>
      <SectionBox title="PersistentVolume">
        <NameValueTable
          rows={[
            { name: 'Name', value: pv.metadata.name },
            { name: 'Capacity', value: pv.spec.capacity?.storage ?? '—' },
            { name: 'Access Modes', value: formatAccessModes(pv.spec.accessModes) },
            { name: 'Reclaim Policy', value: pv.spec.persistentVolumeReclaimPolicy ?? '—' },
            { name: 'Storage Class', value: pv.spec.storageClassName ?? '—' },
            {
              name: 'Phase',
              value: (
                <StatusLabel status={phaseToStatus(pv.status?.phase)}>
                  {pv.status?.phase ?? 'Unknown'}
                </StatusLabel>
              ),
            },
            {
              name: 'Claim',
              value: pv.spec.claimRef
                ? `${pv.spec.claimRef.namespace}/${pv.spec.claimRef.name}`
                : '—',
            },
            { name: 'Age', value: formatAge(pv.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>
      <SectionBox title="CSI Volume Attributes">
        <NameValueTable
          rows={[
            { name: 'Driver', value: pv.spec.csi?.driver ?? '—' },
            { name: 'Volume Handle', value: pv.spec.csi?.volumeHandle ?? '—' },
            ...Object.entries(attrs).map(([k, v]) => ({ name: k, value: v ?? '—' })),
          ]}
        />
      </SectionBox>
    </div>
  );
}

export default function VolumesPage() {
  const { persistentVolumes, loading, error } = useRookCephContext();
  const [selected, setSelected] = useState<RookCephPersistentVolume | null>(null);

  if (loading) return <Loader title="Loading Rook-Ceph volumes..." />;

  return (
    <>
      <SectionHeader title="Rook-Ceph Persistent Volumes" />

      {error && (
        <SectionBox title="Error">
          <NameValueTable rows={[{ name: 'Status', value: <StatusLabel status="error">{error}</StatusLabel> }]} />
        </SectionBox>
      )}

      {persistentVolumes.length === 0 ? (
        <SectionBox title="No Volumes">
          <NameValueTable
            rows={[{ name: 'Status', value: 'No Rook-Ceph PersistentVolumes found.' }]}
          />
        </SectionBox>
      ) : (
        <SectionBox title={`Persistent Volumes (${persistentVolumes.length})`}>
          <SimpleTable
            columns={[
              {
                label: 'Name',
                getter: (pv: RookCephPersistentVolume) => (
                  <button
                    onClick={() => setSelected(pv)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--link-color, #1976d2)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                  >
                    {pv.metadata.name}
                  </button>
                ),
              },
              { label: 'Capacity', getter: (pv: RookCephPersistentVolume) => pv.spec.capacity?.storage ?? '—' },
              { label: 'Access Modes', getter: (pv: RookCephPersistentVolume) => formatAccessModes(pv.spec.accessModes) },
              {
                label: 'Phase',
                getter: (pv: RookCephPersistentVolume) => (
                  <StatusLabel status={phaseToStatus(pv.status?.phase)}>
                    {pv.status?.phase ?? 'Unknown'}
                  </StatusLabel>
                ),
              },
              { label: 'Reclaim', getter: (pv: RookCephPersistentVolume) => pv.spec.persistentVolumeReclaimPolicy ?? '—' },
              { label: 'Pool', getter: (pv: RookCephPersistentVolume) => pv.spec.csi?.volumeAttributes?.['pool'] ?? '—' },
              { label: 'Claim', getter: (pv: RookCephPersistentVolume) => pv.spec.claimRef ? `${pv.spec.claimRef.namespace}/${pv.spec.claimRef.name}` : '—' },
              { label: 'Age', getter: (pv: RookCephPersistentVolume) => formatAge(pv.metadata.creationTimestamp) },
            ]}
            data={persistentVolumes}
          />
        </SectionBox>
      )}

      {selected && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1299 }}
            onClick={() => setSelected(null)}
          />
          <PVDetail pv={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </>
  );
}
