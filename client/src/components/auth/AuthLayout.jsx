import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import Logo from '../layout/Logo.jsx';
import { makeArtImage } from '../../lib/visuals.js';

/* Split-screen shell shared by login, signup and password recovery. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={makeArtImage({
            theme: 'auth',
            title: 'Bookify',
            subtitle: 'Tables, seats and tickets in one place',
            seed: 'auth-panel',
            width: 1000,
            height: 1400,
          })}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950/95 via-ink-950/80 to-brand-900/60" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div className="max-w-md">
            <Quote className="h-10 w-10 text-brand-400/60" />
            <p className="mt-4 font-display text-2xl font-semibold leading-snug text-white">
              The nights I remember most all started with a booking on Bookify.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Join thousands discovering the best of their city — one table,
              seat and ticket at a time.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
          <p className="mt-8 text-center text-xs text-slate-600">
            <Link to="/" className="hover:text-slate-400">
              ← Back to Bookify
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
