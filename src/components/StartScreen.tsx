// StartScreen: welcome, database choice, database creation and file loading

import { useEffect, useRef, useState } from 'react';
import type { CongregationData } from '../domain';
import { createEmptyCongregationData } from '../domain';
import type { ApplicationService } from '../application';
import { indexedDbService } from '../storage';
import { DecryptionError } from '../crypto';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ICON_FILE,
  ICON_FOLDER,
  ICON_FEATURE_SECURITY,
  ICON_FEATURE_CONVENIENCE,
  ICON_FEATURE_EXPORT
} from '../config/icons';
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

const WEEKDAYS = [
  { value: 'Monday', label: 'Понедельник' },
  { value: 'Tuesday', label: 'Вторник' },
  { value: 'Wednesday', label: 'Среда' },
  { value: 'Thursday', label: 'Четверг' },
  { value: 'Friday', label: 'Пятница' }
] as const;

const WEEKENDS = [
  { value: 'Saturday', label: 'Суббота' },
  { value: 'Sunday', label: 'Воскресенье' }
] as const;

export default function StartScreen({ applicationService, onUnlock }: StartScreenProps) {
  const [mode, setMode] = useState<'welcome' | 'choice' | 'create' | 'file-open'>('welcome');
  const [newDbName, setNewDbName] = useState('');
  const [password, setPassword] = useState('');
  const [groupCount, setGroupCount] = useState('1');
  const [weekdayMeetingDay, setWeekdayMeetingDay] = useState<string>('Tuesday');
  const [weekendMeetingDay, setWeekendMeetingDay] = useState<string>('Saturday');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDatabase, setHasDatabase] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== 'choice' || hasDatabase !== null) return;

    let isCurrent = true;
    const checkDatabase = async () => {
      try {
        const exists = await indexedDbService.databaseExists();
        if (isCurrent) setHasDatabase(exists);
      } catch (err) {
        if (!isCurrent) return;
        setError(err instanceof Error ? err.message : 'Не удалось проверить базу данных');
        setHasDatabase(true);
      }
    };
    void checkDatabase();

    return () => {
      isCurrent = false;
    };
  }, [mode, hasDatabase]);

  const resetState = () => {
    setNewDbName('');
    setPassword('');
    setGroupCount('1');
    setWeekdayMeetingDay('Tuesday');
    setWeekendMeetingDay('Saturday');
    setSelectedFile(null);
    setError('');
    setHasDatabase(null);
  };

  const readFileAsText = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Не удалось прочитать содержимое файла'));
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsText(file);
  });

  const handleCreateDb = async () => {
    const parsedGroupCount = Number(groupCount);
    if (!newDbName.trim()) {
      setError('Введите название собрания');
      return;
    }
    if (!password) {
      setError('Введите мастер-пароль');
      return;
    }
    if (!Number.isInteger(parsedGroupCount) || parsedGroupCount < 1 || parsedGroupCount > 50) {
      setError('Количество групп должно быть от 1 до 50');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = createEmptyCongregationData();
      data.settings.name = newDbName.trim();
      data.settings.vpsGroupsCount = parsedGroupCount;
      data.settings.weekdayMeetingDay = weekdayMeetingDay;
      data.settings.weekendMeetingDay = weekendMeetingDay;
      await indexedDbService.set(JSON.stringify(data), password);
      onUnlock(data, password, 'admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания базы данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!password) {
      setError('Введите пароль администратора');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const decryptedJson = await indexedDbService.get(password);
      if (decryptedJson === null) {
        setError('База данных не найдена');
        return;
      }
      const data = await applicationService.parseDecryptedJson(decryptedJson);
      onUnlock(data, password, 'admin');
    } catch (err) {
      setError(err instanceof DecryptionError ? 'Неверный пароль' : err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleFileOpen = async () => {
    if (!selectedFile) {
      setError('Выберите JSON файл');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const text = await readFileAsText(selectedFile);
      if (!password) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          setError('Неверный формат файла');
          return;
        }
        const data = await applicationService.parseDecryptedJson(JSON.stringify(parsed));
        onUnlock(data, '', 'guest');
        return;
      }
      const data = await applicationService.openFile({ file: selectedFile, password });
      onUnlock(data, password, 'guest');
    } catch (err) {
      setError(err instanceof DecryptionError ? 'Неверный пароль' : err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Выберите JSON файл');
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  if (mode === 'welcome') {
    return (
      <div className="start-screen start-landing">
        <div className="logo">
          <img src="/logo.png" alt="KeepCong" className="start-logo" />
          <h1>KeepCong</h1>
          <p>Приложение для учёта собраний</p>
        </div>

        <div className="start-features">
          <div className="feature-card">
            <span className="feature-icon"><FontAwesomeIcon icon={ICON_FEATURE_SECURITY} /></span>
            <h3>Безопасность</h3>
            <p>Данные хранятся локально и защищены паролем.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon"><FontAwesomeIcon icon={ICON_FEATURE_CONVENIENCE} /></span>
            <h3>Удобство</h3>
            <p>Учёт собраний, возвещателей и отчётов в одном месте.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon"><FontAwesomeIcon icon={ICON_FEATURE_EXPORT} /></span>
            <h3>Экспорт</h3>
            <p>Сохраняйте резервную копию данных в JSON.</p>
          </div>
        </div>

        <button onClick={() => { resetState(); setMode('choice'); }} className="primary start-login-button">
          Вход
        </button>

        <div className="start-footer">
          <span>v{APP_VERSION} · {APP_STATUS}</span>
          <span>
            Автор:{' '}
            <a href={APP_AUTHOR_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="about-link">
              {APP_AUTHOR_TELEGRAM}
            </a>
          </span>
        </div>
      </div>
    );
  }

  if (mode === 'choice') {
    return (
      <div className="start-screen">
        <div className="logo">
          <img src="/logo.png" alt="KeepCong" className="start-logo" />
          <h2>Что вы хотите сделать?</h2>
        </div>
        {hasDatabase === true && (
          <div className="form" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Введите пароль администратора</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                onKeyDown={(event) => event.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <div className="button-group">
              <button onClick={handleAdminLogin} disabled={loading || !password} className="primary">
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </div>
            {error && <div className="error">{error}</div>}
          </div>
        )}
        <div className="button-group">
          <button onClick={() => { resetState(); setMode('create'); }} className="primary">
            Создать новое собрание
          </button>
          <button onClick={() => { resetState(); setMode('file-open'); }} className="secondary">
            Загрузить файл
          </button>
        </div>
        <div className="button-group">
          <button onClick={() => { resetState(); setMode('welcome'); }} className="secondary">
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="start-screen">
        <h2>Создать новое собрание</h2>
        <div className="form">
          <div className="form-group">
            <label>Название собрания</label>
            <input type="text" value={newDbName} onChange={(event) => setNewDbName(event.target.value)} disabled={loading} autoFocus />
          </div>
          <div className="form-group">
            <label>Мастер-пароль</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} />
          </div>
          <div className="form-group">
            <label>Количество групп ВПС</label>
            <input type="number" min="1" max="50" step="1" value={groupCount} onChange={(event) => setGroupCount(event.target.value)} disabled={loading} />
          </div>
          <div className="form-group">
            <label>Дни встреч (Будни)</label>
            <select value={weekdayMeetingDay} onChange={(event) => setWeekdayMeetingDay(event.target.value)} disabled={loading}>
              {WEEKDAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Дни встреч (Выходные)</label>
            <select value={weekendMeetingDay} onChange={(event) => setWeekendMeetingDay(event.target.value)} disabled={loading}>
              {WEEKENDS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
            </select>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="button-group">
            <button onClick={handleCreateDb} disabled={loading} className="primary">{loading ? 'Создание...' : 'Создать'}</button>
          </div>
          <div className="button-group">
            <button onClick={() => { resetState(); setMode('choice'); }} disabled={loading} className="secondary">
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="start-screen">
      <h2>Загрузить файл</h2>
      <div className="form">
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) handleFileSelect(file);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
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
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Пароль файла, если он зашифрован</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} onKeyDown={(event) => event.key === 'Enter' && handleFileOpen()} />
        </div>
        {error && <div className="error">{error}</div>}
        <div className="button-group">
          <button onClick={handleFileOpen} disabled={loading || !selectedFile} className="primary">{loading ? 'Загрузка...' : 'Открыть'}</button>
        </div>
        <div className="button-group">
          <button onClick={() => { resetState(); setMode('choice'); }} disabled={loading} className="secondary">
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
