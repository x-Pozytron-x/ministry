// Main application component

import { useState } from 'react';
import type { CongregationData } from '../domain';
import type { ApplicationService } from '../application';
import { getServiceYearLabel } from '../domain';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ICON_DASHBOARD,
  ICON_PUBLISHERS,
  ICON_VPS,
  ICON_REPORTS,
  ICON_SETTINGS,
  ICON_LOGOUT,
  ICON_CHECK,
  ICON_WARNING,
  ICON_ARROW_LEFT,
  ICON_ARROW_RIGHT,
  ICON_CARD,
  ICON_SAVE
} from '../config/icons';
import { ICON_ATTENDANCE } from '../config/icons';
import { indexedDbService } from '../storage';
import Publishers from './Publishers';
import Attendance from './Attendance';
import CongregationProfile from './CongregationProfile';
import Dashboard from './Dashboard';
import ServiceReports from './ServiceReports';
import S21Page from './s21/S21Page';
import VpsPage from './VpsPage';
import S1Page from './s1/S1Page';

interface MainAppProps {
  initialData: CongregationData;
  currentPassword: string;
  userMode: 'guest' | 'admin';
  applicationService: ApplicationService;
  onLogout: () => void;
}

type Tab = 'dashboard' | 'publishers' | 'vps' | 'service-records' | 'service-reports' | 'meeting-attendance' | 's1' | 'profile';

