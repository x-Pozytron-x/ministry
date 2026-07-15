import type { Publisher, ServiceRecord, MonthlyServiceData } from '../../domain';

interface S21CardProps {
  publisher: Publisher;
  serviceRecords: ServiceRecord[];
  serviceYear: string;
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

const getMonthKey = (md: MonthlyServiceData): string => md.month.slice(5, 7);

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
    <div style={{
      width: '780px',
      minWidth: '780px',
      background: '#fff',
      color: '#000',
      border: '2px solid #000',
      padding: '16px 18px 10px',
      marginBottom: '16px'
    }}>
      {/* Title */}
      <div style={{
        textAlign: 'center',
        fontWeight: 800,
        fontSize: '19px',
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        margin: '2px 0 14px'
      }}>
        Записи собрания о служении возвещателя
      </div>

      {/* ФИО */}
      <div style={{ display: 'flex', alignItems: 'baseline', fontSize: '13.5px', padding: '3px 0', whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: 700, marginRight: '6px' }}>ФИО:</span>
        <span style={{ fontWeight: 400 }}>{publisher.lastName} {publisher.firstName}</span>
      </div>

      {/* Дата рождения + пол */}
      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', fontSize: '13.5px', padding: '3px 0', whiteSpace: 'nowrap' }}>
        <div style={{ flex: '0 0 470px' }}>
          <span style={{ fontWeight: 700, marginRight: '6px' }}>Дата рождения:</span>
          <span style={{ fontWeight: 400 }}>{publisher.birthDate ?? ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flex: '0 0 130px', fontWeight: 700, fontSize: '13.5px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '1.4px solid #000', flex: '0 0 12px', position: 'relative', top: '1px' }}>
              {!isFemale && (
                <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', lineHeight: 1, fontWeight: 700 }}>✓</span>
              )}
            </span>
            Мужчина
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flex: '0 0 130px', fontWeight: 700, fontSize: '13.5px' }}>
            <span style={{
              display: 'inline-block', width: '12px', height: '12px', border: '1.4px solid #000',
              flex: '0 0 12px', position: 'relative', top: '1px',
              ...(isFemale ? {} : {})
            }}>
              {isFemale && (
                <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', lineHeight: 1, fontWeight: 700 }}>✓</span>
              )}
            </span>
            Женщина
          </span>
        </div>
      </div>

      {/* Дата крещения + надежда */}
      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', fontSize: '13.5px', padding: '3px 0', whiteSpace: 'nowrap' }}>
        <div style={{ flex: '0 0 470px' }}>
          <span style={{ fontWeight: 700, marginRight: '6px' }}>Дата крещения:</span>
          <span style={{ fontWeight: 400 }}>{publisher.baptismDate ?? ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flex: '0 0 130px', fontWeight: 700, fontSize: '13.5px' }}>
            <span style={{
              display: 'inline-block', width: '12px', height: '12px', border: '1.4px solid #000',
              flex: '0 0 12px', position: 'relative', top: '1px'
            }}>
              {!isAnointed && (
                <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', lineHeight: 1, fontWeight: 700 }}>✓</span>
              )}
            </span>
            Другая овца
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flex: '0 0 130px', fontWeight: 700, fontSize: '13.5px' }}>
            <span style={{
              display: 'inline-block', width: '12px', height: '12px', border: '1.4px solid #000',
              flex: '0 0 12px', position: 'relative', top: '1px'
            }}>
              {isAnointed && (
                <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', lineHeight: 1, fontWeight: 700 }}>✓</span>
              )}
            </span>
            Помазанный
          </span>
        </div>
      </div>

      {/* Роли / назначения */}
      <div style={{
        display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', rowGap: '4px',
        padding: '6px 0 10px', fontWeight: 700, fontSize: '13.5px',
        borderBottom: '2px solid #000', marginBottom: '12px'
      }}>
        {[
          { key: 'elder', label: 'Старейшина' },
          { key: 'assistantServant', label: 'Помощник собрания' },
          { key: 'pioneer', label: 'Общий пионер' },
          { key: 'specialPioneer', label: 'Специальный пионер' },
          { key: 'missionary', label: 'Миссионер' },
        ].map(role => {
          const checked = (publisher.assignments as any)[role.key] === true;
          return (
            <span key={role.key} style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginRight: '20px', maxWidth: '170px' }}>
              <span style={{
                display: 'inline-block', width: '12px', height: '12px', border: '1.4px solid #000',
                flex: '0 0 12px', position: 'relative', top: '1px'
              }}>
                {checked && (
                  <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', lineHeight: 1, fontWeight: 700 }}>✓</span>
                )}
              </span>
              {role.label}
            </span>
          );
        })}
      </div>

      {/* Таблица служения */}
      <table style={{
        width: '100%', borderCollapse: 'collapse', border: '2px solid #000',
        tableLayout: 'fixed'
      }}>
        <colgroup>
          <col style={{ width: '15%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '35%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ border: '1px solid #000', padding: '6px', fontSize: '12.5px', fontWeight: 700, background: '#fff' }}>
              Служебный год
              <span style={{ display: 'block', fontWeight: 700, fontSize: '15px', marginTop: '3px' }}>{serviceYear}</span>
            </th>
            <th style={{ border: '1px solid #000', padding: '6px', fontSize: '12.5px', fontWeight: 700, background: '#fff' }}>Участвовал<br />в служении</th>
            <th style={{ border: '1px solid #000', padding: '6px', fontSize: '12.5px', fontWeight: 700, background: '#fff' }}>Изучения<br />Библии</th>
            <th style={{ border: '1px solid #000', padding: '6px', fontSize: '12.5px', fontWeight: 700, background: '#fff' }}>Подсобный<br />пионер</th>
            <th style={{ border: '1px solid #000', padding: '6px', fontSize: '12.5px', fontWeight: 700, background: '#fff' }}>Часы<br />(если пионер<br />или миссионер)</th>
            <th style={{ border: '1px solid #000', padding: '6px', fontSize: '12.5px', fontWeight: 700, background: '#fff' }}>Примечания</th>
          </tr>
        </thead>
        <tbody>
          {MONTH_ORDER.map((monthNum) => {
            const md = dataByMonth.get(monthNum);
            return (
              <tr key={monthNum}>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '13px', height: '24px' }}>
                  {MONTH_NAMES[monthNum]}
                </td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '13px', height: '24px', textAlign: 'center' }}>
                  {md && (
                    <span style={{
                      display: 'inline-block', width: '12px', height: '12px', border: '1.4px solid #000',
                      position: 'relative', top: '1px'
                    }}>
                      {md.participated && (
                        <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', lineHeight: 1, fontWeight: 700 }}>✓</span>
                      )}
                    </span>
                  )}
                </td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '13px', height: '24px', textAlign: 'center' }}>
                  {md?.bibleStudies ?? ''}
                </td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '13px', height: '24px', textAlign: 'center' }}>
                  {md && (
                    <span style={{
                      display: 'inline-block', width: '12px', height: '12px', border: '1.4px solid #000',
                      position: 'relative', top: '1px'
                    }}>
                      {md.auxiliaryPioneer && (
                        <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', lineHeight: 1, fontWeight: 700 }}>✓</span>
                      )}
                    </span>
                  )}
                </td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '15px', height: '24px', textAlign: 'center' }}>
                  {md?.hours ?? ''}
                </td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '12.5px', height: '24px' }}>
                  {md?.note ?? ''}
                </td>
              </tr>
            );
          })}
          {/* Итого */}
          <tr>
            <td colSpan={4} style={{
              border: '1px solid #000', borderTop: '2px solid #000',
              padding: '4px 8px', fontSize: '13px', fontWeight: 700, textAlign: 'right'
            }}>
              Итого
            </td>
            <td style={{
              border: '1px solid #000', borderTop: '2px solid #000',
              padding: '4px 8px', fontSize: '16px', fontWeight: 700, textAlign: 'center'
            }}>
              {totalHours || ''}
            </td>
            <td style={{
              border: '1px solid #000', borderTop: '2px solid #000',
              padding: '4px 8px'
            }}></td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: '10px', color: '#444', marginTop: '10px' }}>S-21-U&nbsp;&nbsp;&nbsp;11/23</div>
    </div>
  );
}
