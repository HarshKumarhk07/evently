import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Drama, CalendarClock } from 'lucide-react';
import HeroCarousel from '../components/home/HeroCarousel.jsx';
import HeroSearch from '../components/home/HeroSearch.jsx';
import VerticalCards from '../components/home/VerticalCards.jsx';
import MobileHeader from '../components/home/MobileHeader.jsx';
import SectionHeader from '../components/listing/SectionHeader.jsx';
import ListingRow from '../components/listing/ListingRow.jsx';
import { restaurantsApi, playsApi, eventsApi } from '../api/listings.api.js';
import { usersApi } from '../api/users.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { titleOf, REFTYPE_TO_VERTICAL } from '../lib/listings.js';
import { useLocation } from '../context/LocationContext.jsx';

const STATS = [
  { value: '1,200+', label: 'Venues & experiences' },
  { value: '40k+', label: 'Bookings made' },
  { value: '4.8★', label: 'Average rating' },
  { value: '4', label: 'Cities live' },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [data, setData] = useState({ dining: [], plays: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    const cityParam = {};
    if (location?.city?._id) cityParam.cityId = location.city._id;
    Promise.all([
      restaurantsApi.list({ sort: 'rating', limit: 10, ...cityParam }).then((d) => d.items),
      playsApi.list({ sort: 'rating', limit: 10, ...cityParam }).then((d) => d.items),
      eventsApi.list({ sort: 'newest', limit: 10, ...cityParam }).then((d) => d.items),
    ])
      .then(([dining, plays, events]) => setData({ dining, plays, events }))
      .catch(() => setData({ dining: [], plays: [], events: [] }))
      .finally(() => setLoading(false));
  }, []);

  /* Personalize the For You feed for signed-in users. */
  useEffect(() => {
    if (!isAuthenticated) {
      setRecentlyViewed([]);
      return;
    }
    usersApi
      .recentlyViewed()
      .then((items) =>
        setRecentlyViewed(
          items.map((i) => ({ ...i, _vertical: REFTYPE_TO_VERTICAL[i._kind] })),
        ),
      )
      .catch(() => setRecentlyViewed([]));
  }, [isAuthenticated]);

  /* Compose hero slides from the highest-rated item of each vertical. */
  const slides = [
    data.dining[0] && {
      image: data.dining[0].coverImage,
      eyebrow: 'Featured Dining',
      title: titleOf(data.dining[0]),
      subtitle: data.dining[0].description,
      to: `/dining/${data.dining[0].slug}`,
    },
    data.events[0] && {
      image: data.events[0].coverImage,
      eyebrow: 'Live Events',
      title: titleOf(data.events[0]),
      subtitle: data.events[0].description,
      to: `/events/${data.events[0].slug}`,
    },
    data.plays[0] && {
      image: data.plays[0].coverImage,
      eyebrow: 'On Stage',
      title: titleOf(data.plays[0]),
      subtitle: data.plays[0].description,
      to: `/plays/${data.plays[0].slug}`,
    },
  ].filter(Boolean);

  return (
    <div className="pb-10">
      <MobileHeader />
      {/* Hero */}
      <section className="section pt-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1.35fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-200">
              <Sparkles className="h-3.5 w-3.5" />
              Your city, beautifully curated
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Discover the best of <span className="text-gradient">dining, plays</span> &amp;
              events
            </h1>
            <p className="mt-4 max-w-md text-base text-slate-400">
              One premium platform to find tables, book theatre seats and grab
              tickets to the experiences worth leaving home for.
            </p>
            <div className="mt-6">
              <HeroSearch />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <HeroCarousel slides={slides} />
          </motion.div>
        </div>
      </section>

      {/* For You — personalized strip for signed-in users with history */}
      {isAuthenticated && recentlyViewed.length > 0 && (
        <section className="section mt-14">
          <SectionHeader
            eyebrow="For You"
            title={`Welcome back, ${user?.name?.split(' ')[0]}`}
            subtitle="Pick up where you left off."
          />
          <ListingRow vertical="dining" items={recentlyViewed} />
        </section>
      )}

      {/* Verticals */}
      <section className="section mt-16">
        <SectionHeader
          eyebrow="Explore"
          title="Where would you like to go?"
          subtitle="Three ways to make your night out unforgettable."
        />
        <VerticalCards />
      </section>

      {/* Trending dining */}
      <section className="section mt-16">
        <SectionHeader
          eyebrow="Hot right now"
          title="Trending dining"
          subtitle="The restaurants everyone’s booking this week."
          to="/dining"
        />
        <ListingRow vertical="dining" items={data.dining} loading={loading} />
      </section>

      {/* Featured plays */}
      <section className="section mt-16">
        <SectionHeader
          eyebrow="On stage"
          title="Featured plays"
          subtitle="Theatre that’s worth dressing up for."
          to="/plays"
        />
        <ListingRow vertical="plays" items={data.plays} loading={loading} />
      </section>

      {/* Upcoming events */}
      <section className="section mt-16">
        <SectionHeader
          eyebrow="Don’t miss out"
          title="Upcoming events"
          subtitle="Concerts, comedy and festivals lighting up the city."
          to="/events"
        />
        <ListingRow vertical="events" items={data.events} loading={loading} />
      </section>

      {/* Stats band */}
      <section className="section mt-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-mesh p-8 sm:p-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Bookify */}
      <section className="section mt-16">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: TrendingUp,
              title: 'Curated, not crowded',
              text: 'Every venue is hand-picked and reviewed by a real community.',
            },
            {
              icon: Drama,
              title: 'Seamless booking',
              text: 'Tables, seats and tickets — confirmed in seconds, not queues.',
            },
            {
              icon: CalendarClock,
              title: 'Never miss out',
              text: 'Live availability, countdowns and reminders for what matters.',
            },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
