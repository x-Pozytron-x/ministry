// Meeting Attendance (S-88) management component

import { useState } from 'react';
import type { AttendanceReport, CongregationData } from '../domain';
import { AttendanceReportService, generateId, validateAttendanceReport } from '../domain';

interface MeetingAttendanceProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
}

export default function MeetingAttendance({ data, onUpdate }: MeetingAttendanceProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AttendanceReport>>({
    month: new Date().toISOString().slice(0, 7),
    meetingType: 'weekday',
    attendanceCount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const handleSubmit = () => {
    setError('');

    try {
      validateAttendanceReport(formData);

      if (editingId) {
        const updated = AttendanceReportService.updateAttendanceReport(data, editingId, formData);
        onUpdate(updated);
        setEditingId(null);
      } else {
        const newReport: AttendanceReport = {
          id: generateId(),
          month: formData.month!,
          meetingType: formData.meetingType!,
          attendanceCount: formData.attendanceCount ?? 0,
          date: formData.date!,
          notes: formData.notes
        };
        const updated = AttendanceReportService.addAttendanceReport(data, newReport);
        onUpdate(updated);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации');
    }
  };

  const handleEdit = (report: AttendanceReport) => {
    setFormData(report);
    setEditingId(report.id);
    setShowForm(true);
  };

  const handleDelete = (reportId: string) => {
    if (confirm('Удалить отчёт о посещаемости?')) {
      const updated = AttendanceReportService.removeAttendanceReport(data, reportId);
      onUpdate(updated);
    }
  };

  const resetForm = () => {
    setFormData({
      month: new Date().toISOString().slice(0, 7),
      meetingType: 'weekday',
      attendanceCount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const filteredReports = AttendanceReportService.getReportsByMonth(data, selectedMonth);
  const sortedReports = [...filteredReports].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const averages = AttendanceReportService.getAverageAttendanceForMonth(data, selectedMonth);

  const getMeetingTypeLabel = (type: string) => {
    return type === 'weekday' ? '🗓️ Встреча в будни' : '📅 Встреча в выходные';
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Посещаемость собраний (S-88)</h2>
        <button onClick={() => setShowForm(!showForm)} className="primary">
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editingId ? 'Редактировать отчёт' : 'Новый отчёт'}</h3>
          <div className="form">
            <div className="form-group">
              <label>Месяц *</label>
              <input
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Дата собрания *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Тип собрания *</label>
              <select
                value={formData.meetingType}
                onChange={(e) => setFormData({ ...formData, meetingType: e.target.value as any })}
              >
                <option value="weekday">Встреча в будни</option>
                <option value="weekend">Встреча в выходные</option>
              </select>
            </div>
            <div className="form-group">
              <label>Количество присутствующих *</label>
              <input
                type="number"
                min="0"
                value={formData.attendanceCount}
                onChange={(e) => setFormData({ ...formData, attendanceCount: Number(e.target.value) })}
              />
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
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="filter-select"
        />
        <div className="stats-inline">
          <span>Средняя в будни: {averages.weekdayAverage.toFixed(1)}</span>
          <span>Средняя в выходные: {averages.weekendAverage.toFixed(1)}</span>
          <span>Общая средняя: {averages.overall.toFixed(1)}</span>
        </div>
      </div>

      <div className="list">
        {sortedReports.length === 0 ? (
          <div className="empty">Нет отчётов за выбранный месяц</div>
        ) : (
          sortedReports.map((report) => (
            <div key={report.id} className="list-item">
              <div className="item-content">
                <div className="item-title">{getMeetingTypeLabel(report.meetingType)}</div>
                <div className="item-meta">
                  <span>📅 {new Date(report.date).toLocaleDateString()}</span>
                  <span className="badge">👥 {report.attendanceCount} чел.</span>
                </div>
                {report.notes && <div className="item-notes">{report.notes}</div>}
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(report)} className="icon-button">
                  ✏️
                </button>
                <button onClick={() => handleDelete(report.id)} className="icon-button">
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
