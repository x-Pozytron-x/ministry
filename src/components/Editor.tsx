import { useState } from 'react';
import type { DecryptedData } from '../types';
import { cryptoService } from '../crypto';
import { downloadFile } from '../utils/fileUtils';

interface EditorProps {
  initialData: DecryptedData;
  currentPassword: string;
}

export default function Editor({ initialData, currentPassword }: EditorProps) {
  const [data, setData] = useState<DecryptedData>(initialData);
  const [password, setPassword] = useState(currentPassword);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setData({ text: e.target.value });
  };

  const handleDownload = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const plainData = JSON.stringify(data);
      const encryptedData = await cryptoService.encrypt(plainData, password);
      downloadFile(encryptedData);
      setSuccess('Файл успешно скачан');
    } catch (err) {
      setError('Ошибка при шифровании данных');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (oldPassword !== password) {
      setError('Неверный текущий пароль');
      return;
    }

    if (newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      setPassword(newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowChangePassword(false);
      setSuccess('Пароль успешно изменён. Не забудьте скачать файл с новым паролем');
    } catch (err) {
      setError('Ошибка при смене пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editor">
      <div className="header">
        <h1>CongrArk</h1>
        <div className="button-group">
          <button onClick={handleDownload} disabled={loading}>
            Скачать зашифрованный файл
          </button>
          <button onClick={() => setShowChangePassword(!showChangePassword)} disabled={loading}>
            {showChangePassword ? 'Отмена' : 'Изменить пароль'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showChangePassword && (
        <div className="change-password">
          <h3>Смена пароля</h3>
          <input
            type="password"
            placeholder="Текущий пароль"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Подтвердите новый пароль"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            disabled={loading}
          />
          <button onClick={handleChangePassword} disabled={loading}>
            {loading ? 'Изменение...' : 'Подтвердить'}
          </button>
        </div>
      )}

      <textarea
        value={data.text}
        onChange={handleTextChange}
        placeholder="Введите текст..."
        disabled={loading}
      />
    </div>
  );
}
