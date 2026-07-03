// Publishers management component

import { useState } from 'react';
import type { Publisher, CongregationData } from '../domain';
import { PublisherService, generateId, validatePublisher } from '../domain';

interface PublishersProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
}

const createEmptyPublisherForm = (): Partial<Publisher> => ({
  lastName: '',
  firstName: '',
  phonePrimary: '',
  address: '',
  emergencyContact: {
    firstName: '',
    lastName: '',
    phone: ''
  },
  vpsGroup: undefined,
  birthDate: '',
  baptismDate: '',
  gender: 'male',
  hope: 'other_sheep',
  assignments: {
    elder: false,
    assistantServant: false,
    pioneer: false,
    specialPioneer: false,
    missionary: false
  }
});

const publisherToFormData = (publisher: Publisher): Partial<Publisher> => ({
  lastName: publisher.lastName,
  firstName: publisher.firstName,
  phonePrimary: publisher.phonePrimary,
  address: publisher.address ?? '',
  emergencyContact: {
    firstName: publisher.emergencyContact.firstName,
    lastName: publisher.emergencyContact.lastName,
    phone: publisher.emergencyContact.phone
  },
  vpsGroup: publisher.vpsGroup,
  birthDate: publisher.birthDate ?? '',
  baptismDate: publisher.baptismDate ?? '',
  gender: publisher.gender,
  hope: publisher.hope,
  assignments: {
    elder: publisher.assignments.elder,
    assistantServant: publisher.assignments.assistantServant,
    pioneer: publisher.assignments.pioneer,
    specialPioneer: publisher.assignments.specialPioneer,
    missionary: publisher.assignments.missionary
  }
});

const buildPublisher = (id: string, formData: Partial<Publisher>): Publisher => {
  const publisher: Publisher = {
    id,
    lastName: formData.lastName!,
    firstName: formData.firstName!,
    phonePrimary: formData.phonePrimary!,
    emergencyContact: {
      firstName: formData.emergencyContact!.firstName,
      lastName: formData.emergencyContact!.lastName,
      phone: formData.emergencyContact!.phone
    },
    gender: formData.gender!,
    hope: formData.hope!,
    assignments: {
      elder: formData.assignments!.elder,
      assistantServant: formData.assignments!.assistantServant,
      pioneer: formData.assignments!.pioneer,
      specialPioneer: formData.assignments!.specialPioneer,
      missionary: formData.assignments!.missionary
    }
  };

  if (formData.address) publisher.address = formData.address;
  if (formData.vpsGroup !== undefined) publisher.vpsGroup = formData.vpsGroup;
  if (formData.birthDate) publisher.birthDate = formData.birthDate;
  if (formData.baptismDate) publisher.baptismDate = formData.baptismDate;

  return publisher;
};

