import type { AffirmationSet, VibeOption } from "../types";

export const AFFIRMATION_SETS: AffirmationSet[] = [
  {
    id: "a1",
    title: "Identity Anchoring",
    subtitle: "Rewire who you believe you are",
    affirmations: [
      "I am exactly who I am choosing to become",
      "My identity is not my past — it is my decision",
      "I move through the world with quiet confidence",
      "Every action I take reinforces who I am becoming",
      "I am worthy of everything I desire",
    ],
    duration: "5 min",
    vibeTags: ["bold-energy", "magnetic-confidence"],
  },
  {
    id: "a2",
    title: "Abundance Frequency",
    subtitle: "Shift from scarcity to overflow",
    affirmations: [
      "Wealth flows to me easily and effortlessly",
      "I am a magnet for opportunity",
      "There is more than enough for everyone, including me",
      "My value is not defined by what I produce",
      "I deserve prosperity in all its forms",
    ],
    duration: "4 min",
    vibeTags: ["magnetic-confidence", "creative-expansion"],
  },
  {
    id: "a3",
    title: "Morning Power Protocol",
    subtitle: "Set your frequency before the world wakes up",
    affirmations: [
      "Today I choose courage over comfort",
      "I wake up with purpose and move with intention",
      "My morning sets the frequency for everything that follows",
      "I am disciplined because I respect my future self",
      "This day is an opportunity I will not waste",
    ],
    duration: "3 min",
    vibeTags: ["bold-energy", "grounded-strength"],
  },
  {
    id: "a4",
    title: "Quiet Strength",
    subtitle: "Ground yourself in unshakable calm",
    affirmations: [
      "I do not need to prove myself to anyone",
      "My stillness is my power",
      "I trust the timing of my life",
      "I am rooted in who I am becoming",
      "Peace is my natural state",
    ],
    duration: "4 min",
    vibeTags: ["calm-clarity", "soft-power"],
  },
  {
    id: "a5",
    title: "Evening Release",
    subtitle: "Let go of the day and restore your frequency",
    affirmations: [
      "I release everything that is not mine to carry",
      "Today I showed up — and that is enough",
      "I forgive myself for any moment I fell short",
      "My rest is productive. My sleep is sacred",
      "Tomorrow I will rise even stronger",
    ],
    duration: "4 min",
    vibeTags: ["calm-clarity", "soft-power"],
    isBedtime: true,
  },
];

/**
 * Get today's assigned affirmation set based on vibe and date.
 * Excludes bedtime loops from the daily assignment.
 */
export function getAssignedAffirmationSet(
  vibe: VibeOption,
  date: string
): AffirmationSet {
  const daytime = AFFIRMATION_SETS.filter((s) => !s.isBedtime);
  const matched = daytime.filter(
    (s) => s.vibeTags && s.vibeTags.includes(vibe)
  );
  const pool = matched.length > 0 ? matched : daytime;

  const dayIndex = getDayIndex(date);
  return pool[dayIndex % pool.length];
}

export function getBedtimeLoop(): AffirmationSet | undefined {
  return AFFIRMATION_SETS.find((s) => s.isBedtime);
}

function getDayIndex(dateStr: string): number {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
