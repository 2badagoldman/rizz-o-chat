export type DemoRoom = {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  category: "Hot" | "Romance" | "Flirt" | "Late Night" | "Chill" | "Fitness" | "Coffee" | "Party" | "Local";
  members: number;
  online: number;
  gradient: string;
  hot?: boolean;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
};

export const ROOM_CATEGORIES = ["All", "Near Me", "Hot", "Romance", "Flirt", "Late Night", "Party", "Local"] as const;

// Major US metros — for the "Rooms Near Me" grid
export const CITY_ROOMS: DemoRoom[] = [
  { slug: "dallas",      name: "Dallas Nights",       emoji: "🤠", tagline: "Big-D flirts and Deep Ellum crew",    category: "Local", members: 1892, online: 421, gradient: "linear-gradient(135deg,#ff6b35,#e84393)", city: "Dallas",       state: "TX", lat: 32.7767, lng: -96.7970, hot: true },
  { slug: "houston",     name: "H-Town Lounge",       emoji: "🚀", tagline: "Space City vibes, midtown mingle",    category: "Local", members: 1655, online: 388, gradient: "linear-gradient(135deg,#f7931e,#e84393)", city: "Houston",      state: "TX", lat: 29.7604, lng: -95.3698, hot: true },
  { slug: "austin",      name: "Austin After-Hours",  emoji: "🎸", tagline: "6th Street energy, keep it weird",    category: "Local", members: 1120, online: 244, gradient: "linear-gradient(135deg,#ff6b35,#6c5ce7)", city: "Austin",       state: "TX", lat: 30.2672, lng: -97.7431 },
  { slug: "atlanta",     name: "Atlanta ATL Room",    emoji: "🍑", tagline: "Peach State, hot takes",              category: "Local", members: 2044, online: 512, gradient: "linear-gradient(135deg,#e84393,#6c5ce7)", city: "Atlanta",      state: "GA", lat: 33.7490, lng: -84.3880, hot: true },
  { slug: "miami",       name: "Miami Nights",        emoji: "🌴", tagline: "South Beach after dark",              category: "Local", members: 2201, online: 604, gradient: "linear-gradient(135deg,#ff6b35,#f7931e)", city: "Miami",        state: "FL", lat: 25.7617, lng: -80.1918, hot: true },
  { slug: "nyc",         name: "NYC Late Night",      emoji: "🗽", tagline: "5-boro flirt, always on",             category: "Local", members: 3488, online: 902, gradient: "linear-gradient(135deg,#6c5ce7,#e84393)", city: "New York",     state: "NY", lat: 40.7128, lng: -74.0060, hot: true },
  { slug: "la",          name: "LA Sunset Room",      emoji: "🌇", tagline: "Sunset Blvd. moods",                  category: "Local", members: 2870, online: 720, gradient: "linear-gradient(135deg,#f7931e,#e84393)", city: "Los Angeles",  state: "CA", lat: 34.0522, lng: -118.2437, hot: true },
  { slug: "sf",          name: "SF Bay Circle",       emoji: "🌉", tagline: "Bay Area chill",                      category: "Local", members: 940,  online: 210, gradient: "linear-gradient(135deg,#6c5ce7,#ff6b35)", city: "San Francisco",state: "CA", lat: 37.7749, lng: -122.4194 },
  { slug: "chicago",     name: "Chicago Loop Chat",   emoji: "🌆", tagline: "Windy city warmth",                   category: "Local", members: 1520, online: 342, gradient: "linear-gradient(135deg,#e84393,#f7931e)", city: "Chicago",      state: "IL", lat: 41.8781, lng: -87.6298 },
  { slug: "vegas",       name: "Vegas After Dark",    emoji: "🎰", tagline: "Strip lights, no sleep",              category: "Local", members: 1988, online: 555, gradient: "linear-gradient(135deg,#ff6b35,#6c5ce7)", city: "Las Vegas",    state: "NV", lat: 36.1699, lng: -115.1398, hot: true },
  { slug: "phoenix",     name: "Phoenix Desert Room", emoji: "🌵", tagline: "AZ heat, cool vibes",                 category: "Local", members: 812,  online: 174, gradient: "linear-gradient(135deg,#f7931e,#ff6b35)", city: "Phoenix",      state: "AZ", lat: 33.4484, lng: -112.0740 },
  { slug: "denver",      name: "Denver Mile-High",    emoji: "🏔️", tagline: "Rocky Mountain flirt",                category: "Local", members: 705,  online: 148, gradient: "linear-gradient(135deg,#6c5ce7,#f7931e)", city: "Denver",       state: "CO", lat: 39.7392, lng: -104.9903 },
  { slug: "seattle",     name: "Seattle Rain Chat",   emoji: "☔", tagline: "Rainy day cuddles",                   category: "Local", members: 690,  online: 132, gradient: "linear-gradient(135deg,#6c5ce7,#e84393)", city: "Seattle",      state: "WA", lat: 47.6062, lng: -122.3321 },
  { slug: "dc",          name: "DC Capitol Circle",   emoji: "🏛️", tagline: "Beltway flirt, off the record",       category: "Local", members: 830,  online: 190, gradient: "linear-gradient(135deg,#e84393,#6c5ce7)", city: "Washington",   state: "DC", lat: 38.9072, lng: -77.0369 },
  { slug: "boston",      name: "Boston Common Room",  emoji: "⚓", tagline: "Beantown banter",                     category: "Local", members: 612,  online: 118, gradient: "linear-gradient(135deg,#ff6b35,#e84393)", city: "Boston",       state: "MA", lat: 42.3601, lng: -71.0589 },
  { slug: "philly",      name: "Philly Row Chat",     emoji: "🔔", tagline: "Rowhome romance",                     category: "Local", members: 588,  online: 108, gradient: "linear-gradient(135deg,#f7931e,#6c5ce7)", city: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652 },
  { slug: "sd",          name: "San Diego Sunset",    emoji: "🏄", tagline: "PCH & palm trees",                    category: "Local", members: 744,  online: 162, gradient: "linear-gradient(135deg,#ff6b35,#f7931e)", city: "San Diego",    state: "CA", lat: 32.7157, lng: -117.1611 },
  { slug: "orlando",     name: "Orlando Magic Room",  emoji: "🎢", tagline: "Theme-park kids grown up",            category: "Local", members: 662,  online: 129, gradient: "linear-gradient(135deg,#e84393,#f7931e)", city: "Orlando",      state: "FL", lat: 28.5383, lng: -81.3792 },
  { slug: "nashville",   name: "Nashville Honky Room",emoji: "🎶", tagline: "Music Row flirt",                     category: "Local", members: 774,  online: 156, gradient: "linear-gradient(135deg,#f7931e,#e84393)", city: "Nashville",    state: "TN", lat: 36.1627, lng: -86.7816 },
  { slug: "detroit",     name: "Detroit Motor Room",  emoji: "🚗", tagline: "Motor City moods",                    category: "Local", members: 501,  online: 96,  gradient: "linear-gradient(135deg,#6c5ce7,#ff6b35)", city: "Detroit",      state: "MI", lat: 42.3314, lng: -83.0458 },
];

