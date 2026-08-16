import { US_STATES, matchState, stateSearchTerms, stateByAbbr } from "./us-states";

export type DemoRoom = {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  category: "Trending" | "Conversation" | "Evening" | "Chill" | "Fitness" | "Coffee" | "Party" | "Local";
  members: number;
  online: number;
  gradient: string;
  hot?: boolean;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  /** Optional themed background image (city skyline, mood shot, etc.) */
  image?: string;
  /** Alt search tags — used to derive image if none is set. */
  tags?: string;
};

/**
 * Deterministic themed photo for a room. Uses LoremFlickr (Flickr-backed) with
 * tag-based lookups, so the same room slug always returns the same photo.
 * City rooms → skyline / cityscape; themed rooms → romantic mood shots.
 */
export function roomImage(room: DemoRoom): string {
  if (room.image) return room.image;
  const seed = Math.abs(hash(room.slug)) % 10000;
  const tags = room.tags
    ?? (room.city ? `${room.city.toLowerCase().replace(/\s+/g, "")},skyline,city,night` : categoryTags(room.category));
  return `https://loremflickr.com/640/420/${encodeURIComponent(tags)}?lock=${seed}`;
}

function categoryTags(cat: DemoRoom["category"]): string {
  switch (cat) {
    case "Trending":     return "confetti,lights,celebration";
    case "Conversation": return "cafe,friends,coffee,talk";
    case "Evening":      return "moon,night,city,lights";
    case "Party":        return "party,confetti,disco,lights";
    case "Chill":        return "sunset,beach,pastel";
    case "Fitness":      return "yoga,pink,studio";
    case "Coffee":       return "latte,cafe,cozy";
    default:             return "city,skyline,night";
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

export const ROOM_CATEGORIES = ["All", "Near Me", "Trending", "Conversation", "Evening", "Party", "Local"] as const;

// Major US metros — for the "Rooms Near Me" grid
export const CITY_ROOMS: DemoRoom[] = [
  { slug: "dallas",      name: "Dallas Nights",       emoji: "🤠", tagline: "Big-D hellos and Deep Ellum crew",    category: "Local", members: 1892, online: 421, gradient: "linear-gradient(135deg,#ff6b35,#e84393)", city: "Dallas",       state: "TX", lat: 32.7767, lng: -96.7970, hot: true },
  { slug: "houston",     name: "H-Town Lounge",       emoji: "🚀", tagline: "Space City vibes, midtown mingle",    category: "Local", members: 1655, online: 388, gradient: "linear-gradient(135deg,#f7931e,#e84393)", city: "Houston",      state: "TX", lat: 29.7604, lng: -95.3698, hot: true },
  { slug: "austin",      name: "Austin Live Music Room",  emoji: "🎸", tagline: "6th Street energy, keep it weird",    category: "Local", members: 1120, online: 244, gradient: "linear-gradient(135deg,#ff6b35,#6c5ce7)", city: "Austin",       state: "TX", lat: 30.2672, lng: -97.7431 },
  { slug: "atlanta",     name: "Atlanta ATL Room",    emoji: "🍑", tagline: "Peach State, good takes",              category: "Local", members: 2044, online: 512, gradient: "linear-gradient(135deg,#e84393,#6c5ce7)", city: "Atlanta",      state: "GA", lat: 33.7490, lng: -84.3880, hot: true },
  { slug: "miami",       name: "Miami Nights",        emoji: "🌴", tagline: "South Beach sunshine crew",              category: "Local", members: 2201, online: 604, gradient: "linear-gradient(135deg,#ff6b35,#f7931e)", city: "Miami",        state: "FL", lat: 25.7617, lng: -80.1918, hot: true },
  { slug: "nyc",         name: "NYC Night Owls",      emoji: "🗽", tagline: "5-boro chat, always on",             category: "Local", members: 3488, online: 902, gradient: "linear-gradient(135deg,#6c5ce7,#e84393)", city: "New York",     state: "NY", lat: 40.7128, lng: -74.0060, hot: true },
  { slug: "la",          name: "LA Sunset Room",      emoji: "🌇", tagline: "Sunset Blvd. moods",                  category: "Local", members: 2870, online: 720, gradient: "linear-gradient(135deg,#f7931e,#e84393)", city: "Los Angeles",  state: "CA", lat: 34.0522, lng: -118.2437, hot: true },
  { slug: "sf",          name: "SF Bay Circle",       emoji: "🌉", tagline: "Bay Area chill",                      category: "Local", members: 940,  online: 210, gradient: "linear-gradient(135deg,#6c5ce7,#ff6b35)", city: "San Francisco",state: "CA", lat: 37.7749, lng: -122.4194 },
  { slug: "chicago",     name: "Chicago Loop Chat",   emoji: "🌆", tagline: "Windy city warmth",                   category: "Local", members: 1520, online: 342, gradient: "linear-gradient(135deg,#e84393,#f7931e)", city: "Chicago",      state: "IL", lat: 41.8781, lng: -87.6298 },
  { slug: "vegas",       name: "Vegas Neon Room",    emoji: "🎰", tagline: "Neon lights, night owls",              category: "Local", members: 1988, online: 555, gradient: "linear-gradient(135deg,#ff6b35,#6c5ce7)", city: "Las Vegas",    state: "NV", lat: 36.1699, lng: -115.1398, hot: true },
  { slug: "phoenix",     name: "Phoenix Desert Room", emoji: "🌵", tagline: "AZ heat, cool vibes",                 category: "Local", members: 812,  online: 174, gradient: "linear-gradient(135deg,#f7931e,#ff6b35)", city: "Phoenix",      state: "AZ", lat: 33.4484, lng: -112.0740 },
  { slug: "denver",      name: "Denver Mile-High",    emoji: "🏔️", tagline: "Rocky Mountain hellos",                category: "Local", members: 705,  online: 148, gradient: "linear-gradient(135deg,#6c5ce7,#f7931e)", city: "Denver",       state: "CO", lat: 39.7392, lng: -104.9903 },
  { slug: "seattle",     name: "Seattle Rain Chat",   emoji: "☔", tagline: "Rainy day coffee talk",                   category: "Local", members: 690,  online: 132, gradient: "linear-gradient(135deg,#6c5ce7,#e84393)", city: "Seattle",      state: "WA", lat: 47.6062, lng: -122.3321 },
  { slug: "dc",          name: "DC Capitol Circle",   emoji: "🏛️", tagline: "Beltway banter, off the record",       category: "Local", members: 830,  online: 190, gradient: "linear-gradient(135deg,#e84393,#6c5ce7)", city: "Washington",   state: "DC", lat: 38.9072, lng: -77.0369 },
  { slug: "boston",      name: "Boston Common Room",  emoji: "⚓", tagline: "Beantown banter",                     category: "Local", members: 612,  online: 118, gradient: "linear-gradient(135deg,#ff6b35,#e84393)", city: "Boston",       state: "MA", lat: 42.3601, lng: -71.0589 },
  { slug: "philly",      name: "Philly Row Chat",     emoji: "🔔", tagline: "Rowhome regulars",                     category: "Local", members: 588,  online: 108, gradient: "linear-gradient(135deg,#f7931e,#6c5ce7)", city: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652 },
  { slug: "sd",          name: "San Diego Sunset",    emoji: "🏄", tagline: "PCH & palm trees",                    category: "Local", members: 744,  online: 162, gradient: "linear-gradient(135deg,#ff6b35,#f7931e)", city: "San Diego",    state: "CA", lat: 32.7157, lng: -117.1611 },
  { slug: "orlando",     name: "Orlando Magic Room",  emoji: "🎢", tagline: "Theme-park kids grown up",            category: "Local", members: 662,  online: 129, gradient: "linear-gradient(135deg,#e84393,#f7931e)", city: "Orlando",      state: "FL", lat: 28.5383, lng: -81.3792 },
  { slug: "nashville",   name: "Nashville Honky Room",emoji: "🎶", tagline: "Music Row jam session",                     category: "Local", members: 774,  online: 156, gradient: "linear-gradient(135deg,#f7931e,#e84393)", city: "Nashville",    state: "TN", lat: 36.1627, lng: -86.7816 },
  { slug: "detroit",     name: "Detroit Motor Room",  emoji: "🚗", tagline: "Motor City moods",                    category: "Local", members: 501,  online: 96,  gradient: "linear-gradient(135deg,#6c5ce7,#ff6b35)", city: "Detroit",      state: "MI", lat: 42.3314, lng: -83.0458 },
];

/**
 * One official room per US state (plus DC) so every state is joinable
 * and searchable, even the ones without a metro room above.
 */
export const STATE_ROOMS: DemoRoom[] = US_STATES.map((st, i) => {
  const gradients = [
    "linear-gradient(135deg,#ff6b35,#e84393)",
    "linear-gradient(135deg,#e84393,#6c5ce7)",
    "linear-gradient(135deg,#f7931e,#e84393)",
    "linear-gradient(135deg,#6c5ce7,#ff6b35)",
  ];
  return {
    slug: `state-${st.abbr.toLowerCase()}`,
    name: `${st.name} Room`,
    emoji: "\u{1F4CD}",
    tagline: `${st.name} members and creators — say hi from ${st.city}.`,
    category: "Local" as const,
    members: 240 + ((i * 137) % 1800),
    online: 30 + ((i * 53) % 320),
    gradient: gradients[i % gradients.length],
    city: st.city,
    state: st.abbr,
    lat: st.lat,
    lng: st.lng,
    tags: `${st.city.toLowerCase().replace(/\s+/g, "")},skyline,city,night`,
  };
});

export const DEMO_ROOMS: DemoRoom[] = [
  { slug: "trending-tonight", name: "Trending Tonight",      emoji: "✨", tagline: "The room everyone's talking about", category: "Trending",     members: 1284, online: 312, gradient: "linear-gradient(135deg,#ff2d75,#ff6b9d)", hot: true },
  { slug: "coffee-chat",      name: "Coffee Chat",           emoji: "☕", tagline: "Slow conversations, good company",  category: "Conversation", members: 942,  online: 187, gradient: "linear-gradient(135deg,#ff5c8a,#c34fff)", hot: true },
  { slug: "icebreakers",      name: "Icebreakers",           emoji: "🎲", tagline: "Games, questions, easy hellos",     category: "Conversation", members: 811,  online: 156, gradient: "linear-gradient(135deg,#ff3d9a,#7b2cff)" },
  { slug: "evening-unwind",   name: "Evening Unwind",        emoji: "🌙", tagline: "Wind down and talk about your day", category: "Evening",      members: 706,  online: 244, gradient: "linear-gradient(135deg,#5a1fbf,#1f0a54)", hot: true },
  { slug: "party-line",       name: "Party Line",            emoji: "🎉", tagline: "Music, memes, mayhem",              category: "Party",        members: 1103, online: 289, gradient: "linear-gradient(135deg,#ff9a3d,#ff3d9a)" },
  { slug: "music-room",       name: "Music Room",            emoji: "🎧", tagline: "Share what you're listening to",    category: "Conversation", members: 615,  online: 132, gradient: "linear-gradient(135deg,#b93dff,#ff3d7a)" },
  ...CITY_ROOMS,
  ...STATE_ROOMS,
];

/**
 * Fuzzy room search — matches name, tagline, city, state abbreviation,
 * state nicknames and close misspellings ("tenn", "cali", "new yrok").
 */
export function searchRooms<T extends { name?: string; tagline?: string; description?: string; city?: string | null; state?: string | null; category?: string }>(
  query: string,
  rooms: T[],
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rooms;
  const tokens = q.split(/\s+/).filter(Boolean);
  const fuzzy = matchState(q);

  return rooms.filter((r) => {
    const st = stateByAbbr(r.state ?? undefined);
    const haystack = [
      r.name ?? "",
      r.tagline ?? "",
      r.description ?? "",
      r.city ?? "",
      r.state ?? "",
      r.category ?? "",
      ...(st ? stateSearchTerms(st) : []),
    ]
      .join(" ")
      .toLowerCase();
    if (tokens.every((t) => haystack.includes(t))) return true;
    return !!fuzzy && (st?.abbr === fuzzy.abbr || (r.city ?? "").toLowerCase() === fuzzy.city.toLowerCase());
  });
}

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
