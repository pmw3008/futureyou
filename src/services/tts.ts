/**
 * Text-to-Speech Service
 *
 * ElevenLabs is the PRIMARY audio engine for all playback.
 * Device TTS (expo-speech) is a hidden emergency fallback only.
 *
 * Key design principles:
 * - NO speech on mount or page load
 * - Speech ONLY starts on explicit user action
 * - Always stop current audio before starting new audio
 * - ElevenLabs first, device TTS only on failure
 * - Clean stop/restart logic with no race conditions
 */

import * as Speech from "expo-speech";
import { Platform } from "react-native";
import {
  speakWithElevenLabs,
  stopElevenLabs,
  precacheAudio,
  clearCacheForVoice,
} from "./elevenlabs";
import { getGuideVoiceId } from "../config/voices";

export { precacheAudio, clearCacheForVoice } from "./elevenlabs";

// ─── Voice Style Types ─────────────────────────────────────────

export type VisualizationVoiceStyle = "human_feminine" | "human_masculine";
export type AffirmationVoiceStyle = "human" | "robotic";

export interface VoiceSettings {
  visualizationVoice: VisualizationVoiceStyle;
  affirmationVoice: AffirmationVoiceStyle;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  visualizationVoice: "human_feminine",
  affirmationVoice: "human",
};

// ─── Internal State ────────────────────────────────────────────

let _isSpeaking = false;
let _stopRequested = false;
let _usingElevenLabs = false;

// ─── Voice Mapping (device TTS fallback only) ──────────────────

function getVoiceOptions(
  style: VisualizationVoiceStyle | AffirmationVoiceStyle
): Speech.SpeechOptions {
  const base: Speech.SpeechOptions = {
    language: "en-US",
    volume: 1.0,
  };

  switch (style) {
    case "human_feminine":
      return { ...base, pitch: 1.05, rate: Platform.OS === "ios" ? 0.48 : 0.9 };
    case "human_masculine":
      return { ...base, pitch: 0.85, rate: Platform.OS === "ios" ? 0.48 : 0.9 };
    case "human":
      return { ...base, pitch: 1.0, rate: Platform.OS === "ios" ? 0.5 : 0.95 };
    case "robotic":
      return { ...base, pitch: 0.9, rate: Platform.OS === "ios" ? 0.5 : 1.0 };
    default:
      return base;
  }
}

// ─── Public API ────────────────────────────────────────────────

export interface SpeakOptions {
  text: string;
  style: VisualizationVoiceStyle | AffirmationVoiceStyle;
  guideId?: string;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: any) => void;
}

/**
 * Speak text. Always stops any current speech first.
 * ALWAYS tries ElevenLabs first (if guideId provided).
 * Falls back to device TTS only on failure.
 */
export async function speak({
  text,
  style,
  guideId,
  onDone,
  onStopped,
  onError,
}: SpeakOptions): Promise<void> {
  // Always stop current speech first
  try { Speech.stop(); } catch {}

  _stopRequested = false;

  // Try ElevenLabs first — this is the primary path for ALL voice styles
  if (guideId) {
    const voiceId = getGuideVoiceId(guideId);
    const success = await speakWithElevenLabs({
      text,
      voiceId,
      onDone: () => {
        _isSpeaking = false;
        _usingElevenLabs = false;
        onDone?.();
      },
      onStopped: () => {
        _isSpeaking = false;
        _usingElevenLabs = false;
        onStopped?.();
      },
      onError: (err) => {
        _isSpeaking = false;
        _usingElevenLabs = false;
        onError?.(err);
      },
    });

    if (success) {
      _isSpeaking = true;
      _usingElevenLabs = true;
      return;
    }
    // Fall through to device TTS silently
    console.warn("[TTS] ElevenLabs failed, falling back to device TTS");
  }

  // Device TTS — emergency fallback only
  if (_stopRequested) return;

  _usingElevenLabs = false;
  _isSpeaking = true;
  const voiceOptions = getVoiceOptions(style);

  try {
    Speech.speak(text, {
      ...voiceOptions,
      onDone: () => {
        _isSpeaking = false;
        onDone?.();
      },
      onStopped: () => {
        _isSpeaking = false;
        onStopped?.();
      },
      onError: (err) => {
        _isSpeaking = false;
        console.warn("[TTS] Speech error:", err);
        onError?.(err);
      },
    });
  } catch (err) {
    _isSpeaking = false;
    console.warn("[TTS] Speech.speak threw:", err);
    onError?.(err);
  }
}

