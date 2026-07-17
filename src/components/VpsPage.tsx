import { useState, useEffect } from 'react';
import type { CongregationData, VpsGroup } from '../domain';
import { VpsGroupService } from '../domain';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICON_EDIT } from '../config/icons';

interface VpsPageProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
}

export default function VpsPage({ data, onUpdate }: VpsPageProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    leaderPublisherId: string | undefined;
    assistantPublisherId: string | undefined;
    meetingPlace: string;
    meetingTime: string;
  }>({ leaderPublisherId: undefined, assistantPublisherId: undefined, meetingPlace: '', meetingTime: '' });

  // Auto-sync groups on mount to match settings.vpsGroupsCount
  useEffect(() => {
    const groups = data.vpsGroups || [];
    if (groups.length !== data.settings.vpsGroupsCount) {
      const result = VpsGroupService.syncVpsGroups(data, data.settings.vpsGroupsCount);
      if (result.data !== data && !result.error) {
        onUpdate(result.data);
      }
    }
  }, []);

  const groups = data.vpsGroups || [];
  const groupCount = data.settings.vpsGroupsCount;
  const displayGroups = groups.slice(0, groupCount);

  const openEditModal = (index: number) => {
    const group = displayGroups[index];
    setEditForm({
      leaderPublisherId: group?.leaderPublisherId || undefined,
      assistantPublisherId: group?.assistantPublisherId || undefined,
      meetingPlace: group?.meetingPlace || '',
      meetingTime: group?.meetingTime || '',
    });
    setEditingIndex(index);
  };

  const handleSaveGroup = () => {
    if (editingIndex === null) return;
    const existing = displayGroups[editingIndex];
    const updated: VpsGroup = {
      ...existing,
      leaderPublisherId: editForm.leaderPublisherId || undefined,
      assistantPublisherId: editForm.assistantPublisherId || undefined,
      meetingPlace: editForm.meetingPlace || '',
      meetingTime: editForm.meetingTime || '',
    };
    const newData = VpsGroupService.updateGroup(data, editingIndex, updated);
    onUpdate(newData);
    setEditingIndex(null);
  };

  const eligibleLeaders = editingIndex !== null
    ? VpsGroupService.getEligibleLeaders(data, editingIndex + 1)
    : [];
  const eligibleAssistants = editingIndex !== null
    ? VpsGroupService.getEligibleAssistants(data, editingIndex + 1)
    : [];

  // Also include current leader/assistant if they were moved out of the group
  const currentLeaderId = editingIndex !== null ? displayGroups[editingIndex]?.leaderPublisherId : undefined;
  const currentAssistantId = editingIndex !== null ? displayGroups[editingIndex]?.assistantPublisherId : undefined;

  if (currentLeaderId && !eligibleLeaders.some(p => p.id === currentLeaderId)) {
    const p = data.publishers.find(pub => pub.id === currentLeaderId);
    if (p) {
      eligibleLeaders.push(p);
    }
  }
  if (currentAssistantId && !eligibleAssistants.some(p => p.id === currentAssistantId)) {
    const p = data.publishers.find(pub => pub.id === currentAssistantId);
    if (p) {
      eligibleAssistants.push(p);
    }
  }

  if (groups.length === 0) {
    return (
      <div className="section">
        <h2>ВПС — Группы проповеднического служения</h2>
        <div className="empty" style={{ padding: '2em', textAlign: 'center' }}>
          Группы ещё не настроены. Укажите количество групп в <strong>Профиле собрания</strong>.
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>ВПС — Группы проповеднического служения</h2>

      <div className="vps-grid-wrapper">
        <div className="vps-grid" style={{ gridTemplateColumns: `repeat(${groupCount}, 1fr)` }}>
          {Array.from({ length: groupCount }, (_, i) => {
            const groupInfo = displayGroups[i];
            const leaderId = groupInfo?.leaderPublisherId;
            const assistantId = groupInfo?.assistantPublisherId;
            const members = VpsGroupService.getGroupPublishers(data, i + 1)
              .filter(m => m.id !== leaderId && m.id !== assistantId)
              .sort((a, b) => a.lastName.localeCompare(b.lastName));
            return (
              <div key={i} className="vps-group-column">
                <div className="vps-group-header" onClick={() => openEditModal(i)} title="Редактировать группу">
                  <span>Группа {i + 1}</span>
                  <span className="vps-edit-icon"><FontAwesomeIcon icon={ICON_EDIT} /></span>
                </div>

                <div className="vps-cell vps-cell-leader">
                    {VpsGroupService.getPublisherName(data, displayGroups[i]?.leaderPublisherId)}
                </div>

                <div className="vps-cell vps-cell-assistant">
                    {VpsGroupService.getPublisherName(data, displayGroups[i]?.assistantPublisherId)}
                </div>

                <div className="vps-cell vps-cell-place">
                  {displayGroups[i]?.meetingPlace || '—'}
                </div>

                <div className="vps-cell vps-cell-time">
                  {displayGroups[i]?.meetingTime || '—'}
                </div>

                <div className="vps-cell vps-cell-members">
                  <div className="vps-members-body">
                    {members.length === 0 ? (
                      <span className="vps-empty">—</span>
                    ) : (
                      <ul className="vps-member-list">
                        {members.map(m => (
                          <li key={m.id} className="vps-member-item">
                            {m.lastName} {m.firstName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingIndex !== null && (
        <div className="vps-modal-overlay" onClick={() => setEditingIndex(null)}>
          <div className="vps-modal" onClick={e => e.stopPropagation()}>
            <h3>Редактирование — Группа {editingIndex + 1}</h3>

            <div className="vps-modal-form">
              <div className="form-group">
                <label>Ответственный</label>
                <select
                  value={editForm.leaderPublisherId || ''}
                  onChange={e => setEditForm({ ...editForm, leaderPublisherId: e.target.value || undefined })}
                >
                  <option value="">— Не выбрано —</option>
                  {eligibleLeaders.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.lastName} {p.firstName}
                    </option>
                  ))}
                </select>
                {eligibleLeaders.length === 0 && (
                  <small className="form-hint">Нет старейшин или помощников собрания в этой группе</small>
                )}
              </div>

              <div className="form-group">
                <label>Помощник</label>
                <select
                  value={editForm.assistantPublisherId || ''}
                  onChange={e => setEditForm({ ...editForm, assistantPublisherId: e.target.value || undefined })}
                >
                  <option value="">— Не выбрано —</option>
                  {eligibleAssistants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.lastName} {p.firstName}
                    </option>
                  ))}
                </select>
                {eligibleAssistants.length === 0 && (
                  <small className="form-hint">Нет братьев в этой группе</small>
                )}
              </div>

              <div className="form-group">
                <label>Место встречи</label>
                <input
                  type="text"
                  value={editForm.meetingPlace}
                  onChange={e => setEditForm({ ...editForm, meetingPlace: e.target.value })}
                  placeholder="ул. Примерная, д. 123"
                />
              </div>

              <div className="form-group">
                <label>Время</label>
                <input
                  type="text"
                  value={editForm.meetingTime}
                  onChange={e => setEditForm({ ...editForm, meetingTime: e.target.value })}
                  placeholder="14:00"
                />
              </div>
            </div>

            <div className="button-group" style={{ marginTop: '1.5em' }}>
              <button onClick={handleSaveGroup} className="primary">Сохранить</button>
              <button onClick={() => setEditingIndex(null)} className="secondary">Отмена</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .vps-grid-wrapper {
          overflow-x: auto;
          margin-top: 1.5em;
          border-radius: 4px;
          max-width: 1300px;
          margin-left: auto;
          margin-right: auto;
          container-type: inline-size;
        }

        .vps-grid {
          display: grid;
          border: 1px solid var(--border-color, #ccc);
          font-size: 2cqw;
        }

        .vps-group-column {
          border-right: 1px solid var(--border-color, #ccc);
          
        }
        .vps-group-column:last-child {
          border-right: none;
        }

        /* Group header — purple/lilac */
        .vps-group-header {
          background-color: #7B1FA2;
          color: #fff;
          font-weight: 600;
          font-size: 1.3em;
          text-align: center;
          padding: 7px 10px;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.15s;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
        }
        .vps-group-header:hover {
          background-color: #9C27B0;
        }

        .vps-edit-icon {
          font-size: 0.85em;
          opacity: 0.4;
        }
        .vps-group-header:hover .vps-edit-icon {
          opacity: 1;
        }

        /* Cells */
        .vps-cell {
          padding: 6px 8px;
          text-align: center;
          border-bottom: 1px solid var(--border-color, #ccc);
        }

        .vps-cell-label {
          display: block;
          font-size: 0.75em;
          opacity: 0.75;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .vps-cell-value {
          display: block;
          font-weight: 500;
        }

        /* Leader — dark green */
        .vps-cell-leader {
          background-color: #2E7D32;
          color: #fff;
          font-size: 0.90em;
          font-weight: 600;
        }

        /* Assistant — light green */
        .vps-cell-assistant {
          background-color: #C8E6C9;
          color: #1B5E20;
          font-size: 0.85em;
          font-weight: 600;
        }

        /* Meeting place — warm orange-brown */
        .vps-cell-place {
          background-color: #FBE9E7;
          color: #BF360C;
          font-size: 0.85em;
          font-weight: 600;
        }

        /* Meeting time — blue */
        .vps-cell-time {
          background-color: #E3F2FD;
          color: #1565C0;
          font-size: 0.85em;
          font-weight: 600;
        }

        /* Publisher list — light */
        .vps-cell-members {
          background-color: var(--card-bg, #fff);
          border-bottom: none;
        }

        .vps-members-body {
          text-align: left;
        }

        .vps-empty {
          color: var(--text-secondary, #999);
        }

        .vps-member-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .vps-member-item {
          padding: 3px 0;
          border-bottom: 1px solid var(--border-color, #eee);
         
          font-size: 0.75em;
        }
        .vps-member-item:last-child {
          border-bottom: none;
        }

        /* Modal overlay */
        .vps-modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .vps-modal {
          background-color: var(--card-bg, #fff);
          border-radius: 12px;
          padding: 24px 28px;
          min-width: 400px;
          max-width: 500px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .vps-modal h3 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #7B1FA2;
        }

        .vps-modal-form .form-group {
          margin-bottom: 12px;
        }

        .vps-modal-form .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          font-size: 0.9em;
        }

        .vps-modal-form .form-group select,
        .vps-modal-form .form-group input {
          width: 100%;
          padding: 6px 10px;
          border: 1px solid var(--border-color, #ccc);
          border-radius: 4px;
          font-size: 0.95em;
          box-sizing: border-box;
        }

        .vps-modal-form .form-hint {
          display: block;
          margin-top: 4px;
          font-size: 0.8em;
          color: var(--text-secondary, #888);
        }

        .vps-modal .button-group {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
