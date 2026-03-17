/**
 * TasteScreen
 *
 * The "micro-transformation" — shown after onboarding, before paywall.
 * Generates a short visualization from the user's dream life input,
 * plays 20-30 seconds of it, then fades out and triggers the paywall.
 *
 * Psychology: Users must FEEL the transformation before they pay.
 * The brain hates unfinished experiences — hearing your dream life
 * narrated and then cut off creates powerful purchase motivation.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { colors, spacing, radius, fonts } from "../../theme";
import { useUserProfile } from "../../context/UserProfileContext";
import { getGuideVoiceId } from "../../config/voices";
import { speakWithElevenLabs, stopElevenLabs } from "../../services/elevenlabs";

const API_KEY = Constants.expoConfig?.extra?.openaiApiKey ?? "";
const API_URL = "https://api.openai.com/v1/chat/completions";

/** How many seconds of audio to play before fading out */
const TASTE_DURATION_MS = 25000; // 25 seconds

interface TasteScreenProps {
  onComplete: () => void;
}

type Phase = "generating" | "playing" | "fading" | "done";

function buildTastePrompt(name: string, identityStatement: string, idealDay: string): string {
  return `You write cinematic, deeply intimate guided visualizations in SECOND PERSON ("you"). Write a short, powerful visualization (3-4 paragraphs only) for someone stepping into their dream life RIGHT NOW.

ABOUT THIS PERSON:
Their identity: "${identityStatement || "someone becoming their highest self"}"
Their dream life: "${idealDay || "waking up with freedom, purpose, and abundance"}"

RULES:
- Write ENTIRELY in second person: "you wake up", "you feel", "you see". NEVER use the person's name — only "you"
- Present tense ONLY — they ARE living this right now
- First sentence drops them IMMEDIATELY into a vivid scene from their dream life
- Build through escalating sensory detail — what they see, feel, hear, the temperature, textures
- Make it so personal they get chills
- This should feel like a film of THEIR specific life, not generic motivation
- End mid-scene — leave them wanting more. The last sentence should feel like it's building toward something incredible but doesn't resolve
- Write 3-4 short paragraphs, each 2-3 sentences
- Flowing sentences with natural speech rhythm`;
}

