import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { CongregationData } from '../domain';
import {
  ICON_FEATURE_SECURITY,
  ICON_FIRE,
  ICON_HANDSHAKE,
  ICON_PUBLISHERS,
  ICON_VPS,
  ICON_WATER
} from '../config/icons';

interface DashboardProps {
  data: CongregationData;
  selectedServiceYearStart?: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: IconProp;
  accent: 'emerald' | 'blue' | 'purple' | 'amber' | 'pink' | 'teal';
}

function StatCard({ title, value, icon, accent }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-heading">
        <FontAwesomeIcon className="stat-icon" icon={icon} aria-hidden="true" />
        <div className="stat-title">{title}</div>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function Dashboard({ data }: DashboardProps) {
  const baptizedAdults = data.publishers.filter(publisher => {
    if (!publisher.baptismDate) return false;
    if (!publisher.birthDate) return false;

    const age = calculateAge(publisher.birthDate);
    return age >= 18;
  }).length;

  const totalPublishers = data.publishers.length;

  const elders = data.publishers.filter(p => p.assignments.elder).length;
  const ministerialServants = data.publishers.filter(p => p.assignments.assistantServant).length;
  const regularPioneers = data.publishers.filter(p => p.assignments.pioneer).length;

  const vpsGroups = data.settings.vpsGroupsCount || 0;

  return (
    <div className="section dashboard-section">
      <h2>Общая информация о собрании</h2>

      <section className="stats-section" aria-labelledby="dashboard-people-title">
        <h3 id="dashboard-people-title" className="stats-section-title">Люди</h3>
        <div className="stats-grid">
          <StatCard
            title="Крещённых совершеннолетних возвещателей"
            value={baptizedAdults}
            icon={ICON_WATER}
            accent="emerald"
          />
          <StatCard
            title="Всего возвещателей"
            value={totalPublishers}
            icon={ICON_PUBLISHERS}
            accent="blue"
          />
          <StatCard
            title="Пионеры"
            value={regularPioneers}
            icon={ICON_FIRE}
            accent="pink"
          />
        </div>
      </section>

      <section className="stats-section" aria-labelledby="dashboard-structure-title">
        <h3 id="dashboard-structure-title" className="stats-section-title">Структура</h3>
        <div className="stats-grid">
          <StatCard
            title="Старейшины"
            value={elders}
            icon={ICON_FEATURE_SECURITY}
            accent="purple"
          />
          <StatCard
            title="Помощники собрания"
            value={ministerialServants}
            icon={ICON_HANDSHAKE}
            accent="amber"
          />
          <StatCard
            title="Количество групп ВПС"
            value={vpsGroups}
            icon={ICON_VPS}
            accent="teal"
          />
        </div>
      </section>
    </div>
  );
}
