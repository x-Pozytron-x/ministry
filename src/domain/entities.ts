// Domain entities for single-congregation data model

export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  joinedAt?: string;
  isActive: boolean;
}

export interface Report {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface S88Report {
  id: string;
  date: string; // YYYY-MM-DD
  meetingType: 'weekday' | 'weekend';
  attendanceCount: number;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'excused' | 'late';
  notes?: string;
}

export interface AppData {
  members: Member[];
  reports: Report[];
  attendance: AttendanceRecord[];
  s88Reports?: S88Report[];
  settings?: {
    weekdayMeetingDay: string;
    weekendMeetingDay: string;
  };
}

export interface CongregationSettings {
  name: string;
  vpsGroupsCount: number;
  language: string;
  weekdayMeetingDay?: string;
  weekendMeetingDay?: string;
}

export type ServiceYear = `${number}/${number}`;

export interface MonthlyServiceData {
  month: string; // YYYY-MM format
  placements: number;
  videoShowings: number;
  hours: number;
  returnVisits: number;
  bibleStudies: number;
  remarks?: string;
}

export interface ServiceRecordPublisherSnapshot {
  firstName: string;
  lastName: string;
}

// Canonical Publisher model. Legacy/older stored JSON shapes are transformed to this structure
// at load-time by the migration layer (see domain/migration.ts). Do NOT remove legacy reading logic.
export interface Publisher {
  id: string;
  lastName: string;
  firstName: string;
  phonePrimary: string;
  address?: string;
  emergencyContact: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  vpsGroup?: number;
  birthDate?: string;
  baptismDate?: string;
  gender: 'male' | 'female';
  hope: 'other_sheep' | 'anointed';
  assignments: {
    elder: boolean;
    assistantServant: boolean;
    pioneer: boolean;
    specialPioneer: boolean;
    missionary: boolean;
  };
}

export interface ServiceRecord {
  id: string;
  publisherId: string;
  serviceYear?: ServiceYear;
  monthlyData?: MonthlyServiceData[];
  publisherSnapshot?: ServiceRecordPublisherSnapshot;

  /** @deprecated Legacy flat monthly S-21 fields retained for stored JSON compatibility. */
  month?: string; // YYYY-MM format
  /** @deprecated Use monthlyData[].placements. */
  placements?: number;
  /** @deprecated Use monthlyData[].videoShowings. */
  videoShowings?: number;
  /** @deprecated Use monthlyData[].hours. */
  hours?: number;
  /** @deprecated Use monthlyData[].returnVisits. */
  returnVisits?: number;
  /** @deprecated Use monthlyData[].bibleStudies. */
  bibleStudies?: number;
  /** @deprecated Use monthlyData[].remarks. */
  remarks?: string;
}

export interface AttendanceReport {
  id: string;
  month: string; // YYYY-MM format
  meetingType: 'weekday' | 'weekend';
  attendanceCount: number;
  date: string;
  notes?: string;
}

export interface CongregationData {
  version: number;
  settings: CongregationSettings;
  publishers: Publisher[];
  serviceRecords: ServiceRecord[];
  attendanceReports: AttendanceReport[];
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface VersionedCongregationData extends CongregationData {
  versionHistory?: DataVersion[];
}

export interface DataVersion {
  version: number;
  timestamp: string;
  changeDescription?: string;
  snapshot?: CongregationData;
}

// S-88 (attendance) domain types
// These are type/interface definitions only — no business logic, generators, UI, or persistence changes.

export interface ServiceYearS88 {
  /** Starting calendar year, e.g. 2025 */
  yearStart: number;
  /** Ending calendar year, e.g. 2026 */
  yearEnd: number;
  /** Canonical service year format, e.g. "2025/2026" */
  format: ServiceYear;
}

export interface S88Cell {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Attendance count for the meeting on that date, or null when not recorded */
  attendance: number | null;
}

export interface S88WeekGroup {
  /** Sequential week index within the service year (starting at 1) */
  weekIndex: number;
  /** Weekday meeting cell (may be null if no meeting) */
  weekdayCell: S88Cell | null;
  /** Weekend meeting cell (may be null if no meeting) */
  weekendCell: S88Cell | null;
}

export interface S88Month {
  /** Month name (e.g. "September", "October", ... "August") */
  month: string;
  /** Service year this month belongs to, e.g. "2025/2026" */
  serviceYear: ServiceYear;
  /** Weekly groups within the month */
  weeks: S88WeekGroup[];
}

export interface S88Record {
  id: string;
  months: S88Month[];
}

// Initial empty data structure
export const createEmptyCongregationData = (): CongregationData => ({
  version: 1,
  settings: {
    name: '',
    vpsGroupsCount: 1,
    language: 'ru'
  },
  publishers: [],
  serviceRecords: [],
  attendanceReports: [],
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
});

// Helper to update timestamp
export const touchCongregationData = (data: CongregationData): CongregationData => ({
  ...data,
  metadata: {
    ...data.metadata,
    updatedAt: new Date().toISOString()
  }
});
