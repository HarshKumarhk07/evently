/* eslint-disable no-console */
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Play from '../models/Play.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import logger from './logger.js';
import { makeArtImage } from './visuals.js';

const img = (seed, title, subtitle, theme, size = { width: 1200, height: 800 }) =>
  makeArtImage({
    seed,
    title,
    subtitle,
    theme,
    width: size.width,
    height: size.height,
  });
const gallery = (seed, title, subtitle, theme, n = 4) =>
  Array.from({ length: n }, (_, i) =>
    img(`${seed}-g${i}`, `${title} ${i + 1}`, subtitle, theme),
  );
const days = (n) => new Date(Date.now() + n * 86400000);

/* ─────────────────── Restaurants ─────────────────── */
const restaurants = [
  {
    name: 'Ember & Oak',
    description:
      'A candle-lit fine-dining room where wood-fired plates meet a curated cellar. Ember & Oak pairs slow cooking with a soundtrack of quiet jazz.',
    cuisine: ['Continental', 'Grill', 'European'],
    priceRange: 4,
    costForTwo: 4200,
    city: 'Bengaluru',
    address: '12, Lavelle Road, Bengaluru',
    features: ['Outdoor Seating', 'Valet Parking', 'Live Music', 'Bar'],
    tags: ['Romantic', 'Date Night', 'Premium'],
    rating: 4.8,
    isFeatured: true,
  },
  {
    name: 'Saffron Theory',
    description:
      'Modern Indian plating with regional spice routes reimagined. Expect tasting menus that travel from Kashmir to Kerala in one sitting.',
    cuisine: ['North Indian', 'Modern Indian'],
    priceRange: 3,
    costForTwo: 2800,
    city: 'Mumbai',
    address: 'Kala Ghoda, Fort, Mumbai',
    features: ['Bar', 'Private Dining', 'Vegetarian Friendly'],
    tags: ['Trending', 'Family'],
    rating: 4.6,
    isFeatured: true,
  },
  {
    name: 'The Tokyo Counter',
    description:
      'An eight-seat omakase bar serving the day’s catch with precision. Reservations open a week in advance.',
    cuisine: ['Japanese', 'Sushi'],
    priceRange: 4,
    costForTwo: 5500,
    city: 'Bengaluru',
    address: 'Indiranagar 100ft Road, Bengaluru',
    features: ['Counter Seating', 'Chef’s Table'],
    tags: ['Premium', 'Date Night'],
    rating: 4.9,
    isFeatured: true,
  },
  {
    name: 'Olive Grove Trattoria',
    description:
      'Hand-rolled pasta, blistered Neapolitan pizza and a sun-drenched terrace. A neighbourhood Italian that feels like a holiday.',
    cuisine: ['Italian', 'Pizza'],
    priceRange: 3,
    costForTwo: 2200,
    city: 'Delhi',
    address: 'Khan Market, New Delhi',
    features: ['Outdoor Seating', 'Wood Fired Oven', 'Bar'],
    tags: ['Family', 'Trending'],
    rating: 4.5,
  },
  {
    name: 'Coastline Mezze',
    description:
      'Levantine small plates, charcoal grills and a rooftop view of the city skyline.',
    cuisine: ['Mediterranean', 'Lebanese'],
    priceRange: 3,
    costForTwo: 2600,
    city: 'Hyderabad',
    address: 'Jubilee Hills, Hyderabad',
    features: ['Rooftop', 'Bar', 'Live Music'],
    tags: ['Rooftop', 'Date Night'],
    rating: 4.4,
  },
  {
    name: 'Brew & Bloom',
    description:
      'A daytime specialty café turning into a natural-wine bar after dark. Single-origin coffee, house focaccia, slow mornings.',
    cuisine: ['Cafe', 'Continental'],
    priceRange: 2,
    costForTwo: 900,
    city: 'Bengaluru',
    address: 'Koramangala 5th Block, Bengaluru',
    features: ['Outdoor Seating', 'Pet Friendly', 'Wifi'],
    tags: ['Cafe', 'Work Friendly'],
    rating: 4.3,
  },
  {
    name: 'Dakshin Spice Co.',
    description:
      'Banana-leaf thalis and filter coffee done with reverence. A celebration of South Indian home cooking.',
    cuisine: ['South Indian'],
    priceRange: 2,
    costForTwo: 800,
    city: 'Hyderabad',
    address: 'Banjara Hills, Hyderabad',
    features: ['Pure Veg', 'Family Seating'],
    tags: ['Family', 'Veg'],
    rating: 4.7,
    isFeatured: true,
  },
  {
    name: 'Neon Wok',
    description:
      'High-energy pan-Asian kitchen — dim sum carts, smoking woks and bubble-tea cocktails.',
    cuisine: ['Chinese', 'Pan Asian', 'Thai'],
    priceRange: 3,
    costForTwo: 2000,
    city: 'Mumbai',
    address: 'Bandra West, Mumbai',
    features: ['Bar', 'Late Night'],
    tags: ['Trending', 'Nightlife'],
    rating: 4.2,
  },
  {
    name: 'The Garden Table',
    description:
      'Farm-to-fork plates served among potted herbs and string lights. Brunch is a local institution.',
    cuisine: ['Continental', 'Healthy'],
    priceRange: 3,
    costForTwo: 1800,
    city: 'Delhi',
    address: 'Greater Kailash II, New Delhi',
    features: ['Outdoor Seating', 'Brunch', 'Vegetarian Friendly'],
    tags: ['Brunch', 'Family'],
    rating: 4.5,
  },
  {
    name: 'Smoke House Republic',
    description:
      'Low-and-slow barbecue, craft beer on tap and a sticky-fingered good time.',
    cuisine: ['American', 'BBQ', 'Grill'],
    priceRange: 3,
    costForTwo: 2400,
    city: 'Bengaluru',
    address: 'Whitefield, Bengaluru',
    features: ['Bar', 'Sports Screening', 'Live Music'],
    tags: ['Nightlife', 'Group'],
    rating: 4.1,
  },
  {
    name: 'Maison Petit',
    description:
      'A pocket-sized French bistro — escargot, steak frites and an unreasonably good crème brûlée.',
    cuisine: ['French', 'European'],
    priceRange: 4,
    costForTwo: 3800,
    city: 'Mumbai',
    address: 'Colaba, Mumbai',
    features: ['Bar', 'Romantic', 'Wine List'],
    tags: ['Date Night', 'Premium'],
    rating: 4.6,
  },
  {
    name: 'Spice Bazaar',
    description:
      'Street-food energy in a sit-down room — chaats, kebabs and tandoor classics under one roof.',
    cuisine: ['North Indian', 'Street Food'],
    priceRange: 2,
    costForTwo: 1100,
    city: 'Delhi',
    address: 'Connaught Place, New Delhi',
    features: ['Family Seating', 'Quick Bites'],
    tags: ['Family', 'Casual'],
    rating: 4.0,
  },
];

