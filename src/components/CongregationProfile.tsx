// Congregation Profile component (replaces Settings)

import { useState } from 'react';
import type { CongregationData, CongregationSettings } from '../domain';
import { CongregationService, VpsGroupService, validateCongregationSettings, getServiceYearLabel, getCurrentServiceYearStart, touchCongregationData } from '../domain';

const WEEK_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const normalizeSettings = (settings: CongregationSettings): CongregationSettings => ({
  ...settings,
  weekdayMeetingDay: settings.weekdayMeetingDay || 'Tuesday',
  weekendMeetingDay: settings.weekendMeetingDay || 'Saturday',
  serviceYearStart: settings.serviceYearStart ?? getCurrentServiceYearStart(),
});

interface CongregationProfileProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
  onChangePassword: () => void;
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
}

export default function CongregationProfile({
  data,
  onUpdate,
  onChangePassword,
  autoSaveEnabled,
  onToggleAutoSave
}: CongregationProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CongregationSettings>(
    normalizeSettings(data.settings)
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = () => {
    setError('');
    setSuccess('');

    try {
      validateCongregationSettings(formData);

      const newCount = formData.vpsGroupsCount;
      const oldCount = data.settings.vpsGroupsCount;

      // Sync vpsGroups if group count changed
      if (newCount !== oldCount) {
        const syncResult = VpsGroupService.syncVpsGroups(data, newCount);
        if (syncResult.error) {
          setError(syncResult.error);
          return;
        }
        // Apply settings on the synced data
        const updated = CongregationService.updateSettings(syncResult.data, formData);
        onUpdate(updated);
      } else {
        const updated = CongregationService.updateSettings(data, formData);
        onUpdate(updated);
      }

      setIsEditing(false);
      setSuccess('Настройки собрания сохранены');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации');
    }
  };

  const handleCancel = () => {
    setFormData(normalizeSettings(data.settings));
    setIsEditing(false);
    setError('');
  };

  const totalRecords = data.serviceRecords.length;
  const recordsWithMonthlyData = data.serviceRecords.filter(
    sr => sr.monthlyData && sr.monthlyData.length > 0
  ).length;
  const emptyRecords = data.serviceRecords.filter(
    sr => sr.monthlyData && sr.monthlyData.length === 0
  ).length;
  const totalMonthlyEntries = data.serviceRecords.reduce(
    (sum, sr) => sum + (sr.monthlyData?.length ?? 0), 0
  );

  const handleCleanEmptyRecords = () => {
    if (emptyRecords === 0) {
      setError('Нет пустых записей для очистки');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!confirm(`Будет удалено ${emptyRecords} пустых записей служения. Продолжить?`)) {
      return;
    }
    const cleaned = data.serviceRecords.filter(
      sr => !(sr.monthlyData && sr.monthlyData.length === 0)
    );
    const updated = touchCongregationData({
      ...data,
      serviceRecords: cleaned
    });
    onUpdate(updated);
    setSuccess(`Удалено ${emptyRecords} пустых записей`);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="section">
      <h2>Профиль собрания</h2>

      {(error || success) && (
        <div style={{ marginBottom: '1em' }}>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </div>
      )}

      <div className="settings-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1em' }}>
          <h3>Информация о собрании</h3>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="secondary">
              ✏️ Редактировать
            </button>
          )}
        </div>

        {!isEditing ? (
          <div>
            <p><strong>Название:</strong> {data.settings.name || 'Не указано'}</p>
            <p><strong>Количество групп проповеднического служения:</strong> {data.settings.vpsGroupsCount}</p>
            <p><strong>Язык:</strong> {data.settings.language}</p>
            <p><strong>День будничного собрания:</strong> {normalizeSettings(data.settings).weekdayMeetingDay}</p>
            <p><strong>День собрания в выходные:</strong> {normalizeSettings(data.settings).weekendMeetingDay}</p>
            <p><strong>Служебный год:</strong> {getServiceYearLabel(normalizeSettings(data.settings).serviceYearStart!)}</p>
          </div>
        ) : (
          <div className="form">
            <div className="form-group">
              <label>Название собрания *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название собрания"
              />
            </div>
            <div className="form-group">
              <label>Количество групп проповеднического служения *</label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.vpsGroupsCount}
                onChange={(e) => setFormData({ ...formData, vpsGroupsCount: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Язык *</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="uk">Українська</option>
                <option value="cs">Čeština</option>
              </select>
            </div>

            {/* New Weekday Meeting Day Dropdown */}
            <div className="form-group">
              <label>День будничного собрания</label>
              <select
                value={formData.weekdayMeetingDay}
                onChange={(e) => setFormData({ ...formData, weekdayMeetingDay: e.target.value })}
              >
                {WEEK_DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* New Weekend Meeting Day Dropdown */}
            <div className="form-group">
              <label>День собрания в выходные</label>
              <select
                value={formData.weekendMeetingDay}
                onChange={(e) => setFormData({ ...formData, weekendMeetingDay: e.target.value })}
              >
                {WEEK_DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Year Start */}
            <div className="form-group">
              <label>Служебный год (начальный)</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={formData.serviceYearStart ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    serviceYearStart: val ? Number(val) : undefined
                  });
                }}
                placeholder="Например: 2025"
              />
              <small className="form-hint">
                Текущий: {getServiceYearLabel(formData.serviceYearStart ?? getCurrentServiceYearStart())}
              </small>
            </div>

            <div className="button-group">
              <button onClick={handleSave} className="primary">
                Сохранить
              </button>
              <button onClick={handleCancel} className="secondary">
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-card">
        <div className="setting-item">
          <div className="setting-info">
            <h3>Автосохранение</h3>
            <p>Автоматически скачивать зашифрованный файл при изменениях (с задержкой 3 сек)</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={onToggleAutoSave}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <h3>Безопасность</h3>
        <button onClick={onChangePassword} className="primary">
          Изменить пароль
        </button>
      </div>

      <div className="settings-card">
        <h3>О данных</h3>
        <p>Версия данных: {data.version}</p>
        <p>Возвещателей: {data.publishers.length}</p>
        <p>Записей служения: {totalRecords}</p>
        <p style={{ marginLeft: '1em', fontSize: '0.9em', color: '#666' }}>
          с monthlyData: {recordsWithMonthlyData}
          {emptyRecords > 0 && <>, пустых: {emptyRecords}</>}
          , всего записей в monthlyData: {totalMonthlyEntries}
        </p>
        <p>Отчётов о посещаемости: {data.attendanceReports.length}</p>
        <p>Создано: {new Date(data.metadata.createdAt).toLocaleString()}</p>
        <p>Обновлено: {new Date(data.metadata.updatedAt).toLocaleString()}</p>
        {emptyRecords > 0 && (
          <button onClick={handleCleanEmptyRecords} className="secondary" style={{ marginTop: '8px' }}>
            🧹 Clean empty service records ({emptyRecords})
          </button>
        )}
      </div>
    </div>
  );
}