export default function Publishers({ data, onUpdate }: PublishersProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Publisher>>(createEmptyPublisherForm);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    try {
      const publisher = buildPublisher(editingId ?? generateId(), formData);
      validatePublisher(publisher);

      if (editingId) {
        const updated = PublisherService.updatePublisher(data, editingId, publisher);
        onUpdate(updated);
        setEditingId(null);
      } else {
        const updated = PublisherService.addPublisher(data, publisher);
        onUpdate(updated);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации');
    }
  };

  const handleEdit = (publisher: Publisher) => {
    setFormData(publisherToFormData(publisher));
    setEditingId(publisher.id);
    setShowForm(true);
  };

  const handleDelete = (publisherId: string) => {
    if (confirm('Удалить возвещателя? Это также удалит связанные отчёты о служении.')) {
      const updated = PublisherService.removePublisher(data, publisherId);
      onUpdate(updated);
    }
  };

  const resetForm = () => {
    setFormData(createEmptyPublisherForm());
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const groupOptions = Array.from({ length: data.settings.vpsGroupsCount }, (_, i) => i + 1);

  const getAssignmentLabels = (assignments: Publisher['assignments']): string[] => {
    const labels: string[] = [];
    if (assignments.elder) labels.push('Старейшина');
    if (assignments.assistantServant) labels.push('Помощник служителя');
    if (assignments.pioneer) labels.push('Пионер');
    if (assignments.specialPioneer) labels.push('Специальный пионер');
    if (assignments.missionary) labels.push('Миссионер');
    return labels;
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Возвещатели ({data.publishers.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="primary">
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editingId ? 'Редактировать возвещателя' : 'Новый возвещатель'}</h3>
          <div className="form">
            {/* Basic Info */}
            <div className="form-group">
              <label>Фамилия *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Иванов"
              />
            </div>
            <div className="form-group">
              <label>Имя *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Иван"
              />
            </div>
            <div className="form-group">
              <label>Основной телефон *</label>
              <input
                type="tel"
                value={formData.phonePrimary}
                onChange={(e) => setFormData({ ...formData, phonePrimary: e.target.value })}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div className="form-group">
              <label>Адрес</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Город, улица, дом, квартира"
              />
            </div>

            {/* Emergency Contact */}
            <h4 style={{ marginTop: '1.5em', marginBottom: '0.5em' }}>Контакт для экстренной связи *</h4>
            <div className="form-group">
              <label>Имя</label>
              <input
                type="text"
                value={formData.emergencyContact?.firstName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact!, firstName: e.target.value }
                  })
                }
                placeholder="Имя"
              />
            </div>
            <div className="form-group">
              <label>Фамилия</label>
              <input
                type="text"
                value={formData.emergencyContact?.lastName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact!, lastName: e.target.value }
                  })
                }
                placeholder="Фамилия"
              />
            </div>
            <div className="form-group">
              <label>Телефон</label>
              <input
                type="tel"
                value={formData.emergencyContact?.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact!, phone: e.target.value }
                  })
                }
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            {/* Additional Info */}
            <div className="form-group">
              <label>Группа</label>
              <select
                value={formData.vpsGroup || ''}
                onChange={(e) =>
                  setFormData({ ...formData, vpsGroup: e.target.value ? Number(e.target.value) : undefined })
                }
              >
                <option value="">Не выбрано</option>
                {groupOptions.map((num) => (
                  <option key={num} value={num}>
                    Группа {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Дата рождения</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Дата крещения</label>
              <input
                type="date"
                value={formData.baptismDate}
                onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Пол *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
              >
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>

            <div className="form-group">
              <label>Надежда *</label>
              <select
                value={formData.hope}
                onChange={(e) =>
                  setFormData({ ...formData, hope: e.target.value as 'other_sheep' | 'anointed' })
                }
              >
                <option value="other_sheep">Другие овцы</option>
                <option value="anointed">Помазанник</option>
              </select>
            </div>

            {/* Assignments */}
            <h4 style={{ marginTop: '1.5em', marginBottom: '0.5em' }}>Назначения</h4>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignments?.elder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assignments: { ...formData.assignments!, elder: e.target.checked }
                    })
                  }
                />
                Старейшина
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignments?.assistantServant}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assignments: { ...formData.assignments!, assistantServant: e.target.checked }
                    })
                  }
                />
                Помощник служителя
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignments?.pioneer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assignments: { ...formData.assignments!, pioneer: e.target.checked }
                    })
                  }
                />
                Пионер
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignments?.specialPioneer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assignments: { ...formData.assignments!, specialPioneer: e.target.checked }
                    })
                  }
                />
                Специальный пионер
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignments?.missionary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assignments: { ...formData.assignments!, missionary: e.target.checked }
                    })
                  }
                />
                Миссионер
              </label>
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
        {data.publishers.length === 0 ? (
          <div className="empty">Нет возвещателей</div>
        ) : (
          data.publishers.map((publisher) => (
            <div key={publisher.id} className="list-item">
              <div className="item-content">
                <div className="item-title">
                  {publisher.firstName} {publisher.lastName}
                </div>
                <div className="item-meta">
                  {publisher.vpsGroup && <span className="badge">Группа {publisher.vpsGroup}</span>}
                  <span>📞 {publisher.phonePrimary}</span>
                  {publisher.gender === 'male' ? '♂️' : '♀️'}
                  {getAssignmentLabels(publisher.assignments).map((label) => (
                    <span key={label} className="badge">
                      {label}
                    </span>
                  ))}
                </div>
                {publisher.address && <div className="item-notes">📍 {publisher.address}</div>}
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(publisher)} className="icon-button">
                  ✏️
                </button>
                <button onClick={() => handleDelete(publisher.id)} className="icon-button">
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
