// Application layer - use cases and orchestration

import type { CongregationData } from '../domain';
import type { CryptoService } from '../crypto';
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
    console.log('📂 OPEN FILE START');
    try {
      console.log('📄 File selected: ' + request.file.name);
      console.log('📏 File size: ' + request.file.size + ' bytes');

      console.log('🔓 Decryption started');
      const encryptedData = await this.storageAdapter.load(request.file);
      const decryptedJson = await this.cryptoService.decrypt(encryptedData, request.password);
      console.log('✅ Decryption successful');

      console.log('📦 JSON parsing started');
      const raw = JSON.parse(decryptedJson);
      console.log('✅ JSON parsed');

      // Migrate legacy shapes (in-memory) to canonical schema before validation.
      // This preserves backward compatibility with older saved JSON files.
      const { migrateCongregationData } = await import('../domain');
      const data = migrateCongregationData(raw);

      console.log('🔍 Validation started');
      this.validateLoadedData(data);
      console.log('✅ Validation successful');

      console.log('🎉 File loaded');
      return data;
    } catch (error) {
      if (error instanceof DecryptionError) {
        console.error('❌ DECRYPTION FAILED', error);
        throw error;
      }
      console.error('❌ OPEN FILE FAILED', error);
      throw new StorageError('Не удалось открыть файл');
    }
  }

  private validateLoadedData(data: CongregationData): void {
    validateCongregationData(data);
  }

  async saveFile(request: SaveFileRequest): Promise<void> {
    console.log('🚀 SAVE START');
    try {
      console.log('📦 Data validation started');
      validateCongregationData(request.data);
      console.log('✅ Validation successful');

      console.log('📄 JSON serialization started');
      const dataJson = JSON.stringify(request.data);
      console.log('✅ JSON created (' + new Blob([dataJson]).size + ' bytes)');

      console.log('🔐 Encryption started');
      const encryptedData = await this.cryptoService.encrypt(dataJson, request.password);
      console.log('✅ Encryption successful (encrypted size: ' + JSON.stringify(encryptedData).length + ' bytes)');

      const filename = request.filename || 'congregation-data.enc.json';
      console.log('💾 Browser save started (filename: ' + filename + ')');
      await this.storageAdapter.save(filename, encryptedData);
      console.log('✅ File save triggered');
    } catch (error) {
      console.error('❌ SAVE FAILED', error);
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
      vpsGroups: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
}
