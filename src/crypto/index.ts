// Web Crypto API implementation of CryptoService

import type { CryptoService, EncryptedData } from './interfaces';
import { DecryptionError, EncryptionError } from './interfaces';

const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

class WebCryptoService implements CryptoService {
  private generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  private stringToBuffer(str: string): ArrayBuffer {
    return new TextEncoder().encode(str);
  }

  private bufferToString(buffer: ArrayBuffer): string {
    return new TextDecoder().decode(buffer);
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const passwordBuffer = this.stringToBuffer(password);

    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(plainData: string, password: string): Promise<EncryptedData> {
    try {
      const salt = this.generateRandomBytes(SALT_LENGTH);
      const iv = this.generateRandomBytes(IV_LENGTH);

      const key = await this.deriveKey(password, salt);
      const dataBuffer = this.stringToBuffer(plainData);

      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        dataBuffer
      );

      return {
        version: 1,
        salt: this.bufferToBase64(salt),
        iv: this.bufferToBase64(iv),
        data: this.bufferToBase64(encryptedBuffer)
      };
    } catch (error) {
      throw new EncryptionError('Не удалось зашифровать данные');
    }
  }

  async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    try {
      const salt = new Uint8Array(this.base64ToBuffer(encryptedData.salt));
      const iv = new Uint8Array(this.base64ToBuffer(encryptedData.iv));
      const data = this.base64ToBuffer(encryptedData.data);

      const key = await this.deriveKey(password, salt);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        data
      );

      return this.bufferToString(decryptedBuffer);
    } catch (error) {
      throw new DecryptionError();
    }
  }

  async changePassword(
    encryptedData: EncryptedData,
    oldPassword: string,
    newPassword: string
  ): Promise<EncryptedData> {
    const decryptedData = await this.decrypt(encryptedData, oldPassword);
    return this.encrypt(decryptedData, newPassword);
  }
}

export const cryptoService: CryptoService = new WebCryptoService();

export * from './interfaces';
