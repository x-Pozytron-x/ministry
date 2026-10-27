import { useEffect, useState } from 'react';
import type { Publisher } from '../domain';
import { generateId, validatePublisher } from '../domain';

interface PublisherModalProps {
  publisher: Publisher | null;
  vpsGroupsCount: number;
  onClose: () => void;
  onSubmit: (publisher: Publisher) => void;
  onDelete: (publisherId: string) => void;
  userMode: 'guest' | 'admin';
}

interface PublisherFormData {
  lastName: string;
  firstName: string;
  phonePrimary: string;
  address: string;
  emergencyContact: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  vpsGroup: number | undefined;
  birthDate: string;
  baptismDate: string;
  gender: Publisher['gender'];
  hope: Publisher['hope'];
  assignments: Publisher['assignments'];
}

const createEmptyPublisherForm = (): PublisherFormData => ({
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

const publisherToFormData = (publisher: Publisher): PublisherFormData => ({
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

const buildPublisher = (id: string, formData: PublisherFormData): Publisher => {
  const publisher: Publisher = {
    id,
    lastName: formData.lastName,
    firstName: formData.firstName,
    phonePrimary: formData.phonePrimary,
    emergencyContact: {
      firstName: formData.emergencyContact.firstName,
      lastName: formData.emergencyContact.lastName,
      phone: formData.emergencyContact.phone
    },
    gender: formData.gender,
    hope: formData.hope,
    assignments: { ...formData.assignments }
  };

  if (formData.address) publisher.address = formData.address;
  if (formData.vpsGroup !== undefined) publisher.vpsGroup = formData.vpsGroup;
  if (formData.birthDate) publisher.birthDate = formData.birthDate;
  if (formData.baptismDate) publisher.baptismDate = formData.baptismDate;

  return publisher;
};

export default function PublisherModal({
  publisher,
  vpsGroupsCount,
  onClose,
  onSubmit,
  onDelete,
  userMode
}: PublisherModalProps) {
  const [formData, setFormData] = useState<PublisherFormData>(() =>
    publisher ? publisherToFormData(publisher) : createEmptyPublisherForm()
  );
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(publisher ? publisherToFormData(publisher) : createEmptyPublisherForm());
    setError('');
  }, [publisher]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const groupOptions = Array.from({ length: vpsGroupsCount }, (_, i) => i + 1);

  const updateAssignment = (key: keyof Publisher['assignments'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [key]: checked
      }
    }));
  };

  const handleSubmit = () => {
    setError('');

    try {
      const nextPublisher = buildPublisher(publisher?.id ?? generateId(), formData);
      validatePublisher(nextPublisher);
      onSubmit(nextPublisher);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации');
    }
  };

  const handleDelete = () => {
    if (!publisher) return;
    if (confirm('Удалить возвещателя? Это действие нельзя отменить')) {
      onDelete(publisher.id);
      onClose();
    }
  };

  return (
    <div className="publisher-modal-overlay" onClick={onClose}>
      <div className="publisher-modal" onClick={e => e.stopPropagation()}>
        <div className="publisher-modal-header">
          <h3>{publisher ? 'Редактировать возвещателя' : 'Новый возвещатель'}</h3>
          <button type="button" onClick={onClose} className="publisher-modal-close" title="Закрыть">
            ×
          </button>
        </div>

        <div className="publisher-modal-body">
          <div className="publisher-form-section">
            <h4>Основные сведения</h4>
            <div className="publisher-form-row">
              <div className="publisher-form-group">
                <label>Фамилия *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Иванов"
                />
              </div>
              <div className="publisher-form-group">
                <label>Имя *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Иван"
                />
              </div>
            </div>

            <div className="publisher-form-row">
              <div className="publisher-form-group">
                <label>Основной телефон *</label>
                <input
                  type="tel"
                  value={formData.phonePrimary}
                  onChange={(e) => setFormData({ ...formData, phonePrimary: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              <div className="publisher-form-group">
                <label>Адрес</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Город, улица, дом, квартира"
                />
              </div>
            </div>
          </div>

          <div className="publisher-form-section">
            <h4>Контакт для экстренной связи *</h4>
            <div className="publisher-form-row">
              <div className="publisher-form-group">
                <label>Имя</label>
                <input
                  type="text"
                  value={formData.emergencyContact.firstName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, firstName: e.target.value }
                    })
                  }
                  placeholder="Имя"
                />
              </div>
              <div className="publisher-form-group">
                <label>Фамилия</label>
                <input
                  type="text"
                  value={formData.emergencyContact.lastName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, lastName: e.target.value }
                    })
                  }
                  placeholder="Фамилия"
                />
              </div>
              <div className="publisher-form-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                    })
                  }
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>
          </div>

          <div className="publisher-form-section">
            <h4>Дополнительная информация</h4>
            <div className="publisher-form-row">
              <div className="publisher-form-group">
                <label>Группа ВПС</label>
                <select
                  value={formData.vpsGroup ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vpsGroup: e.target.value ? Number(e.target.value) : undefined
                    })
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

              <div className="publisher-form-group">
                <label>Дата рождения</label>
                <input
                  type="text"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>

              <div className="publisher-form-group">
                <label>Дата крещения</label>
                <input
                  type="text"
                  value={formData.baptismDate}
                  onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                />
              </div>
            </div>

            <div className="publisher-form-row">
              <div className="publisher-form-group">
                <label>Пол *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value !== 'male' && value !== 'female') return;
                    setFormData({ ...formData, gender: value });
                  }}
                >
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>

              <div className="publisher-form-group">
                <label>Надежда *</label>
                <select
                  value={formData.hope}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value !== 'other_sheep' && value !== 'anointed') return;
                    setFormData({ ...formData, hope: value });
                  }}
                >
                  <option value="other_sheep">Другие овцы</option>
                  <option value="anointed">Помазанник</option>
                </select>
              </div>
            </div>
          </div>

          <div className="publisher-form-section">
            <h4>Назначения</h4>
            <div className="publisher-checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignments.elder}
                  onChange={(e) => updateAssignment('elder', e.target.checked)}
                />
                Старейшина
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignments.assistantServant}
                  onChange={(e) => updateAssignment('assistantServant', e.target.checked)}
                />
                Помощник служителя
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignments.pioneer}
                  onChange={(e) => updateAssignment('pioneer', e.target.checked)}
                />
                Пионер
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignments.specialPioneer}
                  onChange={(e) => updateAssignment('specialPioneer', e.target.checked)}
                />
                Специальный пионер
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignments.missionary}
                  onChange={(e) => updateAssignment('missionary', e.target.checked)}
                />
                Миссионер
              </label>
            </div>
          </div>

          {error && <div className="publisher-modal-error">{error}</div>}

          <div className="publisher-modal-actions">
            {userMode === 'admin' && (
              <button
                type="button"
                onClick={handleSubmit}
                className="primary"
                disabled={!formData.lastName || !formData.firstName || !formData.phonePrimary}
              >
                {publisher ? 'Сохранить' : 'Добавить'}
              </button>
            )}
            {publisher && userMode === 'admin' && (
              <button type="button" onClick={handleDelete} className="danger">
                Удалить
              </button>
            )}
            <button type="button" onClick={onClose} className="secondary">
              Закрыть
            </button>
          </div>
        </div>
      </div>

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
        }

        .publisher-modal {
          background-color: var(--card-bg, #fff);
          color: var(--text-primary, #000);
          border-radius: 12px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .publisher-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #eee);
        }

        .publisher-modal-header h3 {
          margin: 0;
          flex: 1;
          font-size: 1.25em;
        }

        .publisher-modal-close {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          font-size: 1.6em;
          line-height: 1;
          color: var(--text-secondary, #666);
          border-radius: 4px;
        }

        .publisher-modal-close:hover {
          background-color: var(--secondary-bg, #f5f5f5);
          color: var(--text-primary, #000);
        }

        .publisher-modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .publisher-form-section {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color, #eee);
        }

        .publisher-form-section:last-of-type {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .publisher-form-section h4 {
          margin: 0 0 12px 0;
          font-size: 0.95em;
          font-weight: 600;
          color: var(--text-secondary, #666);
        }

        .publisher-form-row {
          display: flex;
          gap: 16px;
          margin-bottom: 6px;
          width: 100%;
        }

        .publisher-form-group {
          flex: 1;
        }

        .publisher-form-group label {
          margin-bottom: 4px;
          display: block;
          font-size: 0.85em;
          font-weight: 500;
        }

        .publisher-form-group input,
        .publisher-form-group select {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid var(--border-color, #ccc);
          border-radius: 4px;
          font-size: 0.9em;
          box-sizing: border-box;
        }

        .publisher-checkbox-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        .publisher-checkbox-row label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9em;
          cursor: pointer;
        }

        .publisher-checkbox-row input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .publisher-modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color, #eee);
        }

        .publisher-modal-actions button.danger {
          background-color: var(--danger, #d9534f);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .publisher-modal-error {
          background-color: var(--danger-light, #fde8e8);
          color: var(--danger, #d9534f);
          padding: 8px 12px;
          border-radius: 4px;
          margin-top: 12px;
          font-size: 0.85em;
        }
      `}</style>
    </div>
  );
}
