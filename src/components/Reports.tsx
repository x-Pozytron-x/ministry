// Reports management component

import { useState } from 'react';
import type { Report, AppData } from '../domain';
import { ReportService, generateId, validateReport } from '../domain';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICON_USER, ICON_CALENDAR, ICON_EDIT, ICON_DELETE } from '../config/icons';

interface ReportsProps {
  data: AppData;
  onUpdate: (data: AppData) => void;
}

export default function Reports({ data, onUpdate }: ReportsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Report>>({
    title: '',
    content: '',
    authorId: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    try {
      validateReport(formData);

      if (editingId) {
        const updated = ReportService.updateReport(data, editingId, formData);
        onUpdate(updated);
        setEditingId(null);
      } else {
        const newReport: Report = {
          id: generateId(),
          title: formData.title!,
          content: formData.content!,
          authorId: formData.authorId!,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: formData.tags
        };
        const updated = ReportService.addReport(data, newReport);
        onUpdate(updated);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации');
    }
  };

  const handleEdit = (report: Report) => {
    setFormData(report);
    setEditingId(report.id);
    setShowForm(true);
  };

  const handleDelete = (reportId: string) => {
    if (confirm('Удалить отчёт?')) {
      const updated = ReportService.removeReport(data, reportId);
      onUpdate(updated);
    }
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const tags = formData.tags || [];
      if (!tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter(t => t !== tag)
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      authorId: '',
      tags: []
    });
    setShowForm(false);
    setEditingId(null);
    setError('');
    setTagInput('');
  };

  const getAuthorName = (authorId: string) => {
    const author = data.members.find(m => m.id === authorId);
    return author?.name || 'Неизвестный автор';
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Отчёты ({data.reports.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="primary">
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editingId ? 'Редактировать отчёт' : 'Новый отчёт'}</h3>
          <div className="form">
            <div className="form-group">
              <label>Заголовок *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Название отчёта"
              />
            </div>
            <div className="form-group">
              <label>Автор *</label>
              <select
                value={formData.authorId}
                onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
              >
                <option value="">Выберите автора</option>
                {data.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Содержание *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Текст отчёта..."
                rows={10}
              />
            </div>
            <div className="form-group">
              <label>Теги</label>
              <div className="tag-input">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Добавить тег"
                />
                <button type="button" onClick={addTag} className="secondary">
                  Добавить
                </button>
              </div>
              <div className="tags">
                {(formData.tags || []).map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                    <button onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
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

      <div className="list">
        {data.reports.length === 0 ? (
          <div className="empty">Нет отчётов</div>
        ) : (
          data.reports.map((report) => (
            <div key={report.id} className="list-item">
              <div className="item-content">
                <div className="item-title">{report.title}</div>
                <div className="item-meta">
                  <span><FontAwesomeIcon icon={ICON_USER} /> {getAuthorName(report.authorId)}</span>
                  <span><FontAwesomeIcon icon={ICON_CALENDAR} /> {new Date(report.createdAt).toLocaleDateString()}</span>
                  {report.tags && report.tags.length > 0 && (
                    <span className="tags-inline">
                      {report.tags.map((tag) => (
                        <span key={tag} className="badge">
                          {tag}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <div className="item-preview">{report.content.substring(0, 150)}...</div>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(report)} className="icon-button">
                  <FontAwesomeIcon icon={ICON_EDIT} />
                </button>
                <button onClick={() => handleDelete(report.id)} className="icon-button">
                  <FontAwesomeIcon icon={ICON_DELETE} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