const sampleMenu = (slug) => [
  { name: 'Signature Tasting Plate', price: 780, category: 'Mains', veg: false, image: img(`${slug}-m1`, 'Chef Special', 'Plated to share', 'dining', { width: 900, height: 900 }) },
  { name: 'Charred Heirloom Salad', price: 420, category: 'Starters', veg: true, image: img(`${slug}-m2`, 'Fresh Starters', 'Seasonal and bright', 'dining', { width: 900, height: 900 }) },
  { name: 'Truffle Mushroom Risotto', price: 620, category: 'Mains', veg: true, image: img(`${slug}-m3`, 'Slow Simmered', 'Creamy comfort bowl', 'dining', { width: 900, height: 900 }) },
  { name: 'Slow-Cooked Lamb Shank', price: 940, category: 'Mains', veg: false, image: img(`${slug}-m4`, 'Wood Fire', 'Weekend main course', 'dining', { width: 900, height: 900 }) },
  { name: 'Dark Chocolate Delice', price: 360, category: 'Desserts', veg: true, image: img(`${slug}-m5`, 'Sweet Finish', 'For the final course', 'dining', { width: 900, height: 900 }) },
];

/* ─────────────────── Plays ─────────────────── */
const plays = [
  {
    title: 'The Glass Menagerie',
    description:
      'A memory play of fragile dreams and family ties, staged in an intimate black-box theatre.',
    genre: ['Drama', 'Classic'],
    language: 'English',
    duration: 135,
    city: 'Bengaluru',
    venue: { name: 'Ranga Shankara', address: 'JP Nagar, Bengaluru' },
    rating: 4.7,
    isFeatured: true,
  },
  {
    title: 'Midnight in Bombay',
    description:
      'A noir-tinged thriller that races through the city’s underbelly in real time.',
    genre: ['Thriller', 'Drama'],
    language: 'Hindi',
    duration: 110,
    city: 'Mumbai',
    venue: { name: 'Prithvi Theatre', address: 'Juhu, Mumbai' },
    rating: 4.5,
    isFeatured: true,
  },
  {
    title: 'The Comedy of Errors',
    description: 'Shakespeare’s farce of mistaken identity, reimagined with live music.',
    genre: ['Comedy', 'Classic'],
    language: 'English',
    duration: 120,
    city: 'Delhi',
    venue: { name: 'Kamani Auditorium', address: 'Mandi House, New Delhi' },
    rating: 4.4,
  },
  {
    title: 'Tughlaq',
    description: 'Girish Karnad’s landmark political drama about an idealist king undone by his own brilliance.',
    genre: ['Drama', 'Historical'],
    language: 'Hindi',
    duration: 150,
    city: 'Bengaluru',
    venue: { name: 'Chowdiah Memorial Hall', address: 'Malleshwaram, Bengaluru' },
    rating: 4.8,
    isFeatured: true,
  },
  {
    title: 'Every Brilliant Thing',
    description: 'A one-man show about depression, hope and the small things worth living for.',
    genre: ['Drama', 'Solo'],
    language: 'English',
    duration: 75,
    city: 'Hyderabad',
    venue: { name: 'Lamakaan', address: 'Banjara Hills, Hyderabad' },
    rating: 4.6,
  },
  {
    title: 'The Mousetrap',
    description: 'Agatha Christie’s legendary whodunit — a snowbound guesthouse and a killer within.',
    genre: ['Mystery', 'Thriller'],
    language: 'English',
    duration: 130,
    city: 'Mumbai',
    venue: { name: 'NCPA', address: 'Nariman Point, Mumbai' },
    rating: 4.5,
  },
  {
    title: 'Laughter on the 23rd Floor',
    description: 'A backstage comedy about a 1950s TV writers’ room bursting at the seams.',
    genre: ['Comedy'],
    language: 'English',
    duration: 115,
    city: 'Delhi',
    venue: { name: 'Akshara Theatre', address: 'Baba Kharak Singh Marg, New Delhi' },
    rating: 4.2,
  },
  {
    title: 'Andha Yug',
    description: 'A haunting verse drama set on the last day of the Mahabharata war.',
    genre: ['Drama', 'Classic'],
    language: 'Hindi',
    duration: 140,
    city: 'Hyderabad',
    venue: { name: 'Ravindra Bharathi', address: 'Saifabad, Hyderabad' },
    rating: 4.7,
  },
];

