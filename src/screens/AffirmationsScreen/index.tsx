import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ScreenContainer,
  ScreenHeader,
} from "../../components";
import {
  colors,
  spacing,
  radius,
  typography,
  fonts,
} from "../../theme";
import { useAffirmationSpeech, useSpeechPlayer } from "../../hooks/useSpeech";
import { useUserProfile } from "../../context/UserProfileContext";
import { useRitual } from "../../context/RitualContext";
import { useProgress } from "../../context/ProgressContext";
import { generateIdentityScript } from "../../utils/generateIdentityScript";
import { precacheAudio } from "../../services/tts";
import { getGuideVoiceId } from "../../config/voices";

// ─── Storage Keys ─────────────────────────────────────────────

const ROBOTIC_KEY = "@futureyou_robotic_affirmations";
const MORNING_SCRIPT_KEY = "@futureyou_morning_script";
const NIGHT_SCRIPT_KEY = "@futureyou_night_script";
const SCRIPT_DATE_KEY = "@futureyou_script_date";
const DURATION_KEY = "@futureyou_affirm_duration";

// ─── Default Robotic Affirmations ─────────────────────────────

const DEFAULT_AFFIRMATIONS = [
  "I am exactly who I choose to be.",
  "I move with certainty and clarity.",
  "I attract wealth, respect, and alignment.",
  "I release what is not mine to carry.",
  "My standards are non-negotiable.",
];

// ─── Duration Options ─────────────────────────────────────────

const DURATION_OPTIONS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "30 min", seconds: 1800 },
];

// ─── Affirmation Editor Modal ─────────────────────────────────

