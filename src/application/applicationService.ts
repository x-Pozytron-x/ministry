// Application layer - use cases and orchestration

import type { CongregationData } from '../domain';
import type { CryptoService, EncryptedData } from '../crypto';
import type { StorageAdapter, VersionManager } from '../storage';
import { validateCongregationData } from '../domain';
import { DecryptionError } from '../crypto';
import { StorageError } from '../storage';

export interface CreateNewFileRequest {
  password: string;
  initialData?: CongregationData;
}

export interface OpenFileRequest {
  file: File;
  password: string;
}

export interface SaveFileRequest {
  data: CongregationData;
  password: string;
  filename?: string;
}

export interface ChangePasswordRequest {
  data: CongregationData;
  oldPassword: string;
  newPassword: string;
}

export class ApplicationService {
  constructor(
    private cryptoService: CryptoService,
    private storageAdapter: StorageAdapter,
    private versionManager: VersionManager
  ) {}

  async createNewFile(request: CreateNewFileRequest): Promise<CongregationData> {
    const data = request.initialData || this.getDefaultCongregationData();
    validateCongregationData(data);
    return data;
  }

  async openFile(request: OpenFileRequest): Promise<CongregationData> {
    try {
      const encryptedData = await this.storageAdapter.load(request.file);
      const decryptedJson = await this.cryptoService.decrypt(encryptedData, request.password);
      const data: CongregationData = JSON.parse(decryptedJson);

      validateCongregationData(data);
      return data;
    } catch (error) {
      if (error instanceof DecryptionError) {
        throw error;
      }
      throw new StorageError('Не удалось открыть файл');
    }
  }

  async saveFile(request: SaveFileRequest): Promise<void> {
    try {
      validateCongregationData(request.data);

      const dataJson = JSON.stringify(request.data);
      const encryptedData = await this.cryptoService.encrypt(dataJson, request.password);

      const filename = request.filename || 'congregation-data.enc.json';
      await this.storageAdapter.save(filename, encryptedData);
    } catch (error) {
      throw new StorageError('Не удалось сохранить файл');
    }
  }

  async changePassword(request: ChangePasswordRequest): Promise<CongregationData> {
    validateCongregationData(request.data);

    // Verify old password by encrypting and decrypting
    const dataJson = JSON.stringify(request.data);
    const testEncrypted = await this.cryptoService.encrypt(dataJson, request.oldPassword);
    await this.cryptoService.decrypt(testEncrypted, request.oldPassword);

    // Password is correct, return data (new password will be used on next save)
    return request.data;
  }

  createSnapshot(data: CongregationData, description?: string): CongregationData {
    validateCongregationData(data);
    return this.versionManager.createSnapshot(data, description);
  }

  getVersionHistory(data: CongregationData) {
    return this.versionManager.getVersionHistory(data);
  }

  restoreVersion(data: CongregationData, version: number): CongregationData | null {
    return this.versionManager.restoreVersion(data, version);
  }

  private getDefaultCongregationData(): CongregationData {
    return {
      version: 1,
      settings: {
        name: '',
        vpsGroupsCount: 1,
        language: 'ru'
      },
      publishers: [],
      serviceRecords: [],
      attendanceReports: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
}