const seatCategories = () => [
  { name: 'Premium', price: 999, totalSeats: 60, bookedSeats: 0 },
  { name: 'Gold', price: 699, totalSeats: 90, bookedSeats: 0 },
  { name: 'Silver', price: 399, totalSeats: 120, bookedSeats: 0 },
];

const cast = (slug) => [
  { name: 'Aarav Mehta', role: 'Lead', image: img(`${slug}-c1`, 'Aarav Mehta', 'Lead role', 'plays', { width: 900, height: 900 }) },
  { name: 'Diya Kapoor', role: 'Lead', image: img(`${slug}-c2`, 'Diya Kapoor', 'Lead role', 'plays', { width: 900, height: 900 }) },
  { name: 'Rohan Iyer', role: 'Supporting', image: img(`${slug}-c3`, 'Rohan Iyer', 'Supporting role', 'plays', { width: 900, height: 900 }) },
];

/* ─────────────────── Events ─────────────────── */
const events = [
  {
    title: 'Sunburn Arena: Midnight Pulse',
    description: 'A night of electronic music with international headliners and a 360° stage.',
    category: 'Music',
    city: 'Bengaluru',
    venue: { name: 'Embassy International Riding School', address: 'Sarjapur, Bengaluru' },
    organizer: 'Pulse Live',
    rating: 4.6,
    isFeatured: true,
  },
  {
    title: 'The Standup Republic',
    description: 'Five comedians, one mic, zero filters. India’s sharpest line-up under one roof.',
    category: 'Comedy',
    city: 'Mumbai',
    venue: { name: 'The Habitat', address: 'Khar West, Mumbai' },
    organizer: 'Republic Comedy',
    rating: 4.7,
    isFeatured: true,
  },
  {
    title: 'Indie Folk Festival',
    description: 'An open-air weekend of acoustic sets, food trucks and golden-hour sound.',
    category: 'Festival',
    city: 'Delhi',
    venue: { name: 'Sunder Nursery', address: 'Nizamuddin, New Delhi' },
    organizer: 'Folk Collective',
    rating: 4.5,
    isFeatured: true,
  },
  {
    title: 'Founder Stories: Tech Summit',
    description: 'A day of keynotes and fireside chats with the operators building India’s next decade.',
    category: 'Tech',
    city: 'Bengaluru',
    venue: { name: 'KTPO Convention Centre', address: 'Whitefield, Bengaluru' },
    organizer: 'Scale Network',
    rating: 4.4,
  },
  {
    title: 'Canvas & Coffee: Art Jam',
    description: 'A guided painting afternoon with unlimited coffee and zero judgement.',
    category: 'Art',
    city: 'Hyderabad',
    venue: { name: 'Phoenix Arena', address: 'Gachibowli, Hyderabad' },
    organizer: 'Makers Studio',
    rating: 4.3,
  },
  {
    title: 'City Marathon 2026',
    description: 'A 10K and half-marathon through the heart of the city at dawn.',
    category: 'Sports',
    city: 'Mumbai',
    venue: { name: 'Marine Drive', address: 'Nariman Point, Mumbai' },
    organizer: 'RunCity',
    rating: 4.6,
  },
  {
    title: 'Synthwave Nights',
    description: 'Retro-futuristic visuals and analog synths in an intimate warehouse setting.',
    category: 'Nightlife',
    city: 'Delhi',
    venue: { name: 'Auro Kitchen & Bar', address: 'Hauz Khas, New Delhi' },
    organizer: 'Pulse Live',
    rating: 4.2,
  },
  {
    title: 'Ceramics Weekend Workshop',
    description: 'Hands-on wheel-throwing for beginners — leave with three pieces of your own.',
    category: 'Workshop',
    city: 'Bengaluru',
    venue: { name: 'Clay Studio', address: 'Indiranagar, Bengaluru' },
    organizer: 'Makers Studio',
    rating: 4.8,
  },
  {
    title: 'Jazz by the Bay',
    description: 'A mellow evening of live jazz with a skyline view and a curated cocktail menu.',
    category: 'Music',
    city: 'Mumbai',
    venue: { name: 'Royal Opera House', address: 'Girgaon, Mumbai' },
    organizer: 'Folk Collective',
    rating: 4.7,
    isFeatured: true,
  },
  {
    title: 'Comedy Open Mic Night',
    description: 'New jokes, brave souls and a crowd that’s on your side. Walk-ins welcome.',
    category: 'Comedy',
    city: 'Hyderabad',
    venue: { name: 'Lamakaan', address: 'Banjara Hills, Hyderabad' },
    organizer: 'Republic Comedy',
    rating: 4.1,
  },
];