const AffirmationEditorModal = React.memo(function AffirmationEditorModal({
  visible,
  affirmations,
  onSave,
  onClose,
}: {
  visible: boolean;
  affirmations: string[];
  onSave: (affirmations: string[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<string[]>([]);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    if (visible) {
      setItems([...affirmations]);
      setNewText("");
    }
  }, [visible, affirmations]);

  const updateItem = (index: number, text: string) => {
    const updated = [...items];
    updated[index] = text;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    const text = newText.trim();
    if (text && items.length < 10) {
      setItems([...items, text]);
      setNewText("");
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...items];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setItems(updated);
  };

  const moveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const updated = [...items];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setItems(updated);
  };

  const handleSave = () => {
    const valid = items.filter((a) => a.trim());
    if (valid.length > 0) onSave(valid);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={editorStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={editorStyles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={editorStyles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={editorStyles.headerTitle}>Edit Affirmations</Text>
          <Pressable onPress={handleSave} hitSlop={12}>
            <Text style={editorStyles.saveText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          style={editorStyles.scroll}
          contentContainerStyle={editorStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={editorStyles.hint}>
            Use present-tense identity language: "I am", "I choose", "I move"
          </Text>

          {items.map((text, i) => (
            <View key={i} style={editorStyles.row}>
              <View style={editorStyles.reorderBtns}>
                <Pressable onPress={() => moveUp(i)} style={editorStyles.reorderBtn} hitSlop={8}>
                  <Text style={editorStyles.reorderText}>↑</Text>
                </Pressable>
                <Pressable onPress={() => moveDown(i)} style={editorStyles.reorderBtn} hitSlop={8}>
                  <Text style={editorStyles.reorderText}>↓</Text>
                </Pressable>
              </View>
              <TextInput
                style={editorStyles.input}
                value={text}
                onChangeText={(t) => updateItem(i, t)}
                placeholder={`Affirmation ${i + 1}`}
                placeholderTextColor={colors.textMuted}
              />
              {items.length > 1 && (
                <Pressable onPress={() => removeItem(i)} hitSlop={8}>
                  <Text style={editorStyles.removeBtn}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}

          {items.length < 10 && (
            <View style={editorStyles.addRow}>
              <TextInput
                style={editorStyles.addInput}
                value={newText}
                onChangeText={setNewText}
                placeholder="Add new affirmation..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={addItem}
                returnKeyType="done"
              />
              <Pressable onPress={addItem} style={editorStyles.addBtn} hitSlop={8}>
                <Text style={editorStyles.addBtnText}>+</Text>
              </Pressable>
            </View>
          )}

          <Text style={editorStyles.countLabel}>
            {items.filter((a) => a.trim()).length} / 10 affirmations
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// ─── Main Affirm Screen ───────────────────────────────────────

export default function AffirmationsScreen() {
  const { profile } = useUserProfile();
  const { ritual, completeStep } = useRitual();
  const { startTracking } = useProgress();

  const guideId = profile.selectedGuideId;

  // All audio uses ElevenLabs via the selected guide
  const affirmSpeech = useAffirmationSpeech(guideId);
  const morningSpeech = useSpeechPlayer(
    profile.voiceSettings.visualizationVoice,
    guideId
  );
  const nightSpeech = useSpeechPlayer(
    profile.voiceSettings.visualizationVoice,
    guideId
  );

  // ─── State ──────────────────────────────────────────────────

  const [roboticAffirmations, setRoboticAffirmations] = useState<string[]>(DEFAULT_AFFIRMATIONS);
  const [selectedDuration, setSelectedDuration] = useState(0);
  const [showEditor, setShowEditor] = useState(false);

  const [morningScript, setMorningScript] = useState<string | null>(null);
  const [nightScript, setNightScript] = useState<string | null>(null);
  const [loadingMorning, setLoadingMorning] = useState(false);
  const [loadingNight, setLoadingNight] = useState(false);

  const trackingRef = useRef<(() => void) | null>(null);

  const isRoboticPlaying = affirmSpeech.status === "playing";
  const isMorningPlaying = morningSpeech.status === "playing";
  const isNightPlaying = nightSpeech.status === "playing";
  const isAnyPlaying = isRoboticPlaying || isMorningPlaying || isNightPlaying;

  // ─── Load persisted data ────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [storedAffirmations, storedMorning, storedNight, storedDate, storedDuration] =
          await Promise.all([
            AsyncStorage.getItem(ROBOTIC_KEY),
            AsyncStorage.getItem(MORNING_SCRIPT_KEY),
            AsyncStorage.getItem(NIGHT_SCRIPT_KEY),
            AsyncStorage.getItem(SCRIPT_DATE_KEY),
            AsyncStorage.getItem(DURATION_KEY),
          ]);

        if (storedAffirmations) {
          const parsed = JSON.parse(storedAffirmations);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRoboticAffirmations(parsed);
          }
        }

        if (storedDuration) {
          const idx = parseInt(storedDuration, 10);
          if (idx >= 0 && idx < DURATION_OPTIONS.length) {
            setSelectedDuration(idx);
          }
        }

        const today = new Date().toISOString().split("T")[0];
        if (storedDate === today) {
          if (storedMorning) setMorningScript(storedMorning);
          if (storedNight) setNightScript(storedNight);
        }
      } catch {}
    })();
  }, []);

  // ─── Precache affirmations on mount/change ──────────────────

  useEffect(() => {
    if (guideId && roboticAffirmations.length > 0) {
      const voiceId = getGuideVoiceId(guideId);
      precacheAudio(voiceId, roboticAffirmations);
    }
  }, [guideId, roboticAffirmations]);

  // ─── Save robotic affirmations ──────────────────────────────

  const saveAffirmations = useCallback((affirmations: string[]) => {
    setRoboticAffirmations(affirmations);
    AsyncStorage.setItem(ROBOTIC_KEY, JSON.stringify(affirmations)).catch(() => {});
    // Precache the new affirmations immediately
    if (guideId) {
      const voiceId = getGuideVoiceId(guideId);
      precacheAudio(voiceId, affirmations);
    }
  }, [guideId]);

  // ─── Generate morning script ────────────────────────────────

  const generateMorning = useCallback(async () => {
    setLoadingMorning(true);
    try {
      const script = await generateIdentityScript("morning", profile);
      setMorningScript(script);
      const today = new Date().toISOString().split("T")[0];
      await Promise.all([
        AsyncStorage.setItem(MORNING_SCRIPT_KEY, script),
        AsyncStorage.setItem(SCRIPT_DATE_KEY, today),
      ]);
    } catch (err) {
      console.warn("[Affirm] Morning script generation error:", err);
    } finally {
      setLoadingMorning(false);
    }
  }, [profile]);

  // ─── Generate night script ──────────────────────────────────

  const generateNight = useCallback(async () => {
    setLoadingNight(true);
    try {
      const script = await generateIdentityScript("night", profile);
      setNightScript(script);
      const today = new Date().toISOString().split("T")[0];
      await Promise.all([
        AsyncStorage.setItem(NIGHT_SCRIPT_KEY, script),
        AsyncStorage.setItem(SCRIPT_DATE_KEY, today),
      ]);
    } catch (err) {
      console.warn("[Affirm] Night script generation error:", err);
    } finally {
      setLoadingNight(false);
    }
  }, [profile]);

  // Auto-generate scripts on mount if not cached
  useEffect(() => {
    if (!morningScript && !loadingMorning) generateMorning();
  }, [morningScript, loadingMorning, generateMorning]);

  useEffect(() => {
    if (!nightScript && !loadingNight) generateNight();
  }, [nightScript, loadingNight, generateNight]);

  // ─── Playback Handlers ──────────────────────────────────────

  const stopAll = useCallback(() => {
    affirmSpeech.stop();
    morningSpeech.stop();
    nightSpeech.stop();
    if (trackingRef.current) {
      trackingRef.current();
      trackingRef.current = null;
    }
  }, [affirmSpeech, morningSpeech, nightSpeech]);

  const handlePlayMorning = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    if (isMorningPlaying) {
      stopAll();
      if (!ritual.steps.affirmation) completeStep("affirmation");
      return;
    }
    stopAll();
    if (!morningScript) { generateMorning(); return; }
    trackingRef.current = startTracking();
    morningSpeech.play(morningScript);
  }, [isMorningPlaying, morningScript, morningSpeech, stopAll, generateMorning, startTracking, ritual.steps.affirmation, completeStep]);

  const handlePlayRobotic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    if (isRoboticPlaying) {
      stopAll();
      if (!ritual.steps.affirmation) completeStep("affirmation");
      return;
    }
    stopAll();
    trackingRef.current = startTracking();
    const duration = DURATION_OPTIONS[selectedDuration].seconds;
    affirmSpeech.playLoop(roboticAffirmations, {
      pacing: "calm",
      durationSeconds: duration,
    });
  }, [isRoboticPlaying, roboticAffirmations, selectedDuration, affirmSpeech, stopAll, startTracking, ritual.steps.affirmation, completeStep]);

  const handlePlayNight = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    if (isNightPlaying) {
      stopAll();
      return;
    }
    stopAll();
    if (!nightScript) { generateNight(); return; }
    trackingRef.current = startTracking();
    nightSpeech.play(nightScript);
  }, [isNightPlaying, nightScript, nightSpeech, stopAll, generateNight, startTracking]);

  const handleDurationChange = useCallback((index: number) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    setSelectedDuration(index);
    AsyncStorage.setItem(DURATION_KEY, String(index)).catch(() => {});
  }, []);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <ScreenContainer orbActive={isAnyPlaying}>
      <ScreenHeader title="Affirm" subtitle="Your daily identity ritual" />

      {/* ═══════════════════════════════════════════════════════
          1. MORNING IDENTITY AUDIO
          ═══════════════════════════════════════════════════════ */}
      <View style={styles.sectionCard}>
        <LinearGradient
          colors={["rgba(255,138,43,0.08)", "rgba(255,138,43,0.02)", "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />

        <Text style={styles.sectionLabel}>MORNING</Text>
        <Text style={styles.sectionTitle}>Morning Identity Audio</Text>
        <Text style={styles.sectionSub}>
          AI-generated · present tense · 3-5 min
        </Text>

        {loadingMorning && !morningScript ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Generating your morning audio...</Text>
          </View>
        ) : (
          <Pressable
            onPress={handlePlayMorning}
            style={({ pressed }) => [styles.primaryCta, pressed && styles.ctaPressed]}
          >
            <LinearGradient
              colors={isMorningPlaying ? ["#3D3228", "#251C14"] : ["#FF8A2B", "#FFBA4A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.ctaText}>
              {isMorningPlaying ? "Stop" : "Play Morning Audio"}
            </Text>
          </Pressable>
        )}

        {isMorningPlaying && (
          <Text style={styles.statusText}>
            Speaking {morningSpeech.currentParagraph + 1} of {morningSpeech.totalParagraphs}
          </Text>
        )}

        {morningScript && !isMorningPlaying && (
          <Pressable onPress={() => { if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } generateMorning(); }} style={styles.regenerateBtn} hitSlop={8}>
            <Text style={styles.regenerateText}>Regenerate</Text>
          </Pressable>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════════
          2. ROBOTIC AFFIRMING
          ═══════════════════════════════════════════════════════ */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>CONDITIONING</Text>
        <Text style={styles.sectionTitle}>Robotic Affirming</Text>
        <Text style={styles.sectionSub}>
          Your affirmations · looped · {DURATION_OPTIONS[selectedDuration].label}
        </Text>

        {/* Affirmation preview */}
        <View style={styles.affirmationPreview}>
          {roboticAffirmations.map((text, i) => (
            <Text key={i} style={styles.affirmationLine}>{text}</Text>
          ))}
        </View>

        {/* Duration selector */}
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map((opt, i) => (
            <Pressable
              key={opt.label}
              onPress={() => handleDurationChange(i)}
              style={[styles.durationChip, selectedDuration === i && styles.durationChipActive]}
            >
              <Text style={[styles.durationText, selectedDuration === i && styles.durationTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Play CTA */}
        <Pressable
          onPress={handlePlayRobotic}
          style={({ pressed }) => [styles.primaryCta, pressed && styles.ctaPressed]}
        >
          <LinearGradient
            colors={isRoboticPlaying ? ["#3D3228", "#251C14"] : ["#FF8A2B", "#FFBA4A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.ctaText}>
            {isRoboticPlaying ? "Stop" : "Play Loop"}
          </Text>
        </Pressable>

        {isRoboticPlaying && (
          <Text style={styles.statusText}>
            Speaking {affirmSpeech.currentIndex + 1} of {roboticAffirmations.length}
          </Text>
        )}

        {/* Edit button */}
        <Pressable
          onPress={() => { if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } setShowEditor(true); }}
          style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
          hitSlop={8}
        >
          <Text style={styles.editBtnText}>Edit Affirmations</Text>
        </Pressable>
      </View>

      {/* ═══════════════════════════════════════════════════════
          3. NIGHT IDENTITY AUDIO
          ═══════════════════════════════════════════════════════ */}
      <View style={[styles.sectionCard, styles.nightCard]}>
        <Text style={styles.sectionLabel}>NIGHT</Text>
        <Text style={styles.sectionTitle}>Night Identity Audio</Text>
        <Text style={styles.sectionSub}>
          AI-generated · release & regulate · 10-15 min
        </Text>

        {loadingNight && !nightScript ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.textMuted} />
            <Text style={styles.loadingText}>Generating your night audio...</Text>
          </View>
        ) : (
          <Pressable
            onPress={handlePlayNight}
            style={({ pressed }) => [styles.nightCta, isNightPlaying && styles.nightCtaActive, pressed && styles.ctaPressed]}
          >
            <Text style={styles.nightCtaText}>
              {isNightPlaying ? "Stop" : "Play Night Audio"}
            </Text>
          </Pressable>
        )}

        {isNightPlaying && (
          <Text style={styles.statusText}>
            Speaking {nightSpeech.currentParagraph + 1} of {nightSpeech.totalParagraphs}
          </Text>
        )}

        {nightScript && !isNightPlaying && (
          <Pressable onPress={() => { if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } generateNight(); }} style={styles.regenerateBtn} hitSlop={8}>
            <Text style={styles.regenerateText}>Regenerate</Text>
          </Pressable>
        )}
      </View>

      {/* ─── Editor Modal ───────────────────────────────────── */}
      <AffirmationEditorModal
        visible={showEditor}
        affirmations={roboticAffirmations}
        onSave={saveAffirmations}
        onClose={() => setShowEditor(false)}
      />
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: radius.large,
    padding: spacing["2xl"],
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.12)",
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  nightCard: {
    borderColor: colors.border,
  },
  sectionLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headline,
    fontSize: 22,
    lineHeight: 30,
    marginBottom: spacing.xs,
  },
  sectionSub: {
    ...typography.editorial,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  primaryCta: {
    borderRadius: radius.pill,
    paddingVertical: spacing.lg + 2,
    alignItems: "center",
    overflow: "hidden",
  },
  ctaPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  ctaText: {
    ...typography.button,
    fontSize: 16,
    letterSpacing: 0.3,
    zIndex: 2,
  },
  nightCta: {
    borderRadius: radius.pill,
    paddingVertical: spacing.lg + 2,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  nightCtaActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  nightCtaText: {
    fontFamily: fonts.headline,
    fontSize: 15,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  statusText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textMuted,
  },
  regenerateBtn: {
    alignSelf: "center",
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  regenerateText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  affirmationPreview: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: radius.medium,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  affirmationLine: {
    ...typography.editorial,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  durationRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  durationChip: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  durationChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  durationText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  durationTextActive: {
    color: colors.primary,
  },
  editBtn: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  editBtnPressed: {
    opacity: 0.7,
  },
  editBtnText: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 0.3,
  },
});

// ─── Editor Modal Styles ──────────────────────────────────────

const editorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.headline,
    fontSize: 18,
  },
  cancelText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
  },
  saveText: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing["5xl"],
  },
  hint: {
    ...typography.editorial,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  reorderBtns: {
    gap: 2,
  },
  reorderBtn: {
    width: 24,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  input: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  removeBtn: {
    fontSize: 13,
    color: colors.textMuted,
    paddingLeft: spacing.sm,
  },
  addRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  addInput: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.medium,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 22,
    color: "#FFFFFF",
    marginTop: -1,
  },
  countLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.lg,
    textAlign: "center",
  },
});
