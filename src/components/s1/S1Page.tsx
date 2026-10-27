import { useMemo } from 'react';
import type { CongregationData, ServiceYear } from '../../domain';
import { S1Service } from '../../application/s1Service';
import { getServiceYear } from '../../domain';

interface S1PageProps {
  data: CongregationData;
  selectedServiceYearStart: number;
  workingServiceYearStart: number;
}

const MONTH_LABELS: Record<string, string> = {
  '09': 'Сентябрь',
  '10': 'Октябрь',
  '11': 'Ноябрь',
  '12': 'Декабрь',
  '01': 'Январь',
  '02': 'Февраль',
  '03': 'Март',
  '04': 'Апрель',
  '05': 'Май',
  '06': 'Июнь',
  '07': 'Июль',
  '08': 'Август',
};

const MONTH_KEYS = ['09','10','11','12','01','02','03','04','05','06','07','08'];

export default function S1Page({ data, selectedServiceYearStart }: S1PageProps) {
  const currentServiceYear: ServiceYear = getServiceYear(selectedServiceYearStart);

  const rows = useMemo(
    () => S1Service.generate(data, currentServiceYear),
    [data, currentServiceYear]
  );

  // Build a lookup map for O(1) access by monthKey
  const rowByMonth = useMemo(() => {
    const map = new Map<string, typeof rows[0]>();
    for (const r of rows) map.set(r.monthKey, r);
    return map;
  }, [rows]);

  const hasData = rows.some(r =>
    r.activePublishers > 0 ||
    r.publisherReports > 0 ||
    r.auxiliaryReports > 0 ||
    r.regularReports > 0
  );

  return (
    <div className="section">
      <style>{`
        .s1-wrapper {
          overflow-x: auto;
          margin-top: 8px;
        }

        .s1-table {
          width: 100%;
          
          border-collapse: collapse;
          border: 2px solid var(--border-color);
          font-size: 0.85em;
        }

        .s1-table thead {
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .s1-table th {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          padding: 6px 4px;
          text-align: center;
          font-weight: 600;
          white-space: nowrap;
        }

        .s1-table th.group-header {
          font-size: 0.85em;
          color: var(--primary-color);
          border-bottom: none;
        }

        .s1-table th.sub-header {
          font-size: 0.8em;
          font-weight: 500;
          border-top: none;
          color: var(--text-secondary);
        }

        .s1-table th.month-header {
          text-align: left;
          padding-left: 10px;
        }

        .s1-table td {
          border: 1px solid var(--border-color);
          padding: 5px 4px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        .s1-table td.month-cell {
          text-align: left;
          padding-left: 10px;
          font-weight: 500;
          white-space: nowrap;
        }

        .s1-table tbody tr:hover {
          background: var(--secondary-bg);
        }

        .s1-table tbody tr:last-child td {
          border-bottom: 2px solid var(--border-color);
        }

        .s1-empty {
          text-align: center;
          padding: 2em;
          color: var(--text-secondary);
          font-style: italic;
        }

        .s1-service-year {
          font-size: 0.9em;
          color: var(--text-secondary);
          margin-bottom: 1em;
        }
      `}</style>

      <div className="section-header" style={{ position: 'static', marginBottom: '0.5em' }}>
        <h2>S-1 — Отчет собрания о служении</h2>
      </div>

        <div className="s1-service-year">
        Служебный год: {currentServiceYear}
      </div>

      <div className="s1-wrapper">
        <table className="s1-table">
          <thead>
            <tr>
              <th rowSpan={2} className="month-header" style={{ minWidth: 100 }}>Месяц</th>
              <th rowSpan={2} style={{ minWidth: 80 }}>Активные <br /> возвещатели</th>
              <th rowSpan={2} style={{ minWidth: 80 }}>Средняя <br /> посещаемость<br /> (выходные)</th>
              <th colSpan={2} className="group-header">Возвещатели</th>
              <th colSpan={3} className="group-header">Подсобные пионеры</th>
              <th colSpan={3} className="group-header">Общие пионеры</th>
            </tr>
            <tr>
              <th className="sub-header">Отчеты</th>
              <th className="sub-header">Изучения</th>
              <th className="sub-header">Отчеты</th>
              <th className="sub-header">Часы</th>
              <th className="sub-header">Изучения</th>
              <th className="sub-header">Отчеты</th>
              <th className="sub-header">Часы</th>
              <th className="sub-header">Изучения</th>
            </tr>
          </thead>
          <tbody>
            {MONTH_KEYS.map(monthKey => {
              const row = rowByMonth.get(monthKey);
              return (
                <tr key={monthKey}>
                  <td className="month-cell">{MONTH_LABELS[monthKey]}</td>
                  {row ? (
                    <>
                      <td>{row.activePublishers}</td>
                      <td>{row.averageWeekendAttendance}</td>
                      <td>{row.publisherReports}</td>
                      <td>{row.publisherBibleStudies}</td>
                      <td>{row.auxiliaryReports}</td>
                      <td>{row.auxiliaryHours}</td>
                      <td>{row.auxiliaryBibleStudies}</td>
                      <td>{row.regularReports}</td>
                      <td>{row.regularHours}</td>
                      <td>{row.regularBibleStudies}</td>
                    </>
                  ) : (
                    <>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {!hasData && (
          <div className="s1-empty">Нет данных за служебный год {currentServiceYear}</div>
        )}
      </div>
    </div>
  );
}
