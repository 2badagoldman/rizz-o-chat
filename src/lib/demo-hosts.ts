import { US_STATES } from "./us-states";

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
  /** If true, anyone (even signed-out visitors) can chat with an AI persona of this creator for free. */
  aiEnabled?: boolean;
};

/**
 * The 10 curated demo hosts whose personas are AI-powered and open for free
 * chat before signup. Keep this list in sync with the `aiEnabled` flags below.
 */
export const AI_HOST_IDS = [
  "demo-aria",
  "demo-jen",
  "demo-lena",
  "demo-nova",
  "demo-jade",
  "demo-remy",
  "demo-mika",
  "demo-harper",
  "demo-cleo",
  "demo-yuna",
  "demo-rubi",
] as const;

export function isAiHost(hostId: string | undefined): boolean {
  return !!hostId && (AI_HOST_IDS as readonly string[]).includes(hostId);
}

/**
 * Up to 5 creators whose Friends List is free to join — members see "Free"
 * and can chat right away without a Friends List purchase.
 */
export const FREE_HOST_IDS = [
  "demo-jen",
  "demo-rubi",
  "demo-nova",
  "demo-harper",
  "demo-cleo",
] as const;

export function isFreeHost(hostId: string | undefined): boolean {
  return !!hostId && (FREE_HOST_IDS as readonly string[]).includes(hostId);
}



const CORE_HOSTS: DemoHost[] = [
  {
    id: "demo-aria",
    name: "Wonder Woman",
    handle: "@wonderwoman",
    age: 24,
    city: "Miami, FL",
    tagline: "Golden-hour girl. Bring your energy.",
    bio: "Café owner and weekend hiker. I love long convos, indie films, and people who can actually text back. Come say hi.",
    interests: ["Coffee", "Beach", "Indie Film", "Yoga", "Reading"],
    tier: "popular",
    priceMonthly: 24.99,
    subscribers: 842,
    online: true,
    gradient: "linear-gradient(135deg,#FF6B9D 0%,#FF3D7F 40%,#7C5CFF 100%)",
    accent: "#FF3D7F",
    photoCount: 12,
    hasVideo: true,
    teaser: "Just made my morning matcha ☕ tell me your Monday plan",
    aiEnabled: true,

  },
  {
    id: "demo-jen",
    name: "Jen",
    handle: "@jenrizz",
    age: 23,
    city: "Chicago, IL",
    tagline: "First Crush host. Come say hi 💌",
    bio: "Founding creator on Crush. I'm here to actually reply — tell me about your week and I'll cheer you on.",
    interests: ["Coffee", "Concerts", "Dogs", "Deep Talks", "Podcasts"],
    tier: "rising",
    priceMonthly: 12.99,
    subscribers: 418,
    online: true,
    gradient: "linear-gradient(135deg,#7C5CFF 0%,#FF3D7F 55%,#FF9770 100%)",
    accent: "#7C5CFF",
    photoCount: 9,
    hasVideo: false,
    teaser: "Pinned online — say hi, I answer fast 💬",
    aiEnabled: true,

  },
  {

    id: "demo-lena",
    name: "Lena",
    handle: "@lena.lux",
    age: 24,
    city: "Los Angeles, CA",
    tagline: "Model. Bookworm. Big opinions.",
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
    aiEnabled: true,

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
    subscribers: 612,
    online: true,
    gradient: "linear-gradient(135deg,#5EE9FF 0%,#7C5CFF 55%,#FF3D7F 100%)",
    accent: "#7C5CFF",
    photoCount: 8,
    hasVideo: false,
    teaser: "Running ranked in 30. Come chat while I queue 🎮",
    aiEnabled: true,

  },
  {
    id: "demo-jade",
    name: "Jade",
    handle: "@jadewilder",
    age: 22,
    city: "New York, NY",
    tagline: "Corporate by day. Chatty by night.",
    bio: "Finance job I can't tell you about. Weekends are for coffee, hikes, and long voice notes about nothing.",
    interests: ["Whiskey", "Hiking", "Finance", "Cooking"],
    tier: "popular",
    priceMonthly: 19.99,
    subscribers: 934,
    online: false,
    gradient: "linear-gradient(135deg,#0B7A6D 0%,#1D4ED8 60%,#0B0B12 100%)",
    accent: "#1D4ED8",
    photoCount: 15,
    hasVideo: true,
    teaser: "Just poured a Nikka. What are we debating tonight?",
    aiEnabled: true,

  },
  {
    id: "demo-remy",
    name: "Remy",
    handle: "@remyriot",
    age: 20,
    city: "Nashville, TN",
    tagline: "Singer-songwriter with commitment issues (to genres).",
    bio: "Writing my second album. I'll send you unreleased demos if you're nice. I'm never nice back tho.",
    interests: ["Music", "Songwriting", "Vinyl", "Whiskey", "Tour life"],
    tier: "rising",
    priceMonthly: 14.99,
    subscribers: 527,
    online: true,
    gradient: "linear-gradient(135deg,#FF9770 0%,#FF3D7F 55%,#8338EC 100%)",
    accent: "#FF9770",
    photoCount: 10,
    hasVideo: true,
    teaser: "Just tracked a new bridge. Should I send it? 🎸",
    aiEnabled: true,

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
    subscribers: 389,
    online: true,
    gradient: "linear-gradient(135deg,#B8A9FF 0%,#FF9AC1 100%)",
    accent: "#B8A9FF",
    photoCount: 6,
    hasVideo: false,
    teaser: "Painting something weird tonight. Wanna see?",
    aiEnabled: true,

  },
  {
    id: "demo-rubi",
    name: "Rubi",
    handle: "@rubi",
    age: 25,
    city: "Austin, TX",
    tagline: "Weekly regulars only · Austin",
    bio: "Austin girl who actually answers. Work, families, bad dates, music — mostly real life. Start wherever you want.",
    interests: ["Live Music", "Tacos", "Road Trips", "Real Talk"],
    tier: "popular",
    priceMonthly: 19.99,
    subscribers: 604,
    online: true,
    gradient: "linear-gradient(135deg,#FF3D7F 0%,#E2483C 50%,#F0C674 100%)",
    accent: "#E2483C",
    photoCount: 11,
    hasVideo: true,
    teaser: "Most people just want someone who answers. Say hi 🙂",
    aiEnabled: true,
  },
  ...buildExtraHosts(),
];

