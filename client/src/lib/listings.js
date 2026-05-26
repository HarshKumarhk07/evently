/* Shared mapping between the three verticals and their data shapes. */
export const VERTICAL_CONFIG = {
  dining: { vertical: 'dining', refType: 'Restaurant', titleKey: 'name', basePath: '/dining', label: 'Dining' },
  plays: { vertical: 'plays', refType: 'Play', titleKey: 'title', basePath: '/plays', label: 'Plays' },
  events: { vertical: 'events', refType: 'Event', titleKey: 'title', basePath: '/events', label: 'Events' },
};

export const REFTYPE_TO_VERTICAL = {
  Restaurant: 'dining',
  Play: 'plays',
  Event: 'events',
};

export const titleOf = (item) => item?.name || item?.title || 'Untitled';

/* Lowest ticket/seat price for a play or event. */
export function priceFrom(item) {
  if (item.priceFrom != null) return item.priceFrom;
  const pools = item.seatCategories || item.ticketTypes || [];
  return pools.length ? Math.min(...pools.map((p) => p.price)) : 0;
}
