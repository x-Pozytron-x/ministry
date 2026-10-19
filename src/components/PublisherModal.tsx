import { useState, useEffect } from 'react';
import type { Publisher, CongregationData } from '../domain';
import { PublisherService, generateId, validatePublisher } from '../domain';

interface PublisherModalProps {
  publisher: Publisher | null;
  data: CongregationData;
  onSave: (publisher: Publisher) => Publisher;
  onDelete: (publisherId: string) => void;
  onClose: () => void;
}

const createEmptyPublisherForm = (): Partial<Publisher> => ({
  lastName: '',
  firstName: '',
  phonePrimary: '',
  address: '',
  emergencyContact: {
    firstName: '-',
    lastName: '-',
    phone: '-'
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid var(--border-color, #ccc)',
  fontSize: '0.95em',
  boxSizing: 'border-box'
};

export default function PublisherModal({ publisher, data: parentData, onSave, onDelete, onClose }: PublisherModalProps) {
  const [formData, setFormData] = useState<Partial<Publisher>>(() => publisher ? publisherToFormData(publisher) : createEmptyPublisherForm());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (publisher) {
      setFormData(publisherToFormData(publisher));
    } else {
      setFormData(createEmptyPublisherForm());
    }
  }, [publisher]);

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      if (publisher) {
        const updated = PublisherService.updatePublisher(parentData, publisher.id, buildPublisher(publisher.id, formData));
        const savedPublisher = updated.publishers.find(p => p.id === publisher.id) || publisher;
        onSave(savedPublisher);
      } else {
        const newPublisher = buildPublisher(generateId(), formData);
        validatePublisher(newPublisher);
        const updated = PublisherService.addPublisher(parentData, newPublisher);
        const savedPublisher = updated.publishers.find(p => p.id === newPublisher.id) || newPublisher;
        onSave(savedPublisher);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (publisher && confirm('Удалить возвещателя? Это действие нельзя отменить')) {
      onDelete(publisher.id);
      onClose();
    }
  };

  return (
    <div className="publisher-modal-overlay" onClick={onClose}>
      <div className="publisher-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{publisher ? 'Редактировать возвещателя' : 'Новый возвещатель'}</h3>
          <button onClick={onClose} className="modal-close" title="Закрыть">X
          </button>
        </div>

        <div className="modal-content">
          <div className="form-section">
            <h4>Основные сведения</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Фамилия *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Иванов"
                  style={inputStyle}
                />
              </div>
              <div className="form-group">
                <label>Имя *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Иван"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Основной телефон *</label>
                <input
                  type="tel"
                  value={formData.phonePrimary}
                  onChange={(e) => setFormData({ ...formData, phonePrimary: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                  style={inputStyle}
                />
              </div>
              <div className="form-group">
                <label>Адрес</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Город, улица, дом, квартира"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Контакт для экстренной связи *</h4>
            <div className="form-row">
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
            </div>
          </div>

          <div className="form-section">
            <h4>Дополнительная информация</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Группа ВПС</label>
                <select
                  value={formData.vpsGroup || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, vpsGroup: e.target.value ? Number(e.target.value) : undefined })
                  }
                >
                  <option value="">Не выбрано</option>
                </select>
              </div>

              <div className="form-group">
                <label>Дата рождения</label>
                <input
                  type="text"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Дата крещения</label>
                <input
                  type="text"
                  value={formData.baptismDate}
                  onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
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
                  onChange={(e) => setFormData({ ...formData, hope: e.target.value as 'other_sheep' | 'anointed' })}
                >
                  <option value="other_sheep">Другие овцы</option>
                  <option value="anointed">Помазанник</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Назначения</h4>
            <div className="checkbox-row">
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
          </div>

          {error && <div className="error">{error}</div>}

          <div className="button-group">
            <button
              onClick={handleSubmit}
              className="primary"
              disabled={isSubmitting || !formData.lastName || !formData.firstName || !formData.phonePrimary}
            >
              {isSubmitting ? 'Сохранение...' : publisher ? 'Сохранить' : 'Добавить'}
            </button>
            <button
              onClick={handleDelete}
              className="danger"
              disabled={!publisher}
            >
              Удалить
            </button>
            <button onClick={onClose} className="secondary">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

<style>{`
  .publisher-modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    overflow: auto;
  }

  .publisher-modal {
    background-color: #fff;
    border-radius: 12px;
    padding: 0;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color, #eee);
  }

  .modal-header h3 {
    margin: 0;
    flex: 1;
    font-size: 1.25em;
  }

  .modal-close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--text-secondary, #666);
    border-radius: 4px;
    transition: all 0.15s;
  }

  .modal-close:hover {
    background-color: var(--secondary-bg, #f5f5f5);
    color: #000;
  }

  .modal-close:active {
    transform: scale(0.95);
  }

  .modal-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .form-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color, #eee);
  }

  .form-section:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .form-section h4 {
    margin: 0 0 12px 0;
    font-size: 0.95em;
    font-weight: 600;
    color: var(--text-secondary, #666);
  }

  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 6px;
    width: 100%;
  }

  .form-row .form-group {
    flex: 1;
    margin-bottom: 0;
  }

  .form-group label {
    margin-bottom: 4px;
    display: block;
    font-size: 0.85em;
    font-weight: 500;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    font-size: 0.9em;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--primary, #2196F3);
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }

  .checkbox-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }

  .checkbox-row label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9em;
    cursor: pointer;
  }

  .checkbox-row input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .button-group {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color, #eee);
  }

  .button-group button {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 0.9em;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .button-group button.primary {
    background-color: var(--primary, #2196F3);
    color: #fff;
  }

  .button-group button.primary:hover:not(:disabled) {
    background-color: #1976D2;
  }

  .button-group button.danger {
    background-color: var(--danger, #d9534f);
    color: #fff;
  }

  .button-group button.danger:hover:not(:disabled) {
    background-color: #c9302c;
  }

  .button-group button.secondary {
    background-color: var(--secondary-bg, #f5f5f5);
    color: var(--text-primary, #000);
    border: 1px solid var(--border-color, #ccc);
  }

  .button-group button.secondary:hover {
    background-color: var(--border-color, #e0e0e0);
  }

  .button-group button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    background-color: var(--danger-light, #fde8e8);
    color: var(--danger, #d9534f);
    padding: 8px 12px;
    border-radius: 4px;
    margin-top: 12px;
    font-size: 0.85em;
  }
`}</style>