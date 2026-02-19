/**
 * ObjectStoresPage — lists CephObjectStore resources.
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
import { CephObjectStore, formatAge, phaseToStatus } from '../api/k8s';
import { useRookCephContext } from '../api/RookCephDataContext';

function ObjectStoreDetail({ store, onClose }: { store: CephObjectStore; onClose: () => void }) {
  const endpoints = (store.status as unknown as Record<string, unknown>)?.endpoints as
    | { insecure?: string[]; secure?: string[] }
    | undefined;

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
        <strong>{store.metadata.name}</strong>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ✕
        </button>
      </div>
      <SectionBox title="Object Store Details">
        <NameValueTable
          rows={[
            { name: 'Name', value: store.metadata.name },
            { name: 'Namespace', value: store.metadata.namespace ?? '—' },
            {
              name: 'Phase',
              value: (
                <StatusLabel status={phaseToStatus(store.status?.phase)}>
                  {store.status?.phase ?? 'Unknown'}
                </StatusLabel>
              ),
            },
            { name: 'Age', value: formatAge(store.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>
      <SectionBox title="Gateway">
        <NameValueTable
          rows={[
            { name: 'Port', value: String(store.spec?.gateway?.port ?? '—') },
            { name: 'Secure Port', value: String(store.spec?.gateway?.securePort ?? '—') },
            { name: 'Instances', value: String(store.spec?.gateway?.instances ?? '—') },
          ]}
        />
      </SectionBox>
      {(endpoints?.insecure?.length || endpoints?.secure?.length) ? (
        <SectionBox title="Endpoints">
          <NameValueTable
            rows={[
              ...(endpoints?.insecure?.length
                ? [{ name: 'Insecure', value: endpoints.insecure.join(', ') }]
                : []),
              ...(endpoints?.secure?.length
                ? [{ name: 'Secure', value: endpoints.secure.join(', ') }]
                : []),
            ]}
          />
        </SectionBox>
      ) : null}
      {store.status?.info && Object.keys(store.status.info).length > 0 && (
        <SectionBox title="Status Info">
          <NameValueTable
            rows={Object.entries(store.status.info).map(([k, v]) => ({ name: k, value: v }))}
          />
        </SectionBox>
      )}
    </div>
  );
}

export default function ObjectStoresPage() {
  const { objectStores, loading, error } = useRookCephContext();
  const [selected, setSelected] = useState<CephObjectStore | null>(null);

  if (loading) return <Loader title="Loading object stores..." />;

  return (
    <>
      <SectionHeader title="Object Stores" />

      {error && (
        <SectionBox title="Error">
          <NameValueTable rows={[{ name: 'Status', value: <StatusLabel status="error">{error}</StatusLabel> }]} />
        </SectionBox>
      )}

      {objectStores.length === 0 ? (
        <SectionBox title="No Object Stores">
          <NameValueTable
            rows={[{ name: 'Status', value: 'No CephObjectStore resources found in rook-ceph namespace.' }]}
          />
        </SectionBox>
      ) : (
        <SectionBox title={`Object Stores (${objectStores.length})`}>
          <SimpleTable
            columns={[
              {
                label: 'Name',
                getter: (o: CephObjectStore) => (
                  <button
                    onClick={() => setSelected(o)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--link-color, #1976d2)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                  >
                    {o.metadata.name}
                  </button>
                ),
              },
              {
                label: 'Phase',
                getter: (o: CephObjectStore) => (
                  <StatusLabel status={phaseToStatus(o.status?.phase)}>
                    {o.status?.phase ?? 'Unknown'}
                  </StatusLabel>
                ),
              },
              { label: 'Gateway Port', getter: (o: CephObjectStore) => String(o.spec?.gateway?.port ?? '—') },
              { label: 'Instances', getter: (o: CephObjectStore) => String(o.spec?.gateway?.instances ?? '—') },
              { label: 'Age', getter: (o: CephObjectStore) => formatAge(o.metadata.creationTimestamp) },
            ]}
            data={objectStores}
          />
        </SectionBox>
      )}

      {selected && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1299 }}
            onClick={() => setSelected(null)}
          />
          <ObjectStoreDetail store={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </>
  );
}
