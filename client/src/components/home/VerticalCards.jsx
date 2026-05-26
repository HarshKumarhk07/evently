import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Drama, Ticket, ArrowUpRight } from 'lucide-react';
import { makeArtImage } from '../../lib/visuals.js';

const cards = [
  {
    to: '/dining',
    label: 'Dining',
    icon: UtensilsCrossed,
    blurb: 'Curated restaurants & rooftop bars',
    image: makeArtImage({
      theme: 'dining',
      title: 'Dining',
      subtitle: 'Curated restaurants & rooftop bars',
      seed: 'vertical-dining',
      width: 600,
      height: 400,
    }),
  },
  {
    to: '/plays',
    label: 'Plays',
    icon: Drama,
    blurb: 'Theatre, drama & live performance',
    image: makeArtImage({
      theme: 'plays',
      title: 'Plays',
      subtitle: 'Theatre, drama & live performance',
      seed: 'vertical-plays',
      width: 600,
      height: 400,
    }),
  },
  {
    to: '/events',
    label: 'Events',
    icon: Ticket,
    blurb: 'Concerts, comedy & festivals',
    image: makeArtImage({
      theme: 'events',
      title: 'Events',
      subtitle: 'Concerts, comedy & festivals',
      seed: 'vertical-events',
      width: 600,
      height: 400,
    }),
  },
];

/* The three navbar verticals presented as large entry-point cards. */
export default function VerticalCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.to}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          <Link
            to={card.to}
            className="group relative block h-52 overflow-hidden rounded-2xl border border-white/[0.06]"
          >
            <img
              src={card.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/10" />
            <div className="relative flex h-full flex-col justify-end p-5">
              <card.icon className="mb-2 h-7 w-7 text-brand-300" />
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-white">{card.label}</h3>
                <ArrowUpRight className="h-5 w-5 text-white transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <p className="mt-0.5 text-sm text-slate-400">{card.blurb}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
