// Attendance management component (S-88) - Spreadsheet matrix layout with corrected date logic
// Uses UTC calculations and proper settings integration

import { useState } from 'react';
import type { AttendanceReport, CongregationData } from '../domain';
import { AttendanceReportService, generateId } from '../domain';

interface AttendanceProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
}

type MeetingType = 'weekday' | 'weekend';

interface EditingCell {
  date: string; // YYYY-MM-DD
  meetingType: MeetingType;
}

// Weekday name to 0..6 mapping
const WEEKDAY_NAME_TO_NUM: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Helper: Parse weekday name to number
const weekdayNameToNumber = (name: string): number => {
  const key = (name || '').toString().trim().toLowerCase();
  return WEEKDAY_NAME_TO_NUM[key] ?? 2; // Default to Tuesday if invalid
};

// Helper: Get days in month (UTC-safe)
const getDaysInMonthUTC = (year: number, monthIndex: number): number => {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
};

// Helper: Format date as YYYY-MM-DD (UTC)
const formatDateUTC = (year: number, monthIndex: number, day: number): string => {
  const y = year.toString().padStart(4, '0');
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper: Collect all meeting dates for a month on a specific weekday
const collectMeetingDatesForMonth = (year: number, monthIndex: number, weekdayNum: number): { date: string; day: number; weekIndex: number }[] => {
  const daysInMonth = getDaysInMonthUTC(year, monthIndex);
  const dates: { date: string; day: number; weekIndex: number }[] = [];
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(Date.UTC(year, monthIndex, d)).getUTCDay();
    if (dow === weekdayNum) {
      const weekIndex = Math.floor((d - 1) / 7) + 1; // 1-5
      dates.push({ date: formatDateUTC(year, monthIndex, d), day: d, weekIndex });
    }
  }
  return dates;
};

// Helper: Get meeting days from settings with defaults
const getMeetingDays = (data: CongregationData) => {
  const settings = data.settings as any;
  return {
    weekday: settings.weekdayMeetingDay || 'Tuesday',
    weekend: settings.weekendMeetingDay || 'Saturday'
  };
};

