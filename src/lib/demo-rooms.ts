export type DemoRoom = {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  category: "Hot" | "Romance" | "Flirt" | "Late Night" | "Chill" | "Fitness" | "Coffee" | "Party";
  members: number;
  online: number;
  gradient: string;
  hot?: boolean;
};

export const ROOM_CATEGORIES = ["All", "Hot", "Romance", "Flirt", "Late Night", "Chill", "Party"] as const;

export const DEMO_ROOMS: DemoRoom[] = [
  { slug: "hot-tonight", name: "Hot Tonight 🔥", emoji: "🔥", tagline: "The room everyone's talking about", category: "Hot", members: 1284, online: 312, gradient: "linear-gradient(135deg,#ff2d75,#ff6b9d)", hot: true },
  { slug: "romance-lounge", name: "Romance Lounge", emoji: "💗", tagline: "Slow burns and butterflies", category: "Romance", members: 942, online: 187, gradient: "linear-gradient(135deg,#ff5c8a,#c34fff)", hot: true },
  { slug: "flirt-club", name: "Flirt Club", emoji: "💋", tagline: "Playful banter, sweet reveals", category: "Flirt", members: 811, online: 156, gradient: "linear-gradient(135deg,#ff3d9a,#7b2cff)" },
  { slug: "late-night", name: "Late Night Whispers", emoji: "🌙", tagline: "After midnight only", category: "Late Night", members: 706, online: 244, gradient: "linear-gradient(135deg,#5a1fbf,#1f0a54)", hot: true },
  { slug: "coffee-talk", name: "Coffee Talk", emoji: "☕", tagline: "Cozy mornings, honest chats", category: "Chill", members: 528, online: 96, gradient: "linear-gradient(135deg,#ffb199,#ff6a88)" },
  { slug: "party-line", name: "Party Line", emoji: "🎉", tagline: "Music, memes, mayhem", category: "Party", members: 1103, online: 289, gradient: "linear-gradient(135deg,#ff9a3d,#ff3d9a)" },
  { slug: "gym-crush", name: "Gym Crush", emoji: "💪", tagline: "Fit babes and workout dares", category: "Fitness", members: 442, online: 71, gradient: "linear-gradient(135deg,#3dffb5,#3d8bff)" },
  { slug: "date-night", name: "Date Night", emoji: "🍷", tagline: "Dressed up. Ready to charm.", category: "Romance", members: 615, online: 132, gradient: "linear-gradient(135deg,#b93dff,#ff3d7a)" },
];
