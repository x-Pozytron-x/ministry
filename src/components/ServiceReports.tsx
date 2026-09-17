import { useState } from 'react';
import type { CongregationData, MonthlyServiceData, ServiceRecord, ServiceYear } from '../domain';
import { generateId, touchCongregationData, getServiceYear } from '../domain';
import CSVImport, { type ImportRecord } from './CSVImport';
import ManualReportEntry from './ManualReportEntry';
import { type ManualEntryRecord } from './ManualReportEntry';

interface ServiceReportsProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
  selectedServiceYearStart: number;
  workingServiceYearStart: number;
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

const getMonthYearFormat = (serviceYear: string, monthValue: string): string => {
  const [startYear, endYear] = serviceYear.split('/').map(Number);
  const monthNum = parseInt(monthValue, 10);

  // September-December use startYear, January-August use endYear
  const year = monthNum >= 9 ? startYear : endYear;
  return `${year}-${monthValue}`;
};

export default function ServiceReports({ data, onUpdate, selectedServiceYearStart }: ServiceReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState('09');

  const currentServiceYear: ServiceYear = getServiceYear(selectedServiceYearStart);
  const [showImport, setShowImport] = useState(false);
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<ImportRecord[] | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [editingReport, setEditingReport] = useState<{
    serviceRecordId: string;
    monthlyData: MonthlyServiceData;
    publisherId?: string;
    publisherSnapshot: { firstName: string; lastName: string };
  } | undefined>(undefined);

  const monthYearFormat = getMonthYearFormat(currentServiceYear, selectedMonth);

  // Get monthly reports for selected month
  // Rows come from ServiceRecords with monthlyData for the selected month,
  // NOT from current publishers list. This preserves historical records.
  const getMonthlyReports = () => {
    const rows: Array<{
      id: string;
      displayLastName: string;
      displayFirstName: string;
      report: MonthlyServiceData;
      isRegularPioneer: boolean;
    }> = [];

    for (const sr of data.serviceRecords) {
      const monthlyData = sr.monthlyData?.find(md => md.month === monthYearFormat);
      if (!monthlyData) continue;

      // Use publisherSnapshot for historical name preservation
      const lastName = sr.publisherSnapshot?.lastName ?? '';
      const firstName = sr.publisherSnapshot?.firstName ?? '';

      rows.push({
        id: sr.id,
        displayLastName: lastName,
        displayFirstName: firstName,
        report: monthlyData,
        isRegularPioneer: monthlyData.pioneer ?? false
      });
    }

    // Sort by LastName, then FirstName (ascending)
    rows.sort((a, b) => {
      const lastCmp = a.displayLastName.localeCompare(b.displayLastName);
      if (lastCmp !== 0) return lastCmp;
      return a.displayFirstName.localeCompare(b.displayFirstName);
    });

    return rows;
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

  const handleImport = (records: ImportRecord[]) => {
    if (hasExistingReports() && !pendingImportData) {
      // Store pending import and show warning
      setPendingImportData(records);
      setShowImport(false);
      setShowReplaceWarning(true);
      return;
    }

    applyImport(records);
  };

  const applyImport = (records: ImportRecord[]) => {
    const newServiceRecords: ServiceRecord[] = data.serviceRecords.map(sr => ({
      ...sr,
      monthlyData: sr.monthlyData ? [...sr.monthlyData] : undefined
    }));

    // Remove existing reports for this month
    for (const sr of newServiceRecords) {
      if (sr.monthlyData) {
        sr.monthlyData = sr.monthlyData.filter(md => md.month !== monthYearFormat);
      }
    }

    // Add new reports
    for (const record of records) {
      const publisherId = record.publisherId;

      let serviceRecord: ServiceRecord | undefined;
      if (publisherId != null) {
        serviceRecord = newServiceRecords.find(sr => sr.publisherId === publisherId);
      } else {
        // Match historical records by snapshot name to reuse existing record
        serviceRecord = newServiceRecords.find(sr =>
          sr.publisherId == null &&
          sr.publisherSnapshot?.firstName === record.publisherSnapshot.firstName &&
          sr.publisherSnapshot?.lastName === record.publisherSnapshot.lastName
        );
      }

      if (!serviceRecord) {
        // Create new service record
        serviceRecord = {
          id: generateId(),
          publisherId,
          serviceYear: currentServiceYear,
          monthlyData: [],
          publisherSnapshot: record.publisherSnapshot
        };
        newServiceRecords.push(serviceRecord);
      }

      // serviceRecord is guaranteed defined here (found or just created)
      const sr = serviceRecord!;
      if (!sr.monthlyData) {
        sr.monthlyData = [];
      }

      sr.monthlyData.push(record.monthlyData);
    }

    // Remove orphan ServiceRecords with empty monthlyData (no useful data)
    const cleaned = newServiceRecords.filter(sr =>
      !(sr.monthlyData && sr.monthlyData.length === 0)
    );

    const updatedData = touchCongregationData({
      ...data,
      serviceRecords: cleaned
    });

    onUpdate(updatedData);
    setShowImport(false);
    setShowReplaceWarning(false);
    setPendingImportData(null);
  };

  const handleManualEntrySave = (records: ManualEntryRecord[]) => {
    const newServiceRecords: ServiceRecord[] = data.serviceRecords.map(sr => ({
      ...sr,
      monthlyData: sr.monthlyData ? [...sr.monthlyData] : undefined
    }));

    if (editingReport) {
      // Edit mode: update existing record
      const recordIdx = newServiceRecords.findIndex(sr => sr.id === editingReport.serviceRecordId);
      if (recordIdx !== -1) {
        const sr = newServiceRecords[recordIdx];
        if (sr.monthlyData) {
          sr.monthlyData = sr.monthlyData.filter(md => md.month !== monthYearFormat);
        }
        if (!sr.monthlyData) {
          sr.monthlyData = [];
        }
        sr.monthlyData.push(records[0].monthlyData);
      }
    } else {
      // Add mode: add new report
      const record = records[0];
      const publisherId = record.publisherId;

      let serviceRecord: ServiceRecord | undefined;
      if (publisherId != null) {
        serviceRecord = newServiceRecords.find(sr => sr.publisherId === publisherId);
      } else {
        serviceRecord = newServiceRecords.find(sr =>
          sr.publisherId == null &&
          sr.publisherSnapshot?.firstName === record.publisherSnapshot.firstName &&
          sr.publisherSnapshot?.lastName === record.publisherSnapshot.lastName
        );
      }

      if (!serviceRecord) {
        serviceRecord = {
          id: generateId(),
          publisherId,
          serviceYear: currentServiceYear,
          monthlyData: [],
          publisherSnapshot: record.publisherSnapshot
        };
        newServiceRecords.push(serviceRecord);
      }

      const sr = serviceRecord!;
      if (!sr.monthlyData) {
        sr.monthlyData = [];
      }
      sr.monthlyData.push(records[0].monthlyData);
    }

    const cleaned = newServiceRecords.filter(sr =>
      !(sr.monthlyData && sr.monthlyData.length === 0)
    );

    const updatedData = touchCongregationData({
      ...data,
      serviceRecords: cleaned
    });

    onUpdate(updatedData);
    setShowManualEntry(false);
    setEditingReport(undefined);
  };

  const handleRowClick = (item: ReturnType<typeof getMonthlyReports>[number]) => {
    const existingRecord = data.serviceRecords.find(sr => sr.id === item.id);
    setEditingReport({
      serviceRecordId: item.id,
      monthlyData: item.report,
      publisherId: existingRecord?.publisherId,
      publisherSnapshot: {
        firstName: item.displayFirstName,
        lastName: item.displayLastName
      }
    });
    setShowManualEntry(true);
  };

  const handleDownloadTemplate = () => {
    const template = `Номер,Имя,Участие,Изучения,Часы,Примечание,Пионер,Подсобный,Неактивный
1,Иванов Иван,да,0,0,Прimer note,да,нет,нет`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service-report-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthlyReports = getMonthlyReports();

  return (
    <div className="section">
      <div className="section-header">
        <h2>Reports</h2>
        <div className="button-group">
          <button onClick={handleDownloadTemplate} className="secondary">
            📥 Скачать шаблон
          </button>
          <button onClick={() => setShowManualEntry(true)} className="secondary">
            ➕ Внести отчет
          </button>
          <button onClick={handleImportClick} className="primary">
            📥 Импорт CSV
          </button>
        </div>
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
              <th>Подсобный</th>
              <th>Неактивный</th>
            </tr>
          </thead>
          <tbody>
            {monthlyReports.map((item, index) => {
              const report = item.report;

              return (
                <tr key={item.id} onClick={() => handleRowClick(item)}>
                  <td>{index + 1}</td>
                  <td>{item.displayLastName} {item.displayFirstName}</td>
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
                    {item.isRegularPioneer && <span className="badge-yes">Да</span>}
                    {!item.isRegularPioneer && <span className="badge-no">Нет</span>}
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
                      applyImport(pendingImportData);
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

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <ManualReportEntry
          data={data}
          selectedMonth={monthYearFormat}
          editingRecord={editingReport}
          onClose={() => {
            setShowManualEntry(false);
            setEditingReport(undefined);
          }}
          onSave={handleManualEntrySave}
        />
      )}
    </div>
  );
}
