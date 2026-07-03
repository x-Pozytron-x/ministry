// Domain entities for single-congregation data model

export interface CongregationSettings {
  name: string;
  vpsGroupsCount: number;
  language: string;
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
