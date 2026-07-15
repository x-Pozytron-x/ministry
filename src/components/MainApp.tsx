// Main application component with tabs and auto-save

import { useState } from 'react';
import type { CongregationData } from '../domain';
import type { ApplicationService } from '../application';
import { useAutoSave } from '../hooks';
import Publishers from './Publishers';
import ServiceRecords from './ServiceRecords';
import Attendance from './Attendance';
import CongregationProfile from './CongregationProfile';
import Dashboard from './Dashboard';

interface MainAppProps {
  initialData: CongregationData;
  currentPassword: string;
  applicationService: ApplicationService;
  onLogout: () => void;
}

type Tab = 'dashboard' | 'publishers' | 'service-records' | 'meeting-attendance' | 'profile';

export default function MainApp({ initialData, currentPassword, applicationService, onLogout }: MainAppProps) {
  const [data, setData] = useState<CongregationData>(initialData);
  const [password, setPassword] = useState(currentPassword);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  // Single save pipeline - all saves go through this
  const handleSave = async (dataToSave: CongregationData) => {
    await applicationService.saveFile({
      data: dataToSave,
      password,
      filename: 'congregation-data.enc.json'
    });
  };

  const { isSaving, lastSaved, error: autoSaveError, flush, toggleAutoSave } = useAutoSave(
    data,
    handleSave,
    3000,
    autoSaveEnabled
  );

  const handleDataUpdate = (newData: CongregationData) => {
    setData(newData);
    setSuccess('');
    setError('');
  };

  const handleManualSave = async () => {
    setError('');
    setSuccess('');
    try {
      // Flush any pending autosave first, or trigger manual save
      if (autoSaveEnabled) {
        await flush();
      } else {
        // When autosave disabled, manually trigger save
        await handleSave(data);
      }
      setSuccess('Файл успешно сохранён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (oldPassword !== password) {
      setError('Неверный текущий пароль');
      return;
    }

    if (newPassword.length < 8) {
      setError('Новый пароль должен содержать минимум 8 символов');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    try {
      await applicationService.changePassword({
        data,
        oldPassword,
        newPassword
      });

      setPassword(newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowChangePassword(false);
      setSuccess('Пароль успешно изменён. Файл будет сохранён с новым паролем.');

      // Force save with new password - goes through single pipeline
      await handleSave(data);

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при смене пароля');
    }
  };

  const handleToggleAutoSave = () => {
    const newState = !autoSaveEnabled;
    setAutoSaveEnabled(newState);
    toggleAutoSave(newState);
  };

  const handleLogout = () => {
    if (confirm('Выйти из приложения? Все несохранённые данные будут потеряны.')) {
      // Clear all data from memory
      onLogout();
    }
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Никогда';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 10) return 'только что';
    if (seconds < 60) return `${seconds} сек. назад`;
    if (minutes < 60) return `${minutes} мин. назад`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="main-app">
      <header className="app-header">
        <div className="header-left">
          <h1>{data.settings.name || 'CongrArk'}</h1>
          <div className="save-status">
            {isSaving && <span className="saving">💾 Сохранение...</span>}
            {!isSaving && lastSaved && (
              <span className="saved">✓ Сохранено: {formatLastSaved(lastSaved)}</span>
            )}
            {autoSaveError && <span className="error-indicator">⚠️ Ошибка автосохранения</span>}
          </div>
        </div>
        <div className="header-right">
          <button onClick={handleManualSave} className="secondary" disabled={isSaving}>
            💾 Скачать файл
          </button>
          <button onClick={handleLogout} className="secondary">
            🚪 Выход
          </button>
        </div>
      </header>

      {(error || success) && (
        <div className="notification-bar">
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </div>
      )}

      <nav className="tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === 'publishers' ? 'active' : ''}
          onClick={() => setActiveTab('publishers')}
        >
          👥 Proclaimers
        </button>
        <button
          className={activeTab === 'service-records' ? 'active' : ''}
          onClick={() => setActiveTab('service-records')}
        >
          S-21
        </button>
        <button
          className={activeTab === 'meeting-attendance' ? 'active' : ''}
          onClick={() => setActiveTab('meeting-attendance')}
        >
          S-88
        </button>
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          ⚙️
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'dashboard' && <Dashboard data={data} />}
        {activeTab === 'publishers' && <Publishers data={data} onUpdate={handleDataUpdate} />}
        {activeTab === 'service-records' && <ServiceRecords data={data} onUpdate={handleDataUpdate} />}
        {activeTab === 'meeting-attendance' && <Attendance data={data} onUpdate={handleDataUpdate} />}
        {activeTab === 'profile' && (
          <>
            {showChangePassword ? (
              <div className="section">
                <h2>Смена пароля</h2>
                <div className="settings-card">
                  <div className="form">
                    <div className="form-group">
                      <label>Текущий пароль</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Новый пароль</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Минимум 8 символов"
                      />
                    </div>
                    <div className="form-group">
                      <label>Подтвердите новый пароль</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="button-group">
                      <button onClick={handleChangePassword} className="primary">
                        Подтвердить
                      </button>
                      <button onClick={() => setShowChangePassword(false)} className="secondary">
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <CongregationProfile
                data={data}
                onUpdate={handleDataUpdate}
                onChangePassword={() => setShowChangePassword(true)}
                autoSaveEnabled={autoSaveEnabled}
                onToggleAutoSave={handleToggleAutoSave}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
