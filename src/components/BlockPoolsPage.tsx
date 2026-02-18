/**
 * BlockPoolsPage — lists CephBlockPool resources.
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
import { CephBlockPool, formatAge, phaseToStatus } from '../api/k8s';

function BlockPoolDetail({ pool, onClose }: { pool: CephBlockPool; onClose: () => void }) {
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
        <strong>{pool.metadata.name}</strong>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ✕
        </button>
      </div>
      <SectionBox title="Block Pool Details">
        <NameValueTable
          rows={[
            { name: 'Name', value: pool.metadata.name },
            { name: 'Namespace', value: pool.metadata.namespace ?? '—' },
            {
              name: 'Phase',
              value: (
                <StatusLabel status={phaseToStatus(pool.status?.phase)}>
                  {pool.status?.phase ?? 'Unknown'}
                </StatusLabel>
              ),
            },
            { name: 'Age', value: formatAge(pool.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>
      <SectionBox title="Replication">
        <NameValueTable
          rows={[
            { name: 'Replicas', value: String(pool.spec?.replicated?.size ?? '—') },
            {
              name: 'Require Safe Replica Size',
              value: String(pool.spec?.replicated?.requireSafeReplicaSize ?? '—'),
            },
            { name: 'Failure Domain', value: pool.spec?.failureDomain ?? '—' },
          ]}
        />
      </SectionBox>
      {pool.spec?.erasureCoded && (
        <SectionBox title="Erasure Coding">
          <NameValueTable
            rows={[
              { name: 'Data Chunks', value: String(pool.spec.erasureCoded.dataChunks ?? '—') },
              { name: 'Coding Chunks', value: String(pool.spec.erasureCoded.codingChunks ?? '—') },
            ]}
          />
        </SectionBox>
      )}
      {pool.status?.info && Object.keys(pool.status.info).length > 0 && (
        <SectionBox title="Status Info">
          <NameValueTable
            rows={Object.entries(pool.status.info).map(([k, v]) => ({ name: k, value: v }))}
          />
        </SectionBox>
      )}
    </div>
  );
}

export default function BlockPoolsPage() {
  const { blockPools, loading, error } = useRookCephContext();
  const [selected, setSelected] = useState<CephBlockPool | null>(null);

  if (loading) return <Loader title="Loading block pools..." />;

  return (
    <>
      <SectionHeader title="Block Pools" />

      {error && (
        <SectionBox title="Error">
          <NameValueTable rows={[{ name: 'Status', value: <StatusLabel status="error">{error}</StatusLabel> }]} />
        </SectionBox>
      )}

      {blockPools.length === 0 ? (
        <SectionBox title="No Block Pools">
          <NameValueTable
            rows={[{ name: 'Status', value: 'No CephBlockPool resources found in rook-ceph namespace.' }]}
          />
        </SectionBox>
      ) : (
        <SectionBox title={`Block Pools (${blockPools.length})`}>
          <SimpleTable
            columns={[
              {
                label: 'Name',
                getter: (p: CephBlockPool) => (
                  <button
                    onClick={() => setSelected(p)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--link-color, #1976d2)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                  >
                    {p.metadata.name}
                  </button>
                ),
              },
              {
                label: 'Phase',
                getter: (p: CephBlockPool) => (
                  <StatusLabel status={phaseToStatus(p.status?.phase)}>
                    {p.status?.phase ?? 'Unknown'}
                  </StatusLabel>
                ),
              },
              { label: 'Replicas', getter: (p: CephBlockPool) => String(p.spec?.replicated?.size ?? '—') },
              { label: 'Failure Domain', getter: (p: CephBlockPool) => p.spec?.failureDomain ?? '—' },
              { label: 'Mirroring', getter: (p: CephBlockPool) => p.spec?.mirroring?.enabled ? 'Enabled' : 'Disabled' },
              { label: 'Age', getter: (p: CephBlockPool) => formatAge(p.metadata.creationTimestamp) },
            ]}
            data={blockPools}
          />
        </SectionBox>
      )}

      {selected && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1299 }}
            onClick={() => setSelected(null)}
          />
          <BlockPoolDetail pool={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </>
  );
}
