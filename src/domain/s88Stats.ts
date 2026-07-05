import { S88Month } from './entities';

interface MonthlyTotals {
  totalAttendance: number;
  totalMeetings: number;
  weekdayAttendance: number;
  weekdayMeetings: number;
  weekendAttendance: number;
  weekendMeetings: number;
}

interface ServiceYearTotals extends MonthlyTotals {}

interface Averages {
  averageAttendancePerMeeting: number;
  averageWeekdayAttendance: number;
  averageWeekendAttendance: number;
}

export function calculateMonthlyTotals(month: S88Month): MonthlyTotals {
  let totalAttendance = 0;
  let totalMeetings = 0;
  let weekdayAttendance = 0;
  let weekdayMeetings = 0;
  let weekendAttendance = 0;
  let weekendMeetings = 0;

  month.weeks.forEach(week => {
    if (week.weekdayCell && typeof week.weekdayCell.attendance === 'number') {
      weekdayAttendance += week.weekdayCell.attendance;
      weekdayMeetings++;
    }
    if (week.weekendCell && typeof week.weekendCell.attendance === 'number') {
      weekendAttendance += week.weekendCell.attendance;
      weekendMeetings++;
    }
  });

  totalAttendance = weekdayAttendance + weekendAttendance;
  totalMeetings = weekdayMeetings + weekendMeetings;

  return {
    totalAttendance,
    totalMeetings,
    weekdayAttendance,
    weekdayMeetings,
    weekendAttendance,
    weekendMeetings,
  };
}

export function calculateServiceYearTotals(months: S88Month[]): ServiceYearTotals {
  let totalAttendance = 0;
  let totalMeetings = 0;
  let weekdayAttendance = 0;
  let weekdayMeetings = 0;
  let weekendAttendance = 0;
  let weekendMeetings = 0;

  months.forEach(month => {
    const monthlyTotals = calculateMonthlyTotals(month);
    totalAttendance += monthlyTotals.totalAttendance;
    totalMeetings += monthlyTotals.totalMeetings;
    weekdayAttendance += monthlyTotals.weekdayAttendance;
    weekdayMeetings += monthlyTotals.weekdayMeetings;
    weekendAttendance += monthlyTotals.weekendAttendance;
    weekendMeetings += monthlyTotals.weekendMeetings;
  });

  return {
    totalAttendance,
    totalMeetings,
    weekdayAttendance,
    weekdayMeetings,
    weekendAttendance,
    weekendMeetings,
  };
}

export function calculateAverages(months: S88Month[]): Averages {
  const totals = calculateServiceYearTotals(months);

  const averageAttendancePerMeeting = totals.totalMeetings > 0
    ? totals.totalAttendance / totals.totalMeetings
    : 0;

  const averageWeekdayAttendance = totals.weekdayMeetings > 0
    ? totals.weekdayAttendance / totals.weekdayMeetings
    : 0;

  const averageWeekendAttendance = totals.weekendMeetings > 0
    ? totals.weekendAttendance / totals.weekendMeetings
    : 0;

  return {
    averageAttendancePerMeeting,
    averageWeekdayAttendance,
    averageWeekendAttendance,
  };
}
