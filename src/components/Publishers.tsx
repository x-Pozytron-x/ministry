import { useCallback, useState } from 'react';
import type { Publisher, CongregationData } from '../domain';
import { PublisherService } from '../domain';
import PublisherModal from './PublisherModal';

interface PublishersProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
  userMode: 'guest' | 'admin';
}

interface PublishersState {
  sortKey: string | null;
  sortDirection: 'asc' | 'desc' | null;
  isModalOpen: boolean;
  editingPublisher: Publisher | null;
}

type SortValue = string | number;

export default function Publishers({ data, onUpdate, userMode }: PublishersProps) {
  const [state, setState] = useState<PublishersState>({
    sortKey: 'fullName',
    sortDirection: 'asc',
    isModalOpen: false,
    editingPublisher: null
  });

  const openCreateModal = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      editingPublisher: null
    }));
  };

  const openEditModal = (publisher: Publisher) => {
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      editingPublisher: publisher
    }));
  };

  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      editingPublisher: null
    }));
  }, []);

  const handleSubmit = (publisher: Publisher) => {
    const exists = data.publishers.some(item => item.id === publisher.id);
    const updated = exists
      ? PublisherService.updatePublisher(data, publisher.id, publisher)
      : PublisherService.addPublisher(data, publisher);
    onUpdate(updated);
  };

  const handleDelete = (publisherId: string) => {
    onUpdate(PublisherService.removePublisher(data, publisherId));
  };

  const handleHeaderClick = (key: string) => {
    if (state.sortKey !== key) {
      setState(prev => ({ ...prev, sortKey: key, sortDirection: 'asc' }));
    } else if (state.sortDirection === 'asc') {
      setState(prev => ({ ...prev, sortDirection: 'desc' }));
    } else if (state.sortDirection === 'desc') {
      setState(prev => ({ ...prev, sortDirection: null, sortKey: null }));
    } else {
      setState(prev => ({ ...prev, sortDirection: 'asc' }));
    }
  };

  const sortedPublishers = [...data.publishers].sort((a, b) => {
    if (!state.sortKey || !state.sortDirection) return 0;

    let valA: SortValue = '';
    let valB: SortValue = '';

    switch (state.sortKey) {
      case 'fullName':
        valA = `${a.lastName} ${a.firstName}`.toLowerCase();
        valB = `${b.lastName} ${b.firstName}`.toLowerCase();
        break;
      case 'phone':
        valA = (a.phonePrimary || '').toLowerCase();
        valB = (b.phonePrimary || '').toLowerCase();
        break;
      case 'address':
        valA = (a.address || '').toLowerCase();
        valB = (b.address || '').toLowerCase();
        break;
      case 'vpsGroup':
        valA = a.vpsGroup ?? 9999;
        valB = b.vpsGroup ?? 9999;
        break;
      case 'birthDate':
        valA = a.birthDate || '9999-99-99';
        valB = b.birthDate || '9999-99-99';
        break;
      case 'baptismDate':
        valA = a.baptismDate || '9999-99-99';
        valB = b.baptismDate || '9999-99-99';
        break;
      case 'emergencyContact':
        valA = `${a.emergencyContact?.firstName || ''} ${a.emergencyContact?.lastName || ''}`.trim().toLowerCase();
        valB = `${b.emergencyContact?.firstName || ''} ${b.emergencyContact?.lastName || ''}`.trim().toLowerCase();
        break;
      default:
        return 0;
    }

    if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIndicator = (key: string) => {
    if (state.sortKey !== key) return ' ↕';
    return state.sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Возвещатели ({data.publishers.length})</h2>
        {userMode === 'admin' && (
          <button type="button" onClick={openCreateModal} className="primary">
            + Добавить
          </button>
        )}
      </div>

      <style>{`
        .publishers-grid-container {
          overflow-x: auto;
          margin-top: 45px;
          border: 1px solid var(--border-color, #ccc);
          border-radius: 4px;
          overflow-y: auto;
        }
        .excel-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75em;
          background-color: var(--card-bg, #fff);
          color: var(--text-primary, #000);
          text-align: left;
        }
        .excel-table th, .excel-table td {
          border: 1px solid var(--border-color, #ccc);
          padding: 3px 5px;
          vertical-align: middle;
          white-space: nowrap;
        }
        .excel-table th {
          background-color: var(--secondary-bg, #f5f5f5);
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
          cursor: pointer;
          user-select: none;
          box-shadow: inset 0 -1px 0 var(--border-color, #ccc);
        }
        .excel-table th:hover {
          background-color: var(--border-color, #e0e0e0);
        }
        .excel-table tbody tr {
          cursor: pointer;
          transition: background-color 0.15s;
        }
        .excel-table tbody tr:hover {
          background-color: var(--secondary-bg, #fafafa);
        }
      `}</style>

      <div className="publishers-grid-container">
        {data.publishers.length === 0 ? (
          <div className="empty" style={{ padding: '2em', textAlign: 'center' }}>Нет возвещателей</div>
        ) : (
          <table className="excel-table">
            <thead>
              <tr>
                <th onClick={() => handleHeaderClick('fullName')}>ФИО{renderSortIndicator('fullName')}</th>
                <th onClick={() => handleHeaderClick('phone')}>Телефон{renderSortIndicator('phone')}</th>
                <th onClick={() => handleHeaderClick('address')}>Адрес{renderSortIndicator('address')}</th>
                <th onClick={() => handleHeaderClick('vpsGroup')}>ВПС{renderSortIndicator('vpsGroup')}</th>
                <th onClick={() => handleHeaderClick('birthDate')}>Дата рождения{renderSortIndicator('birthDate')}</th>
                <th onClick={() => handleHeaderClick('baptismDate')}>Дата крещения{renderSortIndicator('baptismDate')}</th>
                <th onClick={() => handleHeaderClick('emergencyContact')}>Экстренная связь{renderSortIndicator('emergencyContact')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedPublishers.map((publisher) => {
                const fullName = `${publisher.lastName} ${publisher.firstName}`;
                const phone = publisher.phonePrimary || '—';
                const address = publisher.address || '—';
                const vpsGroup = publisher.vpsGroup ? `№ ${publisher.vpsGroup}` : '—';
                const birth = publisher.birthDate || '—';
                const baptism = publisher.baptismDate || '—';

                const emName = `${publisher.emergencyContact?.firstName || ''} ${publisher.emergencyContact?.lastName || ''}`.trim();
                const emPhone = publisher.emergencyContact?.phone || '';

                return (
                  <tr key={publisher.id} onClick={() => openEditModal(publisher)}>
                    <td style={{ fontWeight: 600 }}>{fullName}</td>
                    <td>{phone}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={address}>
                      {address}
                    </td>
                    <td>{vpsGroup}</td>
                    <td>{birth}</td>
                    <td>{baptism}</td>
                    <td>
                      {emName || emPhone ? (
                        <>
                          <div style={{ fontWeight: 500 }}>{emName || '—'}</div>
                          <div style={{ fontSize: '0.9em', color: 'var(--text-secondary, #666)' }}>{emPhone || '—'}</div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {state.isModalOpen && (
        <PublisherModal
          publisher={state.editingPublisher}
          vpsGroupsCount={data.settings.vpsGroupsCount}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          userMode={userMode}
        />
      )}
    </div>
  );
}
