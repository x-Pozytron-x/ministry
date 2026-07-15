// Service Records (S-21) management component

import { useState } from 'react';
import type { ServiceRecord, CongregationData } from '../domain';
import { ServiceRecordService, generateId, validateServiceRecord } from '../domain';

interface ServiceRecordsProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
}

export default function ServiceRecords({ data, onUpdate }: ServiceRecordsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ServiceRecord>>({
    publisherId: '',
    month: new Date().toISOString().slice(0, 7),
    placements: 0,
    videoShowings: 0,
    hours: 0,
    returnVisits: 0,
    bibleStudies: 0,
    remarks: ''
  });
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const handleSubmit = () => {
    setError('');

    try {
      validateServiceRecord(formData);

      if (editingId) {
        const updated = ServiceRecordService.updateServiceRecord(data, editingId, formData);
        onUpdate(updated);
        setEditingId(null);
      } else {
        const publisher = data.publishers.find(p => p.id === formData.publisherId);
        const newRecord: ServiceRecord = {
          id: generateId(),
          publisherId: formData.publisherId!,
          month: formData.month!,
          placements: formData.placements ?? 0,
          videoShowings: formData.videoShowings ?? 0,
          hours: formData.hours ?? 0,
          returnVisits: formData.returnVisits ?? 0,
          bibleStudies: formData.bibleStudies ?? 0,
          remarks: formData.remarks,
          publisherSnapshot: publisher ? {
            firstName: publisher.firstName,
            lastName: publisher.lastName
          } : { firstName: '', lastName: '' }
        };
        const updated = ServiceRecordService.addServiceRecord(data, newRecord);
        onUpdate(updated);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации');
    }
  };

  const handleEdit = (record: ServiceRecord) => {
    setFormData(record);
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = (recordId: string) => {
    if (confirm('Удалить отчёт?')) {
      const updated = ServiceRecordService.removeServiceRecord(data, recordId);
      onUpdate(updated);
    }
  };

  const resetForm = () => {
    setFormData({
      publisherId: '',
      month: new Date().toISOString().slice(0, 7),
      placements: 0,
      videoShowings: 0,
      hours: 0,
      returnVisits: 0,
      bibleStudies: 0,
      remarks: ''
    });
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const getPublisherName = (publisherId: string | undefined) => {
    const publisher = data.publishers.find(p => p.id === publisherId);
    return publisher ? `${publisher.firstName} ${publisher.lastName}` : 'Неизвестный';
  };

  const filteredRecords = ServiceRecordService.getRecordsByMonth(data, selectedMonth);
  const monthTotals = ServiceRecordService.calculateTotalsForMonth(data, selectedMonth);

  return (
    <div className="section">
      <div className="section-header">
        <h2>Отчёты о служении (S-21)</h2>
        <button onClick={() => setShowForm(!showForm)} className="primary">
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editingId ? 'Редактировать отчёт' : 'Новый отчёт'}</h3>
          <div className="form">
            <div className="form-group">
              <label>Возвещатель *</label>
              <select
                value={formData.publisherId}
                onChange={(e) => setFormData({ ...formData, publisherId: e.target.value })}
              >
                <option value="">Выберите возвещателя</option>
                {data.publishers.map((publisher) => (
                  <option key={publisher.id} value={publisher.id}>
                    {publisher.firstName} {publisher.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Месяц *</label>
              <input
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Публикации</label>
              <input
                type="number"
                min="0"
                value={formData.placements}
                onChange={(e) => setFormData({ ...formData, placements: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Видеопоказы</label>
              <input
                type="number"
                min="0"
                value={formData.videoShowings}
                onChange={(e) => setFormData({ ...formData, videoShowings: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Часы</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Повторные посещения</label>
              <input
                type="number"
                min="0"
                value={formData.returnVisits}
                onChange={(e) => setFormData({ ...formData, returnVisits: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Изучения Библии</label>
              <input
                type="number"
                min="0"
                value={formData.bibleStudies}
                onChange={(e) => setFormData({ ...formData, bibleStudies: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Примечания</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
          <span>Отчётов: {monthTotals.activePublishersCount}</span>
          <span>Часов: {monthTotals.totalHours}</span>
          <span>Публикаций: {monthTotals.totalPlacements}</span>
          <span>Изучений: {monthTotals.totalBibleStudies}</span>
        </div>
      </div>

      <div className="list">
        {filteredRecords.length === 0 ? (
          <div className="empty">Нет отчётов за выбранный месяц</div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record.id} className="list-item">
              <div className="item-content">
                <div className="item-title">{getPublisherName(record.publisherId)}</div>
                <div className="item-meta">
                  <span>⏱️ {record.hours} ч</span>
                  <span>📖 Публ: {record.placements}</span>
                  <span>🎥 Видео: {record.videoShowings}</span>
                  <span>🔄 ПП: {record.returnVisits}</span>
                  <span>📚 Изуч: {record.bibleStudies}</span>
                </div>
                {record.remarks && <div className="item-notes">{record.remarks}</div>}
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