export default function MainApp({ initialData, currentPassword, userMode: initialUserMode, applicationService }: MainAppProps) {
  const [data, setData] = useState<CongregationData>(initialData);
  const [password, setPassword] = useState(currentPassword);
  const [userMode, setUserMode] = useState<'guest' | 'admin'>(initialUserMode);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);

  const workingServiceYearStart: number = data.settings.serviceYearStart
    ?? (() => {
      const now = new Date();
      return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    })();

  const [selectedServiceYearStart, setSelectedServiceYearStart] = useState<number>(
    workingServiceYearStart
  );

  const handlePrevYear = () => {
    setSelectedServiceYearStart(selectedServiceYearStart - 1);
  };

  const handleNextYear = () => {
    setSelectedServiceYearStart(selectedServiceYearStart + 1);
  };

  // Save to IndexedDB in Admin mode
  const handleSave = async (dataToSave: CongregationData) => {
    if (userMode === 'admin') {
      setIsSaving(true);
      setAutoSaveError(null);
      try {
        const dataJson = JSON.stringify(dataToSave);
        await indexedDbService.set(dataJson, password);
        setLastSaved(new Date());
      } catch (err) {
        setAutoSaveError(err instanceof Error ? err.message : 'Ошибка сохранения');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBecomeAdmin = async () => {
    let adminPassword = password;
    if (!adminPassword) {
      const enteredPassword = window.prompt('Задайте пароль для локальной базы данных');
      if (enteredPassword === null) return;
      if (!enteredPassword) {
        setError('Введите пароль для локальной базы данных');
        return;
      }
      adminPassword = enteredPassword;
    }

    setError('');
    setIsSaving(true);
    try {
      await indexedDbService.set(JSON.stringify(data), adminPassword);
      setPassword(adminPassword);
      setUserMode('admin');
      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить базу данных');
    } finally {
      setIsSaving(false);
    }
  };
  const handleDataUpdate = (newData: CongregationData) => {
    setData(newData);
    setSuccess('');
    setError('');
    // Trigger save to IndexedDB for Admin
    handleSave(newData);
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
      setSuccess('Пароль успешно изменён');

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при смене пароля');
    }
  };

  const handleLogout = async () => {
    try {
      await indexedDbService.deleteDatabase();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении базы данных');
    }
  };

  const handleManualSave = async () => {
    setError('');
    setSuccess('');
    try {
      await applicationService.saveFile({
        data,
        password,
        filename: 'congregation-data.enc.json'
      });
      setSuccess('Файл успешно скачан');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения файла');
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
          <img src="/logo.png" alt="KeepCong" className="app-logo" />
          <h1>{data.settings.name || 'KeepCong'}</h1>
          <div className="save-status">
            {isSaving && <span className="saving"><FontAwesomeIcon icon={ICON_CARD} spin /> Сохранение...</span>}
            {!isSaving && lastSaved && (
              <span className="saved"><FontAwesomeIcon icon={ICON_CHECK} /> Сохранено: {formatLastSaved(lastSaved)}</span>
            )}
            {autoSaveError && <span className="error-indicator"><FontAwesomeIcon icon={ICON_WARNING} /> {autoSaveError}</span>}
          </div>
        </div>

        <div className="header-right">
          <div className="year-switcher">
            <button className="year-btn" onClick={handlePrevYear} title="Previous year">
              <FontAwesomeIcon icon={ICON_ARROW_LEFT} />
            </button>
            <span className="year-display">{getServiceYearLabel(selectedServiceYearStart)}</span>
            <button
              className="year-btn"
              onClick={handleNextYear}
              title="Next year"
            >
              <FontAwesomeIcon icon={ICON_ARROW_RIGHT} />
            </button>
          </div>

          {userMode === 'guest' && (
            <button onClick={handleBecomeAdmin} disabled={isSaving} className="secondary">
              {isSaving ? 'Сохранение...' : 'В режим администратора'}
            </button>
          )}

          {userMode === 'admin' && (
            <button
              className={activeTab === 'profile' ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              <FontAwesomeIcon icon={ICON_SETTINGS} />
            </button>
          )}

          {userMode === 'admin' && (
            <button onClick={handleManualSave} className="secondary save" title="Скачать JSON файл">
              <FontAwesomeIcon icon={ICON_SAVE} />
            </button>
          )}

          <button onClick={handleLogout} className="secondary exit">
            <FontAwesomeIcon icon={ICON_LOGOUT} />
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
          <FontAwesomeIcon icon={ICON_DASHBOARD} /> Dashboard
        </button>
        <button
          className={activeTab === 'publishers' ? 'active' : ''}
          onClick={() => setActiveTab('publishers')}
        >
          <FontAwesomeIcon icon={ICON_PUBLISHERS} /> Proclaimers
        </button>
        <button
          className={activeTab === 'vps' ? 'active' : ''}
          onClick={() => setActiveTab('vps')}
        >
          <FontAwesomeIcon icon={ICON_VPS} /> ВПС
        </button>
        <button
          className={activeTab === 'service-records' ? 'active' : ''}
          onClick={() => setActiveTab('service-records')}
        >
          <FontAwesomeIcon icon={ICON_CARD} />    S-21
        </button>
        <button
          className={activeTab === 'service-reports' ? 'active' : ''}
          onClick={() => setActiveTab('service-reports')}
        >
          <FontAwesomeIcon icon={ICON_REPORTS} /> Reports
        </button>
        <button
          className={activeTab === 'meeting-attendance' ? 'active' : ''}
          onClick={() => setActiveTab('meeting-attendance')}
        >
          <FontAwesomeIcon icon={ICON_ATTENDANCE} /> S-88
        </button>
        <button
          className={activeTab === 's1' ? 'active' : ''}
          onClick={() => setActiveTab('s1')}
        >
          S-1
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'dashboard' && <Dashboard data={data} selectedServiceYearStart={selectedServiceYearStart} />}
        {activeTab === 'publishers' && <Publishers data={data} onUpdate={handleDataUpdate} userMode={userMode} />}
        {activeTab === 'vps' && <VpsPage data={data} onUpdate={handleDataUpdate} userMode={userMode} />}
        {activeTab === 'service-records' && <S21Page data={data} onUpdate={handleDataUpdate} selectedServiceYearStart={selectedServiceYearStart} workingServiceYearStart={workingServiceYearStart} />}
        {activeTab === 'service-reports' && <ServiceReports data={data} onUpdate={handleDataUpdate} selectedServiceYearStart={selectedServiceYearStart} workingServiceYearStart={workingServiceYearStart} userMode={userMode} />}
        {activeTab === 'meeting-attendance' && <Attendance data={data} onUpdate={handleDataUpdate} selectedServiceYearStart={selectedServiceYearStart} workingServiceYearStart={workingServiceYearStart} userMode={userMode} />}
        {activeTab === 's1' && <S1Page data={data} selectedServiceYearStart={selectedServiceYearStart} workingServiceYearStart={workingServiceYearStart} />}
        {activeTab === 'profile' && userMode === 'admin' && (
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
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