export const DEMO_ROOMS: DemoRoom[] = [
  { slug: "hot-tonight",    name: "Hot Tonight 🔥",       emoji: "🔥", tagline: "The room everyone's talking about", category: "Hot",        members: 1284, online: 312, gradient: "linear-gradient(135deg,#ff2d75,#ff6b9d)", hot: true },
  { slug: "romance-lounge", name: "Romance Lounge",       emoji: "💗", tagline: "Slow burns and butterflies",        category: "Romance",    members: 942,  online: 187, gradient: "linear-gradient(135deg,#ff5c8a,#c34fff)", hot: true },
  { slug: "flirt-club",     name: "Flirt Club",           emoji: "💋", tagline: "Playful banter, sweet reveals",     category: "Flirt",      members: 811,  online: 156, gradient: "linear-gradient(135deg,#ff3d9a,#7b2cff)" },
  { slug: "late-night",     name: "Late Night Whispers",  emoji: "🌙", tagline: "After midnight only",               category: "Late Night", members: 706,  online: 244, gradient: "linear-gradient(135deg,#5a1fbf,#1f0a54)", hot: true },
  { slug: "party-line",     name: "Party Line",           emoji: "🎉", tagline: "Music, memes, mayhem",              category: "Party",      members: 1103, online: 289, gradient: "linear-gradient(135deg,#ff9a3d,#ff3d9a)" },
  { slug: "date-night",     name: "Date Night",           emoji: "🍷", tagline: "Dressed up. Ready to charm.",       category: "Romance",    members: 615,  online: 132, gradient: "linear-gradient(135deg,#b93dff,#ff3d7a)" },
  ...CITY_ROOMS,
];

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
