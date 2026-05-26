import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Ticket, Heart, User } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { cn } from '../../lib/cn.js';

const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/bookings', label: 'My Bookings', icon: Ticket },
  { to: '/dashboard/favorites', label: 'Favorites', icon: Heart },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

const linkClass = ({ isActive }) =>
  cn(
    'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-500/15 text-brand-200'
      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
  );

/* Account-area shell with a sidebar that collapses to a tab bar on mobile. */
export default function DashboardLayout() {
  const { user } = useAuth();

  return (
    <div className="section py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="card p-5 lg:sticky lg:top-20">
            <div className="mb-5 flex items-center gap-3">
              <Avatar name={user?.name} src={user?.avatar?.url} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <nav className="flex gap-1.5 overflow-x-auto no-scrollbar lg:flex-col">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
