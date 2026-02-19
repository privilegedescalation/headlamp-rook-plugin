/**
 * headlamp-rook-ceph-plugin — entry point.
 *
 * Registers sidebar entries, routes, detail view sections, table column
 * processors, and app bar action for Rook-Ceph visibility in Headlamp.
 */

import {
  registerDetailsViewSection,
  registerResourceTableColumnsProcessor,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { RookCephDataProvider } from './api/RookCephDataContext';
import BlockPoolsPage from './components/BlockPoolsPage';
import CephPodDetailSection from './components/CephPodDetailSection';
import FilesystemsPage from './components/FilesystemsPage';
import { buildPVColumns, buildStorageClassColumns } from './components/integrations/StorageClassColumns';
import ObjectStoresPage from './components/ObjectStoresPage';
import OverviewPage from './components/OverviewPage';
import PodsPage from './components/PodsPage';
import PVCDetailSection from './components/PVCDetailSection';
import PVDetailSection from './components/PVDetailSection';
import StorageClassesPage from './components/StorageClassesPage';
import VolumesPage from './components/VolumesPage';

// ---------------------------------------------------------------------------
// Sidebar entries
// ---------------------------------------------------------------------------

registerSidebarEntry({
  parent: null,
  name: 'rook-ceph',
  label: 'Rook-Ceph',
  url: '/rook-ceph',
  icon: 'mdi:database-cog',
});

registerSidebarEntry({
  parent: 'rook-ceph',
  name: 'rook-ceph-overview',
  label: 'Overview',
  url: '/rook-ceph',
  icon: 'mdi:view-dashboard',
});

registerSidebarEntry({
  parent: 'rook-ceph',
  name: 'rook-ceph-blockpools',
  label: 'Block Pools',
  url: '/rook-ceph/block-pools',
  icon: 'mdi:database',
});

registerSidebarEntry({
  parent: 'rook-ceph',
  name: 'rook-ceph-filesystems',
  label: 'Filesystems',
  url: '/rook-ceph/filesystems',
  icon: 'mdi:folder-network',
});

registerSidebarEntry({
  parent: 'rook-ceph',
  name: 'rook-ceph-objectstores',
  label: 'Object Stores',
  url: '/rook-ceph/object-stores',
  icon: 'mdi:bucket',
});

registerSidebarEntry({
  parent: 'rook-ceph',
  name: 'rook-ceph-pods',
  label: 'Pods',
  url: '/rook-ceph/pods',
  icon: 'mdi:cube-outline',
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

registerRoute({
  path: '/rook-ceph',
  sidebar: 'rook-ceph-overview',
  name: 'rook-ceph-overview',
  exact: true,
  component: () => (
    <RookCephDataProvider>
      <OverviewPage />
    </RookCephDataProvider>
  ),
});

registerRoute({
  path: '/rook-ceph/block-pools',
  sidebar: 'rook-ceph-blockpools',
  name: 'rook-ceph-blockpools',
  exact: true,
  component: () => (
    <RookCephDataProvider>
      <BlockPoolsPage />
    </RookCephDataProvider>
  ),
});

registerRoute({
  path: '/rook-ceph/filesystems',
  sidebar: 'rook-ceph-filesystems',
  name: 'rook-ceph-filesystems',
  exact: true,
  component: () => (
    <RookCephDataProvider>
      <FilesystemsPage />
    </RookCephDataProvider>
  ),
});

registerRoute({
  path: '/rook-ceph/object-stores',
  sidebar: 'rook-ceph-objectstores',
  name: 'rook-ceph-objectstores',
  exact: true,
  component: () => (
    <RookCephDataProvider>
      <ObjectStoresPage />
    </RookCephDataProvider>
  ),
});

// Storage Classes and Volumes pages accessible via direct URL
registerRoute({
  path: '/rook-ceph/storage-classes',
  sidebar: 'rook-ceph-overview',
  name: 'rook-ceph-storage-classes',
  exact: true,
  component: () => (
    <RookCephDataProvider>
      <StorageClassesPage />
    </RookCephDataProvider>
  ),
});

registerRoute({
  path: '/rook-ceph/volumes',
  sidebar: 'rook-ceph-overview',
  name: 'rook-ceph-volumes',
  exact: true,
  component: () => (
    <RookCephDataProvider>
      <VolumesPage />
    </RookCephDataProvider>
  ),
});

registerRoute({
  path: '/rook-ceph/pods',
  sidebar: 'rook-ceph-pods',
  name: 'rook-ceph-pods',
  exact: true,
  component: () => (
    <RookCephDataProvider>
      <PodsPage />
    </RookCephDataProvider>
  ),
});

// ---------------------------------------------------------------------------
// Detail view section — PVC pages
// ---------------------------------------------------------------------------

registerDetailsViewSection(({ resource }) => {
  if (resource?.kind !== 'PersistentVolumeClaim') return null;

  return (
    <RookCephDataProvider>
      <PVCDetailSection resource={resource} />
    </RookCephDataProvider>
  );
});

// ---------------------------------------------------------------------------
// Detail view section — PV pages
// ---------------------------------------------------------------------------

registerDetailsViewSection(({ resource }) => {
  if (resource?.kind !== 'PersistentVolume') return null;
  return <PVDetailSection resource={resource} />;
});

// ---------------------------------------------------------------------------
// Detail view section — Pod pages (Rook-Ceph daemon pods only)
// ---------------------------------------------------------------------------

registerDetailsViewSection(({ resource }) => {
  if (resource?.kind !== 'Pod') return null;
  return <CephPodDetailSection resource={resource} />;
});

// ---------------------------------------------------------------------------
// Table column processors — native StorageClass and PV tables
// ---------------------------------------------------------------------------

registerResourceTableColumnsProcessor(({ id, columns }) => {
  if (id === 'headlamp-storageclasses') {
    return [...columns, ...buildStorageClassColumns()];
  }
  if (id === 'headlamp-persistentvolumes') {
    return [...columns, ...buildPVColumns()];
  }
  return columns;
});

