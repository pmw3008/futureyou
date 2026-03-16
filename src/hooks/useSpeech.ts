import { useState, useCallback, useRef, useEffect } from "react";
import {
  speak,
  speakAffirmationLoop,
  stopSpeech,
  precacheAudio,
} from "../services/tts";
import type {
  VisualizationVoiceStyle,
  AffirmationPacing,
} from "../services/tts";
import { getGuideVoiceId } from "../config/voices";

export type SpeechStatus = "idle" | "playing" | "paused";

/**
 * Hook for playing visualization/identity scripts via ElevenLabs.
 * NO speech on mount — only when play() is called.
 */
export function useSpeechPlayer(
  voiceStyle: VisualizationVoiceStyle,
  guideId?: string
) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [totalParagraphs, setTotalParagraphs] = useState(0);
  const paragraphsRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);
  const isStoppedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopSpeech();
    };
  }, []);

  const speakFromParagraph = useCallback(
    (paragraphs: string[], startIndex: number) => {
      if (startIndex >= paragraphs.length) {
        if (isMountedRef.current) {
          setStatus("idle");
          setCurrentParagraph(0);
        }
        return;
      }

      if (isStoppedRef.current || !isMountedRef.current) return;

      setCurrentParagraph(startIndex);
      setStatus("playing");

      speak({
        text: paragraphs[startIndex],
        style: voiceStyle,
        guideId,
        onDone: () => {
          if (!isMountedRef.current || isStoppedRef.current) return;
          setTimeout(() => {
            if (isMountedRef.current && !isStoppedRef.current) {
              speakFromParagraph(paragraphs, startIndex + 1);
            }
          }, 1400);
        },
        onStopped: () => {},
        onError: () => {
          if (!isMountedRef.current || isStoppedRef.current) return;
          setTimeout(() => {
            if (isMountedRef.current && !isStoppedRef.current) {
              speakFromParagraph(paragraphs, startIndex + 1);
            }
          }, 500);
        },
      });
    },
    [voiceStyle, guideId]
  );

  const play = useCallback(
    (script: string) => {
      const paragraphs = script
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      paragraphsRef.current = paragraphs;
      setTotalParagraphs(paragraphs.length);
      isStoppedRef.current = false;

      // Precache the first few paragraphs for faster start
      if (guideId) {
        const voiceId = getGuideVoiceId(guideId);
        precacheAudio(voiceId, paragraphs.slice(0, 3));
      }

      speakFromParagraph(paragraphs, 0);
    },
    [speakFromParagraph, guideId]
  );

  const resume = useCallback(() => {
    if (
      paragraphsRef.current.length > 0 &&
      currentParagraph < paragraphsRef.current.length
    ) {
      isStoppedRef.current = false;
      speakFromParagraph(paragraphsRef.current, currentParagraph);
    }
  }, [currentParagraph, speakFromParagraph]);

  const pause = useCallback(() => {
    isStoppedRef.current = true;
    stopSpeech();
    setStatus("paused");
  }, []);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    stopSpeech();
    setStatus("idle");
    setCurrentParagraph(0);
  }, []);

  const togglePlayPause = useCallback(
    (script: string) => {
      if (status === "playing") {
        pause();
      } else if (status === "paused") {
        resume();
      } else {
        play(script);
      }
    },
    [status, play, pause, resume]
  );

  return {
    status,
    currentParagraph,
    totalParagraphs,
    play,
    pause,
    stop,
    resume,
    togglePlayPause,
  };
}

/**
 * Hook for playing affirmation loops via ElevenLabs (primary).
 * NO speech on mount — only when playLoop() is called.
 *
 * ALWAYS pass guideId so ElevenLabs is used.
 * Without guideId, falls back to device TTS (sounds bad).
 */
export function useAffirmationSpeech(guideId?: string) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopSpeech();
    };
  }, []);

  const precacheLoop = useCallback(
    (affirmations: string[]) => {
      if (!guideId) return;
      const voiceId = getGuideVoiceId(guideId);
      if (voiceId) {
        precacheAudio(voiceId, affirmations);
      }
    },
    [guideId]
  );

  const playLoop = useCallback(
    (
      affirmations: string[],
      options?: { pacing?: AffirmationPacing; durationSeconds?: number }
    ) => {
      if (affirmations.length === 0) return;

      // Instant UI feedback
      setStatus("playing");
      setCurrentIndex(0);

      // Use "human" style — guideId drives ElevenLabs voice selection
      speakAffirmationLoop(affirmations, "human", guideId, {
        pacing: options?.pacing,
        durationSeconds: options?.durationSeconds,
        onAffirmationStart: (index) => {
          if (isMountedRef.current) {
            setCurrentIndex(index);
          }
        },
        onAllDone: () => {
          if (isMountedRef.current) {
            setStatus("idle");
            setCurrentIndex(0);
          }
        },
        onError: () => {},
      });
    },
    [guideId]
  );

  const stop = useCallback(() => {
    stopSpeech();
    setStatus("idle");
    setCurrentIndex(0);
  }, []);

  return {
    status,
    currentIndex,
    playLoop,
    stop,
    precacheLoop,
  };
}
