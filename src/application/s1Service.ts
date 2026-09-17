// S-1 service — fully derived view, no persistence.
// Aggregates monthly field service data from existing records.

import type { CongregationData, ServiceYear } from '../domain';

export interface S1Row {
  /** Month key '09'..'08' in service-year order (September–August) */
  monthKey: string;
  activePublishers: number;
  averageWeekendAttendance: number;

  // Publishers (non-pioneers)
  publisherReports: number;
  publisherBibleStudies: number;

  // Auxiliary pioneers
  auxiliaryReports: number;
  auxiliaryHours: number;
  auxiliaryBibleStudies: number;

  // Regular pioneers
  regularReports: number;
  regularHours: number;
  regularBibleStudies: number;
}

/** Ordered month keys for a service year (September–August) */
const MONTH_KEYS = ['09','10','11','12','01','02','03','04','05','06','07','08'];

/** Convert a service year and month key (01–12) to YYYY-MM format.
 *  September–December → startYear, January–August → endYear. */
function toMonthStr(serviceYear: string, monthKey: string): string {
  const [s, e] = serviceYear.split('/').map(Number);
  const m = Number(monthKey);
  const year = m >= 9 ? s : e;
  return `${year}-${monthKey}`;
}

interface MonthlyEntry {
  participated: boolean;
  bibleStudies: number;
  hours: number | null;
  auxiliaryPioneer: boolean;
  /** Whether the publisher is explicitly marked inactive for this month. */
  inactive: boolean;
  /**
   * Whether the publisher is a regular pioneer at the time of this report.
   *
   * Resolution order:
   *  1. Historical snapshot (md.pioneer) — source of truth if present
   *  2. Current publisher assignments as fallback when snapshot is absent
   */
  pioneer: boolean;
}

/** Подсчитать активных возвещателей за месяц.
 *
 *  Источник: monthly entries этого месяца.
 *  Все записи в monthly snapshot считаются активными,
 *  кроме тех, где inactive === true.
 *
 *  participated === false НЕ исключает.
 *  pioneer/auxiliaryPioneer НЕ влияют.
 */
function countActivePublishers(entries: MonthlyEntry[], monthStr: string): number {
  const inactiveCount = entries.filter(e => e.inactive).length;
  const activeCount = entries.length - inactiveCount;

  console.log({
    month: monthStr,
    totalMonthlyEntries: entries.length,
    inactiveCount,
    activeCount
  });

  return activeCount;
}

/** Extract monthly-data entries for a given YYYY-MM month across all service records.
 *  For each entry, resolve pioneer status using the historical snapshot first,
 *  then fall back to the publisher's current assignments. */
function getMonthlyEntries(data: CongregationData, monthStr: string): MonthlyEntry[] {
  const entries: MonthlyEntry[] = [];

  for (const sr of data.serviceRecords) {
    const md = sr.monthlyData?.find(m => m.month === monthStr);
    if (!md) continue;

    // Resolve pioneer status: historical snapshot first, current publisher as fallback
    let isPioneer: boolean;
    if (md.pioneer !== undefined) {
      isPioneer = md.pioneer;
    } else if (sr.publisherId) {
      const pub = data.publishers.find(p => p.id === sr.publisherId);
      isPioneer = pub ? (pub.assignments.pioneer || pub.assignments.specialPioneer) : false;
    } else {
      isPioneer = false;
    }

    entries.push({
      participated: md.participated,
      bibleStudies: md.bibleStudies,
      hours: md.hours,
      auxiliaryPioneer: md.auxiliaryPioneer,
      inactive: md.inactive,
      pioneer: isPioneer,
    });
  }

  return entries;
}

/**
 * S1Service — generates 12 monthly rows for the S-1 report.
 *
 * Every value is a derived computation over existing data:
 *  - serviceRecords  (monthlyData)
 *  - attendanceReports
 *
 * No data is persisted, duplicated, or stored.
 */
export class S1Service {
  /**
   * Generate one S1Row per month of the given service year.
   * Service year format: "YYYY/YYYY" (e.g. "2025/2026").
   */
  static generate(data: CongregationData, serviceYear: ServiceYear): S1Row[] {
    return MONTH_KEYS.map(monthKey => {
      const monthStr = toMonthStr(serviceYear, monthKey);
      const entries = getMonthlyEntries(data, monthStr);

      // Active publishers: все monthly entries минус inactive=true.
      // participated=false НЕ исключает. pioneer НЕ влияет.
      const activePublishers = countActivePublishers(entries, monthStr);

      // Average weekend attendance from AttendanceReport records
      const weekendReports = data.attendanceReports.filter(
        r => r.month === monthStr && r.meetingType === 'weekend'
      );
      const averageWeekendAttendance = weekendReports.length > 0
        ? Math.round(
            weekendReports.reduce((sum, r) => sum + r.attendanceCount, 0) /
              weekendReports.length
          )
        : 0;

      // Classify entries by pioneer status and participation
      //
      // Regular pioneers:   all entries with pioneer=true (regardless of participation)
      // Auxiliary pioneers: all entries with auxiliaryPioneer=true (regardless of participation)
      // Publishers:         entries that actually reported AND are not pioneers
      const auxPioneers = entries.filter(e => e.auxiliaryPioneer);
      const regPioneers = entries.filter(e => !e.auxiliaryPioneer && e.pioneer);
      const publishers  = entries.filter(e => e.participated !== false && !e.auxiliaryPioneer && !e.pioneer);

      return {
        monthKey,
        activePublishers,
        averageWeekendAttendance,

        publisherReports: publishers.length,
        publisherBibleStudies: publishers.reduce(
          (s, e) => s + (e.bibleStudies || 0), 0
        ),

        auxiliaryReports: auxPioneers.length,
        auxiliaryHours: auxPioneers.reduce(
          (s, e) => s + (e.hours ?? 0), 0
        ),
        auxiliaryBibleStudies: auxPioneers.reduce(
          (s, e) => s + (e.bibleStudies || 0), 0
        ),

        regularReports: regPioneers.length,
        regularHours: regPioneers.reduce(
          (s, e) => s + (e.hours ?? 0), 0
        ),
        regularBibleStudies: regPioneers.reduce(
          (s, e) => s + (e.bibleStudies || 0), 0
        ),
      };
    });
  }
}
