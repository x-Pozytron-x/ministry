import type { CongregationData } from '../domain';

interface DashboardProps {
  data: CongregationData;
}

interface StatCardProps {
  title: string;
  value: number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
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
    <div className="section">
      <h2>Общая информация о собрании</h2>
      <div className="stats-grid">
        <StatCard
          title="Крещённых совершеннолетних возвещателей"
          value={baptizedAdults}
        />
        <StatCard
          title="Всего возвещателей"
          value={totalPublishers}
        />
        <StatCard
          title="Старейшины"
          value={elders}
        />
        <StatCard
          title="Помощники собрания"
          value={ministerialServants}
        />
        <StatCard
          title="Пионеры"
          value={regularPioneers}
        />
        <StatCard
          title="Количество групп ВПС"
          value={vpsGroups}
        />
      </div>
    </div>
  );
}
