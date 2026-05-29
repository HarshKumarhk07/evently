import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Store, CalendarRange, Users, ShieldCheck, Briefcase, MapPin, Tag,
} from 'lucide-react';
import { cn } from '../../lib/cn.js';

const links = [
  { to: '/admin', label: 'Analytics', icon: LayoutDashboard, end: true },
  { to: '/admin/managers', label: 'Managers', icon: Briefcase },
  { to: '/admin/listings', label: 'Listings', icon: Store },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarRange },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/cities', label: 'Cities', icon: MapPin },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
];

const linkClass = ({ isActive }) =>
  cn(
    'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-500/15 text-brand-200'
      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
  );

/* Admin console shell — sidebar navigation + routed panel. */
export default function AdminLayout() {
  return (
    <div className="section py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="card p-5 lg:sticky lg:top-20">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white">Admin Console</p>
                <p className="text-xs text-slate-500">Bookify control</p>
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
