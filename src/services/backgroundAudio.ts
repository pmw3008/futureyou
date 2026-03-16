/**
 * Background Audio Service
 *
 * Plays ambient background audio during affirmation loops and visualizations.
 * Uses expo-av for audio playback with looping.
 *
 * To add audio files:
 * 1. Place .mp3 files in assets/audio/
 * 2. Add them to the AUDIO_SOURCES map below
 * 3. They will appear as options in the UI
 */

import { Audio } from "expo-av";

export type BackgroundAudioOption = "silence" | "ambient" | "brown-noise" | "ocean";

export const BACKGROUND_AUDIO_OPTIONS: {
  id: BackgroundAudioOption;
  label: string;
  description: string;
}[] = [
  { id: "silence", label: "Silence", description: "No background audio" },
  { id: "ambient", label: "Ambient Pad", description: "Soft atmospheric pad" },
  { id: "brown-noise", label: "Brown Noise", description: "Deep, warm noise" },
  { id: "ocean", label: "Ocean", description: "Gentle ocean waves" },
];

// Audio sources — add bundled assets here when available
// Example: { "ambient": require("../../assets/audio/ambient-pad.mp3") }
const AUDIO_SOURCES: Partial<Record<BackgroundAudioOption, any>> = {};

let _sound: Audio.Sound | null = null;
let _currentOption: BackgroundAudioOption = "silence";

/**
 * Start playing background audio.
 * If "silence" is selected, any current audio is stopped.
 */
export async function startBackgroundAudio(
  option: BackgroundAudioOption
): Promise<void> {
  // Stop any existing audio first
  await stopBackgroundAudio();

  _currentOption = option;

  if (option === "silence") return;

  const source = AUDIO_SOURCES[option];
  if (!source) {
    // Audio file not bundled yet — silently skip
    console.log(
      `[BackgroundAudio] No audio file for "${option}" — add it to assets/audio/`
    );
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    const { sound } = await Audio.Sound.createAsync(source, {
      isLooping: true,
      volume: 0.3,
      shouldPlay: true,
    });

    _sound = sound;
  } catch (err) {
    console.warn("[BackgroundAudio] Failed to start:", err);
  }
}

/**
 * Stop background audio and release resources.
 */
export async function stopBackgroundAudio(): Promise<void> {
  if (_sound) {
    try {
      await _sound.stopAsync();
      await _sound.unloadAsync();
    } catch {}
    _sound = null;
  }
}

/**
 * Set background audio volume (0-1).
 */
export async function setBackgroundVolume(volume: number): Promise<void> {
  if (_sound) {
    try {
      await _sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    } catch {}
  }
}

/**
 * Get the currently selected background audio option.
 */
export function getCurrentBackgroundAudio(): BackgroundAudioOption {
  return _currentOption;
}
