import { useState, useMemo } from 'react';
import type { CongregationData, Publisher, ServiceYear } from '../../domain';
import { getServiceYear } from '../../domain';
import S21Card from './S21Card';

interface S21PageProps {
  data: CongregationData;
  onUpdate: (data: CongregationData) => void;
  selectedServiceYearStart: number;
  workingServiceYearStart: number;
}

type Tab = { type: 'pioneers' } | { type: 'group'; groupNumber: number };

const isPioneer = (p: Publisher): boolean =>
  p.assignments.pioneer || p.assignments.specialPioneer;

export default function S21Page({ data, selectedServiceYearStart, workingServiceYearStart }: S21PageProps) {
  const viewingServiceYear: ServiceYear = getServiceYear(selectedServiceYearStart);
  const writingServiceYear: ServiceYear = getServiceYear(workingServiceYearStart);
  const groupCount = data.settings.vpsGroupsCount;

  const [activeTab, setActiveTab] = useState<Tab>({ type: 'pioneers' });

  const filteredPublishers = useMemo(() => {
    if (activeTab.type === 'pioneers') {
      return data.publishers.filter(isPioneer);
    }
    return data.publishers.filter(
      p => p.vpsGroup === activeTab.groupNumber && !isPioneer(p)
    );
  }, [data.publishers, activeTab]);

  // Sort by lastName, firstName
  const sorted = useMemo(() =>
    [...filteredPublishers].sort((a, b) => {
      const c = a.lastName.localeCompare(b.lastName);
      if (c !== 0) return c;
      return a.firstName.localeCompare(b.firstName);
    }),
    [filteredPublishers]
  );

  const tabLabel = (t: Tab): string => {
    if (t.type === 'pioneers') return 'Пионеры';
    return `Группа ${t.groupNumber}`;
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>S-21 — Записи собрания о служении возвещателя</h2>
      </div>

      {/* Вкладки: Пионеры + группы */}
      <div className="month-tabs" style={{ marginBottom: '16px' }}>
        {[
          { type: 'pioneers' as const },
          ...Array.from({ length: groupCount }, (_, i) => ({
            type: 'group' as const,
            groupNumber: i + 1
          }))
        ].map(t => (
          <button
            key={tabLabel(t)}
            className={
              (activeTab.type === t.type &&
                ('groupNumber' in t ? 'groupNumber' in activeTab && activeTab.groupNumber === t.groupNumber : true))
                ? 'active' : ''
            }
            onClick={() => setActiveTab(t)}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {/* Карточки */}
      <div style={{ position: 'relative', top: '85px',  display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {sorted.length === 0 ? (
          <div className="empty">Нет возвещателей в этой категории</div>
        ) : (
          sorted.map(p => (
            <S21Card
              key={p.id}
              publisher={p}
              serviceRecords={data.serviceRecords}
              serviceYear={viewingServiceYear}
              writingServiceYear={writingServiceYear}
            />
          ))
        )}
      </div>
    </div>
  );
}
