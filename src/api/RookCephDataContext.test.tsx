import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Mock headlamp plugin APIs before importing the module under test
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: vi.fn().mockResolvedValue({ items: [] }),
  },
  K8s: {
    ResourceClasses: {
      StorageClass: {
        useList: vi.fn(() => [[], null]),
      },
      PersistentVolume: {
        useList: vi.fn(() => [[], null]),
      },
      PersistentVolumeClaim: {
        useList: vi.fn(() => [[], null]),
      },
    },
  },
}));

import { RookCephDataProvider, useRookCephContext } from './RookCephDataContext';

describe('useRookCephContext', () => {
  it('throws when used outside RookCephDataProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useRookCephContext());
    }).toThrow('useRookCephContext must be used within a RookCephDataProvider');

    spy.mockRestore();
  });

  it('returns context value when inside RookCephDataProvider', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RookCephDataProvider>{children}</RookCephDataProvider>
    );

    const { result } = renderHook(() => useRookCephContext(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.storageClasses).toBeInstanceOf(Array);
    expect(result.current.persistentVolumes).toBeInstanceOf(Array);
    expect(result.current.persistentVolumeClaims).toBeInstanceOf(Array);
    expect(result.current.cephClusters).toBeInstanceOf(Array);
    expect(result.current.blockPools).toBeInstanceOf(Array);
    expect(result.current.filesystems).toBeInstanceOf(Array);
    expect(result.current.objectStores).toBeInstanceOf(Array);
    expect(result.current.operatorPods).toBeInstanceOf(Array);
    expect(result.current.monPods).toBeInstanceOf(Array);
    expect(result.current.osdPods).toBeInstanceOf(Array);
    expect(result.current.mgrPods).toBeInstanceOf(Array);
    expect(typeof result.current.refresh).toBe('function');
  });
});
