import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ScreenContainer, ScreenHeader } from "../../components";
import { colors, spacing, radius, typography, fonts } from "../../theme";
import { useSpeechPlayer } from "../../hooks/useSpeech";
import { useUserProfile } from "../../context/UserProfileContext";
import { useProgress } from "../../context/ProgressContext";
import { useSavedVisualizations } from "../../context/SavedVisualizationsContext";
import Constants from "expo-constants";
import type { UserProfile, SavedVisualization } from "../../types";
import { usePaywallGate } from "../../hooks/usePaywallGate";
import { PaywallModal } from "../../components/PaywallModal";

const API_KEY = Constants.expoConfig?.extra?.openaiApiKey ?? "";
const API_URL = "https://api.openai.com/v1/chat/completions";

const EXAMPLE_PROMPTS = [
  "Winning my tennis championship",
  "Moving into my dream apartment",
  "Feeling confident speaking in public",
  "Launching my successful business",
];

function buildSystemPrompt(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.name) parts.push(`Name: ${profile.name}`);
  if (profile.identityStatement) parts.push(`Their identity (their own words): "${profile.identityStatement}"`);
  if (profile.idealDay) parts.push(`Their dream life (their own words): "${profile.idealDay}"`);
  if (profile.career) parts.push(`Career/work: ${profile.career}`);
  if (profile.vibe) parts.push(`Energy/vibe: ${profile.vibe}`);
  const profileBlock = parts.join("\n");

  return `You write cinematic, deeply intimate guided visualizations. This is NOT meditation. This is identity immersion — like stepping into a film of someone's actual life.

ABOUT THIS PERSON:
${profileBlock || "No profile provided — make it vivid and universal."}

HYPER-PERSONALIZATION RULES (CRITICAL):
- Use their NAME throughout — say it at least 4-5 times across the visualization. Alternate between their name and "you."
- The scenario they provide is the FOUNDATION, but you must weave in details from their identity statement and dream life to make it feel like THEIR version of this scenario.
- Extract SPECIFIC imagery from their profile. If they say they're a "disciplined creator" — show their hands creating. If their dream life mentions a specific place or activity — build the scene there.
- Describe what THEY specifically see, feel, hear, touch, and smell in this moment — based on who they told you they are.
- Every paragraph should contain at least one detail that could ONLY apply to this person living this scenario.

STRICT RULES:
- Write ONLY in present tense: "${profile.name || "You"} step onto...", "You feel...", "You see..."
- NEVER use future language: "someday", "one day", "you will"
- NEVER start with "Close your eyes" or "Take a breath" — drop them IMMEDIATELY into the scene
- First sentence must be vivid, specific, and reference something about THEM or THEIR scenario
- The person IS living this right now — not imagining it

FORMAT:
- Write 7 to 10 scenes as separate paragraphs (no scene numbers or labels)
- Each scene is 2-4 sentences
- Spoken aloud at a calm pace = 5-8 minutes
- Start IN the scene — no preamble
- Build through escalating sensory and emotional detail
- End with deep integration: anchor this experience into their body and identity

TONE:
- Cinematic — like a Terrence Malick film narrated just for them
- Intimate — like someone whispering their truth into their ear
- Emotionally vivid — physical sensations, textures, temperatures, the weight of their body in this moment
- Flowing sentences with commas and dashes for natural speech rhythm — NOT short choppy lines
- This should feel so personal they get chills`;
}

function buildUserMessage(scenario: string, profile: UserProfile): string {
  const parts = [`Write an immersive visualization for this scenario: "${scenario}"`];

  if (profile.name) {
    parts.push(`The listener's name is ${profile.name} — use their name repeatedly throughout, not just "you."`);
  }

  if (profile.identityStatement) {
    parts.push(`Their identity: "${profile.identityStatement}" — weave elements of this identity naturally into how they experience this scenario.`);
  }

  if (profile.idealDay) {
    parts.push(`Their dream life: "${profile.idealDay}" — let details from this bleed into the sensory world of the visualization.`);
  }

  parts.push(
    "Drop them DIRECTLY into the scene. First sentence must be vivid, immediate, and reference something specific about them or the scenario. Build cinematic sensory detail — what they see, feel, hear, the temperature on their skin, the weight of their body. Make this so personal they feel like crying because of how seen they feel."
  );

  return parts.join(" ");
}

