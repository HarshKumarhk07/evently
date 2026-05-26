const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const PHOTO_CATALOG = {
  dining: [
    'photo-1517248135467-4c7edcad34c4',
    'photo-1414235077428-338989a2e8c0',
    'photo-1504674900247-0877df9cc836',
    'photo-1547592180-85f173990554',
    'photo-1559339352-11d035aa65de',
    'photo-1555396273-367ea4eb4db5',
    'photo-1455619452474-d2be8b1e70cd',
    'photo-1504754524776-8f4f37790ca0',
    'photo-1470337458703-46ad1756a187',
    'photo-1496417263034-38ec4f0b665a',
    'photo-1473093295043-cdd812d0e601',
    'photo-1481833761820-0509d3217039',
  ],
  plays: [
    'photo-1501386761578-eac5c94b800a',
    'photo-1516280440614-37939bbacd81',
    'photo-1514525253161-7a46d19cd819',
    'photo-1503095396549-807759245b35',
    'photo-1518972559570-9a5d2b3f0d62',
    'photo-1521334884684-d80222895322',
    'photo-1516450360452-9312f5e86fc7',
    'photo-1493225457124-a3eb161ffa5f',
    'photo-1540039155733-5c1a5d6e6f6b',
    'photo-1511671782779-c97d3d27a1d4',
    'photo-1489599735734-79b4d5f7a2e4',
    'photo-1501386761578-eac5c94b800a',
  ],
  events: [
    'photo-1501386761578-eac5c94b800a',
    'photo-1493225457124-a3eb161ffa5f',
    'photo-1511578314322-379afb0f6598',
    'photo-1515169067860-5387ec356754',
    'photo-1501612780327-45045538702b',
    'photo-1516450360452-9312f5e86fc7',
    'photo-1507924538820-ede94a04019d',
    'photo-1518091043644-c1d4457512c6',
    'photo-1511795409834-432f79cae28f',
    'photo-1519750157634-bbb2f97b3e4e',
    'photo-1521334884684-d80222895322',
    'photo-1493225457124-a3eb161ffa5f',
  ],
  auth: [
    'photo-1477959858617-67f85cf4f1df',
    'photo-1493246507139-91e8fad9978e',
    'photo-1444723121867-7a241cacace9',
    'photo-1519501025264-65ba15a82390',
  ],
  generic: [
    'photo-1469474968028-56623f02e42e',
    'photo-1500530855697-b586d89ba3ee',
    'photo-1482192596544-9eb780fc7f66',
    'photo-1441974231531-c6227db76b6e',
  ],
};

const THEME_LABELS = {
  dining: 'Dining',
  plays: 'Plays',
  events: 'Events',
  auth: 'Bookify',
  generic: 'Bookify',
};

const addParams = (url, width, height) => `${url}?auto=format&fit=crop&w=${width}&h=${height}&q=82&fm=jpg`;

function pickPhoto(theme, seed) {
  const catalog = PHOTO_CATALOG[theme] || PHOTO_CATALOG.generic;
  const index = hashString(`${theme}:${seed}`) % catalog.length;
  return catalog[index];
}

export function makeArtImage({
  theme = 'generic',
  title = 'Bookify',
  subtitle = '',
  seed = 'default',
  width = 1600,
  height = 900,
  label = '',
} = {}) {
  const resolvedTheme = PHOTO_CATALOG[theme] ? theme : 'generic';
  const photo = pickPhoto(resolvedTheme, `${seed}:${title}:${subtitle}`);
  const alt = label || title || THEME_LABELS[resolvedTheme] || 'Bookify';
  return addParams(`https://images.unsplash.com/${photo}`, width, height);
}