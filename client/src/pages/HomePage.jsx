import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
      fallbackImage: makeArtImage({
        theme: 'dining',
        title: titleOf(data.dining[0]),
        subtitle: data.dining[0].city,
        seed: data.dining[0].slug || data.dining[0]._id,
        width: 1600,
        height: 900,
      }),
      eyebrow: 'Featured Dining',
      title: titleOf(data.dining[0]),
      subtitle: data.dining[0].description,
      to: `/dining/${data.dining[0].slug}`,
    },
    data.events[0] && {
      image: data.events[0].coverImage,
      fallbackImage: makeArtImage({
        theme: 'events',
        title: titleOf(data.events[0]),
        subtitle: data.events[0].city,
        seed: data.events[0].slug || data.events[0]._id,
        width: 1600,
        height: 900,
      }),
      eyebrow: 'Live Events',
      title: titleOf(data.events[0]),
      subtitle: data.events[0].description,
      to: `/events/${data.events[0].slug}`,
    },
    data.plays[0] && {
      image: data.plays[0].coverImage,
      fallbackImage: makeArtImage({
        theme: 'plays',
        title: titleOf(data.plays[0]),
        subtitle: data.plays[0].city,
        seed: data.plays[0].slug || data.plays[0]._id,
        width: 1600,
        height: 900,
      }),
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
            className="hidden lg:block"
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

    </div>
  );
}
