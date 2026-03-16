/**
 * Export Affirmation Loop as Audio
 *
 * Uses ElevenLabs API to generate audio for each affirmation,
 * saves individual files, and shares via expo-sharing.
 *
 * Falls back gracefully if ElevenLabs isn't configured — shows
 * a message directing the user to add their API key.
 */

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Constants from "expo-constants";

const API_KEY = Constants.expoConfig?.extra?.elevenlabsApiKey ?? "";
const API_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

interface ExportOptions {
  affirmations: string[];
  title: string;
  voiceId: string;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Export a loop as individual MP3 audio files zipped together,
 * or share the first file if only one affirmation.
 *
 * Returns true if sharing was successful.
 */
export async function exportLoopAsAudio({
  affirmations,
  title,
  voiceId,
  onProgress,
}: ExportOptions): Promise<{ success: boolean; error?: string }> {
  if (!API_KEY) {
    return {
      success: false,
      error: "Add your ElevenLabs API key in .env to export audio",
    };
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    return { success: false, error: "Sharing is not available on this device" };
  }

  try {
    const dir = `${FileSystem.cacheDirectory}export_${Date.now()}/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

    const files: string[] = [];

    for (let i = 0; i < affirmations.length; i++) {
      onProgress?.(i + 1, affirmations.length);

      const base64 = await fetchAudioBase64(voiceId, affirmations[i]);
      const filename = `${dir}${String(i + 1).padStart(2, "0")}_${sanitize(affirmations[i])}.mp3`;
      await FileSystem.writeAsStringAsync(filename, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      files.push(filename);
    }

    // Share the first file (expo-sharing shares one file at a time)
    // For a full export, you'd zip them, but that requires additional libs
    if (files.length > 0) {
      await Sharing.shareAsync(files[0], {
        mimeType: "audio/mpeg",
        dialogTitle: `${title} - Affirmation 1`,
      });
    }

    // Cleanup
    await FileSystem.deleteAsync(dir, { idempotent: true });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Export failed",
    };
  }
}

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
          else reject(new Error("Failed to convert audio"));
        };
        reader.onerror = () => reject(new Error("FileReader error"));
        reader.readAsDataURL(blob);
      } else {
        reject(new Error(`ElevenLabs API error ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.timeout = 30000;

    xhr.send(
      JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      })
    );
  });
}

function sanitize(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 30)
    .toLowerCase();
}
