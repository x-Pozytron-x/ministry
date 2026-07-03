// Domain services - business logic for congregation management

import type { Publisher, ServiceRecord, AttendanceReport, CongregationData, CongregationSettings } from './entities';
import { touchCongregationData } from './entities';

export class CongregationService {
  static updateSettings(data: CongregationData, settings: Partial<CongregationSettings>): CongregationData {
    return touchCongregationData({
      ...data,
      settings: {
        ...data.settings,
        ...settings
      }
    });
  }
}

export class PublisherService {
  static addPublisher(data: CongregationData, publisher: Publisher): CongregationData {
    return touchCongregationData({
      ...data,
      publishers: [...data.publishers, publisher]
    });
  }

  static updatePublisher(data: CongregationData, publisherId: string, publisher: Publisher): CongregationData {
    return touchCongregationData({
      ...data,
      publishers: data.publishers.map(p =>
        p.id === publisherId ? publisher : p
      )
    });
  }

  static removePublisher(data: CongregationData, publisherId: string): CongregationData {
    return touchCongregationData({
      ...data,
      publishers: data.publishers.filter(p => p.id !== publisherId),
      // Also remove related service records
      serviceRecords: data.serviceRecords.filter(sr => sr.publisherId !== publisherId)
    });
  }

  static findPublisherById(data: CongregationData, publisherId: string): Publisher | undefined {
    return data.publishers.find(p => p.id === publisherId);
  }

  static getAllPublishers(data: CongregationData): Publisher[] {
    return data.publishers;
  }

  static getPublishersByGroup(data: CongregationData, groupNumber: number): Publisher[] {
    return data.publishers.filter(p => p.vpsGroup === groupNumber);
  }
}

export class ServiceRecordService {
  static addServiceRecord(data: CongregationData, record: ServiceRecord): CongregationData {
    return touchCongregationData({
      ...data,
      serviceRecords: [...data.serviceRecords, record]
    });
  }

  static updateServiceRecord(data: CongregationData, recordId: string, updates: Partial<ServiceRecord>): CongregationData {
    return touchCongregationData({
      ...data,
      serviceRecords: data.serviceRecords.map(r =>
        r.id === recordId ? { ...r, ...updates } : r
      )
    });
  }

  static removeServiceRecord(data: CongregationData, recordId: string): CongregationData {
    return touchCongregationData({
      ...data,
      serviceRecords: data.serviceRecords.filter(r => r.id !== recordId)
    });
  }

  static getRecordsByPublisher(data: CongregationData, publisherId: string): ServiceRecord[] {
    return data.serviceRecords.filter(r => r.publisherId === publisherId);
  }

  static getRecordsByMonth(data: CongregationData, month: string): ServiceRecord[] {
    return data.serviceRecords.filter(r =>
      r.month === month || r.monthlyData?.some(monthlyData => monthlyData.month === month)
    );
  }

  static getRecordByPublisherAndMonth(
    data: CongregationData,
    publisherId: string,
    month: string
  ): ServiceRecord | undefined {
    return data.serviceRecords.find(r =>
      r.publisherId === publisherId &&
      (r.month === month || r.monthlyData?.some(monthlyData => monthlyData.month === month))
    );
  }

  static calculateTotalsForMonth(data: CongregationData, month: string): {
    totalHours: number;
    totalPlacements: number;
    totalReturnVisits: number;
    totalBibleStudies: number;
    activePublishersCount: number;
  } {
    const records = this.getRecordsByMonth(data, month);
    const monthlyRecords = records.map(r => getServiceDataForMonth(r, month));
    return {
      totalHours: monthlyRecords.reduce((sum, r) => sum + (r?.hours ?? 0), 0),
      totalPlacements: monthlyRecords.reduce((sum, r) => sum + (r?.placements ?? 0), 0),
      totalReturnVisits: monthlyRecords.reduce((sum, r) => sum + (r?.returnVisits ?? 0), 0),
      totalBibleStudies: monthlyRecords.reduce((sum, r) => sum + (r?.bibleStudies ?? 0), 0),
      activePublishersCount: records.length
    };
  }
}

const getServiceDataForMonth = (record: ServiceRecord, month: string) => {
  return record.monthlyData?.find(monthlyData => monthlyData.month === month) ?? (
    record.month === month
      ? {
          month: record.month,
          placements: record.placements ?? 0,
          videoShowings: record.videoShowings ?? 0,
          hours: record.hours ?? 0,
          returnVisits: record.returnVisits ?? 0,
          bibleStudies: record.bibleStudies ?? 0,
          remarks: record.remarks
        }
      : undefined
  );
};

export class AttendanceReportService {
  static addAttendanceReport(data: CongregationData, report: AttendanceReport): CongregationData {
    return touchCongregationData({
      ...data,
      attendanceReports: [...data.attendanceReports, report]
    });
  }

  static updateAttendanceReport(data: CongregationData, reportId: string, updates: Partial<AttendanceReport>): CongregationData {
    return touchCongregationData({
      ...data,
      attendanceReports: data.attendanceReports.map(r =>
        r.id === reportId ? { ...r, ...updates } : r
      )
    });
  }

  static removeAttendanceReport(data: CongregationData, reportId: string): CongregationData {
    return touchCongregationData({
      ...data,
      attendanceReports: data.attendanceReports.filter(r => r.id !== reportId)
    });
  }

  static getReportsByMonth(data: CongregationData, month: string): AttendanceReport[] {
    return data.attendanceReports.filter(r => r.month === month);
  }

  static getReportsByType(data: CongregationData, meetingType: 'weekday' | 'weekend'): AttendanceReport[] {
    return data.attendanceReports.filter(r => r.meetingType === meetingType);
  }

  static getAverageAttendanceForMonth(data: CongregationData, month: string): {
    weekdayAverage: number;
    weekendAverage: number;
    overall: number;
  } {
    const reports = this.getReportsByMonth(data, month);
    const weekdayReports = reports.filter(r => r.meetingType === 'weekday');
    const weekendReports = reports.filter(r => r.meetingType === 'weekend');

    const weekdayAverage = weekdayReports.length > 0
      ? weekdayReports.reduce((sum, r) => sum + r.attendanceCount, 0) / weekdayReports.length
      : 0;

    const weekendAverage = weekendReports.length > 0
      ? weekendReports.reduce((sum, r) => sum + r.attendanceCount, 0) / weekendReports.length
      : 0;

    const overall = reports.length > 0
      ? reports.reduce((sum, r) => sum + r.attendanceCount, 0) / reports.length
      : 0;

    return { weekdayAverage, weekendAverage, overall };
  }
}

// ID generation helper
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
