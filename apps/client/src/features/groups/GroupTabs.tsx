import { NavLink } from 'react-router-dom';
import { LayoutList, Users, BadgeCheck } from 'lucide-react';

export function GroupTabs({ groupId }: { groupId: string }) {
  const base = `/dashboard/groups/${groupId}`;
  const tabs = [
    { to: base, label: 'Resumen', icon: LayoutList, end: true },
    { to: `${base}/members`, label: 'Miembros', icon: Users, end: false },
    { to: `${base}/badges`, label: 'Logros', icon: BadgeCheck, end: false },
  ];
  return (
    <nav className="tabs mb-4" aria-label="Secciones del grupo">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tab${isActive ? ' is-active' : ''}`}>
          <t.icon size={15} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
