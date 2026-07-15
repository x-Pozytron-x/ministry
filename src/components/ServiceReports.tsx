import { useState } from 'react';
import type { CongregationData, MonthlyServiceData, ServiceRecord, Publisher } from '../domain';
import { generateId, touchCongregationData } from '../domain';
import CSVImport from './CSVImport';

interface ServiceReportsProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
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

const getCurrentServiceYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  // Service year starts in September (month 9)
  if (month >= 9) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

const getMonthYearFormat = (serviceYear: string, monthValue: string): string => {
  const [startYear, endYear] = serviceYear.split('/').map(Number);
  const monthNum = parseInt(monthValue, 10);

  // September-December use startYear, January-August use endYear
  const year = monthNum >= 9 ? startYear : endYear;
  return `${year}-${monthValue}`;
};

export default function ServiceReports({ data, onUpdate }: ServiceReportsProps) {
  const currentServiceYear = getCurrentServiceYear();
  const [selectedServiceYear, setSelectedServiceYear] = useState(currentServiceYear);
  const [selectedMonth, setSelectedMonth] = useState('09');
  const [showImport, setShowImport] = useState(false);
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<{
    records: MonthlyServiceData[];
    publisherIds: string[];
  } | null>(null);

  const monthYearFormat = getMonthYearFormat(selectedServiceYear, selectedMonth);

  // Get monthly reports for selected month
  const getMonthlyReports = (): Array<{
    publisher: Publisher;
    report: MonthlyServiceData | null;
  }> => {
    return data.publishers.map(publisher => {
      const serviceRecord = data.serviceRecords.find(sr => sr.publisherId === publisher.id);
      const monthlyData = serviceRecord?.monthlyData?.find(md => md.month === monthYearFormat);

      return {
        publisher,
        report: monthlyData || null
      };
    });
  };

  const hasExistingReports = (): boolean => {
    return data.serviceRecords.some(sr =>
      sr.monthlyData?.some(md => md.month === monthYearFormat)
    );
  };

  const handleImportClick = () => {
    if (hasExistingReports()) {
      setShowReplaceWarning(true);
    } else {
      setShowImport(true);
    }
  };

  const handleConfirmReplace = () => {
    setShowReplaceWarning(false);
    setShowImport(true);
  };

  const handleImport = (records: MonthlyServiceData[], publisherIds: string[]) => {
    if (hasExistingReports() && !pendingImportData) {
      // Store pending import and show warning
      setPendingImportData({ records, publisherIds });
      setShowImport(false);
      setShowReplaceWarning(true);
      return;
    }

    applyImport(records, publisherIds);
  };

  const applyImport = (records: MonthlyServiceData[], publisherIds: string[]) => {
    const newServiceRecords = [...data.serviceRecords];

    // Remove existing reports for this month
    for (const sr of newServiceRecords) {
      if (sr.monthlyData) {
        sr.monthlyData = sr.monthlyData.filter(md => md.month !== monthYearFormat);
      }
    }

    // Add new reports
    records.forEach((monthlyData, index) => {
      const publisherId = publisherIds[index];
      let serviceRecord = newServiceRecords.find(sr => sr.publisherId === publisherId);

      if (!serviceRecord) {
        // Create new service record
        const publisher = data.publishers.find(p => p.id === publisherId);
        serviceRecord = {
          id: generateId(),
          publisherId,
          serviceYear: selectedServiceYear,
          monthlyData: [],
          publisherSnapshot: publisher ? {
            firstName: publisher.firstName,
            lastName: publisher.lastName
          } : undefined
        };
        newServiceRecords.push(serviceRecord);
      }

      if (!serviceRecord.monthlyData) {
        serviceRecord.monthlyData = [];
      }

      serviceRecord.monthlyData.push(monthlyData);
    });

    const updatedData = touchCongregationData({
      ...data,
      serviceRecords: newServiceRecords
    });

    onUpdate(updatedData);
    setShowImport(false);
    setShowReplaceWarning(false);
    setPendingImportData(null);
  };

  const monthlyReports = getMonthlyReports();

  return (
    <div className="section">
      <div className="section-header">
        <h2>Service Reports</h2>
        <button onClick={handleImportClick} className="primary">
          📥 Импорт CSV
        </button>
      </div>

      {/* Month tabs */}
      <div className="month-tabs">
        {SERVICE_MONTHS.map(month => (
          <button
            key={month.value}
            className={selectedMonth === month.value ? 'active' : ''}
            onClick={() => setSelectedMonth(month.value)}
          >
            {month.label}
          </button>
        ))}
      </div>

      {/* Reports table */}
      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Возвещатель</th>
              <th>Служение</th>
              <th>Изучения</th>
              <th>Часы</th>
              <th>Примечание</th>
              <th>Пионер</th>
              <th>Подсобный пионер</th>
              <th>Неактивный</th>
            </tr>
          </thead>
          <tbody>
            {monthlyReports.map((item, index) => {
              const report = item.report;
              const isRegularPioneer = item.publisher.assignments.pioneer;

              return (
                <tr key={item.publisher.id}>
                  <td>{index + 1}</td>
                  <td>{item.publisher.firstName} {item.publisher.lastName}</td>
                  <td>
                    {report?.participated !== undefined ? (
                      <span className={report.participated ? 'badge-yes' : 'badge-no'}>
                        {report.participated ? 'Да' : 'Нет'}
                      </span>
                    ) : (
                      <span className="badge-empty">-</span>
                    )}
                  </td>
                  <td>{report?.bibleStudies ?? '-'}</td>
                  <td>{report?.hours !== undefined && report.hours !== null ? report.hours : '-'}</td>
                  <td className="note-cell">{report?.note || '-'}</td>
                  <td>
                    {isRegularPioneer && <span className="badge-yes">Да</span>}
                    {!isRegularPioneer && <span className="badge-no">Нет</span>}
                  </td>
                  <td>
                    {report?.auxiliaryPioneer && <span className="badge-yes">Да</span>}
                    {report && !report.auxiliaryPioneer && <span className="badge-no">Нет</span>}
                    {!report && <span className="badge-empty">-</span>}
                  </td>
                  <td>
                    {report?.inactive && <span className="badge-warning">Да</span>}
                    {report && !report.inactive && <span className="badge-no">Нет</span>}
                    {!report && <span className="badge-empty">-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CSV Import Modal */}
      {showImport && (
        <CSVImport
          data={data}
          selectedMonth={monthYearFormat}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Replace Warning Modal */}
      {showReplaceWarning && (
        <div className="modal-overlay" onClick={() => setShowReplaceWarning(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Предупреждение</h3>
            </div>
            <div className="modal-body">
              <p>Данные за этот месяц уже существуют. Заменить?</p>
              <div className="button-group">
                <button
                  onClick={() => {
                    if (pendingImportData) {
                      applyImport(pendingImportData.records, pendingImportData.publisherIds);
                    } else {
                      handleConfirmReplace();
                    }
                  }}
                  className="primary"
                >
                  Да, заменить
                </button>
                <button
                  onClick={() => {
                    setShowReplaceWarning(false);
                    setPendingImportData(null);
                  }}
                  className="secondary"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
