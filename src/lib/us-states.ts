/**
 * Single source of truth for US state coverage across Crush.
 * Used to guarantee that every state has demo creators and a chat room,
 * and to power fuzzy state search ("tenn", "NY", "cali" ...).
 */

export type UsState = {
  abbr: string;
  name: string;
  /** Anchor city used for demo creators / rooms in that state. */
  city: string;
  lat: number;
  lng: number;
  /** Extra search aliases (nicknames, common shorthands). */
  aliases: string[];
};

export const US_STATES: UsState[] = [
  { abbr: "AL", name: "Alabama", city: "Birmingham", lat: 33.5186, lng: -86.8104, aliases: ["bama", "yellowhammer"] },
  { abbr: "AK", name: "Alaska", city: "Anchorage", lat: 61.2181, lng: -149.9003, aliases: ["last frontier"] },
  { abbr: "AZ", name: "Arizona", city: "Phoenix", lat: 33.4484, lng: -112.0740, aliases: ["zona", "grand canyon"] },
  { abbr: "AR", name: "Arkansas", city: "Little Rock", lat: 34.7465, lng: -92.2896, aliases: ["natural state"] },
  { abbr: "CA", name: "California", city: "Los Angeles", lat: 34.0522, lng: -118.2437, aliases: ["cali", "golden state", "socal", "norcal"] },
  { abbr: "CO", name: "Colorado", city: "Denver", lat: 39.7392, lng: -104.9903, aliases: ["mile high", "colo"] },
  { abbr: "CT", name: "Connecticut", city: "Hartford", lat: 41.7658, lng: -72.6734, aliases: ["conn", "nutmeg"] },
  { abbr: "DE", name: "Delaware", city: "Wilmington", lat: 39.7391, lng: -75.5398, aliases: ["first state"] },
  { abbr: "DC", name: "Washington DC", city: "Washington", lat: 38.9072, lng: -77.0369, aliases: ["dc", "district of columbia", "the district"] },
  { abbr: "FL", name: "Florida", city: "Miami", lat: 25.7617, lng: -80.1918, aliases: ["sunshine state", "flo rida"] },
  { abbr: "GA", name: "Georgia", city: "Atlanta", lat: 33.7490, lng: -84.3880, aliases: ["peach state", "atl"] },
  { abbr: "HI", name: "Hawaii", city: "Honolulu", lat: 21.3069, lng: -157.8583, aliases: ["aloha state", "oahu"] },
  { abbr: "ID", name: "Idaho", city: "Boise", lat: 43.6150, lng: -116.2023, aliases: ["gem state"] },
  { abbr: "IL", name: "Illinois", city: "Chicago", lat: 41.8781, lng: -87.6298, aliases: ["chi", "windy city"] },
  { abbr: "IN", name: "Indiana", city: "Indianapolis", lat: 39.7684, lng: -86.1581, aliases: ["indy", "hoosier"] },
  { abbr: "IA", name: "Iowa", city: "Des Moines", lat: 41.5868, lng: -93.6250, aliases: ["hawkeye"] },
  { abbr: "KS", name: "Kansas", city: "Wichita", lat: 37.6872, lng: -97.3301, aliases: ["sunflower state"] },
  { abbr: "KY", name: "Kentucky", city: "Louisville", lat: 38.2527, lng: -85.7585, aliases: ["bluegrass", "derby"] },
  { abbr: "LA", name: "Louisiana", city: "New Orleans", lat: 29.9511, lng: -90.0715, aliases: ["nola", "bayou"] },
  { abbr: "ME", name: "Maine", city: "Portland", lat: 43.6591, lng: -70.2568, aliases: ["pine tree state"] },
  { abbr: "MD", name: "Maryland", city: "Baltimore", lat: 39.2904, lng: -76.6122, aliases: ["bmore", "old line"] },
  { abbr: "MA", name: "Massachusetts", city: "Boston", lat: 42.3601, lng: -71.0589, aliases: ["mass", "beantown"] },
  { abbr: "MI", name: "Michigan", city: "Detroit", lat: 42.3314, lng: -83.0458, aliases: ["motor city", "great lakes"] },
  { abbr: "MN", name: "Minnesota", city: "Minneapolis", lat: 44.9778, lng: -93.2650, aliases: ["minny", "twin cities"] },
  { abbr: "MS", name: "Mississippi", city: "Jackson", lat: 32.2988, lng: -90.1848, aliases: ["magnolia state"] },
  { abbr: "MO", name: "Missouri", city: "Kansas City", lat: 39.0997, lng: -94.5786, aliases: ["show me state", "kc"] },
  { abbr: "MT", name: "Montana", city: "Billings", lat: 45.7833, lng: -108.5007, aliases: ["big sky"] },
  { abbr: "NE", name: "Nebraska", city: "Omaha", lat: 41.2565, lng: -95.9345, aliases: ["cornhusker"] },
  { abbr: "NV", name: "Nevada", city: "Las Vegas", lat: 36.1699, lng: -115.1398, aliases: ["vegas", "silver state"] },
  { abbr: "NH", name: "New Hampshire", city: "Manchester", lat: 42.9956, lng: -71.4548, aliases: ["granite state"] },
  { abbr: "NJ", name: "New Jersey", city: "Newark", lat: 40.7357, lng: -74.1724, aliases: ["jersey", "garden state"] },
  { abbr: "NM", name: "New Mexico", city: "Albuquerque", lat: 35.0844, lng: -106.6504, aliases: ["abq", "land of enchantment"] },
  { abbr: "NY", name: "New York", city: "New York", lat: 40.7128, lng: -74.0060, aliases: ["nyc", "empire state", "brooklyn"] },
  { abbr: "NC", name: "North Carolina", city: "Charlotte", lat: 35.2271, lng: -80.8431, aliases: ["carolina", "tar heel"] },
  { abbr: "ND", name: "North Dakota", city: "Fargo", lat: 46.8772, lng: -96.7898, aliases: ["peace garden"] },
  { abbr: "OH", name: "Ohio", city: "Columbus", lat: 39.9612, lng: -82.9988, aliases: ["buckeye"] },
  { abbr: "OK", name: "Oklahoma", city: "Oklahoma City", lat: 35.4676, lng: -97.5164, aliases: ["okc", "sooner"] },
  { abbr: "OR", name: "Oregon", city: "Portland", lat: 45.5152, lng: -122.6784, aliases: ["pdx", "beaver state"] },
  { abbr: "PA", name: "Pennsylvania", city: "Philadelphia", lat: 39.9526, lng: -75.1652, aliases: ["philly", "keystone"] },
  { abbr: "RI", name: "Rhode Island", city: "Providence", lat: 41.8240, lng: -71.4128, aliases: ["ocean state"] },
  { abbr: "SC", name: "South Carolina", city: "Charleston", lat: 32.7765, lng: -79.9311, aliases: ["palmetto", "carolina"] },
  { abbr: "SD", name: "South Dakota", city: "Sioux Falls", lat: 43.5460, lng: -96.7313, aliases: ["mount rushmore"] },
  { abbr: "TN", name: "Tennessee", city: "Nashville", lat: 36.1627, lng: -86.7816, aliases: ["tenn", "volunteer state", "music city"] },
  { abbr: "TX", name: "Texas", city: "Dallas", lat: 32.7767, lng: -96.7970, aliases: ["tejas", "lone star"] },
  { abbr: "UT", name: "Utah", city: "Salt Lake City", lat: 40.7608, lng: -111.8910, aliases: ["slc", "beehive"] },
  { abbr: "VT", name: "Vermont", city: "Burlington", lat: 44.4759, lng: -73.2121, aliases: ["green mountain"] },
  { abbr: "VA", name: "Virginia", city: "Richmond", lat: 37.5407, lng: -77.4360, aliases: ["old dominion", "rva"] },
  { abbr: "WA", name: "Washington", city: "Seattle", lat: 47.6062, lng: -122.3321, aliases: ["evergreen state", "pnw"] },
  { abbr: "WV", name: "West Virginia", city: "Charleston", lat: 38.3498, lng: -81.6326, aliases: ["mountain state"] },
  { abbr: "WI", name: "Wisconsin", city: "Milwaukee", lat: 43.0389, lng: -87.9065, aliases: ["badger state", "cheesehead"] },
  { abbr: "WY", name: "Wyoming", city: "Cheyenne", lat: 41.1400, lng: -104.8202, aliases: ["cowboy state"] },
];