const ticketTypes = (cat) => {
  const base =
    cat === 'Workshop' ? 1500 : cat === 'Tech' ? 1999 : cat === 'Sports' ? 999 : 799;
  return [
    { name: 'General', price: base, totalQuantity: 300, soldQuantity: 0, perks: ['Entry'] },
    {
      name: 'Premium',
      price: base * 2,
      totalQuantity: 120,
      soldQuantity: 0,
      perks: ['Priority Entry', 'Reserved Area'],
    },
    {
      name: 'VIP',
      price: base * 3.5,
      totalQuantity: 40,
      soldQuantity: 0,
      perks: ['Lounge Access', 'Complimentary Drinks', 'Meet & Greet'],
    },
  ];
};

async function run() {
  await connectDB();
  logger.info('Clearing existing collections...');

  /* Drop collections (not just documents) so indexes rebuild from the
     current schema — then recreate them explicitly. */
  const models = [User, Restaurant, Play, Event, Booking, Payment, Review];
  await Promise.all(models.map((m) => m.collection.drop().catch(() => {})));
  await Promise.all(models.map((m) => m.createIndexes()));

  const admin = await User.create({
    name: 'Bookify Admin',
    email: 'admin@bookify.app',
    password: 'admin123',
    role: 'admin',
    city: 'Bengaluru',
    isVerified: true,
  });
  const demo = await User.create({
    name: 'Aisha Khan',
    email: 'user@bookify.app',
    password: 'user123',
    city: 'Bengaluru',
    isVerified: true,
  });
  logger.success('Created admin@bookify.app / admin123 and user@bookify.app / user123');

  const restDocs = await Restaurant.create(
    restaurants.map((r, i) => {
      const seed = `rest-${i}`;
      return {
        ...r,
        coverImage: img(`${seed}-cover`, r.name, r.city, 'dining'),
        gallery: gallery(seed, r.name, r.city, 'dining', 5),
        menu: sampleMenu(seed),
        location: { lat: 12.97 + i * 0.01, lng: 77.59 + i * 0.01 },
      };
    }),
  );

  const playDocs = await Play.create(
    plays.map((p, i) => {
      const seed = `play-${i}`;
      return {
        ...p,
        coverImage: img(`${seed}-cover`, p.title, p.city, 'plays'),
        gallery: gallery(seed, p.title, p.city, 'plays', 4),
        cast: cast(seed),
        seatCategories: seatCategories(),
        showtimes: [days(i + 2), days(i + 4), days(i + 7)],
        tags: p.genre,
      };
    }),
  );

  const eventDocs = await Event.create(
    events.map((e, i) => {
      const seed = `event-${i}`;
      return {
        ...e,
        coverImage: img(`${seed}-cover`, e.title, e.city, 'events'),
        gallery: gallery(seed, e.title, e.city, 'events', 5),
        startDate: days(i + 3),
        endDate: days(i + 3),
        ticketTypes: ticketTypes(e.category),
        lineup: cast(seed).map((c) => ({ name: c.name, image: c.image })),
        tags: [e.category, e.city],
      };
    }),
  );

  logger.success(
    `Seeded ${restDocs.length} restaurants, ${playDocs.length} plays, ${eventDocs.length} events`,
  );

  /* A few reviews so listings show social proof. */
  const reviewSamples = [
    { rating: 5, comment: 'Genuinely one of the best nights out I’ve had this year.' },
    { rating: 4, comment: 'Great atmosphere and service. Will be back.' },
    { rating: 5, comment: 'Worth every rupee — the detail in everything is incredible.' },
  ];
  /* Review a spread of listings across all three verticals so ratings,
     review counts and the reviews section stay consistent everywhere. */
  const reviewed = [
    ...restDocs.slice(0, 6),
    ...playDocs.slice(0, 5),
    ...eventDocs.slice(0, 6),
  ];
  for (const [i, doc] of reviewed.entries()) {
    const itemType = doc.constructor.modelName;
    await Review.create({
      user: i % 2 === 0 ? demo._id : admin._id,
      itemType,
      item: doc._id,
      ...reviewSamples[i % reviewSamples.length],
    });
    /* Recompute the listing's aggregate rating before moving on. */
    await Review.syncRating(itemType, doc._id);
  }
  logger.success('Seeded sample reviews');

  /* Let any fire-and-forget post-save hooks settle, then exit hard —
     process.exit reclaims the connection without a graceful-close race. */
  await new Promise((resolve) => setTimeout(resolve, 600));
  logger.success('Seed complete ✨');
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
