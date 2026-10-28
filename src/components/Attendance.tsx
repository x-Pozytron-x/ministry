// Attendance S-88 — FULL CLEAN VERSION (FIXED MATRIX + SUM/AVG + INLINE EDIT)

import { useState } from 'react';
import { CongregationData } from '../domain';
import { AttendanceReportService, generateId } from '../domain';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICON_ATTENDANCE } from '../config/icons';

interface AttendanceProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
  selectedServiceYearStart: number;
  workingServiceYearStart: number;
  userMode: 'guest' | 'admin';
}

type MeetingType = 'weekday' | 'weekend';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekdayMap: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2,
  wednesday: 3, thursday: 4, friday: 5, saturday: 6
};

const toWeekdayNum = (v: string) =>
  weekdayMap[(v || '').toLowerCase()] ?? 2;

const formatDate = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const weekIndex = (day: number, firstDow: number) =>
  Math.floor((day + firstDow - 1) / 7) + 1;

const isValid = (v: number | null): v is number =>
  typeof v === 'number' && !isNaN(v) && v > 0;

export default function Attendance({ data, onUpdate, selectedServiceYearStart, userMode }: AttendanceProps) {

  const baseYear = selectedServiceYearStart;

  const [edit, setEdit] = useState<null | {
    date: string;
    type: MeetingType;
  }>(null);

  const [value, setValue] = useState('');

  const settings = data.settings as any;

  const weekdayNum = toWeekdayNum(settings.weekdayMeetingDay);
  const weekendNum = toWeekdayNum(settings.weekendMeetingDay);

  const getReport = (date: string, type: MeetingType) =>
    data.attendanceReports.find(
      r => r.date === date && r.meetingType === type
    );

  const buildWeekMap = (year: number, month: number, dow: number) => {
    const map: Record<number, { date: string; day: number } | null> = {
      1: null, 2: null, 3: null, 4: null, 5: null
    };

    const days = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun ... 6=Sat

    for (let d = 1; d <= days; d++) {
      if (new Date(year, month, d).getDay() === dow) {
        const w = weekIndex(d, firstDow);
        if (w <= 5) {
          map[w] = { date: formatDate(year, month, d), day: d };
        }
      }
    }

    return map;
  };

  const calcStats = (weeks: number[], type: MeetingType) => {
    const values = weeks
      .map(w => {
        const cell = currentWeekMaps[type][w];
        if (!cell) return null;
        const r = getReport(cell.date, type);
        return r?.attendanceCount ?? null;
      })
      .filter(isValid) as number[];

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = values.length ? sum / values.length : 0;

    return { sum, avg };
  };

  const save = (date: string, type: MeetingType) => {
    if (userMode !== 'admin') return;
    const num = Number(value);
    if (isNaN(num)) return;

    const existing = getReport(date, type);

    if (existing) {
      onUpdate(
        AttendanceReportService.updateAttendanceReport(data, existing.id, {
          ...existing,
          attendanceCount: num
        })
      );
    } else {
      onUpdate(
        AttendanceReportService.addAttendanceReport(data, {
          id: generateId(),
          date,
          meetingType: type,
          attendanceCount: num,
          month: date.slice(0, 7),
          notes: ''
        })
      );
    }

    setEdit(null);
    setValue('');
  };

  const months = [
    ...Array.from({ length: 4 }, (_, i) => ({ y: baseYear, m: 8 + i })),
    ...Array.from({ length: 8 }, (_, i) => ({ y: baseYear + 1, m: i }))
  ];

  const currentWeekMaps = {
    weekday: {} as any,
    weekend: {} as any
  };

  return (
    <div className="s88">

      <div className="header">
        <h2><FontAwesomeIcon icon={ICON_ATTENDANCE} /> S-88 Attendance</h2>
        <div>{baseYear}/{baseYear + 1}</div>
      </div>

      {months.map((m, idx) => {

        const weekday = buildWeekMap(m.y, m.m, weekdayNum);
        const weekend = buildWeekMap(m.y, m.m, weekendNum);

        currentWeekMaps.weekday = weekday;
        currentWeekMaps.weekend = weekend;

        const weekdayStats = calcStats([1, 2, 3, 4, 5], 'weekday');
        const weekendStats = calcStats([1, 2, 3, 4, 5], 'weekend');

        return (
          <div key={idx} className="month">
            <table>
              <thead>
                <tr>
                  <th className="month-header">{MONTHS[m.m]}</th>
                  <th>Week 1</th><th>Week 2</th><th>Week 3</th><th>Week 4</th><th>Week 5</th>
                  <th>SUM</th>
                  <th className="avg-header">AVG</th>
                </tr>
              </thead>

              <tbody>

                {(['weekday', 'weekend'] as MeetingType[]).map(type => {
                  const map = type === 'weekday' ? weekday : weekend;

                  const stats = type === 'weekday'
                    ? weekdayStats
                    : weekendStats;

                  return (
                    <tr key={type} className={type === 'weekend' ? 'weekend-row' : undefined}>
                      <td>{type === 'weekday' ? 'Weekday' : 'Weekend'}</td>

                      {[1, 2, 3, 4, 5].map(w => {
                        const cell = map[w];
                        const report = cell
                          ? getReport(cell.date, type)
                          : null;

                        const isEditing =
                          userMode === 'admin' &&
                          !!cell &&
                          edit?.date === cell.date &&
                          edit?.type === type;

                        return (
                          <td
                            key={w}
                            onClick={() => {
                              if (userMode !== 'admin' || !cell || isEditing) return;
                              setEdit({ date: cell.date, type });
                              setValue(String(report?.attendanceCount ?? ''));
                            }}
                          >
                            {cell ? (
                              <div className="attendance-cell">
                                <span className="attendance-day">{cell.day}</span>
                                {isEditing ? (
                                  <input
                                    size={3}
                                    autoFocus
                                    className="cell-input"
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                    onBlur={() => save(cell.date, type)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        save(cell.date, type);
                                      } else if (e.key === 'Escape') {
                                        setEdit(null);
                                        setValue('');
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="attendance-count">{report?.attendanceCount ?? <span className="empty-value">—</span>}</span>
                                )}
                              </div>
                            ) : <span className="empty-value">—</span>}
                          </td>
                        );
                      })}

                      <td>{stats.sum || <span className="empty-value">—</span>}</td>
                      <td className="avg-cell">{stats.avg ? stats.avg.toFixed(1) : <span className="empty-value">—</span>}</td>
                    </tr>
                  );
                })}

              </tbody>
            </table>
          </div>
        );
      })}

      <style>{`
        .s88 { padding: 16px; }
        .s88 .header { margin-bottom: 16px; }

        .s88 .month {
          margin-bottom: 24px;
          padding: 16px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 12px;
          background: rgba(17, 24, 39, 0.5);
        }

        .s88 .month h3 {
          margin: 0 0 12px;
        }

        .s88 table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          table-layout: fixed;
        }

        .s88 th,
        .s88 td {
          border: 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
          padding: 6px;
          text-align: center;
        }

        .s88 thead th {
          color: #9ca3af;
          font-size: 12px;
          font-weight: 500;
        }

        .s88 .month-header {
          color: #5eead4;
          font-size: 18px;
          font-weight: 700;
          text-align: center;
        }
        .s88 td {
          cursor: pointer;
        }

        .s88 .attendance-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          gap: 2px;
          padding: 2px;
        }

        .s88 .attendance-day {
          color: #9ca3af;
          font-size: 11px;
          font-weight: 400;
          line-height: 1;
        }

        .s88 .attendance-count {
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.1;
          font-variant-numeric: tabular-nums;
        }

        .s88 .weekend-row {
          color: #d8b4fe;
          font-style: italic;
        }

        .s88 .avg-header,
        .s88 .avg-cell {
          background: rgba(6, 78, 59, 0.2);
          color: #6ee7b7;
          font-weight: 700;
        }

        .s88 .empty-value {
          color: #374151;
        }

        .s88 .cell-input {
          width: 3ch;
          border: none;
          background: transparent;
          text-align: center;
          font: inherit;
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.1;
          padding: 0;
          outline: none;
        }
      `}</style>
    </div>
  );
}
