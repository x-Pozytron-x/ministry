import type { EncryptedFile } from '../types';

// Скачивание файла
export function downloadFile(data: EncryptedFile, filename: string = 'secure-data.enc.json'): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Чтение файла
export function readFile(file: File): Promise<EncryptedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.version || !data.salt || !data.iv || !data.data) {
          throw new Error('Неверный формат файла');
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Не удалось прочитать файл'));
      }
    };

    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}
