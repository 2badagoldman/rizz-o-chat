// Scripted marketing personas paired with held-back showcase photos.
export type DemoLine = { from: "member" | "creator"; text: string };

export interface DemoProof {
  id: string;
  name: string;
  age: number;
  tagline: string;
  image: string;
  lines: DemoLine[];
}

const PERSONAS: Array<{ name: string; age: number; tagline: string; lines: DemoLine[] }> = [
  {
    name: "Aria",
    age: 26,
    tagline: "Replies in seconds · Miami",
    lines: [
      { from: "member", text: "ok be honest — is this really you replying? 😄" },
      { from: "creator", text: "It's me. No bots, no copy-paste. Ask me anything 😌" },
      { from: "member", text: "what's your plan tonight?" },
      { from: "creator", text: "Beach walk, then someone worth texting. You're winning so far 🌴" },
    ],
  },
  {
    name: "Jen",
    age: 24,
    tagline: "Top creator this week · LA",
    lines: [
      { from: "member", text: "hey Jen, your photos are unreal" },
      { from: "creator", text: "Thank you 🤍 but I like people who talk to me, not at me." },
      { from: "member", text: "fair. what makes you actually reply to someone?" },
      { from: "creator", text: "One real question instead of 'hey'. You already passed." },
    ],
  },
  {
    name: "Nova",
    age: 27,
    tagline: "Online now · Ibiza",
    lines: [
      { from: "member", text: "how's the water today?" },
      { from: "creator", text: "Warm. I'm out here with my phone and nobody good to text 😅" },
      { from: "member", text: "well now you do" },
      { from: "creator", text: "Confident. I like it. Stay on my list and I'll keep you company all week." },
    ],
  },
  {
    name: "Camila",
    age: 25,
    tagline: "Friends List open · Rio",
    lines: [
      { from: "member", text: "what's the best message you've gotten today?" },
      { from: "creator", text: "Honestly? This one. Most people just send 'hi' 🙃" },
      { from: "member", text: "low bar. what should I ask instead?" },
      { from: "creator", text: "Ask what I'm scared of. Then I'll tell you and we're friends." },
    ],
  },
  {
    name: "Bianca",
    age: 23,
    tagline: "New this week · Sydney",
    lines: [
      { from: "member", text: "morning — how's your Sunday going?" },
      { from: "creator", text: "Slow, sunny, a little bored. Rescue me with a good story ☀️" },
      { from: "member", text: "I've got one about a lost passport in Lisbon" },
      { from: "creator", text: "Okay you have my full attention. Keep going, don't skip parts." },
    ],
  },
  {
    name: "Mila",
    age: 28,
    tagline: "VIP creator · Dubai",
    lines: [
      { from: "member", text: "do you actually remember who you talk to?" },
      { from: "creator", text: "Yes. You told me about your new job last time — how's it going? 💬" },
      { from: "member", text: "wait, you really remembered" },
      { from: "creator", text: "That's the whole point of being on my list. I show up for you." },
    ],
  },
  {
    name: "Sofia",
    age: 26,
    tagline: "Replies 24/7 · Barcelona",
    lines: [
      { from: "member", text: "bad day. distract me." },
      { from: "creator", text: "Deal. Rate my sunset out of 10 and then tell me what happened 🌅" },
      { from: "member", text: "9.5 — and work happened" },
      { from: "creator", text: "Work always happens. I'm here till you feel better, promise." },
    ],
  },
  {
    name: "Layla",
    age: 22,
    tagline: "Trending creator · Tulum",
    lines: [
      { from: "member", text: "what's the vibe over there?" },
      { from: "creator", text: "Salt water, no signal, one bar of battery — using it on you 😌" },
      { from: "member", text: "honored, genuinely" },
      { from: "creator", text: "Be interesting and I'll charge my phone just for this chat." },
    ],
  },
];

export { PERSONAS };
