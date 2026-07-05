// Congregation Profile component (replaces Settings)

import { useState } from 'react';
import type { CongregationData, CongregationSettings } from '../domain';
import { CongregationService, validateCongregationSettings } from '../domain';

const WEEK_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

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
  const [formData, setFormData] = useState<CongregationSettings>({
    ...data.settings,
    weekdayMeetingDay: data.settings.weekdayMeetingDay || 'Tuesday',
    weekendMeetingDay: data.settings.weekendMeetingDay || 'Saturday',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = () => {
    setError('');
    setSuccess('');

    try {
      validateCongregationSettings(formData);
      const updated = CongregationService.updateSettings(data, formData);
      onUpdate(updated);
      setIsEditing(false);
      setSuccess('Настройки собрания сохранены');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации');
    }
  };

  const handleCancel = () => {
    setFormData(data.settings);
    setIsEditing(false);
    setError('');
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
        <p>Отчётов о служении: {data.serviceRecords.length}</p>
        <p>Отчётов о посещаемости: {data.attendanceReports.length}</p>
        <p>Создано: {new Date(data.metadata.createdAt).toLocaleString()}</p>
        <p>Обновлено: {new Date(data.metadata.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
