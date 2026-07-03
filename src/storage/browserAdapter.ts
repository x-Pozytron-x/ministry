// Browser file download/upload storage adapter

import type { StorageAdapter } from './interfaces';
import type { EncryptedData } from '../crypto';
import { StorageError } from './interfaces';

export class BrowserStorageAdapter implements StorageAdapter {
  async save(filename: string, data: EncryptedData): Promise<void> {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Cleanup after download starts
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      throw new StorageError('Не удалось сохранить файл');
    }
  }

  async load(file: File): Promise<EncryptedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          if (!this.validateEncryptedData(data)) {
            throw new Error('Неверный формат файла');
          }

          resolve(data);
        } catch (error) {
          reject(new StorageError('Не удалось прочитать файл'));
        }
      };

      reader.onerror = () => reject(new StorageError('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }

  private validateEncryptedData(data: any): data is EncryptedData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.version === 'number' &&
      typeof data.salt === 'string' &&
      typeof data.iv === 'string' &&
      typeof data.data === 'string'
    );
  }
}
