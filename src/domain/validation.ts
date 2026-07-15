// Domain validation logic

import type {
  Publisher,
  ServiceRecord,
  MonthlyServiceData,
  AttendanceReport,
  CongregationData,
  CongregationSettings,
  Member,
  Report,
  AttendanceRecord
} from './entities';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateCongregationSettings = (settings: Partial<CongregationSettings>): void => {
  if (!settings.name || settings.name.trim().length === 0) {
    throw new ValidationError('Название собрания обязательно');
  }

  if (settings.name.trim().length > 200) {
    throw new ValidationError('Название собрания слишком длинное (макс. 200 символов)');
  }

  if (settings.vpsGroupsCount !== undefined && (settings.vpsGroupsCount < 1 || settings.vpsGroupsCount > 50)) {
    throw new ValidationError('Количество групп должно быть от 1 до 50');
  }

  if (settings.language && !['ru', 'en', 'uk', 'cs'].includes(settings.language)) {
    throw new ValidationError('Неподдерживаемый язык');
  }

  if (settings.serviceYearStart !== undefined) {
    const year = settings.serviceYearStart;
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new ValidationError('Год служебного года должен быть целым числом от 2000 до 2100');
    }
  }
};

export const validatePublisher = (publisher: Partial<Publisher>): void => {
  const extraPublisherKey = Object.keys(publisher).find(
    (key) =>
      ![
        'id',
        'lastName',
        'firstName',
        'phonePrimary',
        'address',
        'emergencyContact',
        'vpsGroup',
        'birthDate',
        'baptismDate',
        'gender',
        'hope',
        'assignments'
      ].includes(key)
  );

  if (extraPublisherKey) {
    throw new ValidationError(`Publisher contains unsupported field: ${extraPublisherKey}`);
  }

  if (!publisher.lastName || publisher.lastName.trim().length === 0) {
    throw new ValidationError('Last name is required');
  }

  if (!publisher.firstName || publisher.firstName.trim().length === 0) {
    throw new ValidationError('First name is required');
  }

  if (!publisher.phonePrimary || publisher.phonePrimary.trim().length === 0) {
    throw new ValidationError('Primary phone is required');
  }

  if (!publisher.emergencyContact) {
    throw new ValidationError('Emergency contact is required');
  }

  const extraEmergencyContactKey = Object.keys(publisher.emergencyContact).find(
    (key) => !['firstName', 'lastName', 'phone'].includes(key)
  );

  if (extraEmergencyContactKey) {
    throw new ValidationError(`Emergency contact contains unsupported field: ${extraEmergencyContactKey}`);
  }

  if (!publisher.emergencyContact.firstName || publisher.emergencyContact.firstName.trim().length === 0) {
    throw new ValidationError('Emergency contact first name is required');
  }

  if (!publisher.emergencyContact.lastName || publisher.emergencyContact.lastName.trim().length === 0) {
    throw new ValidationError('Emergency contact last name is required');
  }

  if (!publisher.emergencyContact.phone || publisher.emergencyContact.phone.trim().length === 0) {
    throw new ValidationError('Emergency contact phone is required');
  }

  if (!publisher.gender || !['male', 'female'].includes(publisher.gender)) {
    throw new ValidationError('Gender must be "male" or "female"');
  }

  if (!publisher.hope || !['other_sheep', 'anointed'].includes(publisher.hope)) {
    throw new ValidationError('Hope must be "other_sheep" or "anointed"');
  }

  if (!publisher.assignments) {
    throw new ValidationError('Assignments are required');
  }

  const extraAssignmentKey = Object.keys(publisher.assignments).find(
    (key) => !['elder', 'assistantServant', 'pioneer', 'specialPioneer', 'missionary'].includes(key)
  );

  if (extraAssignmentKey) {
    throw new ValidationError(`Assignments contains unsupported field: ${extraAssignmentKey}`);
  }

  if (
    typeof publisher.assignments.elder !== 'boolean' ||
    typeof publisher.assignments.assistantServant !== 'boolean' ||
    typeof publisher.assignments.pioneer !== 'boolean' ||
    typeof publisher.assignments.specialPioneer !== 'boolean' ||
    typeof publisher.assignments.missionary !== 'boolean'
  ) {
    throw new ValidationError('Assignments must be boolean values');
  }
};


