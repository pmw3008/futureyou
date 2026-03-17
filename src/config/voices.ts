// ─── ElevenLabs Guide Voices ──────────────────────────────────
// Four premium guides available for visualization and affirmation playback.

export interface Guide {
  id: string;
  voiceId: string;
  label: string;
  subtitle: string;
  provider: "elevenlabs";
}

export const GUIDES: Guide[] = [
  {
    id: "jules",
    voiceId: "Wu8LvXIxRX001LOMLGOn",
    label: "Jules",
    subtitle: "Soft Guide",
    provider: "elevenlabs",
  },
  {
    id: "atlas",
    voiceId: "vWKXOYfUs0p6HlAwTvoH",
    label: "Atlas",
    subtitle: "Deep Mentor",
    provider: "elevenlabs",
  },
  {
    id: "nova",
    voiceId: "8E713gHoOWTVwJa9Vio2",
    label: "Nova",
    subtitle: "Cinematic Future",
    provider: "elevenlabs",
  },
  {
    id: "sol",
    voiceId: "QZpXTMjEJ978q8d0qAbs",
    label: "Sol",
    subtitle: "Meditation Calm",
    provider: "elevenlabs",
  },
];

export const DEFAULT_GUIDE_ID = "jules";

export function getGuideById(id: string): Guide | undefined {
  return GUIDES.find((g) => g.id === id);
}

export function getGuideVoiceId(guideId: string): string {
  const guide = getGuideById(guideId);
  return guide?.voiceId ?? GUIDES[0].voiceId;
}
