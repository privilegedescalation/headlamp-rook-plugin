/**
 * StorageClassColumns — registerResourceTableColumnsProcessor integration.
 *
 * Adds Rook-Ceph-specific columns to the native Headlamp StorageClass table
 * ('headlamp-storageclasses') and PV table ('headlamp-persistentvolumes').
 * Non-Rook-Ceph rows show '—'.
 */

import React from 'react';
import { formatStorageType, isRookCephProvisioner } from '../../api/k8s';

/** Safely read a nested field from either a KubeObject instance or plain object. */
function getField(item: unknown, ...path: string[]): unknown {
  if (!item || typeof item !== 'object') return undefined;
  const obj = item as Record<string, unknown>;
  // KubeObject instances store raw JSON in .jsonData
  const raw =
    'jsonData' in obj && obj['jsonData'] && typeof obj['jsonData'] === 'object'
      ? (obj['jsonData'] as Record<string, unknown>)
      : obj;
  let cur: unknown = raw;
  for (const key of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function isRookRow(item: unknown): boolean {
  const provisioner = getField(item, 'provisioner') as string | undefined;
  return typeof provisioner === 'string' && isRookCephProvisioner(provisioner);
}

function isRookPvRow(item: unknown): boolean {
  const driver = getField(item, 'spec', 'csi', 'driver') as string | undefined;
  return typeof driver === 'string' && isRookCephProvisioner(driver);
}

export function buildStorageClassColumns() {
  return [
    {
      label: 'Type',
      getValue: (item: unknown) => {
        if (!isRookRow(item)) return null;
        const provisioner = getField(item, 'provisioner') as string | undefined;
        if (!provisioner) return null;
        const type = provisioner.includes('.rbd.') ? 'rbd' : provisioner.includes('.cephfs.') ? 'cephfs' : 'unknown';
        return formatStorageType(type as 'rbd' | 'cephfs' | 'unknown');
      },
      render: (item: unknown) => {
        if (!isRookRow(item)) return <span>—</span>;
        const provisioner = getField(item, 'provisioner') as string | undefined;
        if (!provisioner) return <span>—</span>;
        const type = provisioner.includes('.rbd.') ? 'rbd' : provisioner.includes('.cephfs.') ? 'cephfs' : 'unknown';
        return <span style={{ color: '#1976d2', fontWeight: 500 }}>{formatStorageType(type as 'rbd' | 'cephfs' | 'unknown')}</span>;
      },
    },
    {
      label: 'Pool',
      getValue: (item: unknown) => getField(item, 'parameters', 'pool') as string | null ?? null,
      render: (item: unknown) => {
        if (!isRookRow(item)) return <span>—</span>;
        const pool = getField(item, 'parameters', 'pool') as string | undefined;
        return <span>{pool ?? '—'}</span>;
      },
    },
    {
      label: 'Cluster',
      getValue: (item: unknown) => getField(item, 'parameters', 'clusterID') as string | null ?? null,
      render: (item: unknown) => {
        if (!isRookRow(item)) return <span>—</span>;
        const clusterID = getField(item, 'parameters', 'clusterID') as string | undefined;
        if (!clusterID) return <span>—</span>;
        // Truncate long cluster IDs
        return <span title={clusterID}>{clusterID.length > 16 ? `${clusterID.slice(0, 16)}…` : clusterID}</span>;
      },
    },
  ];
}

export function buildPVColumns() {
  return [
    {
      label: 'Type',
      getValue: (item: unknown) => {
        if (!isRookPvRow(item)) return null;
        const driver = getField(item, 'spec', 'csi', 'driver') as string | undefined;
        if (!driver) return null;
        const type = driver.includes('.rbd.') ? 'rbd' : driver.includes('.cephfs.') ? 'cephfs' : 'unknown';
        return formatStorageType(type as 'rbd' | 'cephfs' | 'unknown');
      },
      render: (item: unknown) => {
        if (!isRookPvRow(item)) return <span>—</span>;
        const driver = getField(item, 'spec', 'csi', 'driver') as string | undefined;
        if (!driver) return <span>—</span>;
        const type = driver.includes('.rbd.') ? 'rbd' : driver.includes('.cephfs.') ? 'cephfs' : 'unknown';
        return <span style={{ color: '#1976d2', fontWeight: 500 }}>{formatStorageType(type as 'rbd' | 'cephfs' | 'unknown')}</span>;
      },
    },
    {
      label: 'Pool',
      getValue: (item: unknown) => getField(item, 'spec', 'csi', 'volumeAttributes', 'pool') as string | null ?? null,
      render: (item: unknown) => {
        if (!isRookPvRow(item)) return <span>—</span>;
        const pool = getField(item, 'spec', 'csi', 'volumeAttributes', 'pool') as string | undefined;
        return <span>{pool ?? '—'}</span>;
      },
    },
  ];
}