export const validateServiceRecord = (record: Partial<ServiceRecord>): void => {
  const duplicatedPublisherFields = [
    'lastName',
    'firstName',
    'phonePrimary',
    'address',
    'birthDate',
    'baptismDate',
    'gender',
    'hope',
    'assignments',
    'vpsGroup',
    'emergencyContact'
  ];
  const duplicatedField = Object.keys(record).find((key) => duplicatedPublisherFields.includes(key));

  if (duplicatedField) {
    throw new ValidationError(`S-21 must not duplicate Publisher field: ${duplicatedField}`);
  }

  if (!record.publisherId && !record.publisherSnapshot?.firstName && !record.publisherSnapshot?.lastName) {
    throw new ValidationError('Publisher ID or publisher snapshot is required');
  }

  if (record.serviceYear !== undefined && !isValidServiceYearFormat(record.serviceYear)) {
    throw new ValidationError('Service year must use YYYY/YYYY format');
  }

  if (record.monthlyData !== undefined) {
    if (!Array.isArray(record.monthlyData)) {
      throw new ValidationError('Monthly service data must be an array');
    }

    record.monthlyData.forEach(validateMonthlyServiceData);
    return;
  }

  if (!record.month) {
    throw new ValidationError('Month is required');
  }

  validateMonthlyServiceData({
    month: record.month,
    placements: record.placements ?? 0,
    videoShowings: record.videoShowings ?? 0,
    hours: record.hours ?? 0,
    returnVisits: record.returnVisits ?? 0,
    bibleStudies: record.bibleStudies ?? 0,
    remarks: record.remarks
  });
};

export const validateAttendanceReport = (report: Partial<AttendanceReport>): void => {
  if (!report.month) {
    throw new ValidationError('Месяц обязателен');
  }

  if (!isValidMonthFormat(report.month)) {
    throw new ValidationError('Неверный формат месяца (ожидается YYYY-MM)');
  }

  if (!report.meetingType || !['weekday', 'weekend'].includes(report.meetingType)) {
    throw new ValidationError('Тип собрания должен быть "weekday" или "weekend"');
  }

  if (!report.date) {
    throw new ValidationError('Дата обязательна');
  }

  if (report.attendanceCount === undefined || report.attendanceCount < 0) {
    throw new ValidationError('Количество присутствующих должно быть неотрицательным числом');
  }
};

// Simple validators for app-level members, reports, and attendance records
export const validateMember = (member: Partial<Member>): void => {
  if (!member.name || member.name.trim() === '') throw new ValidationError('Имя участника обязательно');
};

export const validateReport = (report: Partial<Report>): void => {
  if (!report.title || report.title.trim() === '') throw new ValidationError('Заголовок отчёта обязателен');
  if (!report.content || report.content.trim() === '') throw new ValidationError('Содержимое отчёта обязательно');
};

export const validateAttendanceRecord = (record: Partial<AttendanceRecord>): void => {
  if (!record.memberId) throw new ValidationError('Участник обязателен');
  if (!record.date) throw new ValidationError('Дата обязательна');
  if (!record.status || !['present', 'absent', 'excused', 'late'].includes(record.status)) throw new ValidationError('Неверный статус посещения');
};

export const validateCongregationData = (data: Partial<CongregationData>): void => {
  if (!data.version || data.version < 1) {
    throw new ValidationError('Некорректная версия данных');
  }

  if (!data.settings) {
    throw new ValidationError('Настройки собрания обязательны');
  }

  validateCongregationSettings(data.settings);

  if (!Array.isArray(data.publishers)) {
    throw new ValidationError('Publishers должен быть массивом');
  }

  if (!Array.isArray(data.serviceRecords)) {
    throw new ValidationError('ServiceRecords должен быть массивом');
  }

  if (!Array.isArray(data.attendanceReports)) {
    throw new ValidationError('AttendanceReports должен быть массивом');
  }

  data.publishers?.forEach(validatePublisher);
  data.serviceRecords?.forEach(validateServiceRecord);
  data.attendanceReports?.forEach(validateAttendanceReport);
};

const isValidMonthFormat = (month: string): boolean => {
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return monthRegex.test(month);
};

const isValidServiceYearFormat = (serviceYear: string): boolean => {
  const match = /^(\d{4})\/(\d{4})$/.exec(serviceYear);
  return match !== null && Number(match[2]) === Number(match[1]) + 1;
};

const validateMonthlyServiceData = (data: Partial<MonthlyServiceData>): void => {
  if (!data.month || !isValidMonthFormat(data.month)) {
    throw new ValidationError('Month must use YYYY-MM format');
  }

  if (data.placements !== undefined && data.placements < 0) {
    throw new ValidationError('Placements cannot be negative');
  }

  if (data.videoShowings !== undefined && data.videoShowings < 0) {
    throw new ValidationError('Video showings cannot be negative');
  }

  if (data.hours != null && data.hours < 0) {
    throw new ValidationError('Hours cannot be negative');
  }

  if (data.returnVisits !== undefined && data.returnVisits < 0) {
    throw new ValidationError('Return visits cannot be negative');
  }

  if (data.bibleStudies !== undefined && data.bibleStudies < 0) {
    throw new ValidationError('Bible studies cannot be negative');
  }
};
