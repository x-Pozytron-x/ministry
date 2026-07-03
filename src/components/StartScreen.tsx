// Enhanced StartScreen with drag-and-drop support

import { useState, useRef } from 'react';
import type { CongregationData } from '../domain';
import type { ApplicationService } from '../application';

interface StartScreenProps {
  applicationService: ApplicationService;
  onUnlock: (data: CongregationData, password: string) => void;
}

export default function StartScreen({ applicationService, onUnlock }: StartScreenProps) {
  const [mode, setMode] = useState<'choice' | 'create' | 'open'>('choice');
  const [congregationName, setCongregationName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (mode === 'choice') {
    return (
      <div className="start-screen">
        <div className="logo">
          <h1>CongrArk</h1>
          <p>Безопасное локальное хранение данных</p>
        </div>
        <div className="button-group">
          <button onClick={() => setMode('create')} className="primary">
            Создать новый файл
          </button>
          <button onClick={() => setMode('open')} className="secondary">
            Открыть существующий файл
          </button>
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
              <span className="file-icon">📄</span>
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
            </div>
          ) : (
            <div className="drop-zone-content">
              <span className="upload-icon">📁</span>
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
