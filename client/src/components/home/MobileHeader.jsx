import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Search } from 'lucide-react';
import LocationSelector from '../../components/layout/LocationSelector.jsx';
import ProfileMenu from '../../components/layout/ProfileMenu.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import { NAV_LINKS } from '../../lib/constants.js';

export default function MobileHeader() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');

  return (
    <div className="md:hidden px-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <LocationSelector compact />
        </div>
        <div>
          {isAuthenticated ? (
            <ProfileMenu compact />
          ) : (
            <div className="flex items-center gap-2">
              <Button as="a" href="/login" variant="ghost" size="sm">
                Log in
              </Button>
              <Button as="a" href="/signup" size="sm">
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <button
              onClick={() => {}}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left"
            >
              <Search className="h-4 w-4 text-slate-300" />
              <span className="text-sm text-slate-400">Search for events, movies and restaurants</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.key}
            to={link.path}
            end={link.end}
            className={({ isActive }) =>
              `rounded-2xl px-4 py-2 text-sm font-semibold ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 bg-white/2'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
