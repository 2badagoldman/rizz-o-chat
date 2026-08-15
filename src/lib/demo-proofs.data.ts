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
  {
    name: "Elena",
    age: 27,
    tagline: "Replies every night · Lisbon",
    lines: [
      { from: "member", text: "long shift, I'm running on coffee and spite" },
      { from: "creator", text: "Spite is a valid fuel. What happened today? 👀" },
      { from: "member", text: "manager took credit for my work again" },
      { from: "creator", text: "Ugh. Screenshot everything next time. Tonight though — you're off the clock with me." },
    ],
  },
  {
    name: "Priya",
    age: 26,
    tagline: "Great listener · Toronto",
    lines: [
      { from: "member", text: "do you ever get tired of people messaging you?" },
      { from: "creator", text: "Not the ones who actually talk. You're one of those so far ☺️" },
      { from: "member", text: "low bar honestly" },
      { from: "creator", text: "You'd be surprised. Tell me one thing that made you smile today." },
    ],
  },
  {
    name: "Ava",
    age: 24,
    tagline: "Night owl · Chicago",
    lines: [
      { from: "member", text: "you're up late too?" },
      { from: "creator", text: "Always. My brain files complaints after midnight 😅 what's keeping you up?" },
      { from: "member", text: "overthinking a text I sent 3 hours ago" },
      { from: "creator", text: "Read it to me. I'll tell you honestly if it was fine — it probably was." },
    ],
  },
  {
    name: "Rubi",
    age: 25,
    tagline: "Weekly regulars only · Austin",
    lines: [
      { from: "member", text: "what do you actually talk about with people here?" },
      { from: "creator", text: "Work, families, bad dates, music. Mostly real life 🙂" },
      { from: "member", text: "that's not what I expected" },
      { from: "creator", text: "Most people just want someone who answers. Start wherever you want." },
    ],
  },
  {
    name: "Zara",
    age: 28,
    tagline: "Straight talker · London",
    lines: [
      { from: "member", text: "be honest, am I wasting my time here?" },
      { from: "creator", text: "Only if you send one word and disappear. Say something real and I'll match it." },
      { from: "member", text: "fair enough. I just moved cities and I don't know anyone" },
      { from: "creator", text: "Okay that's a real one. Which city? I'll help you find your first three places." },
    ],
  },
  {
    name: "Maya",
    age: 23,
    tagline: "Morning person · Seoul",
    lines: [
      { from: "member", text: "morning. what's the first thing you do when you wake up?" },
      { from: "creator", text: "Stretch, coffee, then read messages like this one ☀️ you?" },
      { from: "member", text: "hit snooze four times, then panic" },
      { from: "creator", text: "Classic. Text me before the panic tomorrow and I'll get you out of bed." },
    ],
  },
  {
    name: "Isabella",
    age: 29,
    tagline: "Remembers everything · Milan",
    lines: [
      { from: "member", text: "hey, back again" },
      { from: "creator", text: "You had the interview today, right? How did it go? 🤞" },
      { from: "member", text: "you actually remembered" },
      { from: "creator", text: "Of course. Now tell me — did you get it, or do we plan revenge?" },
    ],
  },
  {
    name: "Chloe",
    age: 22,
    tagline: "Funny one · Melbourne",
    lines: [
      { from: "member", text: "give me a reason to stay up 20 more minutes" },
      { from: "creator", text: "I'll tell you about the time I locked myself out in a towel 🙃" },
      { from: "member", text: "okay that's worth it" },
      { from: "creator", text: "Neighbour still won't look me in the eye. Your turn — worst public moment." },
    ],
  },
  {
    name: "Noor",
    age: 26,
    tagline: "Calm energy · Dubai",
    lines: [
      { from: "member", text: "rough week. don't really want advice" },
      { from: "creator", text: "Then no advice. Just talk, I'll stay here 🤍" },
      { from: "member", text: "thanks. that's rarer than you'd think" },
      { from: "creator", text: "It shouldn't be. Start anywhere — I've got time tonight." },
    ],
  },
  {
    name: "Valentina",
    age: 27,
    tagline: "Keeps the convo going · Bogotá",
    lines: [
      { from: "member", text: "I'm bad at starting conversations" },
      { from: "creator", text: "Then I'll start. Coffee or tea, beach or mountains, early or late? 😌" },
      { from: "member", text: "coffee, mountains, late" },
      { from: "creator", text: "So you're a 2am cabin person. Noted. I'm keeping this one in my head." },
    ],
  },
];

export { PERSONAS };
