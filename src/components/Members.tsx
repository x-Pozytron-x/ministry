// Members management component

import { useState } from 'react';
import type { Member, AppData } from '../domain';
import { MemberService, generateId, validateMember } from '../domain';

interface MembersProps {
  data: AppData;
  onUpdate: (data: AppData) => void;
}

export default function Members({ data, onUpdate }: MembersProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    email: '',
    phone: '',
    role: '',
    isActive: true
  });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    try {
      validateMember(formData);

      if (editingId) {
        const updated = MemberService.updateMember(data, editingId, formData);
        onUpdate(updated);
        setEditingId(null);
      } else {
        const newMember: Member = {
          id: generateId(),
          name: formData.name!,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          joinedAt: new Date().toISOString(),
          isActive: formData.isActive ?? true
        };
        const updated = MemberService.addMember(data, newMember);
        onUpdate(updated);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации');
    }
  };

  const handleEdit = (member: Member) => {
    setFormData(member);
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleDelete = (memberId: string) => {
    if (confirm('Удалить участника? Это также удалит связанные записи о посещаемости.')) {
      const updated = MemberService.removeMember(data, memberId);
      onUpdate(updated);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      isActive: true
    });
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Участники ({data.members.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="primary">
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editingId ? 'Редактировать' : 'Новый участник'}</h3>
          <div className="form">
            <div className="form-group">
              <label>Имя *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Иван Иванов"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ivan@example.com"
              />
            </div>
            <div className="form-group">
              <label>Телефон</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div className="form-group">
              <label>Роль</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Член комитета"
              />
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Активен
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
        {data.members.length === 0 ? (
          <div className="empty">Нет участников</div>
        ) : (
          data.members.map((member) => (
            <div key={member.id} className={`list-item ${!member.isActive ? 'inactive' : ''}`}>
              <div className="item-content">
                <div className="item-title">{member.name}</div>
                <div className="item-meta">
                  {member.role && <span className="badge">{member.role}</span>}
                  {member.email && <span>{member.email}</span>}
                  {member.phone && <span>{member.phone}</span>}
                  {!member.isActive && <span className="badge inactive">Неактивен</span>}
                </div>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(member)} className="icon-button">
                  ✏️
                </button>
                <button onClick={() => handleDelete(member.id)} className="icon-button">
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