export default function VisualizationGeneratorScreen() {
  const { profile } = useUserProfile();
  const { startTracking } = useProgress();
  const { savedVisualizations, saveVisualization, removeVisualization, isSaved } =
    useSavedVisualizations();

  const speechPlayer = useSpeechPlayer(
    profile.voiceSettings.visualizationVoice,
    profile.selectedGuideId
  );

  const { gate, paywallVisible, featureName, hidePaywall } = usePaywallGate();

  const [prompt, setPrompt] = useState("");
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  // For viewing a saved visualization
  const [viewingSaved, setViewingSaved] = useState<SavedVisualization | null>(null);

  const isPlaying = speechPlayer.status === "playing";

  const handleGenerate = useCallback(async () => {
    const input = prompt.trim();
    if (!input) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setError(null);
    setGeneratedScript(null);
    setActivePrompt(input);
    setViewingSaved(null);

    try {
      if (!API_KEY || API_KEY === "your-api-key-here") {
        setGeneratedScript(getFallbackScript(input, profile));
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
            { role: "system", content: buildSystemPrompt(profile) },
            { role: "user", content: buildUserMessage(input, profile) },
          ],
          max_tokens: 1200,
          temperature: 0.92,
        }),
      });

      if (!response.ok) {
        setError("Could not generate visualization. Please try again.");
        return;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (content) {
        setGeneratedScript(content);
      } else {
        setGeneratedScript(getFallbackScript(input, profile));
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, profile]);

  const handlePlay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (generatedScript) {
      speechPlayer.play(generatedScript);
    }
  }, [generatedScript, speechPlayer]);

  const handleStop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    speechPlayer.stop();
  }, [speechPlayer]);

  const handleCreateAnother = useCallback(() => {
    speechPlayer.stop();
    setGeneratedScript(null);
    setActivePrompt(null);
    setViewingSaved(null);
    setPrompt("");
  }, [speechPlayer]);

  const handleExamplePress = useCallback((example: string) => {
    Haptics.selectionAsync();
    setPrompt(example);
  }, []);

  const handleSave = useCallback(() => {
    if (activePrompt && generatedScript) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      saveVisualization(activePrompt, generatedScript);
    }
  }, [activePrompt, generatedScript, saveVisualization]);

  const handleUnsave = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      removeVisualization(id);
    },
    [removeVisualization]
  );

  const handleOpenSaved = useCallback(
    (saved: SavedVisualization) => {
      speechPlayer.stop();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setViewingSaved(saved);
      setActivePrompt(saved.prompt);
      setGeneratedScript(saved.script);
      setPrompt("");
    },
    [speechPlayer]
  );

  const currentIsSaved =
    activePrompt && generatedScript
      ? isSaved(activePrompt, generatedScript)
      : false;

  // Show the result view when we have a script (even while playing)
  const showResult = generatedScript && !isGenerating;
  const showInput = !showResult;

  return (
    <ScreenContainer orbActive={isPlaying}>
      <ScreenHeader title="Visualize" subtitle="Create immersive experiences" />

      {/* Prompt input — only when no result */}
      {showInput && (
        <>
          <View style={styles.inputCard}>
            <LinearGradient
              colors={["rgba(255,138,43,0.06)", "transparent"]}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.inputLabel}>WHAT DO YOU WANT TO VISUALIZE?</Text>
            <TextInput
              style={styles.input}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Describe your scenario..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit
            />

            <Pressable
              onPress={() => gate(handleGenerate, "Visualization Generator")}
              style={({ pressed }) => [
                styles.generateCta,
                pressed && styles.ctaPressed,
                (!prompt.trim() || isGenerating) && styles.ctaDisabled,
              ]}
              disabled={!prompt.trim() || isGenerating}
            >
              <Text style={styles.ctaText}>
                {isGenerating ? "Generating..." : "Generate Visualization"}
              </Text>
            </Pressable>
          </View>

          {/* Example prompts */}
          {!isGenerating && (
            <View style={styles.examplesSection}>
              <Text style={styles.examplesLabel}>TRY THESE</Text>
              {EXAMPLE_PROMPTS.map((example) => (
                <Pressable
                  key={example}
                  onPress={() => handleExamplePress(example)}
                  style={({ pressed }) => [styles.exampleChip, pressed && styles.exampleChipPressed]}
                >
                  <Text style={styles.exampleText}>"{example}"</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Saved Library */}
          {savedVisualizations.length > 0 && !isGenerating && (
            <View style={styles.librarySection}>
              <Text style={styles.libraryLabel}>YOUR LIBRARY</Text>
              {savedVisualizations.map((saved) => (
                <Pressable
                  key={saved.id}
                  onPress={() => handleOpenSaved(saved)}
                  style={({ pressed }) => [
                    styles.savedCard,
                    pressed && styles.savedCardPressed,
                  ]}
                >
                  <LinearGradient
                    colors={["rgba(255,138,43,0.04)", "transparent"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.savedPrompt} numberOfLines={2}>
                    "{saved.prompt}"
                  </Text>
                  <Text style={styles.savedDate}>
                    {formatDate(saved.createdAt)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      {/* Loading */}
      {isGenerating && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Building your visualization...</Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Generated result — stays visible during playback */}
      {showResult && (
        <View style={styles.resultCard}>
          <LinearGradient
            colors={["rgba(255,138,43,0.08)", "rgba(255,138,43,0.02)", "transparent"]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Header row: prompt + save button */}
          <View style={styles.resultHeader}>
            <View style={styles.resultHeaderLeft}>
              {activePrompt && (
                <Text style={styles.promptReminder}>"{activePrompt}"</Text>
              )}
              <Text style={styles.resultLabel}>YOUR VISUALIZATION</Text>
            </View>

            {/* Save / Unsave button */}
            {!isPlaying && (
              <Pressable
                onPress={() => {
                  if (currentIsSaved && viewingSaved) {
                    handleUnsave(viewingSaved.id);
                    handleCreateAnother();
                  } else {
                    handleSave();
                  }
                }}
                style={({ pressed }) => [
                  styles.saveBtn,
                  currentIsSaved && styles.saveBtnActive,
                  pressed && styles.saveBtnPressed,
                ]}
                hitSlop={8}
              >
                <Text
                  style={[
                    styles.saveBtnText,
                    currentIsSaved && styles.saveBtnTextActive,
                  ]}
                >
                  {currentIsSaved ? "Saved" : "Save"}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Play / Stop buttons */}
          {!isPlaying ? (
            <Pressable
              onPress={handlePlay}
              style={({ pressed }) => [styles.playCta, pressed && styles.ctaPressed]}
            >
              <Text style={styles.ctaText}>Play Visualization</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleStop}
              style={({ pressed }) => [styles.stopCta, pressed && styles.ctaPressed]}
            >
              <Text style={styles.stopCtaText}>Stop</Text>
            </Pressable>
          )}

          {isPlaying && (
            <Text style={styles.statusText}>
              Speaking {speechPlayer.currentParagraph + 1} of {speechPlayer.totalParagraphs}
            </Text>
          )}

          {/* Script preview — numbered scenes */}
          <View style={styles.scriptPreview}>
            {generatedScript.split("\n\n").filter(Boolean).map((scene, i) => (
              <View key={i} style={styles.sceneBlock}>
                <Text style={styles.sceneLabel}>Scene {i + 1}</Text>
                <Text style={styles.sceneText}>{scene.trim()}</Text>
              </View>
            ))}
          </View>

          {/* Create another — only when not playing */}
          {!isPlaying && (
            <Pressable onPress={handleCreateAnother} style={styles.newBtn} hitSlop={8}>
              <Text style={styles.newBtnText}>Create Another</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={hidePaywall} featureName={featureName} />
    </ScreenContainer>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getFallbackScript(scenario: string, profile: UserProfile): string {
  const name = profile.name || "you";
  const identity = profile.identityStatement || "someone who moves with purpose and power";

  return `The door opens and ${name} steps through. The room is exactly how you designed it — warm light, clean surfaces, the quiet hum of a life built with intention.

You move through this space like it belongs to you. Because it does. Every object here reflects a choice you made. Every detail whispers back your identity: ${identity}.

${scenario}. You feel it in your chest first — that deep, calm certainty. Not excitement. Not anxiety. Just knowing. This is who you are.

Your hands are steady. Your breathing is slow. There is no rush because you are not chasing anything. You are already here. You have already arrived.

The people around you — they see it too. The way you carry yourself. The way your eyes hold steady. There is a gravity to you that draws respect without demanding it.

You pause. You take in this moment. Not as a fantasy but as a fact. This is the life you are choosing, and it is choosing you back.

Every step you take from here is rooted in this truth. You are ${identity}. Not becoming. Being. Right now. In this breath.

You open your eyes. The feeling stays.`;
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  inputCard: {
    borderRadius: radius.large,
    padding: spacing["2xl"],
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.1)",
    overflow: "hidden",
    backgroundColor: "rgba(13,9,6,0.9)",
  },
  inputLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.lg,
  },
  input: {
    ...typography.editorial,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: radius.medium,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    minHeight: 100,
    marginBottom: spacing.xl,
  },
  generateCta: {
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.7)",
    backgroundColor: "transparent",
    borderRadius: 28,
    paddingVertical: spacing.lg + 2,
    alignItems: "center",
    overflow: "hidden",
  },
  ctaPressed: {
    backgroundColor: colors.primaryMuted,
    transform: [{ scale: 0.97 }],
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    ...typography.button,
    fontSize: 16,
    letterSpacing: 0.3,
    color: colors.primary,
  },

  examplesSection: {
    marginBottom: spacing.xl,
  },
  examplesLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  exampleChip: {
    backgroundColor: "rgba(13,9,6,0.7)",
    borderRadius: radius.medium,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.06)",
  },
  exampleChipPressed: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  exampleText: {
    fontFamily: fonts.editorial,
    fontSize: 14,
    color: "rgba(255,240,225,0.6)",
    lineHeight: 20,
  },

  /* Saved Library */
  librarySection: {
    marginBottom: spacing.xl,
  },
  libraryLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primary,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  savedCard: {
    backgroundColor: "rgba(13,9,6,0.7)",
    borderRadius: radius.medium,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.1)",
    overflow: "hidden",
  },
  savedCardPressed: {
    backgroundColor: colors.primaryMuted,
    borderColor: "rgba(255,138,43,0.3)",
  },
  savedPrompt: {
    fontFamily: fonts.editorial,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  savedDate: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textMuted,
  },

  errorCard: {
    backgroundColor: "rgba(255,107,74,0.1)",
    borderRadius: radius.medium,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,107,74,0.2)",
  },
  errorText: {
    ...typography.body,
    fontSize: 14,
    color: colors.coral,
  },

  resultCard: {
    borderRadius: radius.large,
    padding: spacing["2xl"],
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.1)",
    overflow: "hidden",
    backgroundColor: "rgba(13,9,6,0.9)",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
  },
  resultHeaderLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  promptReminder: {
    fontFamily: fonts.editorial,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontStyle: "italic",
  },
  resultLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primary,
    textTransform: "uppercase",
  },

  /* Save button */
  saveBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.5)",
    borderRadius: 16,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    backgroundColor: "transparent",
  },
  saveBtnActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(255,138,43,0.12)",
  },
  saveBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
  saveBtnText: {
    fontFamily: fonts.headline,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  saveBtnTextActive: {
    color: colors.primary,
  },

  playCta: {
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.7)",
    backgroundColor: "transparent",
    borderRadius: 28,
    paddingVertical: spacing.lg + 2,
    alignItems: "center",
    overflow: "hidden",
  },
  stopCta: {
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.4)",
    backgroundColor: "rgba(255,138,43,0.08)",
    borderRadius: 28,
    paddingVertical: spacing.lg + 2,
    alignItems: "center",
    overflow: "hidden",
  },
  stopCtaText: {
    ...typography.button,
    fontSize: 16,
    letterSpacing: 0.3,
    color: colors.textSecondary,
  },
  statusText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  scriptPreview: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sceneBlock: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: radius.medium,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  sceneLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  sceneText: {
    fontFamily: fonts.editorial,
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,240,225,0.6)",
  },
  newBtn: {
    alignSelf: "center",
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  newBtnText: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 0.3,
  },
});
