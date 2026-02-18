/**
 * AppBarClusterBadge — registerAppBarAction cluster health badge.
 *
 * Displays "rook-ceph: HEALTH_OK" in the Headlamp top nav bar.
 * Color-coded: green=HEALTH_OK, orange=HEALTH_WARN, red=HEALTH_ERR.
 * Returns null if no CephCluster found (no clutter on unmanaged clusters).
 *
 * Wrapped in RookCephDataProvider at registration time (index.tsx).
 */

import React from 'react';
import { useHistory } from 'react-router-dom';
import { useRookCephContext } from '../api/RookCephDataContext';

function getHealthColor(health: string | undefined): string {
  switch (health) {
    case 'HEALTH_OK': return '#4caf50';
    case 'HEALTH_WARN': return '#ff9800';
    case 'HEALTH_ERR': return '#f44336';
    default: return '#9e9e9e';
  }
}

export default function AppBarClusterBadge() {
  const { cephClusters, loading } = useRookCephContext();
  const history = useHistory();

  if (loading || cephClusters.length === 0) return null;

  const primary = cephClusters[0];
  const health = primary?.status?.ceph?.health;

  const color = getHealthColor(health);
  const label = health ?? 'Unknown';
  const ariaLabel = `Rook-Ceph cluster health: ${label}`;

  const handleClick = () => {
    history.push('/rook-ceph');
  };

  return (
    <button
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        marginRight: '8px',
        padding: '4px 12px',
        borderRadius: '16px',
        border: 'none',
        backgroundColor: color,
        color: 'white',
        fontSize: '13px',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span>rook-ceph: {label}</span>
    </button>
  );
}
