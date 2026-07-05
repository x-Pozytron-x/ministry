import type { CongregationData, S88Record, S88Month, ServiceYear } from '../domain';
import { generateS88Months } from '../domain/s88Generator';
import { generateId, touchCongregationData } from '../domain';

/**
 * S88Service orchestrates S88 (attendance) calendar generation and storage.
 * Connects the S88 generator with CongregationData persistence.
 * Does not touch Publisher or S-21 logic, UI, or encryption.
 */
export class S88Service {
  /**
   * Generate S88 months for a given service year.
   * Service year must be in YYYY/YYYY format (e.g. "2025/2026").
   */
  static generateS88Calendar(
    weekdayMeetingDay: string,
    weekendMeetingDay: string,
    serviceYear: ServiceYear
  ): S88Month[] {
    return generateS88Months(weekdayMeetingDay, weekendMeetingDay, serviceYear);
  }

  /**
   * Create or update an S88 record in congregation data.
   * If recordId is provided, updates existing record; otherwise creates new one.
   */
  static saveS88Record(
    data: CongregationData,
    record: S88Record,
    recordId?: string
  ): CongregationData {
    const id = recordId || record.id || generateId();
    const s88Record: S88Record = { ...record, id };

    // Load existing S88 records or initialize empty array
    const s88Records = loadS88Records(data);

    // Update or add the record
    const updated = s88Records.some((r) => r.id === id)
      ? s88Records.map((r) => (r.id === id ? s88Record : r))
      : [...s88Records, s88Record];

    // Store back in congregation data
    return storeS88Records(data, updated);
  }

  /**
   * Load all S88 records from congregation data.
   */
  static getS88Records(data: CongregationData): S88Record[] {
    return loadS88Records(data);
  }

  /**
   * Get S88 record for a specific service year, or null if not found.
   */
  static getS88RecordByServiceYear(data: CongregationData, serviceYear: ServiceYear): S88Record | null {
    const records = loadS88Records(data);
    return records.find((r) => r.months?.some((m) => m.serviceYear === serviceYear)) ?? null;
  }

  /**
   * Remove S88 record by ID.
   */
  static removeS88Record(data: CongregationData, recordId: string): CongregationData {
    const records = loadS88Records(data);
    const filtered = records.filter((r) => r.id !== recordId);
    return storeS88Records(data, filtered);
  }

  /**
   * Update attendance for a specific cell in an S88 month.
   * This is a convenience for in-place updates without full record replacement.
   */
  static updateAttendanceCell(
    data: CongregationData,
    recordId: string,
    month: string,
    weekIndex: number,
    cellType: 'weekday' | 'weekend',
    attendance: number | null
  ): CongregationData {
    const records = loadS88Records(data);
    const record = records.find((r) => r.id === recordId);

    if (!record) return data; // No change if record not found

    const updatedMonths = record.months.map((m) => {
      if (m.month !== month) return m;

      const updatedWeeks = m.weeks.map((w) => {
        if (w.weekIndex !== weekIndex) return w;

        if (cellType === 'weekday' && w.weekdayCell) {
          return { ...w, weekdayCell: { ...w.weekdayCell, attendance } };
        } else if (cellType === 'weekend' && w.weekendCell) {
          return { ...w, weekendCell: { ...w.weekendCell, attendance } };
        }

        return w;
      });

      return { ...m, weeks: updatedWeeks };
    });

    const updatedRecord: S88Record = { ...record, months: updatedMonths };
    return this.saveS88Record(data, updatedRecord, recordId);
  }

  /**
   * Validate service year consistency across records.
   * Returns true if all records have non-overlapping service years.
   */
  static validateServiceYearConsistency(data: CongregationData): boolean {
    const records = loadS88Records(data);
    const serviceYears = new Set<string>();

    for (const record of records) {
      for (const month of record.months) {
        if (serviceYears.has(month.serviceYear)) {
          // Duplicate service year found
          return false;
        }
        serviceYears.add(month.serviceYear);
      }
    }

    return true;
  }
}

/**
 * Internal helpers: load and store S88 records in CongregationData.
 * S88 records are stored as an extension to the congregation data structure.
 * (In the future, this could be a dedicated field in CongregationData.)
 */

function loadS88Records(data: CongregationData): S88Record[] {
  // TODO: When CongregationData schema is extended to include s88Records field,
  // return data.s88Records directly instead of an empty array.
  // For now, we return empty to avoid breaking existing data structure.
  return (data as any).s88Records || [];
}

function storeS88Records(data: CongregationData, records: S88Record[]): CongregationData {
  // Store S88 records in the congregation data and touch metadata.
  // When CongregationData is formally extended with s88Records field,
  // update this to set data.s88Records = records.
  return touchCongregationData({
    ...data,
    s88Records: records
  } as any);
}
