/**
 * FilesystemsPage — lists CephFilesystem resources.
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
import { CephFilesystem, formatAge, phaseToStatus } from '../api/k8s';
import { useRookCephContext } from '../api/RookCephDataContext';

function FilesystemDetail({ fs, onClose }: { fs: CephFilesystem; onClose: () => void }) {
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
        <strong>{fs.metadata.name}</strong>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ✕
        </button>
      </div>
      <SectionBox title="Filesystem Details">
        <NameValueTable
          rows={[
            { name: 'Name', value: fs.metadata.name },
            { name: 'Namespace', value: fs.metadata.namespace ?? '—' },
            {
              name: 'Phase',
              value: (
                <StatusLabel status={phaseToStatus(fs.status?.phase)}>
                  {fs.status?.phase ?? 'Unknown'}
                </StatusLabel>
              ),
            },
            { name: 'Age', value: formatAge(fs.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>
      <SectionBox title="Metadata Server">
        <NameValueTable
          rows={[
            { name: 'Active Count', value: String(fs.spec?.metadataServer?.activeCount ?? '—') },
            { name: 'Active Standby', value: String(fs.spec?.metadataServer?.activeStandby ?? '—') },
          ]}
        />
      </SectionBox>
      {fs.spec?.dataPools && fs.spec.dataPools.length > 0 && (
        <SectionBox title="Data Pools">
          {fs.spec.dataPools.map((pool, i) => (
            <NameValueTable
              key={pool.name ?? i}
              rows={[
                { name: 'Pool Name', value: pool.name ?? '—' },
                { name: 'Replicas', value: String(pool.replicated?.size ?? '—') },
              ]}
            />
          ))}
        </SectionBox>
      )}
      {fs.spec?.metadataPool && (
        <SectionBox title="Metadata Pool">
          <NameValueTable
            rows={[
              { name: 'Replicas', value: String(fs.spec.metadataPool.replicated?.size ?? '—') },
            ]}
          />
        </SectionBox>
      )}
      {fs.status?.info && Object.keys(fs.status.info).length > 0 && (
        <SectionBox title="Status Info">
          <NameValueTable
            rows={Object.entries(fs.status.info).map(([k, v]) => ({ name: k, value: v }))}
          />
        </SectionBox>
      )}
    </div>
  );
}

export default function FilesystemsPage() {
  const { filesystems, loading, error } = useRookCephContext();
  const [selected, setSelected] = useState<CephFilesystem | null>(null);

  if (loading) return <Loader title="Loading filesystems..." />;

  return (
    <>
      <SectionHeader title="Filesystems" />

      {error && (
        <SectionBox title="Error">
          <NameValueTable rows={[{ name: 'Status', value: <StatusLabel status="error">{error}</StatusLabel> }]} />
        </SectionBox>
      )}

      {filesystems.length === 0 ? (
        <SectionBox title="No Filesystems">
          <NameValueTable
            rows={[{ name: 'Status', value: 'No CephFilesystem resources found in rook-ceph namespace.' }]}
          />
        </SectionBox>
      ) : (
        <SectionBox title={`Filesystems (${filesystems.length})`}>
          <SimpleTable
            columns={[
              {
                label: 'Name',
                getter: (f: CephFilesystem) => (
                  <button
                    onClick={() => setSelected(f)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--link-color, #1976d2)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                  >
                    {f.metadata.name}
                  </button>
                ),
              },
              {
                label: 'Phase',
                getter: (f: CephFilesystem) => (
                  <StatusLabel status={phaseToStatus(f.status?.phase)}>
                    {f.status?.phase ?? 'Unknown'}
                  </StatusLabel>
                ),
              },
              { label: 'Active MDS', getter: (f: CephFilesystem) => String(f.spec?.metadataServer?.activeCount ?? '—') },
              { label: 'Active Standby', getter: (f: CephFilesystem) => String(f.spec?.metadataServer?.activeStandby ?? '—') },
              { label: 'Data Pools', getter: (f: CephFilesystem) => String(f.spec?.dataPools?.length ?? 0) },
              { label: 'Age', getter: (f: CephFilesystem) => formatAge(f.metadata.creationTimestamp) },
            ]}
            data={filesystems}
          />
        </SectionBox>
      )}

      {selected && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1299 }}
            onClick={() => setSelected(null)}
          />
          <FilesystemDetail fs={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </>
  );
}
