// Version management implementation

import type { VersionManager } from './interfaces';
import type { CongregationData, VersionedCongregationData, DataVersion } from '../domain';

const MAX_VERSIONS = 10;

export class SimpleVersionManager implements VersionManager {
  createSnapshot(data: CongregationData, changeDescription?: string): CongregationData {
    const versionedData = data as VersionedCongregationData;
    const currentHistory = versionedData.versionHistory || [];

    const newVersion: DataVersion = {
      version: data.version,
      timestamp: new Date().toISOString(),
      changeDescription,
      snapshot: JSON.parse(JSON.stringify(data)) // Deep clone
    };

    // Keep only last MAX_VERSIONS
    const updatedHistory = [...currentHistory, newVersion].slice(-MAX_VERSIONS);

    return {
      ...data,
      version: data.version + 1,
      versionHistory: updatedHistory
    } as CongregationData;
  }

  getVersionHistory(data: CongregationData): Array<{ version: number; timestamp: string; changeDescription?: string }> {
    const versionedData = data as VersionedCongregationData;
    return (versionedData.versionHistory || []).map(v => ({
      version: v.version,
      timestamp: v.timestamp,
      changeDescription: v.changeDescription
    }));
  }

  restoreVersion(data: CongregationData, version: number): CongregationData | null {
    const versionedData = data as VersionedCongregationData;
    const targetVersion = versionedData.versionHistory?.find(v => v.version === version);

    if (!targetVersion?.snapshot) {
      return null;
    }

    return {
      ...targetVersion.snapshot,
      version: data.version + 1,
      metadata: {
        ...targetVersion.snapshot.metadata,
        updatedAt: new Date().toISOString()
      }
    };
  }
}
