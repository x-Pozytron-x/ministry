// Enhanced StartScreen with drag-and-drop support

import { useState, useRef } from 'react';
import type { CongregationData } from '../domain';
import { createEmptyCongregationData } from '../domain';
import type { ApplicationService } from '../application';
import { indexedDbService } from '../storage';
import { DecryptionError } from '../crypto';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICON_FILE, ICON_FOLDER } from '../config/icons';
import {
  APP_VERSION,
  APP_STATUS,
  APP_AUTHOR_TELEGRAM,
  APP_AUTHOR_TELEGRAM_URL
} from '../config';

interface StartScreenProps {
  applicationService: ApplicationService;
  onUnlock: (data: CongregationData, password: string, mode?: 'guest' | 'admin') => void;
}

export default function StartScreen({ applicationService, onUnlock }: StartScreenProps) {
  const [mode, setMode] = useState<'mode-select' | 'choice' | 'create' | 'open' | 'admin-password' | 'admin-no-db' | 'admin-import-json' | 'admin-create-db'>('mode-select');
  const [congregationName, setCongregationName] = useState('');
  const [newDbName, setNewDbName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [importFilePassword, setImportFilePassword] = useState('');
  const [userMode, setUserMode] = useState<'guest' | 'admin'>('guest');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNewDatabase = async () => {
    if (!newDbName || !newDbName.trim()) {
      setError('Название собрания обязательно');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = createEmptyCongregationData();
      data.settings.name = newDbName.trim();
      const dataJson = JSON.stringify(data);

      await indexedDbService.set(dataJson, adminPassword);

      setUserMode('admin');
      onUnlock(data, adminPassword, 'admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания базы данных');
    } finally {
      setLoading(false);
    }
  };

  const handleImportJson = async () => {
    if (!selectedFile) {
      setError('Выберите JSON файл для импорта');
      return;
    }

    if (!importFilePassword) {
      setError('Введите пароль импортируемого файла');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Используем существующий механизм openFile для расшифровки и валидации
      const data = await applicationService.openFile({
        file: selectedFile,
        password: importFilePassword
      });

      // Сохраняем расшифрованные данные в IndexedDB с паролем Admin
      const dataJson = JSON.stringify(data);
      await indexedDbService.set(dataJson, adminPassword);

      setUserMode('admin');
      onUnlock(data, adminPassword, 'admin');
    } catch (err) {
      setError(
        err instanceof DecryptionError
          ? 'Неверный пароль импортируемого файла'
          : err instanceof Error
            ? err.message
            : 'Ошибка импорта'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    setUserMode('guest');
    setMode('choice');
  };

  const handleAdminPasswordSubmit = async () => {
    if (!adminPassword) {
      setError('Введите пароль');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const hasExistingData = await indexedDbService.hasData();

      if (!hasExistingData) {
        setMode('admin-no-db');
        return;
      }

      const decryptedJson = await indexedDbService.get(adminPassword);

      if (decryptedJson === null) {
        setError('Не удалось прочитать данные');
        return;
      }

      // Пароль правильный — данные расшифрованы.
      // Теперь проверяем валидацию отдельно, чтобы не путать с ошибкой пароля
      try {
        const data = await applicationService.parseDecryptedJson(decryptedJson);
        setUserMode('admin');
        onUnlock(data, adminPassword, 'admin');
      } catch (validationErr) {
        setError(
          validationErr instanceof Error
            ? 'Данные повреждены или невалидны: ' + validationErr.message
            : 'Ошибка валидации данных'
        );
      }
    } catch (err) {
      // Ошибка расшифровки (неверный пароль или повреждённые данные)
      const isDecryptError = err instanceof DecryptionError || (err instanceof Error && err.name === 'DecryptionError');
      setError(
        isDecryptError
          ? 'Неверный пароль'
          : err instanceof Error
            ? err.message
            : 'Ошибка входа'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setError('');

    if (!congregationName.trim()) {
      setError('Название собрания обязательно');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      const data = await applicationService.createNewFile({
        password,
        initialData: {
          version: 1,
          settings: {
            name: congregationName.trim(),
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
        }
      });
      onUnlock(data, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании файла');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Пожалуйста, выберите JSON файл');
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleOpenFile = async () => {
    if (!selectedFile) {
      setError('Выберите файл');
      return;
    }

    if (!password) {
      setError('Введите пароль');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await applicationService.openFile({
        file: selectedFile,
        password
      });
      onUnlock(data, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка расшифрования');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'mode-select') {
    return (
      <div className="start-screen">
        <div className="logo">
          <img src="/logo.png" alt="KeepCong" className="start-logo" />
          <h1>KeepCong</h1>
          <p>Выберите режим работы</p>
        </div>
        <div className="button-group">
          <button onClick={handleGuestMode} className="primary">
            Guest
          </button>
          <button onClick={() => setMode('admin-password')} className="secondary">
            Admin
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'admin-password') {
    return (
      <div className="start-screen">
        <h2>Вход администратора</h2>
        <div className="form">
          <div className="form-group">
            <label>Пароль администратора</label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              disabled={loading}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdminPasswordSubmit()}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="button-group">
            <button onClick={handleAdminPasswordSubmit} disabled={loading} className="primary">
              Подтвердить
            </button>
            <button onClick={() => { setMode('mode-select'); setAdminPassword(''); setError(''); }} disabled={loading} className="secondary">
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'admin-no-db') {
    return (
      <div className="start-screen">
        <h2>База данных не найдена</h2>
        <p>Локальная зашифрованная база ещё не создана. Выберите действие:</p>
        {error && <div className="error">{error}</div>}
        <div className="button-group">
          <button onClick={() => setMode('admin-import-json')} className="primary" disabled={loading}>
            Импортировать JSON
          </button>
          <button onClick={() => setMode('admin-create-db')} className="secondary" disabled={loading}>
            {loading ? 'Создание...' : 'Создать новую базу'}
          </button>
        </div>
        <div className="button-group">
          <button onClick={() => { setMode('mode-select'); setAdminPassword(''); setError(''); }} className="secondary" disabled={loading}>
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'admin-create-db') {
    return (
      <div className="start-screen">
        <h2>Создать новую базу</h2>
        <div className="form">
          <div className="form-group">
            <label>Название собрания *</label>
            <input
              type="text"
              placeholder="Введите название собрания"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              disabled={loading}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewDatabase()}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="button-group">
            <button onClick={handleCreateNewDatabase} disabled={loading} className="primary">
              {loading ? 'Создание...' : 'Создать базу'}
            </button>
            <button onClick={() => { setMode('admin-no-db'); setNewDbName(''); setError(''); }} disabled={loading} className="secondary">
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'admin-import-json') {
    return (
      <div className="start-screen">
        <h2>Импорт JSON файла</h2>
        <div className="form">
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            {selectedFile ? (
              <div className="file-info">
                <span className="file-icon"><FontAwesomeIcon icon={ICON_FILE} /></span>
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
              </div>
            ) : (
              <div className="drop-zone-content">
                <span className="upload-icon"><FontAwesomeIcon icon={ICON_FOLDER} /></span>
                <p>Перетащите JSON файл сюда или нажмите для выбора</p>
                <small>.json файлы</small>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="form-group">
              <label>Пароль импортируемого файла</label>
              <input
                type="password"
                placeholder="Введите пароль JSON файла"
                value={importFilePassword}
                onChange={(e) => setImportFilePassword(e.target.value)}
                disabled={loading}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleImportJson()}
              />
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <div className="button-group">
            <button
              onClick={handleImportJson}
              disabled={loading || !selectedFile || !importFilePassword}
              className="primary"
            >
              {loading ? 'Импорт...' : 'Импортировать'}
            </button>
            <button onClick={() => { setMode('admin-no-db'); setSelectedFile(null); setImportFilePassword(''); setError(''); }} disabled={loading} className="secondary">
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'choice') {
    return (
      <div className="start-screen">
        <div className="logo">
          <img src="/logo.png" alt="KeepCong" className="start-logo" />
          <h1>KeepCong</h1>
          <p>
            Безопасное локальное хранение данных собрания
            <span className="mode-badge">{userMode === 'admin' ? 'Admin' : 'Guest'}</span>
          </p>
        </div>
        <div className="button-group">
          <button onClick={() => setMode('create')} className="primary">
            Создать новый файл
          </button>
          <button onClick={() => setMode('open')} className="secondary">
            Открыть существующий файл
          </button>
        </div>

        <div className="start-about">
          <div className="about-card">
            <h3>О приложении</h3>
            <p>KeepCong — приложение для управления данных собрания. Все сведения о возвещателях, отчётах служения и посещаемость хранятся локально на вашем устройстве в зашифрованном виде.</p>
            <p>Приложение работает полностью офлайн и не требует подключения к интернету для повседневного использования.</p>
          </div>

          <div className="about-card about-card-compact">
            <div className="about-row">
              <span className="about-label">Версия:</span>
              <span>{APP_VERSION}</span>
            </div>
            <div className="about-row">
              <span className="about-label">Статус:</span>
              <span>{APP_STATUS}</span>
            </div>
            <div className="about-row">
              <span className="about-label">Автор:</span>
              <a
                href={APP_AUTHOR_TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="about-link"
              >
                {APP_AUTHOR_TELEGRAM}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="start-screen">
        <h2>Создать новый файл</h2>
        <div className="form">
          <div className="form-group">
            <label>Название собрания *</label>
            <input
              type="text"
              placeholder="Введите название собрания"
              value={congregationName}
              onChange={(e) => setCongregationName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Пароль *</label>
            <input
              type="password"
              placeholder="Минимум 8 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Подтвердите пароль *</label>
            <input
              type="password"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="button-group">
            <button onClick={handleCreateNew} disabled={loading} className="primary">
              {loading ? 'Создание...' : 'Создать'}
            </button>
            <button onClick={() => setMode('choice')} disabled={loading} className="secondary">
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="start-screen">
      <h2>Открыть файл</h2>
      <div className="form">
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          {selectedFile ? (
            <div className="file-info">
              <span className="file-icon"><FontAwesomeIcon icon={ICON_FILE} /></span>
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
            </div>
          ) : (
            <div className="drop-zone-content">
              <span className="upload-icon"><FontAwesomeIcon icon={ICON_FOLDER} /></span>
              <p>Перетащите файл сюда или нажмите для выбора</p>
              <small>.json файлы</small>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleOpenFile()}
            />
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div className="button-group">
          <button
            onClick={handleOpenFile}
            disabled={loading || !selectedFile || !password}
            className="primary"
          >
            {loading ? 'Открытие...' : 'Открыть'}
          </button>
          <button onClick={() => setMode('choice')} disabled={loading} className="secondary">
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
