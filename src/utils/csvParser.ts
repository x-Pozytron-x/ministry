// CSV parser for service reports

export interface CSVServiceReport {
  number: string;
  publisherName: string;
  participated: string;
  bibleStudies: string;
  hours: string;
  notes: string;
  pioneer: string;
  auxiliary: string;
  inactive: string;
}

export const parseCSV = (csvText: string): CSVServiceReport[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV файл пустой или содержит только заголовок');
  }

  const records: CSVServiceReport[] = [];

  // Skip header (first line)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map(p => p.trim());

    if (parts.length < 9) {
      console.warn(`Строка ${i + 1} пропущена: недостаточно колонок`);
      continue;
    }

    records.push({
      number: parts[0],
      publisherName: parts[1],
      participated: parts[2],
      bibleStudies: parts[3],
      hours: parts[4],
      notes: parts[5],
      pioneer: parts[6],
      auxiliary: parts[7],
      inactive: parts[8]
    });
  }

  return records;
};

export const parseBooleanValue = (value: string): boolean => {
  const normalized = value.toLowerCase().trim();
  return normalized === 'да' || normalized === '1' || normalized === 'yes' || normalized === 'true';
};

export const parseNumberValue = (value: string): number => {
  const num = parseInt(value.trim(), 10);
  return isNaN(num) ? 0 : num;
};

export const parseHoursValue = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-' || trimmed === '') {
    return null;
  }
  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
};
