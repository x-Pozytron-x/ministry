// Attendance S-88 — FULL CLEAN VERSION (FIXED MATRIX + SUM/AVG + INLINE EDIT)

import { useState } from 'react';
import { CongregationData } from '../domain';
import { AttendanceReportService, generateId } from '../domain';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICON_ATTENDANCE } from '../config/icons';

interface AttendanceProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
}

type MeetingType = 'weekday' | 'weekend';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const weekdayMap: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2,
  wednesday: 3, thursday: 4, friday: 5, saturday: 6
};

const toWeekdayNum = (v: string) =>
  weekdayMap[(v || '').toLowerCase()] ?? 2;

const formatDate = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

const weekIndex = (day: number, firstDow: number) =>
  Math.floor((day + firstDow - 1) / 7) + 1;

const isValid = (v: number | null): v is number =>
  typeof v === 'number' && !isNaN(v) && v > 0;

export default function Attendance({ data, onUpdate }: AttendanceProps) {

  const now = new Date();
  const baseYear =
    now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;

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
          month: date.slice(0,7),
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

        const weekdayStats = calcStats([1,2,3,4,5], 'weekday');
        const weekendStats = calcStats([1,2,3,4,5], 'weekend');

        return (
          <div key={idx} className="month">

            <h3>{MONTHS[m.m]}</h3>

            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>V1</th><th>V2</th><th>V3</th><th>V4</th><th>V5</th>
                  <th>SUM</th>
                  <th>AVG</th>
                </tr>
              </thead>

              <tbody>

                {(['weekday','weekend'] as MeetingType[]).map(type => {
                  const map = type === 'weekday' ? weekday : weekend;

                  const stats = type === 'weekday'
                    ? weekdayStats
                    : weekendStats;

                  return (
                    <tr key={type}>
                      <td>{type}</td>

                      {[1,2,3,4,5].map(w => {
                        const cell = map[w];
                        const report = cell
                          ? getReport(cell.date, type)
                          : null;

                        const isEditing =
                          !!cell &&
                          edit?.date === cell.date &&
                          edit?.type === type;

                        return (
                          <td
                            key={w}
                            onClick={() => {
                              if (!cell || isEditing) return;
                              setEdit({ date: cell.date, type });
                              setValue(String(report?.attendanceCount ?? ''));
                            }}
                          >
                            {cell ? (
                              <>
                                <div>{cell.day}</div>
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
                                  <div>{report?.attendanceCount ?? '—'}</div>
                                )}
                              </>
                            ) : '—'}
                          </td>
                        );
                      })}

                      <td>{stats.sum || '—'}</td>
                      <td>{stats.avg ? stats.avg.toFixed(1) : '—'}</td>
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
        .header { margin-bottom: 16px; }

        .month {
          margin-bottom: 24px;
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 8px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px; table-layout: fixed;
        }

        td, th {
          border: 1px solid #ddd;
          text-align: center;
          padding: 6px;
        }

        td {
          cursor: pointer;
        }

        td div:first-child {
          font-size: 12px;
          color: #666;  
        }
          
        td div:last-child {
          font-size: 18px;
          color: white;  
        }

        .cell-input {
          border: none;
          background: transparent;
          text-align: center;
          font: inherit;
          color: inherit;
          padding: 0;
          outline: none;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}