import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Ticket, Heart, User, Shield, LogOut, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useOnClickOutside } from '../../hooks/useOnClickOutside.js';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/bookings', label: 'My Bookings', icon: Ticket },
  { to: '/dashboard/favorites', label: 'Favorites', icon: Heart },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

/* Avatar dropdown with account navigation and logout. */
export default function ProfileMenu() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useOnClickOutside(ref, () => setOpen(false));

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-white/[0.07] p-0.5 pr-2 transition-colors hover:border-brand-500/40"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={user.name} src={user.avatar?.url} size="sm" />
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl glass p-1.5"
          >
            <div className="border-b border-white/[0.06] px-3 py-3">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>

            <div className="py-1.5" onClick={() => setOpen(false)}>
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <item.icon className="h-4 w-4 text-slate-500" />
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-brand-300 transition-colors hover:bg-brand-500/10"
                >
                  <Shield className="h-4 w-4" />
                  Admin Console
                </Link>
              )}
            </div>

            <button
              onClick={handleLogout}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-lg border-t border-white/[0.06] px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
