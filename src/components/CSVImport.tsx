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

interface UnmatchedPublisher {
  csvName: string;
  csvRecord: CSVServiceReport;
  suggestedPublishers: Publisher[];
}

type MatchDecision =
  | { type: 'link'; publisherId: string }
  | { type: 'historical' }
  | { type: 'skip' };

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
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }
  return {
    firstName: fullName,
    lastName: ''
  };
};

export default function CSVImport({ data, selectedMonth, onImport, onClose }: CSVImportProps) {
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvRecords, setCSVRecords] = useState<CSVServiceReport[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedPublisher[]>([]);
  const [matchDecisions, setMatchDecisions] = useState<Map<string, MatchDecision>>(new Map());
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'resolve' | 'confirm'>('upload');

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

  const findSimilarPublishers = (name: string): Publisher[] => {
    const normalized = name.toLowerCase().trim();
    const words = normalized.split(/\s+/);

    return data.publishers.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      return words.some(word => fullName.includes(word));
    }).slice(0, 5);
  };

  const handleParse = async () => {
    if (!csvFile) return;

    try {
      const text = await csvFile.text();
      const records = parseCSV(text);
      setCSVRecords(records);

      // Find unmatched publishers
      const unmatchedList: UnmatchedPublisher[] = [];

      for (const record of records) {
        const publisher = findPublisherByName(record.publisherName);
        if (!publisher) {
          const similar = findSimilarPublishers(record.publisherName);
          unmatchedList.push({
            csvName: record.publisherName,
            csvRecord: record,
            suggestedPublishers: similar
          });
        }
      }

      if (unmatchedList.length > 0) {
        setUnmatched(unmatchedList);
        setStep('resolve');
      } else {
        setStep('confirm');
      }

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка парсинга CSV');
    }
  };

  const handleMatchDecision = (csvName: string, decision: MatchDecision) => {
    const newDecisions = new Map(matchDecisions);
    newDecisions.set(csvName, decision);
    setMatchDecisions(newDecisions);
  };

  const handleResolveComplete = () => {
    setStep('confirm');
  };

  const handleConfirmImport = () => {
    const importRecords: ImportRecord[] = [];

    for (const record of csvRecords) {
      let publisher = findPublisherByName(record.publisherName);
      let publisherId: string | undefined;
      let publisherSnapshot: { firstName: string; lastName: string };

      // If not found, check match decisions
      if (!publisher) {
        const decision = matchDecisions.get(record.publisherName);

        if (decision?.type === 'link') {
          publisher = data.publishers.find(p => p.id === decision.publisherId) || null;
          if (publisher) {
            publisherId = publisher.id;
            publisherSnapshot = {
              firstName: publisher.firstName,
              lastName: publisher.lastName
            };
          } else {
            continue; // Should not happen
          }
        } else if (decision?.type === 'historical') {
          // Import as historical record without publisherId
          publisherId = undefined;
          publisherSnapshot = parseFullName(record.publisherName);
        } else if (decision?.type === 'skip') {
          continue;
        } else {
          // No decision made - skip
          continue;
        }
      } else {
        // Publisher found - link to existing
        publisherId = publisher.id;
        publisherSnapshot = {
          firstName: publisher.firstName,
          lastName: publisher.lastName
        };
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

        {step === 'resolve' && unmatched.length > 0 && (
          <div className="modal-body">
            <p>Найдены неизвестные возвещатели. Выберите действие для каждого:</p>

            <div className="unmatched-list">
              {unmatched.map((item, index) => {
                const decision = matchDecisions.get(item.csvName);

                return (
                  <div key={index} className="unmatched-item">
                    <div className="unmatched-name">{item.csvName}</div>

                    <div className="decision-group">
                      <label>
                        <input
                          type="radio"
                          name={`decision-${index}`}
                          checked={decision?.type === 'historical'}
                          onChange={() => handleMatchDecision(item.csvName, { type: 'historical' })}
                        />
                        Импортировать как историческую запись
                      </label>

                      {item.suggestedPublishers.length > 0 && (
                        <div className="suggestions">
                          <label>Связать с существующим:</label>
                          {item.suggestedPublishers.map(pub => (
                            <label key={pub.id}>
                              <input
                                type="radio"
                                name={`decision-${index}`}
                                checked={decision?.type === 'link' && decision.publisherId === pub.id}
                                onChange={() => handleMatchDecision(item.csvName, { type: 'link', publisherId: pub.id })}
                              />
                              {pub.firstName} {pub.lastName}
                            </label>
                          ))}
                        </div>
                      )}

                      <label>
                        <input
                          type="radio"
                          name={`decision-${index}`}
                          checked={decision?.type === 'skip'}
                          onChange={() => handleMatchDecision(item.csvName, { type: 'skip' })}
                        />
                        Пропустить
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="button-group">
              <button
                onClick={handleResolveComplete}
                disabled={Array.from(matchDecisions.values()).length < unmatched.length}
                className="primary"
              >
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
