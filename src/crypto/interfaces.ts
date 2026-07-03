// Crypto layer interfaces - abstraction over encryption implementation

export interface EncryptedData {
  version: number;
  salt: string;
  iv: string;
  data: string;
}

export interface CryptoService {
  encrypt(plainData: string, password: string): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData, password: string): Promise<string>;
  changePassword(encryptedData: EncryptedData, oldPassword: string, newPassword: string): Promise<EncryptedData>;
}

export class DecryptionError extends Error {
  constructor(message: string = 'Неверный пароль или повреждённые данные') {
    super(message);
    this.name = 'DecryptionError';
  }
}

export class EncryptionError extends Error {
  constructor(message: string = 'Ошибка шифрования') {
    super(message);
    this.name = 'EncryptionError';
  }
}