export default function Attendance({ data, onUpdate }: AttendanceProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const baseYear = currentMonth >= 8 ? currentYear : currentYear - 1; // Service year Sep-Aug

  const [selectedYear, setSelectedYear] = useState(baseYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');

  // Generate 12 months for service year (Sep-Aug)
  const monthsLayout: { name: string; monthIndex: number; year: number }[] = [];
  // Sep-Dec of selectedYear
  for (let mi = 8; mi <= 11; mi++) monthsLayout.push({ name: MONTH_NAMES[mi], monthIndex: mi, year: selectedYear });
  // Jan-Aug of selectedYear+1
  for (let mi = 0; mi <= 7; mi++) monthsLayout.push({ name: MONTH_NAMES[mi], monthIndex: mi, year: selectedYear + 1 });

  const serviceYearLabel = `${selectedYear}/${selectedYear + 1}`;

  if (!monthsLayout.length) {
    return (
      <div className="section">
        <h2>Посещаемость S-88</h2>
        <div className="empty" style={{ padding: '2em', textAlign: 'center' }}>Нет данных</div>
      </div>
    );
  }

  const currentMonthData = monthsLayout[selectedMonthIndex];
  
  // Get meeting days from settings
  const meetingDays = getMeetingDays(data);
  const weekdayNum = weekdayNameToNumber(meetingDays.weekday);
  const weekendNum = weekdayNameToNumber(meetingDays.weekend);

  // Collect all meeting dates for current month
  const weekdayDates = collectMeetingDatesForMonth(currentMonthData.year, currentMonthData.monthIndex, weekdayNum);
  const weekendDates = collectMeetingDatesForMonth(currentMonthData.year, currentMonthData.monthIndex, weekendNum);

  // Create weekIndex -> date info objects
  const weekdayByWeek: Record<number, { date: string; day: number; weekIndex: number } | null> = { 1: null, 2: null, 3: null, 4: null, 5: null };
  weekdayDates.forEach(d => {
    if (d.weekIndex >= 1 && d.weekIndex <= 5) {
      weekdayByWeek[d.weekIndex] = d;
    }
  });

  const weekendByWeek: Record<number, { date: string; day: number; weekIndex: number } | null> = { 1: null, 2: null, 3: null, 4: null, 5: null };
  weekendDates.forEach(d => {
    if (d.weekIndex >= 1 && d.weekIndex <= 5) {
      weekendByWeek[d.weekIndex] = d;
    }
  });

  // Get attendance for a specific date
  const getAttendance = (dateStr: string, meetingType: MeetingType): AttendanceReport | null => {
    return data.attendanceReports.find((r) => r.date === dateStr && r.meetingType === meetingType) || null;
  };

  // Get attendance count for week/meeting cell
  const getAttendanceCount = (weekIndex: number, meetingType: MeetingType): number | null => {
    const dateInfo = meetingType === 'weekday' ? weekdayByWeek[weekIndex] : weekendByWeek[weekIndex];
    if (!dateInfo) return null;
    const report = getAttendance(dateInfo.date, meetingType);
    return report?.attendanceCount ?? null;
  };

  // Get day number for display
  const getDateDay = (weekIndex: number, meetingType: MeetingType): number | null => {
    const dateInfo = meetingType === 'weekday' ? weekdayByWeek[weekIndex] : weekendByWeek[weekIndex];
    return dateInfo?.day ?? null;
  };

  // Get full date for data storage
  const getDateStr = (weekIndex: number, meetingType: MeetingType): string | null => {
    const dateInfo = meetingType === 'weekday' ? weekdayByWeek[weekIndex] : weekendByWeek[weekIndex];
    return dateInfo?.date ?? null;
  };

  const handleCellClick = (weekIndex: number, meetingType: MeetingType) => {
    const dateStr = getDateStr(weekIndex, meetingType);
    if (!dateStr) return;

    const attendance = getAttendanceCount(weekIndex, meetingType);
    setEditValue(attendance !== null ? String(attendance) : '');
    setEditingCell({ date: dateStr, meetingType });
  };

  const handleSaveCell = () => {
    if (!editingCell) return;

    const attendance = Number(editValue);
    if (isNaN(attendance) || attendance < 0) return;

    const monthKey = `${currentMonthData.year}-${(currentMonthData.monthIndex + 1).toString().padStart(2, '0')}`;
    const existing = getAttendance(editingCell.date, editingCell.meetingType);

    if (existing) {
      const updated = AttendanceReportService.updateAttendanceReport(data, existing.id, {
        ...existing,
        attendanceCount: attendance
      });
      onUpdate(updated);
    } else {
      const newReport: AttendanceReport = {
        id: generateId(),
        month: monthKey,
        meetingType: editingCell.meetingType,
        attendanceCount: attendance,
        date: editingCell.date,
        notes: ''
      };
      const updated = AttendanceReportService.addAttendanceReport(data, newReport);
      onUpdate(updated);
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveCell();
    else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };


  return (
    <div className="section">
      <div className="section-header">
        <h2>Посещаемость S-88 {serviceYearLabel}</h2>
      </div>

      <div className="s88-controls">
        <label>Служебный год:</label>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {[...Array(5)].map((_, i) => {
            const year = baseYear - 2 + i;
            return (
              <option key={year} value={year}>
                {year}/{year + 1}
              </option>
            );
          })}
        </select>
        
        <div style={{ marginLeft: '2em', display: 'flex', gap: '1em', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))}
            disabled={selectedMonthIndex === 0}
            className="s88-nav-btn"
          >
            ← Назад
          </button>
          <span style={{ fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
            {currentMonthData.name} {currentMonthData.year}
          </span>
          <button
            onClick={() => setSelectedMonthIndex(Math.min(monthsLayout.length - 1, selectedMonthIndex + 1))}
            disabled={selectedMonthIndex === monthsLayout.length - 1}
            className="s88-nav-btn"
          >
            Вперед →
          </button>
        </div>
      </div>

      <div className="s88-grid-container">
        <table className="s88-matrix-table">
          <thead>
            <tr>
              <th className="row-label">Тип собрания</th>
              <th>V1</th>
              <th>V2</th>
              <th>V3</th>
              <th>V4</th>
              <th>V5</th>
            </tr>
          </thead>
          <tbody>
            {/* Weekday row */}
            <tr>
              <td className="row-label">Встречи в будний день</td>
              {[1, 2, 3, 4, 5].map((weekIndex) => {
                const isEditing = editingCell?.meetingType === 'weekday' && getDateStr(weekIndex, 'weekday') === editingCell?.date;
                const dayNum = getDateDay(weekIndex, 'weekday');
                const attendance = getAttendanceCount(weekIndex, 'weekday');
                return (
                  <td
                    key={`weekday-${weekIndex}`}
                    className={`attendance-matrix-cell ${isEditing ? 'editing' : ''} ${dayNum === null ? 'empty' : ''}`}
                    onClick={() => dayNum !== null && handleCellClick(weekIndex, 'weekday')}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSaveCell}
                        autoFocus
                        className="attendance-input"
                      />
                    ) : (
                      <>
                        {dayNum !== null && (
                          <>
                            <div className="cell-date">{dayNum}</div>
                            <div className="cell-attendance">{attendance ?? '—'}</div>
                          </>
                        )}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Weekend row */}
            <tr>
              <td className="row-label">Встречи в выходной день</td>
              {[1, 2, 3, 4, 5].map((weekIndex) => {
                const isEditing = editingCell?.meetingType === 'weekend' && getDateStr(weekIndex, 'weekend') === editingCell?.date;
                const dayNum = getDateDay(weekIndex, 'weekend');
                const attendance = getAttendanceCount(weekIndex, 'weekend');
                return (
                  <td
                    key={`weekend-${weekIndex}`}
                    className={`attendance-matrix-cell ${isEditing ? 'editing' : ''} ${dayNum === null ? 'empty' : ''}`}
                    onClick={() => dayNum !== null && handleCellClick(weekIndex, 'weekend')}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSaveCell}
                        autoFocus
                        className="attendance-input"
                      />
                    ) : (
                      <>
                        {dayNum !== null && (
                          <>
                            <div className="cell-date">{dayNum}</div>
                            <div className="cell-attendance">{attendance ?? '—'}</div>
                          </>
                        )}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <style>{`
        .s88-controls {
          display: flex;
          align-items: center;
          gap: 1.5em;
          margin: 1.5em 0;
          padding: 1em;
          background: var(--secondary-bg, #f5f5f5);
          border-radius: 4px;
        }

        .s88-controls label {
          font-weight: 600;
        }

        .s88-controls select {
          padding: 6px 10px;
          border: 1px solid var(--border-color, #ccc);
          border-radius: 4px;
          font-size: 1em;
        }

        .s88-nav-btn {
          padding: 6px 12px;
          border: 1px solid var(--border-color, #ccc);
          background: var(--card-bg, #fff);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
        }

        .s88-nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .s88-grid-container {
          overflow-x: auto;
          border: 1px solid var(--border-color, #ccc);
          border-radius: 4px;
          max-height: 400px;
          overflow-y: auto;
        }

        .s88-matrix-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--card-bg, #fff);
          font-size: 0.95em;
        }

        .s88-matrix-table th,
        .s88-matrix-table td {
          border: 1px solid var(--border-color, #ccc);
          padding: 8px;
          text-align: center;
          vertical-align: middle;
        }

        .s88-matrix-table th {
          background: var(--secondary-bg, #f5f5f5);
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .row-label {
          min-width: 180px;
          text-align: left;
          position: sticky;
          left: 0;
          background: var(--secondary-bg, #f5f5f5);
          z-index: 9;
          font-weight: 600;
        }

        .s88-matrix-table th.row-label {
          z-index: 11;
        }

        .attendance-matrix-cell {
          min-width: 100px;
          min-height: 60px;
          cursor: pointer;
          transition: background-color 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .attendance-matrix-cell:hover:not(.empty) {
          background-color: var(--hover-bg, #f9f9f9);
        }

        .attendance-matrix-cell.editing {
          background-color: var(--focus-bg, #e8f4f8);
        }

        .attendance-matrix-cell.empty {
          background-color: var(--disabled-bg, #f5f5f5);
          cursor: default;
        }

        .cell-date {
          font-size: 0.8em;
          color: var(--text-secondary, #666);
          font-weight: 500;
        }

        .cell-attendance {
          font-size: 1.3em;
          font-weight: 700;
          color: var(--text-primary, #000);
        }

        .attendance-input {
          width: 70px;
          padding: 6px;
          font-size: 1.1em;
          font-weight: 700;
          border: 2px solid var(--focus-color, #0066cc);
          border-radius: 4px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}