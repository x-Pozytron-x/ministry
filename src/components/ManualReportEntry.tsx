import { useState } from 'react';
import type { CongregationData, MonthlyServiceData } from '../domain';
import { parseNumberValue, parseHoursValue } from '../utils/csvParser';

interface ManualReportEntryProps {
  data: CongregationData;
  selectedMonth: string; // YYYY-MM format
  editingRecord?: {
    serviceRecordId: string;
    monthlyData: MonthlyServiceData;
    publisherId?: string;
    publisherSnapshot: { firstName: string; lastName: string };
  };
  onClose: () => void;
  onSave: (records: ManualEntryRecord[]) => void;
}

export interface ManualEntryRecord {
  monthlyData: MonthlyServiceData;
  publisherId?: string;
  publisherSnapshot: { firstName: string; lastName: string };
}

interface ManualReportEntryFormData {
  selectedPublisherId: string;
  participated: boolean;
  bibleStudies: string;
  hours: string;
  note: string;
  pioneer: boolean;
  auxiliary: boolean;
  inactive: boolean;
}

export default function ManualReportEntry({ data, selectedMonth, editingRecord, onClose, onSave }: ManualReportEntryProps) {
  const [formData, setFormData] = useState<ManualReportEntryFormData>(() => {
    if (editingRecord) {
      const md = editingRecord.monthlyData;
      return {
        selectedPublisherId: editingRecord.publisherId ?? '',
        participated: md.participated,
        bibleStudies: String(md.bibleStudies),
        hours: md.hours !== null && md.hours !== undefined ? String(md.hours) : '',
        note: md.note || '',
        pioneer: md.pioneer ?? false,
        auxiliary: md.auxiliaryPioneer ?? false,
        inactive: md.inactive ?? false
      };
    }
    return {
      selectedPublisherId: '',
      participated: false,
      bibleStudies: '0',
      hours: '',
      note: '',
      pioneer: false,
      auxiliary: false,
      inactive: false
    };
  });

  const handleSave = () => {
    let publisherId: string | undefined;
    let publisherSnapshot: { firstName: string; lastName: string };

    if (formData.selectedPublisherId) {
      const publisher = data.publishers.find(p => p.id === formData.selectedPublisherId);
      if (publisher) {
        publisherId = publisher.id;
        publisherSnapshot = { firstName: publisher.firstName, lastName: publisher.lastName };
      } else {
        publisherSnapshot = { firstName: '', lastName: '' };
      }
    } else {
      publisherSnapshot = { firstName: '', lastName: '' };
    }

    const monthlyData: MonthlyServiceData = {
      month: selectedMonth,
      participated: formData.participated,
      bibleStudies: parseNumberValue(formData.bibleStudies),
      hours: formData.hours.trim() ? parseHoursValue(formData.hours) : null,
      auxiliaryPioneer: formData.auxiliary,
      inactive: formData.inactive,
      pioneer: formData.pioneer,
      note: formData.note
    };

    onSave([{ monthlyData, publisherId, publisherSnapshot }]);
  };

  const getMonthLabel = () => {
    const monthNum = parseInt(selectedMonth.split('-')[1], 10);
    const monthMap: Record<number, string> = {
      9: 'Сентябрь', 10: 'Октябрь', 11: 'Ноябрь', 12: 'Декабрь',
      1: 'Январь', 2: 'Февраль', 3: 'Март', 4: 'Апрель',
      5: 'Май', 6: 'Июнь', 7: 'Июль', 8: 'Август'
    };
    return monthMap[monthNum] || selectedMonth;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingRecord ? 'Редагировать отчет' : 'Новый отчет'} за {getMonthLabel()}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Выберите возвещатель</label>
            <select
              value={formData.selectedPublisherId}
              onChange={(e) => setFormData({ ...formData, selectedPublisherId: e.target.value })}
            >
              <option key="" value="">-- Неизбранный --</option>
              {data.publishers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.lastName} {p.firstName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Служение</label>
              <input
                type="checkbox"
                checked={formData.participated}
                onChange={(e) => setFormData({ ...formData, participated: (e.target as HTMLInputElement).checked })}
              />
            </div>
            <div className="form-group">
              <label>Изучения</label>
              <input
                type="number"
                value={formData.bibleStudies}
                onChange={(e) => setFormData({ ...formData, bibleStudies: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Часы</label>
              <input
                type="number"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                min="0"
                placeholder="-"
              />
            </div>
            <div className="form-group">
              <label>Примечание</label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder=""
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Пионер</label>
              <input
                type="checkbox"
                checked={formData.pioneer}
                onChange={(e) => setFormData({ ...formData, pioneer: (e.target as HTMLInputElement).checked })}
              />
            </div>
            <div className="form-group">
              <label>Подсобный</label>
              <input
                type="checkbox"
                checked={formData.auxiliary}
                onChange={(e) => setFormData({ ...formData, auxiliary: (e.target as HTMLInputElement).checked })}
              />
            </div>
            <div className="form-group">
              <label>Неактивный</label>
              <input
                type="checkbox"
                checked={formData.inactive}
                onChange={(e) => setFormData({ ...formData, inactive: (e.target as HTMLInputElement).checked })}
              />
            </div>
          </div>

          <div className="button-group">
            <button onClick={handleSave} className="primary">
              {editingRecord ? 'Сохранить измены' : 'Добавить отчет'}
            </button>
            <button onClick={onClose} className="secondary">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
