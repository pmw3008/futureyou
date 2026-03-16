/**
 * ElevenLabs Text-to-Speech Service
 *
 * Premium voice engine. Primary audio source for all app playback.
 * Uses XMLHttpRequest for reliable binary data handling in React Native.
 *
 * Key design:
 * - Cache keys include voiceId + text hash (voice switching safe)
 * - Precache entire affirmation sets ahead of playback
 * - Uses eleven_multilingual_v2 for natural, expressive speech
 * - Audio mode set once, not per-call
 */

import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import Constants from "expo-constants";

const API_KEY = Constants.expoConfig?.extra?.elevenlabsApiKey ?? "";
const API_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

// ─── Internal State ────────────────────────────────────────────

let _currentSound: Audio.Sound | null = null;
let _stopRequested = false;
let _audioModeSet = false;

// ─── Audio Cache ──────────────────────────────────────────────

const _audioCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

function hashText(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

// Bump this when voice_settings change to invalidate cached audio
const VOICE_SETTINGS_VERSION = 3;

function getCacheKey(voiceId: string, text: string): string {
  return `v${VOICE_SETTINGS_VERSION}:${voiceId}:${hashText(text)}`;
}

function evictOldestIfNeeded(): void {
  if (_audioCache.size >= MAX_CACHE_SIZE) {
    const firstKey = _audioCache.keys().next().value;
    if (firstKey) {
      const path = _audioCache.get(firstKey);
      if (path) FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
      _audioCache.delete(firstKey);
    }
  }
}

/**
 * Check if audio for a specific text + voice is already cached.
 */
export function isAudioCached(voiceId: string, text: string): boolean {
  return _audioCache.has(getCacheKey(voiceId, text));
}

/**
 * Pre-cache audio for a list of texts. Call ahead of playback.
 */
export async function precacheAudio(
  voiceId: string,
  texts: string[]
): Promise<void> {
  if (!API_KEY || !voiceId) return;
  const uncached = texts.filter((t) => !_audioCache.has(getCacheKey(voiceId, t)));
  if (uncached.length === 0) return;

  const batches: string[][] = [];
  for (let i = 0; i < uncached.length; i += 3) {
    batches.push(uncached.slice(i, i + 3));
  }

  for (const batch of batches) {
    await Promise.allSettled(
      batch.map(async (text) => {
        try {
          const key = getCacheKey(voiceId, text);
          const base64 = await fetchAudioBase64(voiceId, text);
          evictOldestIfNeeded();
          const tempFile = `${FileSystem.cacheDirectory}el_${voiceId.slice(0, 6)}_${hashText(text)}.mp3`;
          await FileSystem.writeAsStringAsync(tempFile, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          _audioCache.set(key, tempFile);
        } catch {
          // Silent — precache is best-effort
        }
      })
    );
  }
}

/**
 * Configure audio session for playback. Only runs once.
 */
async function ensureAudioMode(): Promise<void> {
  if (_audioModeSet) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    _audioModeSet = true;
  } catch {}
}

/**
 * Fetch audio from ElevenLabs via XMLHttpRequest and return base64.
 */
function fetchAudioBase64(voiceId: string, text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/${voiceId}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("xi-api-key", API_KEY);
    xhr.responseType = "blob";

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response as Blob;
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1];
          if (base64) resolve(base64);
          else reject(new Error("Failed to convert audio to base64"));
        };
        reader.onerror = () => reject(new Error("FileReader error"));
        reader.readAsDataURL(blob);
      } else {
        reject(new Error(`ElevenLabs API error ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.ontimeout = () => reject(new Error("Request timeout"));
    xhr.timeout = 30000;

    xhr.send(
      JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.42,
          similarity_boost: 0.82,
          style: 0.68,
          use_speaker_boost: true,
        },
      })
    );
  });
}

/**
 * Speak text using ElevenLabs API.
 * Returns true if playback started, false if it failed.
 */
export async function speakWithElevenLabs(options: {
  text: string;
  voiceId: string;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: any) => void;
}): Promise<boolean> {
  const { text, voiceId, onDone, onStopped, onError } = options;

  if (!API_KEY) {
    console.warn("[ElevenLabs] No API key configured");
    return false;
  }

  _stopRequested = false;

  try {
    if (_currentSound) {
      await stopElevenLabs();
    }
    _stopRequested = false;
    await ensureAudioMode();

    if (_stopRequested) { onStopped?.(); return true; }

    // Check cache first
    const cacheKey = getCacheKey(voiceId, text);
    let tempFile = _audioCache.get(cacheKey);

    if (!tempFile) {
      const base64 = await fetchAudioBase64(voiceId, text);
      if (_stopRequested) { onStopped?.(); return true; }

      tempFile = `${FileSystem.cacheDirectory}el_${voiceId.slice(0, 6)}_${hashText(text)}.mp3`;
      await FileSystem.writeAsStringAsync(tempFile, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      evictOldestIfNeeded();
      _audioCache.set(cacheKey, tempFile);
    }

    if (_stopRequested) { onStopped?.(); return true; }

    const { sound } = await Audio.Sound.createAsync(
      { uri: tempFile },
      { shouldPlay: true, volume: 1.0 }
    );

    _currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        _currentSound = null;
        sound.unloadAsync().catch(() => {});
        if (!_stopRequested) onDone?.();
      }
    });

    return true;
  } catch (err) {
    console.warn("[ElevenLabs] Playback error:", err);
    onError?.(err);
    return false;
  }
}

/**
 * Stop current ElevenLabs playback.
 */
export async function stopElevenLabs(): Promise<void> {
  _stopRequested = true;
  if (_currentSound) {
    try {
      await _currentSound.stopAsync();
      await _currentSound.unloadAsync();
    } catch {}
    _currentSound = null;
  }
}

/**
 * Check if ElevenLabs is currently playing.
 */
export function isElevenLabsPlaying(): boolean {
  return _currentSound !== null;
}

/**
 * Clear all cached audio for a specific voice (used on voice switch).
 */
export function clearCacheForVoice(voiceId: string): void {
  const keysToDelete: string[] = [];
  _audioCache.forEach((_path, key) => {
    if (key.startsWith(voiceId)) {
      FileSystem.deleteAsync(_path, { idempotent: true }).catch(() => {});
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((k) => _audioCache.delete(k));
}
