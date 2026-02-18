import { describe, expect, it } from 'vitest';
import {
  filterRookCephPersistentVolumes,
  filterRookCephStorageClasses,
  formatAge,
  formatAccessModes,
  formatBytes,
  formatStorageType,
  healthToStatus,
  isKubeList,
  isPodReady,
  isRookCephPersistentVolume,
  isRookCephProvisioner,
  isRookCephStorageClass,
  parseStorageToBytes,
  phaseToStatus,
  ROOK_CEPH_CEPHFS_PROVISIONER,
  ROOK_CEPH_RBD_PROVISIONER,
  storageClassType,
  filterRookCephPVCs,
  findBoundPv,
  getPodRestarts,
} from './k8s';

describe('isRookCephProvisioner', () => {
  it('recognises default namespace RBD provisioner', () => {
    expect(isRookCephProvisioner(ROOK_CEPH_RBD_PROVISIONER)).toBe(true);
  });

  it('recognises default namespace CephFS provisioner', () => {
    expect(isRookCephProvisioner(ROOK_CEPH_CEPHFS_PROVISIONER)).toBe(true);
  });

  it('recognises custom namespace provisioners', () => {
    expect(isRookCephProvisioner('my-namespace.rbd.csi.ceph.com')).toBe(true);
    expect(isRookCephProvisioner('my-namespace.cephfs.csi.ceph.com')).toBe(true);
  });

  it('rejects non-rook provisioners', () => {
    expect(isRookCephProvisioner('tns.csi.io')).toBe(false);
    expect(isRookCephProvisioner('ebs.csi.aws.com')).toBe(false);
    expect(isRookCephProvisioner('')).toBe(false);
  });
});

describe('isRookCephStorageClass', () => {
  it('accepts a Rook-Ceph SC', () => {
    const sc = { metadata: { name: 'rook-ceph-block' }, provisioner: ROOK_CEPH_RBD_PROVISIONER };
    expect(isRookCephStorageClass(sc)).toBe(true);
  });

  it('rejects a non-Rook SC', () => {
    const sc = { metadata: { name: 'other' }, provisioner: 'tns.csi.io' };
    expect(isRookCephStorageClass(sc)).toBe(false);
  });

  it('rejects null / non-object', () => {
    expect(isRookCephStorageClass(null)).toBe(false);
    expect(isRookCephStorageClass('string')).toBe(false);
  });
});

describe('filterRookCephStorageClasses', () => {
  it('filters to Rook-Ceph only', () => {
    const items = [
      { metadata: { name: 'rook-block' }, provisioner: ROOK_CEPH_RBD_PROVISIONER },
      { metadata: { name: 'other' }, provisioner: 'tns.csi.io' },
      { metadata: { name: 'rook-cephfs' }, provisioner: ROOK_CEPH_CEPHFS_PROVISIONER },
    ];
    const result = filterRookCephStorageClasses(items);
    expect(result).toHaveLength(2);
    expect(result.map(s => s.metadata.name)).toEqual(['rook-block', 'rook-cephfs']);
  });
});

describe('storageClassType', () => {
  it('returns rbd for RBD provisioner', () => {
    const sc = { metadata: { name: 'x' }, provisioner: ROOK_CEPH_RBD_PROVISIONER };
    expect(storageClassType(sc)).toBe('rbd');
  });

  it('returns cephfs for CephFS provisioner', () => {
    const sc = { metadata: { name: 'x' }, provisioner: ROOK_CEPH_CEPHFS_PROVISIONER };
    expect(storageClassType(sc)).toBe('cephfs');
  });
});

describe('isRookCephPersistentVolume', () => {
  it('accepts a Rook-Ceph PV', () => {
    const pv = {
      metadata: { name: 'pvc-123' },
      spec: { csi: { driver: ROOK_CEPH_RBD_PROVISIONER } },
    };
    expect(isRookCephPersistentVolume(pv)).toBe(true);
  });

  it('rejects a non-Rook PV', () => {
    const pv = { metadata: { name: 'other' }, spec: { csi: { driver: 'tns.csi.io' } } };
    expect(isRookCephPersistentVolume(pv)).toBe(false);
  });

  it('rejects PVs with no spec.csi', () => {
    expect(isRookCephPersistentVolume({ metadata: { name: 'x' }, spec: {} })).toBe(false);
  });
});

describe('filterRookCephPersistentVolumes', () => {
  it('returns only Rook-Ceph PVs', () => {
    const items = [
      { metadata: { name: 'pv-a' }, spec: { csi: { driver: ROOK_CEPH_RBD_PROVISIONER } } },
      { metadata: { name: 'pv-b' }, spec: { csi: { driver: 'tns.csi.io' } } },
    ];
    expect(filterRookCephPersistentVolumes(items)).toHaveLength(1);
  });
});

describe('filterRookCephPVCs', () => {
  it('returns PVCs bound to Rook-Ceph PVs', () => {
    const pvs = [
      {
        metadata: { name: 'pv-1' },
        spec: {
          csi: { driver: ROOK_CEPH_RBD_PROVISIONER },
          claimRef: { name: 'my-pvc', namespace: 'default' },
        },
      },
    ];
    const pvcs = [
      { metadata: { name: 'my-pvc', namespace: 'default' }, spec: {} },
      { metadata: { name: 'other-pvc', namespace: 'default' }, spec: {} },
    ];
    const result = filterRookCephPVCs(pvcs as never, pvs as never);
    expect(result).toHaveLength(1);
    expect(result[0].metadata.name).toBe('my-pvc');
  });
});