/** Every creator, including the auto-generated one-per-state coverage set. */
export const DEMO_HOSTS: DemoHost[] = [...CORE_HOSTS, ...buildStateHosts(CORE_HOSTS)];

function buildExtraHosts(): DemoHost[] {
  const seeds: Array<Partial<DemoHost> & { name: string; city: string; tagline: string; interests: string[]; gradient: string; accent: string }> = [
    { name: "Sasha", city: "Denver, CO", tagline: "Ski bum with a poetry habit.", interests: ["Skiing", "Poetry", "Whiskey", "Dogs"], gradient: "linear-gradient(135deg,#4FACFE 0%,#00F2FE 100%)", accent: "#4FACFE" },
    { name: "Elena", city: "Phoenix, AZ", tagline: "Desert energy. Ask about tarot.", interests: ["Tarot", "Hiking", "Cacti", "Vinyl"], gradient: "linear-gradient(135deg,#FBAB7E 0%,#F7CE68 100%)", accent: "#FBAB7E" },
    { name: "Priya", city: "San Francisco, CA", tagline: "Startup girl who codes AND reads.", interests: ["Tech", "Books", "Ramen", "Yoga"], gradient: "linear-gradient(135deg,#A18CD1 0%,#FBC2EB 100%)", accent: "#A18CD1" },
    { name: "Camila", city: "Miami, FL", tagline: "Salsa nights, sunrise beach runs.", interests: ["Salsa", "Beach", "Spanish", "Rum"], gradient: "linear-gradient(135deg,#FF9A9E 0%,#FAD0C4 100%)", accent: "#FF9A9E" },
    { name: "Zoe", city: "Portland, OR", tagline: "Bookstore owner. Big feelings.", interests: ["Books", "Rain", "Coffee", "Cats"], gradient: "linear-gradient(135deg,#667EEA 0%,#764BA2 100%)", accent: "#667EEA" },
    { name: "Harper", city: "Atlanta, GA", tagline: "Southern charm and endless recipes.", interests: ["Cooking", "R&B", "Wine", "Podcasts"], gradient: "linear-gradient(135deg,#F093FB 0%,#F5576C 100%)", accent: "#F5576C" },
    { name: "Isla", city: "San Diego, CA", tagline: "Surf instructor + certified over-thinker.", interests: ["Surfing", "Meditation", "Sushi", "Sunsets"], gradient: "linear-gradient(135deg,#43E97B 0%,#38F9D7 100%)", accent: "#43E97B" },
    { name: "Wren", city: "Brooklyn, NY", tagline: "Photographer. Chronically online.", interests: ["Film", "Vintage", "Coffee", "Memes"], gradient: "linear-gradient(135deg,#30CFD0 0%,#330867 100%)", accent: "#30CFD0" },
    { name: "Maya", city: "Chicago, IL", tagline: "Med student. Terrible at board games.", interests: ["Medicine", "Board games", "Boba", "Anime"], gradient: "linear-gradient(135deg,#FA709A 0%,#FEE140 100%)", accent: "#FA709A" },
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
    { name: "Sienna", city: "Charleston, SC", tagline: "Southern charm and a great playlist.", interests: ["R&B", "Sweet tea", "Boats", "Vintage"], gradient: "linear-gradient(135deg,#F6D5F7 0%,#FBE9D7 100%)", accent: "#F6A5C0" },
    { name: "Willow", city: "Boulder, CO", tagline: "Climber, cook, chronic day-dreamer.", interests: ["Climbing", "Cooking", "Kombucha", "Journaling"], gradient: "linear-gradient(135deg,#84FAB0 0%,#8FD3F4 100%)", accent: "#84FAB0" },
    { name: "Cleo", city: "Austin, TX", tagline: "Tattoo artist. Yes, I'll draw you.", interests: ["Tattoos", "Cats", "Techno", "Vintage"], gradient: "linear-gradient(135deg,#FF3CAC 0%,#784BA0 50%,#2B86C5 100%)", accent: "#FF3CAC" },
    { name: "Josie", city: "Kansas City, MO", tagline: "BBQ princess with a nursing degree.", interests: ["BBQ", "Nursing", "Country", "Line dancing"], gradient: "linear-gradient(135deg,#FFDEE9 0%,#B5FFFC 100%)", accent: "#FFDEE9" },
    { name: "Reese", city: "Raleigh, NC", tagline: "Engineer by day, karaoke queen by night.", interests: ["Engineering", "Karaoke", "Coffee", "Hiking"], gradient: "linear-gradient(135deg,#FBC2EB 0%,#A6C1EE 100%)", accent: "#A6C1EE" },
    { name: "Nina", city: "Detroit, MI", tagline: "DJ. Vinyl only. Fight me.", interests: ["House", "Vinyl", "Sneakers", "Live sets"], gradient: "linear-gradient(135deg,#0F2027 0%,#2C5364 100%)", accent: "#00E5FF" },
    { name: "Mira", city: "Providence, RI", tagline: "Chef in training. I feed people I like.", interests: ["Cooking", "Wine", "Farmers markets", "Pasta"], gradient: "linear-gradient(135deg,#FFAFBD 0%,#FFC3A0 100%)", accent: "#FFAFBD" },
    { name: "Talia", city: "Sacramento, CA", tagline: "Yoga teacher with a dark sense of humor.", interests: ["Yoga", "Wine", "Hiking", "Memes"], gradient: "linear-gradient(135deg,#D4FC79 0%,#96E6A1 100%)", accent: "#96E6A1" },
    { name: "Selena", city: "Tampa, FL", tagline: "Real estate hustler + reality-TV addict.", interests: ["Real estate", "Boats", "Reality TV", "Rosé"], gradient: "linear-gradient(135deg,#FF9A8B 0%,#FF6A88 50%,#FF99AC 100%)", accent: "#FF6A88" },
    { name: "Kira", city: "Pittsburgh, PA", tagline: "Physicist. Also a beer nerd.", interests: ["Physics", "Craft beer", "Football", "Chess"], gradient: "linear-gradient(135deg,#B993D6 0%,#8CA6DB 100%)", accent: "#8CA6DB" },
    { name: "Ophelia", city: "Savannah, GA", tagline: "Antique shop girl. Ghost story enthusiast.", interests: ["Antiques", "Ghosts", "Tea", "Poetry"], gradient: "linear-gradient(135deg,#E0C3FC 0%,#8EC5FC 100%)", accent: "#E0C3FC" },
    { name: "Poppy", city: "Columbus, OH", tagline: "Florist with a great text streak.", interests: ["Flowers", "Coffee", "Painting", "Rom-coms"], gradient: "linear-gradient(135deg,#FDDB92 0%,#D1FDFF 100%)", accent: "#FDDB92" },
    { name: "Sunny", city: "Orlando, FL", tagline: "Theme park cast member with main-character energy.", interests: ["Disney", "Musicals", "Baking", "Puppies"], gradient: "linear-gradient(135deg,#FFECD2 0%,#FCB69F 100%)", accent: "#FCB69F" },
    { name: "Chloe", city: "Milwaukee, WI", tagline: "Cheese, beer, and honest opinions.", interests: ["Cheese", "Beer", "Books", "Concerts"], gradient: "linear-gradient(135deg,#FFB199 0%,#FF0844 100%)", accent: "#FF0844" },
    { name: "Aya", city: "San Jose, CA", tagline: "Software eng that actually goes outside.", interests: ["Tech", "Rock climbing", "Ramen", "Board games"], gradient: "linear-gradient(135deg,#C2E9FB 0%,#A1C4FD 100%)", accent: "#A1C4FD" },
    { name: "Delilah", city: "Memphis, TN", tagline: "Gospel-choir kid gone soul singer.", interests: ["Soul", "BBQ", "Vinyl", "Church"], gradient: "linear-gradient(135deg,#F7971E 0%,#FFD200 100%)", accent: "#F7971E" },
    { name: "Freya", city: "Anchorage, AK", tagline: "Bush pilot with a soft spot for cinnamon rolls.", interests: ["Flying", "Baking", "Hiking", "Northern lights"], gradient: "linear-gradient(135deg,#96DEDA 0%,#50C9C3 100%)", accent: "#50C9C3" },
    { name: "Blair", city: "Dallas, TX", tagline: "PR girl who talks fast and tips well.", interests: ["PR", "Wine", "SoulCycle", "Country clubs"], gradient: "linear-gradient(135deg,#FBC7D4 0%,#9796F0 100%)", accent: "#9796F0" },
    { name: "Alia", city: "Newark, NJ", tagline: "Nurse. Runs on cold brew and drama.", interests: ["Nursing", "Coffee", "Reality TV", "Trap music"], gradient: "linear-gradient(135deg,#FF6E7F 0%,#BFE9FF 100%)", accent: "#FF6E7F" },
    { name: "Juno", city: "Richmond, VA", tagline: "Museum curator. Owns 4 record players.", interests: ["Art", "Vinyl", "Wine", "Museums"], gradient: "linear-gradient(135deg,#D9AFD9 0%,#97D9E1 100%)", accent: "#D9AFD9" },
    { name: "Marley", city: "Cleveland, OH", tagline: "Sports reporter with a shoe problem.", interests: ["Basketball", "Sneakers", "Podcasts", "Tacos"], gradient: "linear-gradient(135deg,#F5EFEF 0%,#FEB692 100%)", accent: "#FEB692" },
    { name: "Yuna", city: "Los Angeles, CA", tagline: "K-pop dance teacher. Very extra.", interests: ["K-pop", "Dance", "Skincare", "Boba"], gradient: "linear-gradient(135deg,#FDA0FF 0%,#B0BEFB 100%)", accent: "#FDA0FF" },
    { name: "Rosa", city: "El Paso, TX", tagline: "Border-town girl. Homemade salsa on tap.", interests: ["Cooking", "Family", "Mariachi", "Sunsets"], gradient: "linear-gradient(135deg,#FF5858 0%,#F09819 100%)", accent: "#F09819" },
    { name: "Emmy", city: "Louisville, KY", tagline: "Bourbon distiller with a horse obsession.", interests: ["Bourbon", "Horses", "Derby", "Blues"], gradient: "linear-gradient(135deg,#F6D365 0%,#FDA085 100%)", accent: "#F6D365" },
    { name: "Fiona", city: "St. Louis, MO", tagline: "Ballet dropout, jazz devotee.", interests: ["Ballet", "Jazz", "Wine", "Painting"], gradient: "linear-gradient(135deg,#FCCB90 0%,#D57EEB 100%)", accent: "#D57EEB" },
    { name: "Gia", city: "Jersey City, NJ", tagline: "Italian grandma in a 24-year-old body.", interests: ["Pasta", "Espresso", "Vespas", "Opera"], gradient: "linear-gradient(135deg,#FF9A9E 0%,#FECFEF 100%)", accent: "#FECFEF" },
    { name: "Halle", city: "Baltimore, MD", tagline: "Marine biologist. Loves ugly fish.", interests: ["Ocean", "Diving", "Fish", "Documentaries"], gradient: "linear-gradient(135deg,#4FACFE 0%,#00F2FE 100%)", accent: "#4FACFE" },
    { name: "Indira", city: "Fresno, CA", tagline: "Farmer's daughter with an MBA.", interests: ["Wine", "Business", "Farms", "Dogs"], gradient: "linear-gradient(135deg,#F5F7FA 0%,#C3CFE2 100%)", accent: "#C3CFE2" },
    { name: "Nadia", city: "Buffalo, NY", tagline: "Snowboarder, chicken-wing critic.", interests: ["Snowboarding", "Wings", "Hockey", "Trap"], gradient: "linear-gradient(135deg,#00DBDE 0%,#FC00FF 100%)", accent: "#FC00FF" },
    { name: "Piper", city: "Omaha, NE", tagline: "Vet tech. Will show you 200 dog pics.", interests: ["Dogs", "Farms", "Country", "Baking"], gradient: "linear-gradient(135deg,#FDCBF1 0%,#E6DEE9 100%)", accent: "#FDCBF1" },
    { name: "Rhea", city: "Tucson, AZ", tagline: "Astronomer. Star charts as small talk.", interests: ["Astronomy", "Camping", "Chai", "Sci-fi"], gradient: "linear-gradient(135deg,#5B247A 0%,#1BCEDF 100%)", accent: "#1BCEDF" },
    { name: "Stella", city: "Birmingham, AL", tagline: "Ex-cheer captain, current interior designer.", interests: ["Design", "SEC football", "Rosé", "HGTV"], gradient: "linear-gradient(135deg,#FCE38A 0%,#F38181 100%)", accent: "#F38181" },
    { name: "Tori", city: "Reno, NV", tagline: "Poker dealer with poet-brain.", interests: ["Poker", "Poetry", "Whiskey", "Desert drives"], gradient: "linear-gradient(135deg,#C33764 0%,#1D2671 100%)", accent: "#C33764" },
    { name: "Uma", city: "Albuquerque, NM", tagline: "Balloon-festival kid. Loves a big sky.", interests: ["Hot air balloons", "Green chile", "Art", "Hikes"], gradient: "linear-gradient(135deg,#F953C6 0%,#B91D73 100%)", accent: "#F953C6" },
    { name: "Vera", city: "Madison, WI", tagline: "Grad student. Cheese-curd expert.", interests: ["Academia", "Cheese", "Beer", "Snow"], gradient: "linear-gradient(135deg,#B24592 0%,#F15F79 100%)", accent: "#F15F79" },
    { name: "Winter", city: "Anchorage, AK", tagline: "Husky-mom, aurora chaser.", interests: ["Dogs", "Snow", "Aurora", "Coffee"], gradient: "linear-gradient(135deg,#83A4D4 0%,#B6FBFF 100%)", accent: "#83A4D4" },
    { name: "Xena", city: "Chattanooga, TN", tagline: "Rock-climbing coach. Zero chill.", interests: ["Climbing", "Whiskey", "Metal", "Camping"], gradient: "linear-gradient(135deg,#232526 0%,#414345 100%)", accent: "#FF6A00" },
    { name: "Yara", city: "Ann Arbor, MI", tagline: "Architect. Sketches you in her notebook.", interests: ["Architecture", "Sketching", "Coffee", "Bikes"], gradient: "linear-gradient(135deg,#EECDA3 0%,#EF629F 100%)", accent: "#EF629F" },
    { name: "Zara", city: "Scottsdale, AZ", tagline: "Golf pro who parties harder than you.", interests: ["Golf", "Rosé", "Pilates", "Vegas"], gradient: "linear-gradient(135deg,#FFAFBD 0%,#FFC3A0 100%)", accent: "#FFAFBD" },
    { name: "Ada", city: "Oakland, CA", tagline: "Product designer. Owns 40 plants.", interests: ["Design", "Plants", "Matcha", "Records"], gradient: "linear-gradient(135deg,#A8EDEA 0%,#FED6E3 100%)", accent: "#A8EDEA" },
  ];
  const tiers: DemoHost["tier"][] = ["new", "rising", "popular", "elite"];
  return seeds.map((s, i) => {
    const tier = tiers[i % tiers.length];
    const price = tier === "new" ? 4.99 : tier === "rising" ? 14.99 : tier === "popular" ? 29.99 : 59.99;
    const id = `demo-${s.name!.toLowerCase()}`;
    return {
      id,
      handle: `@${s.name!.toLowerCase()}rizz`,
      // 65% of hosts are 18-24, the rest spread 25-42
      age: (i % 20) < 13 ? 18 + (i % 7) : 25 + (i % 18),
      bio: `${s.tagline} Come hang — I actually reply.`,
      tier,
      priceMonthly: price,
      subscribers: (AI_HOST_IDS as readonly string[]).includes(id)
        ? 320 + ((i * 37) % 900)
        : 20 + i * 13,
      online: i % 3 !== 0,
      photoCount: 6 + (i % 10),
      hasVideo: i % 2 === 0,
      teaser: s.tagline,
      aiEnabled: (AI_HOST_IDS as readonly string[]).includes(id),
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

/**
 * Guarantees that every US state (plus DC) has demo creators, so searching
 * "Montana", "MT" or "Billings" in Discover always returns someone.
 * Two creators per state, deterministic so ids/photos stay stable.
 */
function buildStateHosts(existing: DemoHost[]): DemoHost[] {
  const taken = new Set(existing.map((h) => h.name.toLowerCase()));
  const firstNames = [
    "Amelia", "Brielle", "Cora", "Daniela", "Eliza", "Faith", "Gemma", "Hazel", "Imani", "Jolene",
    "Kendra", "Lacey", "Margot", "Noelle", "Odette", "Paloma", "Rosalie", "Sloane", "Thea", "Verity",
    "Wanda", "Ximena", "Yvette", "Zuri", "Adeline", "Bianca", "Colette", "Delia", "Esme", "Frankie",
    "Georgia", "Hattie", "Isadora", "Juniper", "Kaia", "Liana", "Maren", "Nadine", "Opal", "Priya",
    "Rowan", "Saoirse", "Tatum", "Ursula", "Violet", "Wilder", "Xiomara", "Yasmin", "Zelda", "Anya",
    "Blythe", "Carys", "Dahlia", "Elodie", "Fern", "Greta", "Halima", "Ines", "Jovie", "Keira",
    "Lark", "Mabel", "Nia", "Oona", "Pearl", "Quincy", "Rhiannon", "Sable", "Tamsin", "Ulla",
    "Vada", "Wren", "Xena", "Yara", "Zora", "Annika", "Brynn", "Cassia", "Dove", "Emberly",
    "Flora", "Giselle", "Honor", "Iris", "Jules", "Kalani", "Leona", "Mira", "Nova", "Olive",
    "Phoebe", "Romy", "Sylvie", "Tessa", "Una", "Vivi", "Winnie", "Xiu", "Yolanda", "Zadie",
    "Alba", "Bexley", "Coraline", "Danika",
  ];
  const gradients = [
    ["linear-gradient(135deg,#FF6B9D 0%,#FF3D7F 100%)", "#FF3D7F"],
    ["linear-gradient(135deg,#F6D365 0%,#FDA085 100%)", "#FDA085"],
    ["linear-gradient(135deg,#A18CD1 0%,#FBC2EB 100%)", "#A18CD1"],
    ["linear-gradient(135deg,#43E97B 0%,#38F9D7 100%)", "#43E97B"],
    ["linear-gradient(135deg,#4FACFE 0%,#00F2FE 100%)", "#4FACFE"],
    ["linear-gradient(135deg,#FA709A 0%,#FEE140 100%)", "#FA709A"],
    ["linear-gradient(135deg,#667EEA 0%,#764BA2 100%)", "#667EEA"],
    ["linear-gradient(135deg,#FF9A9E 0%,#FAD0C4 100%)", "#FF9A9E"],
  ];
  const vibes = [
    { tagline: "Local girl who always texts back.", interests: ["Coffee", "Road trips", "Music", "Dogs"] },
    { tagline: "Weekend explorer, weeknight over-thinker.", interests: ["Hiking", "Cooking", "Reading", "Movies"] },
    { tagline: "Small-town heart, big playlist.", interests: ["Country", "Bonfires", "Baking", "Trucks"] },
    { tagline: "Gym in the morning, deep talks at night.", interests: ["Fitness", "Smoothies", "Podcasts", "Sunsets"] },
    { tagline: "Art school brain, diner-food soul.", interests: ["Art", "Vintage", "Diners", "Vinyl"] },
    { tagline: "Nurse by day, meme historian by night.", interests: ["Nursing", "Memes", "Coffee", "Cats"] },
  ];
  const tiers: DemoHost["tier"][] = ["new", "rising", "popular", "elite"];

  const out: DemoHost[] = [];
  let n = 0;
  US_STATES.forEach((st, si) => {
    for (let k = 0; k < 2; k++) {
      let name = firstNames[n % firstNames.length];
      if (taken.has(name.toLowerCase())) name = `${name} ${st.abbr}`;
      taken.add(name.toLowerCase());
      const vibe = vibes[(si + k) % vibes.length];
      const [gradient, accent] = gradients[(si + k) % gradients.length];
      const tier = tiers[(si + k) % tiers.length];
      const price = tier === "new" ? 4.99 : tier === "rising" ? 14.99 : tier === "popular" ? 29.99 : 59.99;
      out.push({
        id: `demo-${st.abbr.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
        handle: `@${name.toLowerCase().replace(/\s+/g, "")}${st.abbr.toLowerCase()}`,
        age: 21 + ((si * 3 + k * 5) % 21),
        city: `${st.city}, ${st.abbr}`,
        tagline: vibe.tagline,
        bio: `${st.city}, ${st.name}. ${vibe.tagline} Come hang — I actually reply.`,
        interests: [...vibe.interests, st.name],
        tier,
        priceMonthly: price,
        subscribers: 15 + ((si * 29 + k * 61) % 780),
        online: (si + k) % 3 !== 0,
        gradient,
        accent,
        photoCount: 6 + ((si + k) % 10),
        hasVideo: (si + k) % 2 === 0,
        teaser: `${st.city} girl — tell me what your day looked like.`,
      });
      n++;
    }
  });
  return out;
}
