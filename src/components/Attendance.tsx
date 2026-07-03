// Attendance management component

import { useState } from 'react';
import type { AttendanceRecord, AppData } from '../domain';
import { AttendanceService, generateId, validateAttendanceRecord } from '../domain';

interface AttendanceProps {
  data: AppData;
  onUpdate: (data: AppData) => void;
}

export default function Attendance({ data, onUpdate }: AttendanceProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({
    memberId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    notes: ''
  });
  const [error, setError] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const handleSubmit = () => {
    setError('');

    try {
      validateAttendanceRecord(formData);

      if (editingId) {
        const updated = AttendanceService.updateAttendance(data, editingId, formData);
        onUpdate(updated);
        setEditingId(null);
      } else {
        const newRecord: AttendanceRecord = {
          id: generateId(),
          memberId: formData.memberId!,
          date: formData.date!,
          status: formData.status!,
          notes: formData.notes
        };
        const updated = AttendanceService.addAttendance(data, newRecord);
        onUpdate(updated);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации');
    }
  };

  const handleEdit = (record: AttendanceRecord) => {
    setFormData(record);
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = (recordId: string) => {
    if (confirm('Удалить запись о посещаемости?')) {
      const updated = AttendanceService.removeAttendance(data, recordId);
      onUpdate(updated);
    }
  };

  const resetForm = () => {
    setFormData({
      memberId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      notes: ''
    });
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const getMemberName = (memberId: string) => {
    const member = data.members.find(m => m.id === memberId);
    return member?.name || 'Неизвестный участник';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      present: '✅ Присутствовал',
      absent: '❌ Отсутствовал',
      excused: '📝 Уважительная причина',
      late: '⏰ Опоздал'
    };
    return labels[status] || status;
  };

  const filteredRecords = selectedMemberId
    ? data.attendance.filter(r => r.memberId === selectedMemberId)
    : data.attendance;

  const sortedRecords = [...filteredRecords].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getMemberStats = (memberId: string) => {
    return AttendanceService.getAttendanceStats(data, memberId);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Посещаемость ({data.attendance.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="primary">
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editingId ? 'Редактировать запись' : 'Новая запись'}</h3>
          <div className="form">
            <div className="form-group">
              <label>Участник *</label>
              <select
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              >
                <option value="">Выберите участника</option>
                {data.members.filter(m => m.isActive).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Дата *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Статус *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="present">Присутствовал</option>
                <option value="absent">Отсутствовал</option>
                <option value="excused">Уважительная причина</option>
                <option value="late">Опоздал</option>
              </select>
            </div>
            <div className="form-group">
              <label>Примечания</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация..."
                rows={3}
              />
            </div>
            {error && <div className="error">{error}</div>}
            <div className="button-group">
              <button onClick={handleSubmit} className="primary">
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
              <button onClick={resetForm} className="secondary">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="filter-select"
        >
          <option value="">Все участники</option>
          {data.members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        {selectedMemberId && (
          <div className="stats-inline">
            {(() => {
              const stats = getMemberStats(selectedMemberId);
              return (
                <>
                  <span>Всего: {stats.total}</span>
                  <span>Присутствий: {stats.present + stats.late}</span>
                  <span>Посещаемость: {(stats.attendanceRate * 100).toFixed(1)}%</span>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="list">
        {sortedRecords.length === 0 ? (
          <div className="empty">
            {selectedMemberId ? 'Нет записей для выбранного участника' : 'Нет записей о посещаемости'}
          </div>
        ) : (
          sortedRecords.map((record) => (
            <div key={record.id} className="list-item">
              <div className="item-content">
                <div className="item-title">{getMemberName(record.memberId)}</div>
                <div className="item-meta">
                  <span>📅 {new Date(record.date).toLocaleDateString()}</span>
                  <span className={`status-badge ${record.status}`}>
                    {getStatusLabel(record.status)}
                  </span>
                </div>
                {record.notes && <div className="item-notes">{record.notes}</div>}
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(record)} className="icon-button">
                  ✏️
                </button>
                <button onClick={() => handleDelete(record.id)} className="icon-button">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