export default function TasteScreen({ onComplete }: TasteScreenProps) {
  const { profile } = useUserProfile();
  const [phase, setPhase] = useState<Phase>("generating");
  const [script, setScript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const cutoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
      if (cutoffTimer.current) clearTimeout(cutoffTimer.current);
      stopElevenLabs();
    };
  }, []);

  // Generate the visualization on mount
  useEffect(() => {
    (async () => {
      try {
        const prompt = buildTastePrompt(
          profile.name,
          profile.identityStatement,
          profile.idealDay
        );

        if (!API_KEY || API_KEY === "your-api-key-here") {
          // Fallback script for dev
          const fallback = getFallbackTasteScript(profile.name, profile.identityStatement, profile.idealDay);
          if (mounted.current) {
            setScript(fallback);
            setPhase("playing");
          }
          return;
        }

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: prompt },
              {
                role: "user",
                content: `Write the visualization now. Drop the listener directly into the most vivid scene of their dream life using only "you" — never their name. Make it cinematic and deeply personal. End mid-moment — leave them desperate to hear more.`,
              },
            ],
            max_tokens: 500,
            temperature: 0.92,
          }),
        });

        if (!response.ok) throw new Error("API error");

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();

        if (content && mounted.current) {
          setScript(content);
          setPhase("playing");
        } else {
          throw new Error("No content");
        }
      } catch {
        if (mounted.current) {
          // Use fallback on error
          const fallback = getFallbackTasteScript(profile.name, profile.identityStatement, profile.idealDay);
          setScript(fallback);
          setPhase("playing");
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track whether timer and audio have each completed
  const timerDone = useRef(false);
  const audioDone = useRef(false);

  const handleFadeOut = useCallback(() => {
    setPhase("fading");
    stopElevenLabs();

    // Haptics only supported on native platforms
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    // Fade in the "continue" overlay
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      if (mounted.current) {
        setPhase("done");
      }
    });
  }, [fadeAnim]);

  const tryFadeOut = useCallback(() => {
    // Only fade out when BOTH audio has finished AND minimum time has passed
    if (timerDone.current && audioDone.current && mounted.current) {
      handleFadeOut();
    }
  }, [handleFadeOut]);

  // When phase becomes "playing", start audio + cutoff timer
  useEffect(() => {
    if (phase !== "playing" || !script) return;

    timerDone.current = false;
    audioDone.current = false;

    // Fade in the text
    Animated.timing(textFadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Start ElevenLabs audio
    const voiceId = getGuideVoiceId(profile.selectedGuideId);
    // Only speak the first 2 paragraphs for the taste
    const paragraphs = script.split("\n\n").filter(Boolean);
    const tasteText = paragraphs.slice(0, 2).join("\n\n");

    speakWithElevenLabs({
      text: tasteText,
      voiceId,
      onDone: () => {
        audioDone.current = true;
        tryFadeOut();
      },
      onError: () => {
        audioDone.current = true;
        tryFadeOut();
      },
    }).catch(() => {
      audioDone.current = true;
      tryFadeOut();
    });

    // Set minimum time before fade-out can happen
    cutoffTimer.current = setTimeout(() => {
      if (!mounted.current) return;
      timerDone.current = true;
      tryFadeOut();
    }, TASTE_DURATION_MS);
  }, [phase, script]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = useCallback(() => {
    // Haptics only supported on native platforms
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    stopElevenLabs();
    onComplete();
  }, [onComplete]);

  // Skip — user can tap "skip" to go straight to paywall
  const handleSkip = useCallback(() => {
    if (cutoffTimer.current) clearTimeout(cutoffTimer.current);
    stopElevenLabs();
    onComplete();
  }, [onComplete]);

  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#000000", "#0D0906", "#080504", "#000000"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Warm ambient glow */}
      <View style={s.ambientGlow}>
        <LinearGradient
          colors={[
            "rgba(229,80,26,0.15)",
            "rgba(255,138,43,0.06)",
            "transparent",
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        {/* Generating state */}
        {phase === "generating" && (
          <View style={s.centerContent}>
            <View style={s.generatingPulse}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={s.generatingTitle}>Creating your vision</Text>
            <Text style={s.generatingSubtitle}>
              Building a personalized visualization{"\n"}from your dream life...
            </Text>
          </View>
        )}

        {/* Playing / Fading states */}
        {(phase === "playing" || phase === "fading" || phase === "done") && (
          <View style={s.playingContent}>
            {/* Now playing indicator */}
            <View style={s.nowPlaying}>
              <View style={[s.pulseOrb, phase === "fading" && s.pulseOrbFading]} />
              <Text style={s.nowPlayingText}>
                {phase === "playing" ? "NOW PLAYING" : ""}
              </Text>
            </View>

            <Text style={s.playingTitle}>Your Future Life</Text>

            {/* Script text — fades in */}
            <Animated.View style={[s.scriptContainer, { opacity: textFadeAnim }]}>
              {script &&
                script
                  .split("\n\n")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((paragraph, i) => (
                    <Text key={i} style={s.scriptText}>
                      {paragraph.trim()}
                    </Text>
                  ))}
            </Animated.View>

            {/* Fade-out overlay — covers everything when audio ends */}
            <Animated.View
              style={[s.fadeOverlay, { opacity: fadeAnim }]}
              pointerEvents={phase === "done" ? "auto" : "none"}
            >
              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(0,0,0,0.6)",
                  "rgba(0,0,0,0.95)",
                  "#000000",
                ]}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={s.fadeContent}>
                <Text style={s.fadeTitle}>Your story doesn't{"\n"}end here.</Text>
                <Text style={s.fadeSubtitle}>
                  Unlock your full personalized ritual
                </Text>

                <Pressable
                  onPress={handleContinue}
                  style={({ pressed }) => [
                    s.continueBtn,
                    pressed && s.continueBtnPressed,
                  ]}
                >
                  <LinearGradient
                    colors={["#FF8A2B", "#E5501A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={s.continueBtnText}>Continue</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Skip — subtle, bottom */}
            {phase === "playing" && (
              <Pressable onPress={handleSkip} style={s.skipBtn} hitSlop={16}>
                <Text style={s.skipText}>Skip</Text>
              </Pressable>
            )}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function getFallbackTasteScript(name: string, identity: string, dreamLife: string): string {
  const id = identity || "someone who moves with quiet power and certainty";
  const dream = dreamLife || "freedom, abundance, and deep creative fulfillment";

  return `The morning light pours through floor-to-ceiling windows, and you are already awake. Not from an alarm. From that quiet internal knowing that today matters. Your body feels strong, rested, aligned. The space around you reflects exactly who you have become: ${id}.

You move through your morning with the kind of calm that only comes from knowing you are exactly where you are meant to be. This is what ${dream} actually feels like — not as a fantasy, but as the texture of an ordinary Tuesday in your life. The coffee is perfect. The silence is chosen. Every detail whispers back your identity.

Your phone lights up — not with noise, but with evidence. People reaching out. Opportunities arriving. They see what you already know about yourself. There is a gravity to you now, a magnetism that you did not manufacture. It grew from the inside out, from every morning you chose to show up as this version of yourself...`;
}

// ─── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  ambientGlow: {
    position: "absolute",
    width: "140%",
    height: "40%",
    top: 0,
    left: "-20%",
    borderRadius: 9999,
    overflow: "hidden",
    opacity: 0.9,
  },
  safe: {
    flex: 1,
  },

  /* Generating */
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["2xl"],
  },
  generatingPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,138,43,0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  generatingTitle: {
    fontFamily: fonts.editorial,
    fontSize: 28,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  generatingSubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: "rgba(255,240,225,0.5)",
    textAlign: "center",
    lineHeight: 22,
  },

  /* Playing */
  playingContent: {
    flex: 1,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing["3xl"],
  },
  nowPlaying: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  pulseOrb: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  pulseOrbFading: {
    opacity: 0.3,
  },
  nowPlayingText: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 3,
    color: "rgba(255,138,43,0.5)",
    textTransform: "uppercase",
  },
  playingTitle: {
    fontFamily: fonts.editorial,
    fontSize: 36,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: spacing["2xl"],
  },

  /* Script text */
  scriptContainer: {
    gap: spacing.xl,
  },
  scriptText: {
    fontFamily: fonts.editorial,
    fontSize: 17,
    lineHeight: 28,
    color: "rgba(255,240,225,0.65)",
  },

  /* Fade overlay */
  fadeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  fadeContent: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["4xl"],
    alignItems: "center",
  },
  fadeTitle: {
    fontFamily: fonts.editorial,
    fontSize: 32,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    lineHeight: 38,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  fadeSubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: "rgba(255,240,225,0.5)",
    textAlign: "center",
    marginBottom: spacing["2xl"],
  },
  continueBtn: {
    width: "100%",
    borderRadius: 28,
    paddingVertical: spacing.lg + 4,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    minHeight: 56,
  },
  continueBtnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  continueBtnText: {
    fontFamily: fonts.headline,
    fontSize: 17,
    color: "#000000",
    letterSpacing: 0.5,
  },

  /* Skip */
  skipBtn: {
    position: "absolute",
    bottom: spacing.xl,
    alignSelf: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,240,225,0.2)",
    letterSpacing: 0.5,
  },
});
