import type { Visualization, VibeOption } from "../types";

export const VISUALIZATIONS: Visualization[] = [
  {
    id: "v1",
    title: "The Morning You Finally Became Her",
    description:
      "Step into the version of you that already exists — confident, magnetic, unshakable.",
    category: "visualization",
    duration: 480,
    script: `Take a deep breath. Close your eyes.

Imagine yourself one year from today. You are standing in the space you've always dreamed of. The air feels different here — lighter, charged with possibility.

Look down at your hands. These are the hands of someone who followed through. Someone who chose discipline over comfort, every single day.

Now look around. This is your reality. You built it — one intentional morning, one courageous decision, one visualization at a time.

Feel the confidence in your posture. Notice the calm certainty in your voice when you speak. This is not the old you. This is who you've always been underneath the doubt.

Say to yourself: "I am already this person. I have always been this person."

Hold this image. Breathe it in. Let it become your new normal.

When you open your eyes, carry this version of yourself into every moment today.`,
    isSaved: true,
    vibeTags: ["bold-energy", "magnetic-confidence"],
  },
  {
    id: "v2",
    title: "Your 5AM Kingdom",
    description:
      "Visualize the morning ritual that sets your frequency. Feel the power of silence, discipline, and intention.",
    category: "embodiment",
    duration: 360,
    script: `Close your eyes. Take three slow breaths.

It's 5:45 AM. Your eyes open naturally, without an alarm. There's a quiet excitement in your chest — the feeling of someone who loves their life.

You rise. Your body feels strong, rested, alive. You move to your meditation space. The stillness is powerful.

As you sit in silence, you feel connected to something bigger. Your mind is clear. Your intentions are set.

You move through your morning ritual — each action deliberate, each moment savored. Cold water on your face. The stretch of your muscles. The taste of clean fuel.

This is not discipline. This is identity. This is who you are now.

Carry this energy. Own this morning. The rest of the day will follow your lead.`,
    isSaved: false,
    vibeTags: ["grounded-strength", "calm-clarity"],
  },
  {
    id: "v3",
    title: "Magnetize Everything That's Yours",
    description:
      "Tune into the vibration of already having. Wealth, love, opportunity — stop chasing and start receiving.",
    category: "visualization",
    duration: 420,
    script: `Breathe deeply. Relax your shoulders.

Imagine your life as a vessel. Right now, you are making space — clearing old beliefs, releasing scarcity, letting go of the idea that you have to struggle.

Now feel it: abundance is your natural state. It always has been.

See your bank account reflecting your true worth. See opportunities arriving effortlessly. See the right people gravitating toward your energy.

This is not fantasy. This is the reality you are creating with every aligned action, every brave decision, every moment of gratitude.

Say to yourself: "I am a magnet for everything that is meant for me."

Feel the truth of it settle into your body. From this state, everything changes.`,
    isSaved: false,
    vibeTags: ["magnetic-confidence", "creative-expansion"],
  },
  {
    id: "v4",
    title: "The Quiet Power Within",
    description:
      "Connect to the still, unshakable strength that lives beneath the noise. You don't need to prove anything.",
    category: "visualization",
    duration: 390,
    script: `Settle into stillness. Let your breathing slow.

There is a place inside you that the world cannot touch. A core of quiet certainty that doesn't need validation, approval, or proof.

Go there now. Feel its warmth. Notice how solid it is — unshakable, patient, wise.

This is your true power. Not the loud kind. Not the kind that performs. The kind that simply knows.

From this place, you make decisions with clarity. You hold boundaries without guilt. You move through challenges with grace.

Say to yourself: "I am enough, exactly as I am. My power is quiet and it is infinite."

Carry this stillness with you. Let it be your anchor today.`,
    isSaved: false,
    vibeTags: ["soft-power", "calm-clarity"],
  },
];

/**
 * Get today's assigned visualization based on vibe and date.
 * Prioritizes vibe-matching content, rotates daily.
 */
export function getAssignedVisualization(
  vibe: VibeOption,
  date: string
): Visualization {
  const matched = VISUALIZATIONS.filter(
    (v) => v.vibeTags && v.vibeTags.includes(vibe)
  );
  const pool = matched.length > 0 ? matched : VISUALIZATIONS;

  // Simple deterministic rotation based on day
  const dayIndex = getDayIndex(date);
  return pool[dayIndex % pool.length];
}

function getDayIndex(dateStr: string): number {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
