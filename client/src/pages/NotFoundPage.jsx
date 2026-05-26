import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="section flex min-h-[70vh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-500/10 text-brand-300"
      >
        <Compass className="h-9 w-9" />
      </motion.div>
      <p className="mt-6 font-display text-6xl font-extrabold text-gradient">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        The page you’re looking for has moved, or never existed. Let’s get you
        back on track.
      </p>
      <Button as={Link} to="/" className="mt-6">
        Back to home
      </Button>
    </div>
  );
}
