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
    id: "demo-jen",
    name: "Jen",
    handle: "@jenrizz",
    age: 26,
    city: "Chicago, IL",
    tagline: "First Rizzla host. Come say hi 💌",
    bio: "Founding host on Rizzla. I'm here to actually reply — tell me about your week and I'll roast your dating life (gently).",
    interests: ["Coffee", "Concerts", "Dogs", "Deep Talks", "Podcasts"],
    tier: "rising",
    priceMonthly: 12.99,
    subscribers: 8,
    online: true,
    gradient: "linear-gradient(135deg,#7C5CFF 0%,#FF3D7F 55%,#FF9770 100%)",
    accent: "#7C5CFF",
    photoCount: 9,
    hasVideo: false,
    teaser: "Pinned online — send me a message and let's test the chat 💬",
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
  ...buildExtraHosts(),
];

function buildExtraHosts(): DemoHost[] {
  const seeds: Array<Partial<DemoHost> & { name: string; city: string; tagline: string; interests: string[]; gradient: string; accent: string }> = [
    { name: "Sasha", city: "Denver, CO", tagline: "Ski bum with a poetry habit.", interests: ["Skiing", "Poetry", "Whiskey", "Dogs"], gradient: "linear-gradient(135deg,#4FACFE 0%,#00F2FE 100%)", accent: "#4FACFE" },
    { name: "Elena", city: "Phoenix, AZ", tagline: "Desert energy. Ask about tarot.", interests: ["Tarot", "Hiking", "Cacti", "Vinyl"], gradient: "linear-gradient(135deg,#FBAB7E 0%,#F7CE68 100%)", accent: "#FBAB7E" },
    { name: "Priya", city: "San Francisco, CA", tagline: "Startup girl who codes AND reads.", interests: ["Tech", "Books", "Ramen", "Yoga"], gradient: "linear-gradient(135deg,#A18CD1 0%,#FBC2EB 100%)", accent: "#A18CD1" },
    { name: "Camila", city: "Miami, FL", tagline: "Salsa nights, sunrise beach runs.", interests: ["Salsa", "Beach", "Spanish", "Rum"], gradient: "linear-gradient(135deg,#FF9A9E 0%,#FAD0C4 100%)", accent: "#FF9A9E" },
    { name: "Zoe", city: "Portland, OR", tagline: "Bookstore owner. Big feelings.", interests: ["Books", "Rain", "Coffee", "Cats"], gradient: "linear-gradient(135deg,#667EEA 0%,#764BA2 100%)", accent: "#667EEA" },
    { name: "Harper", city: "Atlanta, GA", tagline: "Southern with a spicy DM game.", interests: ["Cooking", "R&B", "Wine", "Podcasts"], gradient: "linear-gradient(135deg,#F093FB 0%,#F5576C 100%)", accent: "#F5576C" },
    { name: "Isla", city: "San Diego, CA", tagline: "Surf instructor + certified over-thinker.", interests: ["Surfing", "Meditation", "Sushi", "Sunsets"], gradient: "linear-gradient(135deg,#43E97B 0%,#38F9D7 100%)", accent: "#43E97B" },
    { name: "Wren", city: "Brooklyn, NY", tagline: "Photographer. Chronically online.", interests: ["Film", "Vintage", "Coffee", "Memes"], gradient: "linear-gradient(135deg,#30CFD0 0%,#330867 100%)", accent: "#30CFD0" },
    { name: "Maya", city: "Chicago, IL", tagline: "Med student. Roasts you for free.", interests: ["Medicine", "Board games", "Boba", "Anime"], gradient: "linear-gradient(135deg,#FA709A 0%,#FEE140 100%)", accent: "#FA709A" },
    { name: "Ivy", city: "Boston, MA", tagline: "Lawyer by day, cocktail nerd by night.", interests: ["Law", "Mixology", "Sailing", "Jazz"], gradient: "linear-gradient(135deg,#5EE7DF 0%,#B490CA 100%)", accent: "#B490CA" },
    { name: "Rae", city: "Las Vegas, NV", tagline: "Dancer. Pretends she doesn't gamble.", interests: ["Dance", "Poker", "Neon", "Pop"], gradient: "linear-gradient(135deg,#F6D365 0%,#FDA085 100%)", accent: "#FDA085" },
    { name: "Skye", city: "Salt Lake City, UT", tagline: "Trail runner with dad-joke energy.", interests: ["Trails", "Camping", "Craft beer", "Golden retrievers"], gradient: "linear-gradient(135deg,#89F7FE 0%,#66A6FF 100%)", accent: "#66A6FF" },
    { name: "Bea", city: "New Orleans, LA", tagline: "Jazz baby. Hot sauce on everything.", interests: ["Jazz", "Creole food", "Ghost tours", "Voodoo doughnuts"], gradient: "linear-gradient(135deg,#FDCB82 0%,#EF476F 100%)", accent: "#EF476F" },
    { name: "Tess", city: "Minneapolis, MN", tagline: "Ex-figure-skater, current sarcasm champion.", interests: ["Skating", "Podcasts", "Hot dish", "Ice fishing"], gradient: "linear-gradient(135deg,#A1FFCE 0%,#FAFFD1 100%)", accent: "#A1FFCE" },
    { name: "Val", city: "Houston, TX", tagline: "Astronaut wannabe. Rocket-fuel espresso.", interests: ["Astronomy", "Sci-fi", "BBQ", "Rockets"], gradient: "linear-gradient(135deg,#141E30 0%,#243B55 100%)", accent: "#4FC3F7" },
    { name: "Kai", city: "Honolulu, HI", tagline: "Beach lifeguard. Aloha, chaos.", interests: ["Surfing", "Poke", "Ukulele", "Hikes"], gradient: "linear-gradient(135deg,#00C6FB 0%,#005BEA 100%)", accent: "#00C6FB" },
    { name: "Nora", city: "Philadelphia, PA", tagline: "Baker, hoops fan, ruthless in Uno.", interests: ["Baking", "Basketball", "True crime", "IPAs"], gradient: "linear-gradient(135deg,#FF758C 0%,#FF7EB3 100%)", accent: "#FF758C" },
    { name: "Amara", city: "Washington, DC", tagline: "Policy nerd. Weekends: brunch mafia.", interests: ["Politics", "Brunch", "Museums", "Wine"], gradient: "linear-gradient(135deg,#7F7FD5 0%,#91EAE4 100%)", accent: "#7F7FD5" },
    { name: "Luna", city: "Santa Fe, NM", tagline: "Painter of skies. Believer in signs.", interests: ["Art", "Astrology", "Turquoise", "Green chile"], gradient: "linear-gradient(135deg,#C471F5 0%,#FA71CD 100%)", accent: "#C471F5" },
    { name: "Quinn", city: "Toronto, ON", tagline: "Comedy writer. Will make you snort-laugh.", interests: ["Comedy", "Hockey", "Poutine", "Improv"], gradient: "linear-gradient(135deg,#FF5F6D 0%,#FFC371 100%)", accent: "#FF5F6D" },
  ];
  const tiers: DemoHost["tier"][] = ["new", "rising", "popular", "elite"];
  return seeds.map((s, i) => {
    const tier = tiers[i % tiers.length];
    const price = tier === "new" ? 4.99 : tier === "rising" ? 14.99 : tier === "popular" ? 29.99 : 59.99;
    return {
      id: `demo-${s.name!.toLowerCase()}`,
      handle: `@${s.name!.toLowerCase()}rizz`,
      age: 22 + (i % 10),
      bio: `${s.tagline} Come hang — I actually reply.`,
      tier,
      priceMonthly: price,
      subscribers: 20 + i * 13,
      online: i % 3 !== 0,
      photoCount: 6 + (i % 10),
      hasVideo: i % 2 === 0,
      teaser: s.tagline,
      ...s,
    } as DemoHost;
  });
}


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
