import type { Publisher, ServiceRecord, MonthlyServiceData } from '../../domain';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICON_CHECK } from '../../config/icons';

interface S21CardProps {
  publisher: Publisher;
  serviceRecords: ServiceRecord[];
  serviceYear: string;
  writingServiceYear?: string;
}

const MONTH_ORDER = ['09','10','11','12','01','02','03','04','05','06','07','08'];
const MONTH_NAMES: Record<string, string> = {
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
  '08': 'Август'
};

/** Проверить, принадлежит ли месяц YYYY-MM к служебному году YYYY/YYYY */
const isMonthInServiceYear = (month: string, serviceYear: string): boolean => {
  const [startStr, endStr] = serviceYear.split('/');
  const start = Number(startStr);
  const end = Number(endStr);
  const monthNum = Number(month.slice(5, 7));
  const yearNum = Number(month.slice(0, 4));
  // Сентябрь–декабрь → start, январь–август → end
  return (monthNum >= 9 && yearNum === start) || (monthNum <= 8 && yearNum === end);
};

/** Получить все monthlyData для publisher за указанный служебный год */
const getMonthlyDataForYear = (
  publisher: Publisher,
  records: ServiceRecord[],
  serviceYear: string
): MonthlyServiceData[] => {
  const publisherRecords = records.filter(
    sr => sr.publisherId === publisher.id
  );
  const all: MonthlyServiceData[] = [];
  for (const sr of publisherRecords) {
    if (sr.monthlyData) {
      for (const md of sr.monthlyData) {
        if (isMonthInServiceYear(md.month, serviceYear)) {
          all.push(md);
        }
      }
    }
  }
  return all;
};

