// ─── User Profile & Personalization ────────────────────────────

export interface UserProfile {
  /** Display name */
  name: string;
  /** Age as string for display */
  age: string;
  /** City/location */
  city: string;
  /** Career/occupation */
  career: string;
  /** Core identity statement — "I am..." */
  identityStatement: string;
  /** What does your ideal day look like? */
  idealDay: string;
  /** What are you no longer willing to accept? */
  nonNegotiable: string;
  /** What does success feel like in your body? */
  successFeeling: string;
  /** What would you do if fear didn't exist? */
  fearlessDream: string;
  /** Lifestyle tags (legacy — kept for compatibility) */
  lifestyleTags: string[];
  /** Things the user has left behind (legacy) */
  neverAgain: string[];
  /** Selected vibe/aesthetic (from onboarding) */
  vibe: VibeOption;
  /** Visualization preference */
  visualizationPreference: VisualizationPreference;
  /** Goals (legacy — kept for compatibility) */
  goals: string[];
  /** Voice preference for audio content */
  voicePreference: VoicePreference;
  /** TTS voice settings */
  voiceSettings: VoiceSettings;
  /** Selected ElevenLabs guide ID */
  selectedGuideId: string;
  /** Whether onboarding has been completed */
  onboardingComplete: boolean;
}

export type VibeOption =
  | "calm-clarity"
  | "bold-energy"
  | "soft-power"
  | "grounded-strength"
  | "magnetic-confidence"
  | "creative-expansion";

export const VIBE_OPTIONS: { id: VibeOption; label: string; description: string; emoji: string }[] = [
  { id: "calm-clarity", label: "Calm Clarity", description: "Peaceful, centered, and intentional", emoji: "✦" },
  { id: "bold-energy", label: "Bold Energy", description: "Confident, magnetic, and unstoppable", emoji: "⚡" },
  { id: "soft-power", label: "Soft Power", description: "Gentle strength, quiet confidence", emoji: "❋" },
  { id: "grounded-strength", label: "Grounded Strength", description: "Rooted, disciplined, unshakable", emoji: "◆" },
  { id: "magnetic-confidence", label: "Magnetic Confidence", description: "Radiant, chosen, unforgettable", emoji: "✧" },
  { id: "creative-expansion", label: "Creative Expansion", description: "Visionary, free, limitless expression", emoji: "◇" },
];

export type VisualizationPreference = "audio" | "reading" | "both";

export const VISUALIZATION_OPTIONS: { id: VisualizationPreference; label: string; description: string }[] = [
  { id: "both", label: "Both", description: "Listen and read — full immersion" },
  { id: "audio", label: "Audio", description: "Close your eyes and listen" },
  { id: "reading", label: "Reading", description: "Read and absorb at your pace" },
];

export type VoicePreference = "default" | "custom";

// ─── Voice Settings (TTS) ──────────────────────────────────────

export type VisualizationVoiceStyle = "human_feminine" | "human_masculine";
export type AffirmationVoiceStyle = "human" | "robotic";

export interface VoiceSettings {
  visualizationVoice: VisualizationVoiceStyle;
  affirmationVoice: AffirmationVoiceStyle;
}

export const VISUALIZATION_VOICE_OPTIONS: {
  id: VisualizationVoiceStyle;
  label: string;
  description: string;
}[] = [
  {
    id: "human_feminine",
    label: "Feminine",
    description: "Warm, soothing, and grounding",
  },
  {
    id: "human_masculine",
    label: "Masculine",
    description: "Deep, steady, and confident",
  },
];

export const AFFIRMATION_VOICE_OPTIONS: {
  id: AffirmationVoiceStyle;
  label: string;
  description: string;
}[] = [
  {
    id: "human",
    label: "Human",
    description: "Natural, expressive delivery",
  },
  {
    id: "robotic",
    label: "Robotic",
    description: "Monotone, hypnotic repetition",
  },
];

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  visualizationVoice: "human_feminine",
  affirmationVoice: "human",
};

// ─── Lifestyle Tag Options ─────────────────────────────────────

