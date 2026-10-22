// IndexedDB storage service for encrypted congregation data

import type { EncryptedData } from '../crypto';
import { cryptoService } from '../crypto';
import { StorageError } from './interfaces';

const DB_NAME = 'CongrArkDB';
const DB_VERSION = 1;
const STORE_NAME = 'encryptedStore';
const DATA_KEY = 'congregation';

class IndexedDbService {
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new StorageError('Не удалось открыть IndexedDB'));
    });
  }

  async set(plainData: string, password: string): Promise<void> {
    const encrypted = await cryptoService.encrypt(plainData, password);
    const db = await this.openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(encrypted, DATA_KEY);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(new StorageError('Не удалось сохранить данные в IndexedDB'));
      };
    });
  }

  async get(password: string): Promise<string | null> {
    const encrypted = await this.getRaw();
    if (!encrypted) {
      return null;
    }

    return cryptoService.decrypt(encrypted, password);
  }

  async clear(): Promise<void> {
    const db = await this.openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(DATA_KEY);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(new StorageError('Не удалось очистить данные в IndexedDB'));
      };
    });
  }

  async hasData(): Promise<boolean> {
    const raw = await this.getRaw();
    return raw !== null;
  }

  private async getRaw(): Promise<EncryptedData | null> {
    const db = await this.openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(DATA_KEY);

      request.onsuccess = () => {
        db.close();
        const result: unknown = request.result;
        if (result === undefined) {
          resolve(null);
          return;
        }

        if (!this.validateEncryptedData(result)) {
          reject(new StorageError('Повреждённые данные в IndexedDB'));
          return;
        }

        resolve(result);
      };
      request.onerror = () => {
        db.close();
        reject(new StorageError('Не удалось прочитать данные из IndexedDB'));
      };
    });
  }

  private validateEncryptedData(data: unknown): data is EncryptedData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as Record<string, unknown>).version === 'number' &&
      typeof (data as Record<string, unknown>).salt === 'string' &&
      typeof (data as Record<string, unknown>).iv === 'string' &&
      typeof (data as Record<string, unknown>).data === 'string'
    );
  }
}

export const indexedDbService = new IndexedDbService();
