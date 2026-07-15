import { useState } from 'react';
import type { CongregationData, Publisher, MonthlyServiceData } from '../domain';
import { parseCSV, parseBooleanValue, parseNumberValue, parseHoursValue, CSVServiceReport } from '../utils/csvParser';

interface CSVImportProps {
  data: CongregationData;
  selectedMonth: string; // YYYY-MM format
  onImport: (records: ImportRecord[]) => void;
  onClose: () => void;
}

export interface ImportRecord {
  monthlyData: MonthlyServiceData;
  publisherId?: string;
  publisherSnapshot: {
    firstName: string;
    lastName: string;
  };
}

const SERVICE_MONTHS = [
  { value: '09', label: 'Сентябрь' },
  { value: '10', label: 'Октябрь' },
  { value: '11', label: 'Ноябрь' },
  { value: '12', label: 'Декабрь' },
  { value: '01', label: 'Январь' },
  { value: '02', label: 'Февраль' },
  { value: '03', label: 'Март' },
  { value: '04', label: 'Апрель' },
  { value: '05', label: 'Май' },
  { value: '06', label: 'Июнь' },
  { value: '07', label: 'Июль' },
  { value: '08', label: 'Август' }
];

const parseFullName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return {
      firstName: parts.slice(1).join(' '),
      lastName: parts[0]
    };
  }
  return {
    firstName: '',
    lastName: fullName
  };
};

export default function CSVImport({ data, selectedMonth, onImport, onClose }: CSVImportProps) {
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvRecords, setCSVRecords] = useState<CSVServiceReport[]>([]);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'confirm'>('upload');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Выберите CSV файл');
      return;
    }

    setCSVFile(file);
    setError('');
  };

  const findPublisherByName = (name: string): Publisher | null => {
    const normalized = name.toLowerCase().trim();
    return data.publishers.find(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase().trim();
      const reverseFullName = `${p.lastName} ${p.firstName}`.toLowerCase().trim();
      return fullName === normalized || reverseFullName === normalized;
    }) || null;
  };

  const handleParse = async () => {
    if (!csvFile) return;

    try {
      const text = await csvFile.text();
      const records = parseCSV(text);
      setCSVRecords(records);

      // Count unmatched publishers (they will be imported as historical)
      let count = 0;
      for (const record of records) {
        const publisher = findPublisherByName(record.publisherName);
        if (!publisher) {
          count++;
        }
      }
      setUnmatchedCount(count);

      setStep('confirm');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка парсинга CSV');
    }
  };

  const handleConfirmImport = () => {
    const importRecords: ImportRecord[] = [];

    for (const record of csvRecords) {
      const publisher = findPublisherByName(record.publisherName);
      let publisherId: string | undefined;
      let publisherSnapshot: { firstName: string; lastName: string };

      if (publisher) {
        // Publisher matched - link to existing publisher
        publisherId = publisher.id;
        publisherSnapshot = {
          firstName: publisher.firstName,
          lastName: publisher.lastName
        };
      } else {
        // Unmatched publisher - import as historical record
        publisherId = undefined;
        publisherSnapshot = parseFullName(record.publisherName);
      }

      const monthlyData: MonthlyServiceData = {
        month: selectedMonth,
        participated: parseBooleanValue(record.participated),
        bibleStudies: parseNumberValue(record.bibleStudies),
        hours: parseHoursValue(record.hours),
        auxiliaryPioneer: parseBooleanValue(record.auxiliary),
        inactive: parseBooleanValue(record.inactive),
        note: record.notes
      };

      importRecords.push({
        monthlyData,
        publisherId,
        publisherSnapshot
      });
    }

    onImport(importRecords);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Импорт CSV отчётов за {SERVICE_MONTHS.find(m => selectedMonth.endsWith(m.value))?.label}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {error && <div className="error">{error}</div>}

        {step === 'upload' && (
          <div className="modal-body">
            <div className="form-group">
              <label>Выберите CSV файл</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
              />
            </div>

            {csvFile && (
              <div className="file-info">
                <p>Файл: {csvFile.name}</p>
                <p>Размер: {(csvFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            <div className="button-group">
              <button onClick={handleParse} disabled={!csvFile} className="primary">
                Далее
              </button>
              <button onClick={onClose} className="secondary">
                Отмена
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="modal-body">
            <p>Готово к импорту: {csvRecords.length} записей</p>
            {unmatchedCount > 0 && (
              <p className="warning">
                Обнаружено неизвестных возвещателей: {unmatchedCount}.
                Они будут импортированы как исторические записи.
              </p>
            )}
            <p>Месяц: {SERVICE_MONTHS.find(m => selectedMonth.endsWith(m.value))?.label}</p>

            <div className="button-group">
              <button onClick={handleConfirmImport} className="primary">
                Импортировать
              </button>
              <button onClick={onClose} className="secondary">
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
