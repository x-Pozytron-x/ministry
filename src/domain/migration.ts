import type { CongregationData, Publisher } from './entities';
import { generateId } from './services';

// Migration helpers to normalize legacy publisher shapes into canonical Publisher
// Keep this as a compatibility layer when opening older saved JSON files.

const toString = (v: any) => (v === undefined || v === null ? '' : String(v));

const migrateAssignments = (src: any) => {
  // Canonical assignment keys
  const defaultAssignments = {
    elder: false,
    assistantServant: false,
    pioneer: false,
    specialPioneer: false,
    missionary: false
  };

  if (!src) return { ...defaultAssignments };

  // If already an object with canonical keys, coerce to booleans
  if (typeof src === 'object' && !Array.isArray(src)) {
    return {
      elder: Boolean(src.elder),
      assistantServant: Boolean(src.assistantServant),
      pioneer: Boolean(src.pioneer),
      specialPioneer: Boolean(src.specialPioneer),
      missionary: Boolean(src.missionary)
    };
  }

  // Legacy: assignments may be an array of strings
  if (Array.isArray(src)) {
    const set = new Set(src.map((s) => String(s).toLowerCase()));
    return {
      elder: set.has('elder') || set.has('старейшина') || set.has('elder: true'),
      assistantServant: set.has('assistantservant') || set.has('помощник') || set.has('assistant'),
      pioneer: set.has('pioneer') || set.has('пioner') || set.has('первонер'),
      specialPioneer: set.has('specialpioneer') || set.has('special') || set.has('специальный'),
      missionary: set.has('missionary') || set.has('миссионер')
    };
  }

  // Legacy: flat boolean fields
  return {
    elder: Boolean(src.elder || src.isElder || src.старейшина),
    assistantServant: Boolean(src.assistantServant || src.isAssistantServant || src.помощник),
    pioneer: Boolean(src.pioneer || src.isPioneer),
    specialPioneer: Boolean(src.specialPioneer || src.isSpecialPioneer),
    missionary: Boolean(src.missionary || src.isMissionary)
  };
};

const migrateEmergencyContact = (src: any) => {
  if (src && typeof src === 'object' && ('phone' in src || 'firstName' in src || 'lastName' in src)) {
    return {
      firstName: toString(src.firstName || src.first || src.first_name || ''),
      lastName: toString(src.lastName || src.last || src.last_name || ''),
      phone: toString(src.phone || src.phoneNumber || src.phone_primary || src.phone_primary_contact || '')
    };
  }

  // Legacy flat fields
  const fn = toString(src?.firstName ?? src?.first ?? src?.emergencyFirstName ?? src?.emergency_first_name ?? '');
  const ln = toString(src?.lastName ?? src?.last ?? src?.emergencyLastName ?? src?.emergency_last_name ?? '');
  const ph = toString(src?.phone ?? src?.emergencyPhone ?? src?.emergency_phone ?? src?.phoneEmergency ?? '');

  return {
    firstName: fn,
    lastName: ln,
    phone: ph
  };
};

const migratePublisher = (raw: any): Publisher => {
  // Keep deprecated/legacy fields in 'raw' but build canonical shape below
  const id = raw?.id || generateId();
  const lastName = toString(raw.lastName ?? raw.last_name ?? raw.surname ?? '');
  const firstName = toString(raw.firstName ?? raw.first_name ?? raw.givenName ?? raw.first ?? '');
  const phonePrimary = toString(raw.phonePrimary ?? raw.phone_primary ?? raw.phone ?? raw.phonePrimaryContact ?? '');
  const address = raw.address ?? raw.addr ?? raw.addressLine ?? undefined;

  const emergencyContact = raw.emergencyContact
    ? migrateEmergencyContact(raw.emergencyContact)
    : migrateEmergencyContact({
        firstName: raw.emergencyFirstName ?? raw.emergency_first_name,
        lastName: raw.emergencyLastName ?? raw.emergency_last_name,
        phone: raw.emergencyPhone ?? raw.emergency_phone
      });

  const vpsGroup = raw.vpsGroup ?? raw.vps_group ?? raw.group ?? undefined;
  const birthDate = raw.birthDate ?? raw.birth_date ?? raw.dob ?? undefined;
  const baptismDate = raw.baptismDate ?? raw.baptism_date ?? raw.baptism ?? undefined;

  const gender = (raw.gender || raw.sex) as 'male' | 'female' | undefined;
  const hope = (raw.hope as 'other_sheep' | 'anointed') || undefined;

  const assignments = migrateAssignments(raw.assignments ?? raw.roles ?? raw.flags ?? raw);

  // Build canonical object
  const publisher: Publisher = {
    id,
    lastName,
    firstName,
    phonePrimary,
    address,
    emergencyContact,
    vpsGroup,
    birthDate,
    baptismDate,
    gender: gender === 'female' ? 'female' : 'male', // default male if missing/unknown
    hope: hope === 'anointed' ? 'anointed' : 'other_sheep', // default
    assignments
  };

  // Note: do NOT remove legacy keys here. Migration is only in-memory — saved JSON remains unchanged until user saves.
  return publisher;
};

export const migrateCongregationData = (rawData: any): CongregationData => {
  // Minimal defensive checks
  const data = { ...rawData };

  const settings = data.settings ?? { name: '', vpsGroupsCount: 1, language: 'ru' };

  const publishersRaw = Array.isArray(data.publishers) ? data.publishers : [];
  const publishers = publishersRaw.map((p) => migratePublisher(p));

  return {
    version: data.version ?? 1,
    settings,
    publishers,
    serviceRecords: Array.isArray(data.serviceRecords) ? data.serviceRecords : [],
    attendanceReports: Array.isArray(data.attendanceReports) ? data.attendanceReports : [],
    metadata: data.metadata ?? { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  };
};
