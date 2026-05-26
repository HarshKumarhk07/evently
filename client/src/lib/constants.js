/* Cities surfaced in the rich location picker — name + coordinates so
   "Use Current Location" can pick the nearest one. */
export const POPULAR_CITIES = [
  { name: 'Abu Dhabi',  lat: 24.4539, lng: 54.3773 },
  { name: 'Ahmedabad',  lat: 23.0225, lng: 72.5714 },
  { name: 'Bengaluru',  lat: 12.9716, lng: 77.5946 },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Chennai',    lat: 13.0827, lng: 80.2707 },
  { name: 'Delhi',      lat: 28.6139, lng: 77.209 },
  { name: 'Dubai',      lat: 25.2769, lng: 55.2962 },
  { name: 'Goa',        lat: 15.2993, lng: 74.124 },
  { name: 'Hyderabad',  lat: 17.385,  lng: 78.4867 },
  { name: 'Kolkata',    lat: 22.5726, lng: 88.3639 },
  { name: 'Mumbai',     lat: 19.076,  lng: 72.8777 },
  { name: 'Pune',       lat: 18.5204, lng: 73.8567 },
];

/* Default city for first-time visitors — one we have seeded data for. */
export const DEFAULT_CITY = 'Bengaluru';

/* Names of cities used by signup / profile dropdowns and the location
   context's `cities` list. */
export const CITIES = POPULAR_CITIES.map((c) => c.name);

/* The full alphabetical city list shown in the "All Cities" section.
   Includes the popular cities + a wider catalogue across India and beyond. */
export const ALL_CITIES = [
  ...CITIES,
  'Abohar', 'Abu Road', 'Agra', 'Ajmer', 'Aligarh', 'Allahabad', 'Ambala',
  'Amritsar', 'Asansol', 'Aurangabad',
  'Bareilly', 'Belgaum', 'Bhavnagar', 'Bhilai', 'Bhopal', 'Bhubaneswar',
  'Coimbatore', 'Cuttack',
  'Dehradun', 'Dhanbad', 'Durgapur',
  'Erode',
  'Faridabad',
  'Gangtok', 'Ghaziabad', 'Gorakhpur', 'Gulbarga', 'Guntur', 'Guwahati', 'Gwalior',
  'Hubli',
  'Imphal', 'Indore',
  'Jabalpur', 'Jaipur', 'Jalandhar', 'Jammu', 'Jamnagar', 'Jamshedpur', 'Jodhpur',
  'Kanpur', 'Kochi', 'Kolhapur', 'Kota',
  'Lucknow', 'Ludhiana',
  'Madurai', 'Mangalore', 'Meerut', 'Mysuru',
  'Nagpur', 'Nashik', 'Noida',
  'Patiala', 'Patna', 'Puducherry',
  'Raipur', 'Rajkot', 'Ranchi', 'Rourkela',
  'Salem', 'Shillong', 'Shimla', 'Siliguri', 'Solapur', 'Srinagar', 'Surat',
  'Thane', 'Thiruvananthapuram', 'Tiruchirapalli', 'Tirupati',
  'Udaipur', 'Ujjain',
  'Vadodara', 'Varanasi', 'Vellore', 'Vijayawada', 'Visakhapatnam',
  'Warangal',
].sort((a, b) => a.localeCompare(b));

export const CUISINES = [
  'North Indian',
  'South Indian',
  'Italian',
  'Japanese',
  'Chinese',
  'Continental',
  'Mediterranean',
  'French',
  'American',
  'Cafe',
  'Pan Asian',
];

export const RESTAURANT_FEATURES = [
  'Outdoor Seating',
  'Bar',
  'Live Music',
  'Valet Parking',
  'Rooftop',
  'Pet Friendly',
  'Pure Veg',
];

export const EVENT_CATEGORIES = [
  'Music',
  'Comedy',
  'Workshop',
  'Sports',
  'Festival',
  'Tech',
  'Art',
  'Nightlife',
];

export const PLAY_GENRES = [
  'Drama',
  'Comedy',
  'Thriller',
  'Classic',
  'Mystery',
  'Historical',
  'Solo',
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Reviewed' },
];

export const PRICE_RANGES = [
  { value: 1, label: '₹ Budget' },
  { value: 2, label: '₹₹ Casual' },
  { value: 3, label: '₹₹₹ Premium' },
  { value: 4, label: '₹₹₹₹ Luxe' },
];

/* Drives the three listing verticals and their routes/theming. */
export const VERTICALS = [
  { key: 'dining', label: 'Dining', path: '/dining' },
  { key: 'plays', label: 'Plays', path: '/plays' },
  { key: 'events', label: 'Events', path: '/events' },
];

/* Top-level navbar links — "For You" is the curated home, followed by
   the three verticals. `end` matches the exact path only (otherwise "/"
   would be active on every page). */
export const NAV_LINKS = [
  { key: 'foryou', label: 'For You', path: '/', end: true },
  ...VERTICALS,
];
