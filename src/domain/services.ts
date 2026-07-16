// Domain services - business logic for congregation management

import type { Publisher, ServiceRecord, AttendanceReport, CongregationData, CongregationSettings, VpsGroup } from './entities';
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
    const trimmed: Publisher = {
      ...publisher,
      firstName: publisher.firstName.trim(),
      lastName: publisher.lastName.trim()
    };
    // Add publisher first
    const withPublisher = touchCongregationData({
      ...data,
      publishers: [...data.publishers, trimmed]
    });
    // Then link any historical ServiceRecords matching this publisher's name
    return this.linkHistoricalRecords(withPublisher, trimmed);
  }

  /** Link historical ServiceRecords (without publisherId) whose publisherSnapshot
   *  exactly matches the given publisher's name. Preserves all existing monthly data. */
  static linkHistoricalRecords(data: CongregationData, publisher: Publisher): CongregationData {
    const updatedRecords = data.serviceRecords.map(sr => {
      // Only touch records without publisherId
      if (sr.publisherId != null) return sr;
      // Exact match on firstName AND lastName
      if (sr.publisherSnapshot?.firstName === publisher.firstName &&
          sr.publisherSnapshot?.lastName === publisher.lastName) {
        return { ...sr, publisherId: publisher.id };
      }
      return sr;
    });

    // Only touch data if at least one record was updated
    if (updatedRecords.some((sr, i) => sr !== data.serviceRecords[i])) {
      return touchCongregationData({
        ...data,
        serviceRecords: updatedRecords
      });
    }
    return data;
  }

  static updatePublisher(data: CongregationData, publisherId: string, publisher: Publisher): CongregationData {
    const trimmed: Publisher = {
      ...publisher,
      firstName: publisher.firstName.trim(),
      lastName: publisher.lastName.trim()
    };
    return touchCongregationData({
      ...data,
      publishers: data.publishers.map(p =>
        p.id === publisherId ? trimmed : p
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

// App-level services for members, reports, and attendance (minimal helpers used by components)
export class MemberService {
  static addMember(data: any, member: any) {
    return { ...data, members: [...(data.members || []), member] };
  }

  static updateMember(data: any, memberId: string, updates: any) {
    return { ...data, members: (data.members || []).map((m: any) => (m.id === memberId ? { ...m, ...updates } : m)) };
  }

  static removeMember(data: any, memberId: string) {
    // Also remove related attendance records
    const members = (data.members || []).filter((m: any) => m.id !== memberId);
    const attendance = (data.attendance || []).filter((a: any) => a.memberId !== memberId);
    return { ...data, members, attendance };
  }
}

export class ReportService {
  static addReport(data: any, report: any) {
    return { ...data, reports: [...(data.reports || []), report] };
  }

  static updateReport(data: any, reportId: string, updates: any) {
    return { ...data, reports: (data.reports || []).map((r: any) => (r.id === reportId ? { ...r, ...updates } : r)) };
  }

  static removeReport(data: any, reportId: string) {
    return { ...data, reports: (data.reports || []).filter((r: any) => r.id !== reportId) };
  }
}

export class AttendanceService {
  static addAttendance(data: any, record: any) {
    return { ...data, attendance: [...(data.attendance || []), record] };
  }

  static updateAttendance(data: any, recordId: string, updates: any) {
    return { ...data, attendance: (data.attendance || []).map((r: any) => (r.id === recordId ? { ...r, ...updates } : r)) };
  }

  static removeAttendance(data: any, recordId: string) {
    return { ...data, attendance: (data.attendance || []).filter((r: any) => r.id !== recordId) };
  }

  static getAttendanceStats(data: any, memberId: string) {
    const records = (data.attendance || []).filter((r: any) => r.memberId === memberId);
    const total = records.length;
    const present = records.filter((r: any) => r.status === 'present').length;
    const late = records.filter((r: any) => r.status === 'late').length;
    const attendanceRate = total > 0 ? (present + late) / total : 0;
    return { total, present, late, attendanceRate };
  }
}


export class VpsGroupService {
  /** Ensure vpsGroups array length matches settings.vpsGroupsCount.
   *  Returns { data, error } — when error is set, the change is blocked. */
  static syncVpsGroups(data: CongregationData, newCount: number): { data: CongregationData; error?: string } {
    const currentGroups = data.vpsGroups || [];
    const currentCount = currentGroups.length;

    if (newCount === currentCount) return { data };

    if (newCount > currentCount) {
      const newGroups: VpsGroup[] = [];
      for (let i = currentCount; i < newCount; i++) {
        newGroups.push({
          id: generateId(),
          meetingPlace: '',
          meetingTime: '',
        });
      }
      return {
        data: touchCongregationData({
          ...data,
          vpsGroups: [...currentGroups, ...newGroups]
        })
      };
    }

    // newCount < currentCount — validate groups being removed
    for (let i = newCount; i < currentCount; i++) {
      const group = currentGroups[i];
      const groupNumber = i + 1;
      const hasPublishers = data.publishers.some(p => p.vpsGroup === groupNumber);
      if (hasPublishers || group.leaderPublisherId || group.assistantPublisherId || group.meetingPlace || group.meetingTime) {
        return {
          data,
          error: `Невозможно уменьшить количество групп: группа ${groupNumber} не пуста. Уберите всех возвещателей из группы и очистите данные группы.`
        };
      }
    }

    return {
      data: touchCongregationData({
        ...data,
        vpsGroups: currentGroups.slice(0, newCount)
      })
    };
  }

  static updateGroup(data: CongregationData, groupIndex: number, group: VpsGroup): CongregationData {
    const groups = [...(data.vpsGroups || [])];
    groups[groupIndex] = group;
    return touchCongregationData({
      ...data,
      vpsGroups: groups
    });
  }

  static getGroupPublishers(data: CongregationData, groupNumber: number): Publisher[] {
    return data.publishers.filter(p => p.vpsGroup === groupNumber);
  }

  /** Leaders: elders and ministerial servants (male) in this group */
  static getEligibleLeaders(data: CongregationData, groupNumber: number): Publisher[] {
    return data.publishers.filter(p =>
      p.vpsGroup === groupNumber &&
      p.gender === 'male' &&
      (p.assignments.elder || p.assignments.assistantServant)
    );
  }

  /** Assistants: all male publishers in this group (elders, ministerial servants, other brothers) */
  static getEligibleAssistants(data: CongregationData, groupNumber: number): Publisher[] {
    return data.publishers.filter(p =>
      p.vpsGroup === groupNumber &&
      p.gender === 'male'
    );
  }

  /** Get publisher name for display */
  static getPublisherName(data: CongregationData, publisherId: string | undefined): string {
    if (!publisherId) return '—';
    const p = data.publishers.find(pub => pub.id === publisherId);
    return p ? `${p.lastName} ${p.firstName}` : '—';
  }
}

// ID generation helper
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