export default function S21Card({ publisher, serviceRecords, serviceYear }: S21CardProps) {
  const data = getMonthlyDataForYear(publisher, serviceRecords, serviceYear);

  // Build a map for O(1) lookup by month number
  const dataByMonth = new Map<string, MonthlyServiceData>();
  for (const md of data) {
    const key = md.month.slice(5, 7); // "09", "10", etc.
    dataByMonth.set(key, md);
  }

  const totalHours = data.reduce((sum, md) => sum + (md.hours ?? 0), 0);
  const isFemale = publisher.gender === 'female';
  const isAnointed = publisher.hope === 'anointed';

  return (
    <div className="s21-card">
      <style>{`
        .s21-card {
          width: 780px;
          min-width: 780px;
          background: #fff;
          color: #000;
          border: 2px solid #000;
          padding: 16px 18px 10px;
          margin-bottom: 16px;
        }

        .s21-title {
          text-align: center;
          font-weight: 800;
          font-size: 19px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          margin: 2px 0 14px;
        }

        .s21-row {
          display: flex;
          align-items: baseline;
          font-size: 13.5px;
          padding: 3px 0;
          white-space: nowrap;
        }

        .s21-row-full {
          display: flex;
          align-items: baseline;
          width: 100%;
          font-size: 13.5px;
          padding: 3px 0;
          white-space: nowrap;
        }

        .s21-label {
          font-weight: 700;
          margin-right: 6px;
        }

        .s21-value {
          font-weight: 400;
        }

        .s21-col-left {
          flex: 0 0 470px;
        }

        .s21-col-right {
          display: flex;
          align-items: baseline;
          flex: 1;
        }

        .s21-checkbox-label {
          display: flex;
          align-items: baseline;
          gap: 5px;
          flex: 0 0 130px;
          font-weight: 700;
          font-size: 13.5px;
        }

        .s21-checkbox-box {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 1.4px solid #000;
          flex: 0 0 12px;
          position: relative;
          top: 1px;
        }

        .s21-checkmark {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.7em;
          line-height: 0.7em;
          font-weight: 700;
          padding: 0.1em;
        }

        .s21-assignments {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          row-gap: 4px;
          padding: 6px 0 10px;
          font-weight: 700;
          font-size: 13.5px;
          border-bottom: 2px solid #000;
          margin-bottom: 12px;
        }

        .s21-role {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-right: 20px;
          max-width: 170px;
        }

        .s21-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          table-layout: fixed;
        }

        .s21-col-1 { width: 15%; }
        .s21-col-2 { width: 12%; }
        .s21-col-3 { width: 10%; }
        .s21-col-4 { width: 12%; }
        .s21-col-5 { width: 16%; }
        .s21-col-6 { width: 35%; }

        .s21-th {
          border: 1px solid #000;
          padding: 6px;
          font-size: 12.5px;
          font-weight: 700;
          background: #fff;
        }

        .s21-th-year {
          display: block;
          font-weight: 700;
          font-size: 15px;
          margin-top: 3px;
        }

        .s21-td {
          border: 1px solid #000;
          padding: 4px 8px;
          font-size: 13px;
          height: 24px;
        }

        .s21-td-center {
          border: 1px solid #000;
          padding: 4px 8px;
          font-size: 13px;
          height: 24px;
          text-align: center;
        }

        .s21-td-checkbox {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 1.4px solid #000;
          position: relative;
          top: 1px;
        }

        .s21-td-hours {
          border: 1px solid #000;
          padding: 4px 8px;
          font-size: 15px;
          height: 24px;
          text-align: center;
        }

        .s21-td-notes {
          border: 1px solid #000;
          padding: 4px 8px;
          font-size: 12.5px;
          height: 24px;
        }

        .s21-total-label {
          border: 1px solid #000;
          border-top: 2px solid #000;
          padding: 4px 8px;
          font-size: 13px;
          font-weight: 700;
          text-align: right;
        }

        .s21-total-val {
          border: 1px solid #000;
          border-top: 2px solid #000;
          padding: 4px 8px;
          font-size: 16px;
          font-weight: 700;
          text-align: center;
        }

        .s21-total-empty {
          border: 1px solid #000;
          border-top: 2px solid #000;
          padding: 4px 8px;
        }

        .s21-footer {
          font-size: 10px;
          color: #444;
          margin-top: 10px;
        }
      `}</style>

      {/* Title */}
      <div className="s21-title">
        Записи собрания о служении возвещателя
      </div>

      {/* ФИО */}
      <div className="s21-row">
        <span className="s21-label">ФИО:</span>
        <span className="s21-value">{publisher.lastName} {publisher.firstName}</span>
      </div>

      {/* Дата рождения + пол */}
      <div className="s21-row-full">
        <div className="s21-col-left">
          <span className="s21-label">Дата рождения:</span>
          <span className="s21-value">{publisher.birthDate ?? ''}</span>
        </div>
        <div className="s21-col-right">
          <span className="s21-checkbox-label">
            <span className="s21-checkbox-box">
              {!isFemale && (
                <span className="s21-checkmark"><FontAwesomeIcon icon={ICON_CHECK} /></span>
              )}
            </span>
            Мужчина
          </span>
          <span className="s21-checkbox-label">
            <span className="s21-checkbox-box">
              {isFemale && (
                <span className="s21-checkmark"><FontAwesomeIcon icon={ICON_CHECK} /></span>
              )}
            </span>
            Женщина
          </span>
        </div>
      </div>

      {/* Дата крещения + надежда */}
      <div className="s21-row-full">
        <div className="s21-col-left">
          <span className="s21-label">Дата крещения:</span>
          <span className="s21-value">{publisher.baptismDate ?? ''}</span>
        </div>
        <div className="s21-col-right">
          <span className="s21-checkbox-label">
            <span className="s21-checkbox-box">
              {!isAnointed && (
                <span className="s21-checkmark"><FontAwesomeIcon icon={ICON_CHECK} /></span>
              )}
            </span>
            Другая овца
          </span>
          <span className="s21-checkbox-label">
            <span className="s21-checkbox-box">
              {isAnointed && (
                <span className="s21-checkmark"><FontAwesomeIcon icon={ICON_CHECK} /></span>
              )}
            </span>
            Помазанный
          </span>
        </div>
      </div>

      {/* Роли / назначения */}
      <div className="s21-assignments">
        {[
          { key: 'elder', label: 'Старейшина' },
          { key: 'assistantServant', label: 'Помощник собрания' },
          { key: 'pioneer', label: 'Общий пионер' },
          { key: 'specialPioneer', label: 'Специальный пионер' },
          { key: 'missionary', label: 'Миссионер' },
        ].map(role => {
          const checked = (publisher.assignments as any)[role.key] === true;
          return (
            <span key={role.key} className="s21-role">
              <span className="s21-checkbox-box">
                {checked && (
                  <span className="s21-checkmark"><FontAwesomeIcon icon={ICON_CHECK} /></span>
                )}
              </span>
              {role.label}
            </span>
          );
        })}
      </div>

      {/* Таблица служения */}
      <table className="s21-table">
        <colgroup>
          <col className="s21-col-1" />
          <col className="s21-col-2" />
          <col className="s21-col-3" />
          <col className="s21-col-4" />
          <col className="s21-col-5" />
          <col className="s21-col-6" />
        </colgroup>
        <thead>
          <tr>
            <th className="s21-th">
              Служебный год
              <span className="s21-th-year">{serviceYear}</span>
            </th>
            <th className="s21-th">Участвовал<br />в служении</th>
            <th className="s21-th">Изучения<br />Библии</th>
            <th className="s21-th">Подсобный<br />пионер</th>
            <th className="s21-th">Часы<br />(если пионер<br />или миссионер)</th>
            <th className="s21-th">Примечания</th>
          </tr>
        </thead>
        <tbody>
          {MONTH_ORDER.map((monthNum) => {
            const md = dataByMonth.get(monthNum);
            return (
              <tr key={monthNum}>
                <td className="s21-td">
                  {MONTH_NAMES[monthNum]}
                </td>
                <td className="s21-td-center">
                  {md && (
                    <span className="s21-td-checkbox">
                      {md.participated && (
                        <span className="s21-checkmark"><FontAwesomeIcon icon={ICON_CHECK} /></span>
                      )}
                    </span>
                  )}
                </td>
                <td className="s21-td-center">
                  {md?.bibleStudies ?? ''}
                </td>
                <td className="s21-td-center">
                  {md && (
                    <span className="s21-td-checkbox">
                      {md.auxiliaryPioneer && (
                        <span className="s21-checkmark"><FontAwesomeIcon icon={ICON_CHECK} /></span>
                      )}
                    </span>
                  )}
                </td>
                <td className="s21-td-hours">
                  {md?.hours ?? ''}
                </td>
                <td className="s21-td-notes">
                  {md?.note ?? ''}
                </td>
              </tr>
            );
          })}
          {/* Итого */}
          <tr>
            <td colSpan={4} className="s21-total-label">
              Итого
            </td>
            <td className="s21-total-val">
              {totalHours || ''}
            </td>
            <td className="s21-total-empty"></td>
          </tr>
        </tbody>
      </table>

      <div className="s21-footer">S-21-U&nbsp;&nbsp;&nbsp;11/23</div>
    </div>
  );
}
