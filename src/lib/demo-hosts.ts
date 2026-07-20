// Demo host data for Discover / locked profile UI while the real
// directory fills up. Once real hosts publish Friends Lists, they'll
// appear alongside these seeded showcase profiles.

export type DemoHost = {
  id: string;
  name: string;
  handle: string;
  age: number;
  city: string;
  tagline: string;
  bio: string;
  interests: string[];
  tier: "new" | "rising" | "popular" | "elite";
  priceMonthly: number; // dollars
  subscribers: number;
  online: boolean;
  gradient: string; // css gradient (background for cover)
  accent: string;   // hex for glow
  photoCount: number;
  hasVideo: boolean;
  teaser: string;
};

export const DEMO_HOSTS: DemoHost[] = [
  {
    id: "demo-aria",
    name: "Aria",
    handle: "@ariasunset",
    age: 24,
    city: "Miami, FL",
    tagline: "Golden-hour girl. Bring your energy.",
    bio: "Ex-cheerleader turned café owner. I love late-night convos, indie films, and men who can actually text back. Come vibe.",
    interests: ["Coffee", "Beach", "Indie Film", "Yoga", "Reading"],
    tier: "popular",
    priceMonthly: 24.99,
    subscribers: 142,
    online: true,
    gradient: "linear-gradient(135deg,#FF6B9D 0%,#FF3D7F 40%,#7C5CFF 100%)",
    accent: "#FF3D7F",
    photoCount: 12,
    hasVideo: true,
    teaser: "Just made my morning matcha ☕ tell me your Monday plan",
  },
  {
    id: "demo-lena",
    name: "Lena",
    handle: "@lena.lux",
    age: 27,
    city: "Los Angeles, CA",
    tagline: "Model. Bookworm. Trouble.",
    bio: "In LA between shoots. Big reader, bigger opinions. Looking for members who don't send one-word replies.",
    interests: ["Fashion", "Literature", "Wine", "Travel"],
    tier: "elite",
    priceMonthly: 49.99,
    subscribers: 512,
    online: false,
    gradient: "linear-gradient(135deg,#F0C674 0%,#E86A5C 55%,#7C2D8E 100%)",
    accent: "#E86A5C",
    photoCount: 24,
    hasVideo: true,
    teaser: "Back in LA tonight. Who wants a Q&A voice note?",
  },
  {
    id: "demo-nova",
    name: "Nova",
    handle: "@novastar",
    age: 22,
    city: "Austin, TX",
    tagline: "Gamer girl energy. Actually good at it.",
    bio: "Streamer + astrology brain. Let's talk Valorant, weird theories, and your relationship problems (I'm brutal).",
    interests: ["Gaming", "Astrology", "Anime", "Late-night talks"],
    tier: "rising",
    priceMonthly: 9.99,
    subscribers: 47,
    online: true,
    gradient: "linear-gradient(135deg,#5EE9FF 0%,#7C5CFF 55%,#FF3D7F 100%)",
    accent: "#7C5CFF",
    photoCount: 8,
    hasVideo: false,
    teaser: "Running ranked in 30. Come chat while I queue 🎮",
  },
  {
    id: "demo-jade",
    name: "Jade",
    handle: "@jadewilder",
    age: 29,
    city: "New York, NY",
    tagline: "Corporate by day. Chaos by dm.",
    bio: "Finance job I can't tell you about. Weekends are for whiskey, hikes, and sending you unhinged voice memos.",
    interests: ["Whiskey", "Hiking", "Finance", "Cooking"],
    tier: "popular",
    priceMonthly: 19.99,
    subscribers: 118,
    online: false,
    gradient: "linear-gradient(135deg,#0B7A6D 0%,#1D4ED8 60%,#0B0B12 100%)",
    accent: "#1D4ED8",
    photoCount: 15,
    hasVideo: true,
    teaser: "Just poured a Nikka. What are we debating tonight?",
  },
  {
    id: "demo-remy",
    name: "Remy",
    handle: "@remyriot",
    age: 25,
    city: "Nashville, TN",
    tagline: "Singer-songwriter with commitment issues (to genres).",
    bio: "Writing my second album. I'll send you unreleased demos if you're nice. I'm never nice back tho.",
    interests: ["Music", "Songwriting", "Vinyl", "Whiskey", "Tour life"],
    tier: "rising",
    priceMonthly: 14.99,
    subscribers: 63,
    online: true,
    gradient: "linear-gradient(135deg,#FF9770 0%,#FF3D7F 55%,#8338EC 100%)",
    accent: "#FF9770",
    photoCount: 10,
    hasVideo: true,
    teaser: "Just tracked a new bridge. Should I send it? 🎸",
  },
  {
    id: "demo-mika",
    name: "Mika",
    handle: "@mikamoon",
    age: 21,
    city: "Seattle, WA",
    tagline: "Barista. Painter. Cat person.",
    bio: "New here. Come chat about art, terrible dates, and why oat milk is a personality.",
    interests: ["Art", "Cats", "Rain", "Vintage"],
    tier: "new",
    priceMonthly: 4.99,
    subscribers: 12,
    online: true,
    gradient: "linear-gradient(135deg,#B8A9FF 0%,#FF9AC1 100%)",
    accent: "#B8A9FF",
    photoCount: 6,
    hasVideo: false,
    teaser: "Painting something weird tonight. Wanna see?",
  },
];

export function tierLabel(t: DemoHost["tier"]) {
  return { new: "New", rising: "Rising", popular: "Popular", elite: "Elite" }[t];
}

export function tierBand(t: DemoHost["tier"]) {
  return {
    new: "$0.99 – $4.99/mo",
    rising: "$4.99 – $19.99/mo",
    popular: "$19.99 – $49.99/mo",
    elite: "$49.99 – $99.99/mo",
  }[t];
}
