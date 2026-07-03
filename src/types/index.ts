export interface EncryptedFile {
  version: number;
  salt: string;
  iv: string;
  data: string;
}

export interface DecryptedData {
  text: string;
}

export interface CryptoParams {
  salt: Uint8Array;
  iv: Uint8Array;
  iterations: number;
}
