export const SITE = {
  url: "https://tokala.dev",
  name: "Rohit Tokala",
  title: "Rohit Tokala",
  description:
    "Rohit Tokala builds AI tools for the people who design and build things, as a forward deployed engineer at a global engineering firm. Projects, and notes on what he's building.",
  email: "hello@tokala.dev",
  github: "https://github.com/rtokala14",
  x: "https://x.com/tokalarohit",
  locale: "en",
} as const;

/** Reading speed for walking times on signposts and reports. */
export const WPM = 220;

export function walkingTime(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function readingMinutes(text: string): number {
  const words = text.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  return words / WPM;
}