export const LIFESTYLE_TAG_OPTIONS = [
  "Morning rituals",
  "Clean eating",
  "Strength training",
  "Journaling",
  "Reading daily",
  "Cold exposure",
  "Creative work",
  "Travel",
  "Minimalism",
  "Meditation",
  "Yoga",
  "Deep work",
  "Gratitude practice",
  "Early rising",
  "Nature walks",
  "Digital detox",
  "Breathwork",
  "Meal prep",
] as const;

// ─── Visualization Content ─────────────────────────────────────

export interface Visualization {
  id: string;
  title: string;
  description: string;
  category: "visualization" | "affirmation" | "embodiment";
  /** Duration in seconds */
  duration: number;
  /** Script/text content for reading mode */
  script: string;
  /** Whether this is a saved favorite */
  isSaved: boolean;
  /** Vibes this visualization aligns with */
  vibeTags?: VibeOption[];
}

// ─── Affirmation Loop ──────────────────────────────────────────

export interface AffirmationSet {
  id: string;
  title: string;
  subtitle: string;
  affirmations: string[];
  duration: string;
  /** Vibes this set aligns with */
  vibeTags?: VibeOption[];
  /** Whether this is a bedtime loop */
  isBedtime?: boolean;
}

export interface AffirmationLoop {
  id: string;
  title: string;
  affirmations: string[];
  /** Voice to use: default or custom uploaded */
  voice: VoicePreference;
  /** Duration in seconds */
  duration: number;
}

// ─── Daily Ritual System ──────────────────────────────────────

export type RitualStep = "visualization" | "affirmation" | "standard" | "evidence";

export interface DailyRitual {
  date: string;
  steps: Record<RitualStep, boolean>;
}

export type EvidenceType = "manifestation" | "synchronicity" | "identity-proof" | "courage-action";

export interface EvidenceEntry {
  id: string;
  date: string;
  type: EvidenceType;
  title: string;
  body: string;
  photoUri?: string;
}

export interface DailyStandard {
  date: string;
  focus: string;
  action: string;
  standard: string;
  reframe: string;
}

export const EVIDENCE_TYPES: { id: EvidenceType; label: string; emoji: string }[] = [
  { id: "manifestation", label: "Manifestation", emoji: "✦" },
  { id: "synchronicity", label: "Synchronicity", emoji: "◎" },
  { id: "identity-proof", label: "Identity Proof", emoji: "◆" },
  { id: "courage-action", label: "Courage / Action", emoji: "⚡" },
];

export const RITUAL_STEPS: { id: RitualStep; title: string; description: string; emoji: string }[] = [
  { id: "visualization", title: "Morning Visualization", description: "See and embody your identity", emoji: "◎" },
  { id: "affirmation", title: "Identity Affirmations", description: "Reinforce who you are", emoji: "◇" },
  { id: "standard", title: "Set Today's Standard", description: "Define your focus & action", emoji: "◆" },
  { id: "evidence", title: "Night Reflection", description: "Log evidence of your shift", emoji: "✦" },
];

// ─── Saved Visualizations ─────────────────────────────────────

export interface SavedVisualization {
  id: string;
  /** The prompt the user entered */
  prompt: string;
  /** The generated script text */
  script: string;
  /** When it was saved */
  createdAt: string;
}

// ─── Subscription / Paywall ───────────────────────────────────

export type SubscriptionPlan = "weekly" | "annual";
export type SubscriptionStatus = "active" | "trialing" | "expired" | "none";

export interface SubscriptionInfo {
  /** Current plan type */
  plan: SubscriptionPlan | null;
  /** Subscription status */
  status: SubscriptionStatus;
  /** Whether user has premium access (active or trialing) */
  isPremium: boolean;
  /** Whether user is in free trial */
  isTrialing: boolean;
  /** Expiration date ISO string */
  expirationDate: string | null;
}

// ─── Default Profile ───────────────────────────────────────────

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  age: "",
  city: "",
  career: "",
  identityStatement: "",
  idealDay: "",
  nonNegotiable: "",
  successFeeling: "",
  fearlessDream: "",
  lifestyleTags: [],
  neverAgain: [],
  vibe: "bold-energy",
  visualizationPreference: "both",
  goals: [],
  voicePreference: "default",
  voiceSettings: DEFAULT_VOICE_SETTINGS,
  selectedGuideId: "jules",
  onboardingComplete: false,
};