// ─── Affirmation Loop Engine ──────────────────────────────────

export type AffirmationPacing = "calm" | "fast" | "sleep";

const PACING_DELAY: Record<AffirmationPacing, number> = {
  calm: 1100,
  fast: 400,
  sleep: 2200,
};

export interface AffirmationLoopOptions {
  onAffirmationStart?: (index: number) => void;
  onLoopComplete?: (loopNumber: number) => void;
  onAllDone?: () => void;
  onError?: (error: any) => void;
  pacing?: AffirmationPacing;
  durationSeconds?: number;
}

/**
 * Speak a list of affirmations sequentially with configurable pacing.
 * Uses ElevenLabs via guideId. Loops until duration ends.
 */
export async function speakAffirmationLoop(
  affirmations: string[],
  style: AffirmationVoiceStyle,
  guideId?: string,
  callbacks?: AffirmationLoopOptions
): Promise<void> {
  // Stop everything cleanly
  _stopRequested = true;
  _isSpeaking = false;
  if (_usingElevenLabs) {
    await stopElevenLabs();
    _usingElevenLabs = false;
  }
  try { Speech.stop(); } catch {}

  // Single frame yield to let speech engine release
  await new Promise((resolve) => setTimeout(resolve, 16));

  _stopRequested = false;

  // Precache all affirmations so there's no network delay between them
  if (guideId) {
    const voiceId = getGuideVoiceId(guideId);
    await precacheAudio(voiceId, affirmations);
  }

  if (_stopRequested) return;

  const pacing = callbacks?.pacing ?? "calm";
  const delay = PACING_DELAY[pacing];
  const durationMs = (callbacks?.durationSeconds ?? 0) * 1000;
  const startTime = Date.now();
  let currentIndex = 0;
  let loopNumber = 1;

  const speakNext = () => {
    if (_stopRequested) return;

    if (durationMs > 0 && Date.now() - startTime >= durationMs) {
      _isSpeaking = false;
      callbacks?.onAllDone?.();
      return;
    }

    if (currentIndex >= affirmations.length) {
      callbacks?.onLoopComplete?.(loopNumber);
      if (durationMs > 0 && Date.now() - startTime < durationMs) {
        currentIndex = 0;
        loopNumber++;
        setTimeout(speakNext, delay);
        return;
      }
      _isSpeaking = false;
      callbacks?.onAllDone?.();
      return;
    }

    callbacks?.onAffirmationStart?.(currentIndex);

    const text = affirmations[currentIndex];
    _isSpeaking = true;

    speak({
      text,
      style,
      guideId,
      onDone: () => {
        _isSpeaking = false;
        if (_stopRequested) return;
        currentIndex++;
        setTimeout(speakNext, delay);
      },
      onStopped: () => {
        _isSpeaking = false;
      },
      onError: () => {
        _isSpeaking = false;
        if (!_stopRequested) {
          currentIndex++;
          setTimeout(speakNext, 500);
        }
      },
    });
  };

  speakNext();
}

/**
 * Stop all current speech immediately (both ElevenLabs and device TTS).
 */
export async function stopSpeech(): Promise<void> {
  _stopRequested = true;
  _isSpeaking = false;

  if (_usingElevenLabs) {
    await stopElevenLabs();
    _usingElevenLabs = false;
  }

  try { Speech.stop(); } catch {}
}

/**
 * Check if the TTS engine is currently speaking.
 */
export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
