// Storage layer interfaces

import type { CongregationData } from '../domain';
import type { EncryptedData } from '../crypto';

export interface StorageAdapter {
  save(filename: string, data: EncryptedData): Promise<void>;
  load(file: File): Promise<EncryptedData>;
}

export interface VersionManager {
  createSnapshot(data: CongregationData, changeDescription?: string): CongregationData;
  getVersionHistory(data: CongregationData): Array<{ version: number; timestamp: string; changeDescription?: string }>;
  restoreVersion(data: CongregationData, version: number): CongregationData | null;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}
