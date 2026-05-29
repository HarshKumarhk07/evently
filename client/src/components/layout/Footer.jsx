import { Link } from 'react-router-dom';
import { Instagram, Twitter, Youtube, Mail } from 'lucide-react';
import Logo from './Logo.jsx';

const columns = [
  {
    title: 'Discover',
    links: [
      { label: 'Dining', to: '/dining' },
      { label: 'Plays', to: '/plays' },
      { label: 'Events', to: '/events' },
    ],
  },
  {
    title: 'For partners',
    links: [
      { label: 'List your business', to: '/list-your-business' },
      { label: 'Partner login', to: '/login' },
    ],
  },
];

const socials = [Instagram, Twitter, Youtube, Mail];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.06] bg-ink-900/60">
      <div className="section grid grid-cols-2 gap-10 py-14 md:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
            The premium way to discover and book restaurants, theatre and live
            events across India’s most exciting cities.
          </p>
          <div className="mt-5 flex gap-2">
            {socials.map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-slate-400 transition-colors hover:border-brand-500/40 hover:text-brand-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold text-white">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-500 transition-colors hover:text-brand-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="section flex items-center justify-center gap-2 py-5 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Bookify.</p>
        </div>
      </div>
    </footer>
  );
}
