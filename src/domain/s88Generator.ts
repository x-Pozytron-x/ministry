import type { S88Month, S88Cell, S88WeekGroup, ServiceYear } from './entities';

// Helper: map common weekday names (English) to 0..6 (Sunday..Saturday)
const WEEKDAY_NAME_TO_NUM: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function parseServiceYear(serviceYear: string): { yearStart: number; yearEnd: number } {
  const match = /^\s*(\d{4})\s*\/\s*(\d{4})\s*$/.exec(serviceYear);
  if (!match) throw new Error('Invalid serviceYear format, expected YYYY/YYYY');
  const y1 = Number(match[1]);
  const y2 = Number(match[2]);
  if (y2 !== y1 + 1) throw new Error('Invalid serviceYear range');
  return { yearStart: y1, yearEnd: y2 };
}

function weekdayNameToNumber(name: string): number {
  const key = (name || '').toString().trim().toLowerCase();
  const num = WEEKDAY_NAME_TO_NUM[key];
  if (num === undefined) throw new Error(`Unsupported weekday name: ${name}`);
  return num;
}

function formatDateUTC(year: number, monthIndex: number, day: number): string {
  // Return YYYY-MM-DD using UTC components
  const y = year.toString().padStart(4, '0');
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDaysInMonthUTC(year: number, monthIndex: number): number {
  // monthIndex: 0-11
  // Use UTC to avoid timezone issues
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function collectMeetingDatesForMonth(year: number, monthIndex: number, weekdayNum: number): string[] {
  const daysInMonth = getDaysInMonthUTC(year, monthIndex);
  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(Date.UTC(year, monthIndex, d)).getUTCDay();
    if (dow === weekdayNum) {
      dates.push(formatDateUTC(year, monthIndex, d));
    }
  }
  return dates;
}

export function generateS88Months(
  weekdayMeetingDay: string,
  weekendMeetingDay: string,
  serviceYear: ServiceYear
): S88Month[] {
  const { yearStart, yearEnd } = parseServiceYear(serviceYear);

  const weekdayNum = weekdayNameToNumber(weekdayMeetingDay);
  const weekendNum = weekdayNameToNumber(weekendMeetingDay);

  // Service year months: September (yearStart) .. December (yearStart), then Jan..Aug (yearEnd)
  const monthsOrder: { year: number; monthIndex: number }[] = [];
  // Sep..Dec of yearStart
  for (let mi = 8; mi <= 11; mi++) monthsOrder.push({ year: yearStart, monthIndex: mi });
  // Jan..Aug of yearEnd
  for (let mi = 0; mi <= 7; mi++) monthsOrder.push({ year: yearEnd, monthIndex: mi });

  const s88Months: S88Month[] = monthsOrder.map(({ year, monthIndex }) => {
    const monthName = MONTH_NAMES[monthIndex];
    const weekdayDates = collectMeetingDatesForMonth(year, monthIndex, weekdayNum);
    const weekendDates = collectMeetingDatesForMonth(year, monthIndex, weekendNum);

    // Map dates to week index: 1..5 where weekIndex = floor((day-1)/7)+1
    const weekdayByWeek = new Map<number, S88Cell>();
    const weekendByWeek = new Map<number, S88Cell>();

    weekdayDates.forEach((dateStr) => {
      const day = Number(dateStr.slice(8, 10));
      const weekIndex = Math.floor((day - 1) / 7) + 1; // 1..5
      weekdayByWeek.set(weekIndex, { date: dateStr, attendance: null });
    });

    weekendDates.forEach((dateStr) => {
      const day = Number(dateStr.slice(8, 10));
      const weekIndex = Math.floor((day - 1) / 7) + 1;
      weekendByWeek.set(weekIndex, { date: dateStr, attendance: null });
    });

    // Ensure weeks 1..5 exist (even if empty)
    const weeks: S88WeekGroup[] = [];
    for (let wi = 1; wi <= 5; wi++) {
      const weekdayCell = weekdayByWeek.get(wi) ?? null;
      const weekendCell = weekendByWeek.get(wi) ?? null;
      weeks.push({ weekIndex: wi, weekdayCell, weekendCell });
    }

    const s88Month: S88Month = {
      month: monthName,
      serviceYear,
      weeks
    };

    return s88Month;
  });

  return s88Months;
}
