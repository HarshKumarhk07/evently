import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import LocationSelector from './LocationSelector.jsx';
import ProfileMenu from './ProfileMenu.jsx';
import SearchModal from './SearchModal.jsx';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useScrolled } from '../../hooks/useScrolled.js';
import { useNavLinks } from '../../hooks/useNavLinks.js';
import { cn } from '../../lib/cn.js';

const navLinkClass = ({ isActive }) =>
  cn(
    'relative px-3.5 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-white' : 'text-slate-400 hover:text-white',
  );

/* Sticky, blur-on-scroll navbar — the spec's three verticals only. */
export default function Navbar() {
  const { isAuthenticated, isManager } = useAuth();
  const scrolled = useScrolled(16);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = useNavLinks();

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-white/[0.07] bg-ink-950/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <nav className="section flex h-16 items-center justify-between gap-4">
          {/* Left — logo + location */}
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden h-6 w-px bg-white/10 sm:block" />
            <div className="hidden sm:block">
              <LocationSelector />
            </div>
          </div>

          {/* Center — For You + the three verticals */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((v) => (
              <NavLink key={v.key} to={v.path} end={v.end} className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    {v.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-gradient"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right — search + auth */}
          <div className="flex items-center gap-2">
            {/* Managers see a direct shortcut to their console. Prospective
                partners discover the program on the signup page / footer. */}
            {isManager && (
              <Link
                to="/manager"
                className="hidden whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold text-brand-300 transition-colors hover:text-brand-200 lg:inline-flex"
              >
                Manager dashboard
              </Link>
            )}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="hidden h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-300 transition-colors hover:border-brand-500/40 hover:text-white md:grid"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            {isAuthenticated ? (
              <div className="hidden sm:block">
                <ProfileMenu />
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button as={Link} to="/login" variant="ghost" size="sm">
                  Log in
                </Button>
                <Button as={Link} to="/signup" size="sm">
                  Sign up
                </Button>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-300 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

/* Slide-in drawer for small screens. */
function MobileMenu({ open, onClose }) {
  const { isAuthenticated, isManager } = useAuth();
  const navLinks = useNavLinks();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-ink-900 p-5"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              <LocationSelector />
            </div>

            <div className="mt-6 flex flex-col gap-1" onClick={onClose}>
              {navLinks.map((v) => (
                <NavLink
                  key={v.key}
                  to={v.path}
                  end={v.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-xl px-4 py-3 text-base font-medium transition-colors',
                      isActive
                        ? 'bg-brand-500/15 text-brand-200'
                        : 'text-slate-300 hover:bg-white/[0.05]',
                    )
                  }
                >
                  {v.label}
                </NavLink>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-2" onClick={onClose}>
              {isManager && (
                <Button as={Link} to="/manager" variant="secondary" fullWidth>
                  Manager dashboard
                </Button>
              )}
              {isAuthenticated ? (
                <>
                  <Button as={Link} to="/dashboard" variant="secondary" fullWidth>
                    My Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="secondary" fullWidth>
                    Log in
                  </Button>
                  <Button as={Link} to="/signup" fullWidth>
                    Create account
                  </Button>
                </>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
