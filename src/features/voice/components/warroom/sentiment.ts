export type SentimentStyle = { label: string; emoji: string; color: string; bg: string };

export type SentimentLevel = "hostile" | "cold" | "skeptical" | "neutral" | "warming" | "buying";

export const SENTIMENT_CONFIG: Record<
  SentimentLevel,
  { label: string; emoji: string; color: string; bg: string }
> = {
  hostile: {
    label: "Hostile",
    emoji: "😤",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
  },
  cold: {
    label: "Cold",
    emoji: "❄️",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
  skeptical: {
    label: "Skeptical",
    emoji: "🤔",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
  },
  neutral: {
    label: "Neutral",
    emoji: "😐",
    color: "text-gray-400",
    bg: "bg-white/5 border-white/10",
  },
  warming: {
    label: "Warming",
    emoji: "🙂",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
  },
  buying: {
    label: "Buying",
    emoji: "🔥",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
};

export const SENTIMENT_ORDER: SentimentLevel[] = [
  "hostile",
  "cold",
  "skeptical",
  "neutral",
  "warming",
  "buying",
];

export function getSentimentFromMood(mood: string): SentimentLevel {
  const m = mood.toLowerCase();
  if (m.includes("hostile")) return "hostile";
  if (m.includes("frustrat")) return "cold";
  if (m.includes("disengag")) return "skeptical";
  if (m.includes("hesitant")) return "skeptical";
  if (m.includes("interested")) return "warming";
  if (m.includes("buying")) return "buying";
  return "neutral";
}