const BY_ABBR = new Map(US_STATES.map((s) => [s.abbr, s]));

export function stateByAbbr(abbr?: string | null): UsState | undefined {
  return abbr ? BY_ABBR.get(abbr.toUpperCase()) : undefined;
}

/** "Austin, TX" -> Texas state record. */
export function stateFromCity(city?: string | null): UsState | undefined {
  if (!city) return undefined;
  const m = city.match(/,\s*([A-Za-z]{2})\s*$/);
  return stateByAbbr(m?.[1]);
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

/** Small edit distance — powers "tennesee" / "califonia" style typos. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
    }
  }
  return prev[b.length];
}

/**
 * Fuzzy-resolve a free-text query to a state.
 * Matches full names, abbreviations, nicknames, prefixes and near-misses.
 */
export function matchState(query: string): UsState | undefined {
  const q = norm(query);
  if (!q) return undefined;
  const candidates = US_STATES.map((s) => ({
    s,
    keys: [s.name, s.abbr, s.city, ...s.aliases].map(norm),
  }));

  // exact key
  for (const c of candidates) if (c.keys.includes(q)) return c.s;
  // prefix (min 3 chars so "ma" doesn't grab Massachusetts over Maine)
  if (q.length >= 3) {
    for (const c of candidates) if (c.keys.some((k) => k.startsWith(q) || k.includes(q))) return c.s;
  }
  // typo tolerance
  let best: { s: UsState; d: number } | undefined;
  for (const c of candidates) {
    for (const k of c.keys) {
      const d = editDistance(q, k);
      if (d <= 2 && (!best || d < best.d)) best = { s: c.s, d };
    }
  }
  return best?.s;
}

/** All searchable words for a state — used to build search haystacks. */
export function stateSearchTerms(s: UsState): string[] {
  return [s.name, s.abbr, s.city, ...s.aliases];
}