describe('findBoundPv', () => {
  it('finds the matching PV', () => {
    const pv = {
      metadata: { name: 'pv-1' },
      spec: {
        csi: { driver: ROOK_CEPH_RBD_PROVISIONER },
        claimRef: { name: 'my-pvc', namespace: 'default' },
      },
    };
    const pvc = { metadata: { name: 'my-pvc', namespace: 'default' }, spec: {} };
    const result = findBoundPv(pvc as never, [pv] as never);
    expect(result?.metadata.name).toBe('pv-1');
  });
});

describe('healthToStatus', () => {
  it('maps health strings correctly', () => {
    expect(healthToStatus('HEALTH_OK')).toBe('success');
    expect(healthToStatus('HEALTH_WARN')).toBe('warning');
    expect(healthToStatus('HEALTH_ERR')).toBe('error');
    expect(healthToStatus(undefined)).toBe('error');
  });
});

describe('phaseToStatus', () => {
  it('maps phase strings correctly', () => {
    expect(phaseToStatus('Ready')).toBe('success');
    expect(phaseToStatus('Bound')).toBe('success');
    expect(phaseToStatus('Progressing')).toBe('warning');
    expect(phaseToStatus('Pending')).toBe('warning');
    expect(phaseToStatus('Failed')).toBe('error');
    expect(phaseToStatus(undefined)).toBe('error');
  });
});

describe('isPodReady', () => {
  it('returns true when Ready condition is True', () => {
    const pod = {
      metadata: { name: 'p' },
      status: { conditions: [{ type: 'Ready', status: 'True' }] },
    };
    expect(isPodReady(pod as never)).toBe(true);
  });

  it('returns false when Ready condition is False', () => {
    const pod = {
      metadata: { name: 'p' },
      status: { conditions: [{ type: 'Ready', status: 'False' }] },
    };
    expect(isPodReady(pod as never)).toBe(false);
  });
});

describe('getPodRestarts', () => {
  it('sums restart counts across containers', () => {
    const pod = {
      metadata: { name: 'p' },
      status: {
        containerStatuses: [
          { name: 'c1', ready: true, restartCount: 2 },
          { name: 'c2', ready: true, restartCount: 3 },
        ],
      },
    };
    expect(getPodRestarts(pod as never)).toBe(5);
  });
});

describe('formatAge', () => {
  it('returns unknown for undefined', () => {
    expect(formatAge(undefined)).toBe('unknown');
  });

  it('formats seconds', () => {
    const ts = new Date(Date.now() - 30_000).toISOString();
    expect(formatAge(ts)).toBe('30s');
  });

  it('formats minutes', () => {
    const ts = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatAge(ts)).toBe('5m');
  });

  it('formats hours', () => {
    const ts = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(formatAge(ts)).toBe('3h');
  });

  it('formats days', () => {
    const ts = new Date(Date.now() - 2 * 86400_000).toISOString();
    expect(formatAge(ts)).toBe('2d');
  });
});

describe('formatAccessModes', () => {
  it('abbreviates access modes', () => {
    expect(formatAccessModes(['ReadWriteOnce'])).toBe('RWO');
    expect(formatAccessModes(['ReadWriteMany', 'ReadOnlyMany'])).toBe('RWX, ROX');
  });

  it('returns — for empty', () => {
    expect(formatAccessModes([])).toBe('—');
    expect(formatAccessModes(undefined)).toBe('—');
  });
});

describe('formatBytes', () => {
  it('formats various byte sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KiB');
    expect(formatBytes(1024 ** 2)).toBe('1.0 MiB');
    expect(formatBytes(1024 ** 3)).toBe('1.0 GiB');
    expect(formatBytes(1024 ** 4)).toBe('1.0 TiB');
  });
});

describe('parseStorageToBytes', () => {
  it('parses Gi suffix', () => {
    expect(parseStorageToBytes('10Gi')).toBe(10 * 1024 ** 3);
  });

  it('parses Mi suffix', () => {
    expect(parseStorageToBytes('512Mi')).toBe(512 * 1024 ** 2);
  });

  it('returns 0 for invalid', () => {
    expect(parseStorageToBytes('invalid')).toBe(0);
  });
});

describe('formatStorageType', () => {
  it('formats storage types', () => {
    expect(formatStorageType('rbd')).toBe('Block (RBD)');
    expect(formatStorageType('cephfs')).toBe('Filesystem (CephFS)');
    expect(formatStorageType('unknown')).toBe('Unknown');
  });
});

describe('isKubeList', () => {
  it('accepts objects with items array', () => {
    expect(isKubeList({ items: [] })).toBe(true);
    expect(isKubeList({ items: [1, 2] })).toBe(true);
  });

  it('rejects non-list shapes', () => {
    expect(isKubeList(null)).toBe(false);
    expect(isKubeList({})).toBe(false);
    expect(isKubeList({ items: 'not-array' })).toBe(false);
  });
});
