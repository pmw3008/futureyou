import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
import { ScreenContainer, ScreenHeader } from "../../components";
import { colors, spacing, radius, typography, fonts } from "../../theme";
import { useAffirmationSpeech, useSpeechPlayer } from "../../hooks/useSpeech";
import { useUserProfile } from "../../context/UserProfileContext";
import { useRitual } from "../../context/RitualContext";
import { useProgress } from "../../context/ProgressContext";
import { generateIdentityScript } from "../../utils/generateIdentityScript";
import { precacheAudio } from "../../services/tts";
import { getGuideVoiceId } from "../../config/voices";
import { EVIDENCE_TYPES } from "../../types";
import type { EvidenceType } from "../../types";
import { usePaywallGate } from "../../hooks/usePaywallGate";
import { PaywallModal } from "../../components/PaywallModal";

// ─── Storage Keys ─────────────────────────────────────────────

const ROBOTIC_KEY = "@futureyou_robotic_affirmations";
const MORNING_SCRIPT_KEY = "@futureyou_morning_script";
const NIGHT_SCRIPT_KEY = "@futureyou_night_script";
const SCRIPT_DATE_KEY = "@futureyou_script_date";
const SCRIPT_PROFILE_HASH_KEY = "@futureyou_script_profile_hash";
const DURATION_KEY = "@futureyou_affirm_duration";

// ─── Defaults ─────────────────────────────────────────────────

const DEFAULT_AFFIRMATIONS = [
  "I move through the world with certainty.",
  "I am the version of myself who already lives this life.",
  "My standards shape my reality.",
  "I attract wealth, respect, and alignment.",
  "I release what is not mine to carry.",
];

const DURATION_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
];

/** Simple hash of identity fields to detect profile changes */
function getProfileHash(profile: { identityStatement: string; idealDay: string; name: string }): string {
  return [profile.name, profile.identityStatement, profile.idealDay].join("|");
}

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
      <KeyboardAvoidingView style={editorStyles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={editorStyles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={editorStyles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={editorStyles.headerTitle}>Edit Affirmations</Text>
          <Pressable onPress={handleSave} hitSlop={12}>
            <Text style={editorStyles.saveText}>Save</Text>
          </Pressable>
        </View>
        <ScrollView style={editorStyles.scroll} contentContainerStyle={editorStyles.scrollContent} keyboardShouldPersistTaps="handled">
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
              <TextInput style={editorStyles.input} value={text} onChangeText={(t) => updateItem(i, t)} placeholder={`Affirmation ${i + 1}`} placeholderTextColor={colors.textMuted} />
              {items.length > 1 && (
                <Pressable onPress={() => removeItem(i)} hitSlop={8}>
                  <Text style={editorStyles.removeBtn}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}
          {items.length < 10 && (
            <View style={editorStyles.addRow}>
              <TextInput style={editorStyles.addInput} value={newText} onChangeText={setNewText} placeholder="Add new affirmation..." placeholderTextColor={colors.textMuted} onSubmitEditing={addItem} returnKeyType="done" />
              <Pressable onPress={addItem} style={editorStyles.addBtn} hitSlop={8}>
                <Text style={editorStyles.addBtnText}>+</Text>
              </Pressable>
            </View>
          )}
          <Text style={editorStyles.countLabel}>{items.filter((a) => a.trim()).length} / 10 affirmations</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// ─── Main Daily Identity Screen ───────────────────────────────

export default function DailyIdentityScreen() {
  const { profile } = useUserProfile();
  const { today, ritual, completeStep, addEvidence, getStreak, evidence } = useRitual();
  const { startTracking } = useProgress();

  const { gate, paywallVisible, featureName, hidePaywall } = usePaywallGate();

  const guideId = profile.selectedGuideId;

  // Audio hooks — all use ElevenLabs via guide
  const affirmSpeech = useAffirmationSpeech(guideId);
  const morningSpeech = useSpeechPlayer(profile.voiceSettings.visualizationVoice, guideId);
  const nightSpeech = useSpeechPlayer(profile.voiceSettings.visualizationVoice, guideId);

  // ─── State ──────────────────────────────────────────────────

  const [roboticAffirmations, setRoboticAffirmations] = useState<string[]>(DEFAULT_AFFIRMATIONS);
  const [selectedDuration, setSelectedDuration] = useState(1); // default 3 min
  const [showEditor, setShowEditor] = useState(false);

  const [morningScript, setMorningScript] = useState<string | null>(null);
  const [nightScript, setNightScript] = useState<string | null>(null);
  const [loadingMorning, setLoadingMorning] = useState(false);
  const [loadingNight, setLoadingNight] = useState(false);

  // Night reflection form
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionType, setReflectionType] = useState<EvidenceType>("manifestation");
  const [reflectionTitle, setReflectionTitle] = useState("");
  const [reflectionBody, setReflectionBody] = useState("");

  // Track whether initial load is done to prevent double-generation
  const initialLoadDone = useRef(false);
  const generatingMorning = useRef(false);
  const generatingNight = useRef(false);

  const trackingRef = useRef<(() => void) | null>(null);

  const isRoboticPlaying = affirmSpeech.status === "playing";
  const isMorningPlaying = morningSpeech.status === "playing";
  const isNightPlaying = nightSpeech.status === "playing";
  const isAnyPlaying = isRoboticPlaying || isMorningPlaying || isNightPlaying;

  const streak = useMemo(() => getStreak(), [getStreak, evidence]);

  // ─── Load persisted data ────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [storedAffirmations, storedMorning, storedNight, storedDate, storedDuration, storedHash] =
          await Promise.all([
            AsyncStorage.getItem(ROBOTIC_KEY),
            AsyncStorage.getItem(MORNING_SCRIPT_KEY),
            AsyncStorage.getItem(NIGHT_SCRIPT_KEY),
            AsyncStorage.getItem(SCRIPT_DATE_KEY),
            AsyncStorage.getItem(DURATION_KEY),
            AsyncStorage.getItem(SCRIPT_PROFILE_HASH_KEY),
          ]);

        if (storedAffirmations) {
          const parsed = JSON.parse(storedAffirmations);
          if (Array.isArray(parsed) && parsed.length > 0) setRoboticAffirmations(parsed);
        }
        if (storedDuration) {
          const idx = parseInt(storedDuration, 10);
          if (idx >= 0 && idx < DURATION_OPTIONS.length) setSelectedDuration(idx);
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const currentHash = getProfileHash(profile);

        // Only use cached scripts if same day AND same profile
        if (storedDate === todayStr && storedHash === currentHash) {
          if (storedMorning) setMorningScript(storedMorning);
          if (storedNight) setNightScript(storedNight);
        }
      } catch {}
      initialLoadDone.current = true;
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Precache affirmations
  useEffect(() => {
    if (guideId && roboticAffirmations.length > 0) {
      const voiceId = getGuideVoiceId(guideId);
      precacheAudio(voiceId, roboticAffirmations);
    }
  }, [guideId, roboticAffirmations]);

  // ─── Clear cached scripts when profile identity changes ────

  const profileHash = getProfileHash(profile);
  const prevHashRef = useRef(profileHash);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (prevHashRef.current !== profileHash) {
      // Profile changed — invalidate scripts so they regenerate
      prevHashRef.current = profileHash;
      setMorningScript(null);
      setNightScript(null);
      // Clear storage too
      AsyncStorage.multiRemove([MORNING_SCRIPT_KEY, NIGHT_SCRIPT_KEY, SCRIPT_DATE_KEY, SCRIPT_PROFILE_HASH_KEY]).catch(() => {});
    }
  }, [profileHash]);

  // ─── Affirmation persistence ────────────────────────────────

  const saveAffirmations = useCallback((affirmations: string[]) => {
    setRoboticAffirmations(affirmations);
    AsyncStorage.setItem(ROBOTIC_KEY, JSON.stringify(affirmations)).catch(() => {});
    if (guideId) {
      const voiceId = getGuideVoiceId(guideId);
      precacheAudio(voiceId, affirmations);
    }
  }, [guideId]);

  // ─── Script generation ──────────────────────────────────────

  const generateMorning = useCallback(async () => {
    if (generatingMorning.current) return;
    generatingMorning.current = true;
    setLoadingMorning(true);
    try {
      const script = await generateIdentityScript("morning", profile);
      setMorningScript(script);
      const todayStr = new Date().toISOString().split("T")[0];
      const hash = getProfileHash(profile);
      await Promise.all([
        AsyncStorage.setItem(MORNING_SCRIPT_KEY, script),
        AsyncStorage.setItem(SCRIPT_DATE_KEY, todayStr),
        AsyncStorage.setItem(SCRIPT_PROFILE_HASH_KEY, hash),
      ]);
    } catch (err) {
      console.warn("[DailyIdentity] Morning generation error:", err);
    } finally {
      setLoadingMorning(false);
      generatingMorning.current = false;
    }
  }, [profile]);

  const generateNight = useCallback(async () => {
    if (generatingNight.current) return;
    generatingNight.current = true;
    setLoadingNight(true);
    try {
      const script = await generateIdentityScript("night", profile);
      setNightScript(script);
      const todayStr = new Date().toISOString().split("T")[0];
      const hash = getProfileHash(profile);
      await Promise.all([
        AsyncStorage.setItem(NIGHT_SCRIPT_KEY, script),
        AsyncStorage.setItem(SCRIPT_DATE_KEY, todayStr),
        AsyncStorage.setItem(SCRIPT_PROFILE_HASH_KEY, hash),
      ]);
    } catch (err) {
      console.warn("[DailyIdentity] Night generation error:", err);
    } finally {
      setLoadingNight(false);
      generatingNight.current = false;
    }
  }, [profile]);

  // Auto-generate scripts when they're null (after load or profile change)
  useEffect(() => {
    if (initialLoadDone.current && !morningScript && !loadingMorning && !generatingMorning.current) {
      generateMorning();
    }
  }, [morningScript, loadingMorning, generateMorning]);

  useEffect(() => {
    if (initialLoadDone.current && !nightScript && !loadingNight && !generatingNight.current) {
      generateNight();
    }
  }, [nightScript, loadingNight, generateNight]);

  // ─── Playback ───────────────────────────────────────────────

  const stopAll = useCallback(() => {
    affirmSpeech.stop();
    morningSpeech.stop();
    nightSpeech.stop();
    if (trackingRef.current) { trackingRef.current(); trackingRef.current = null; }
  }, [affirmSpeech, morningSpeech, nightSpeech]);

  const handlePlayMorningAudio = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isMorningPlaying) { stopAll(); if (!ritual.steps.visualization) completeStep("visualization"); return; }
    stopAll();
    if (!morningScript) { generateMorning(); return; }
    trackingRef.current = startTracking();
    morningSpeech.play(morningScript);
  }, [isMorningPlaying, morningScript, morningSpeech, stopAll, generateMorning, startTracking, ritual.steps.visualization, completeStep]);

  const handlePlayRobotic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRoboticPlaying) { stopAll(); if (!ritual.steps.affirmation) completeStep("affirmation"); return; }
    stopAll();
    trackingRef.current = startTracking();
    affirmSpeech.playLoop(roboticAffirmations, { pacing: "calm", durationSeconds: DURATION_OPTIONS[selectedDuration].seconds });
  }, [isRoboticPlaying, roboticAffirmations, selectedDuration, affirmSpeech, stopAll, startTracking, ritual.steps.affirmation, completeStep]);

  const handlePlayNight = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isNightPlaying) { stopAll(); return; }
    stopAll();
    if (!nightScript) { generateNight(); return; }
    trackingRef.current = startTracking();
    nightSpeech.play(nightScript);
  }, [isNightPlaying, nightScript, nightSpeech, stopAll, generateNight, startTracking]);

  const handleLogReflection = useCallback(() => {
    if (reflectionTitle.trim() && reflectionBody.trim()) {
      addEvidence({ type: reflectionType, title: reflectionTitle.trim(), body: reflectionBody.trim() });
      setReflectionTitle("");
      setReflectionBody("");
      setShowReflection(false);
      if (!ritual.steps.evidence) completeStep("evidence");
    }
  }, [reflectionType, reflectionTitle, reflectionBody, addEvidence, ritual.steps.evidence, completeStep]);

  // ─── Time greeting ──────────────────────────────────────────

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Good afternoon,";
    return "Good evening,";
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <ScreenContainer orbActive={isAnyPlaying}>
      {/* Streak Hero */}
      <View style={styles.streakHero}>
        <LinearGradient colors={["rgba(255,138,43,0.12)", "rgba(255,138,43,0.03)", "transparent"]} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.streakGreeting}>{getTimeGreeting()} {profile.name || "You"}</Text>
        <Text style={styles.streakNumber}>Day {streak || 1}</Text>
        <Text style={styles.streakLabel}>of living as your chosen identity</Text>

        {/* 7-day dots */}
        <View style={styles.streakDots}>
          {Array.from({ length: 7 }).map((_, i) => {
            const dayOffset = 6 - i;
            const date = new Date();
            date.setDate(date.getDate() - dayOffset);
            const dateStr = date.toISOString().split("T")[0];
            const hasEvidence = evidence.some(
              (e) => e.date.split("T")[0] === dateStr
            );
            return (
              <View
                key={i}
                style={[styles.streakDot, hasEvidence && styles.streakDotActive]}
              />
            );
          })}
        </View>
      </View>

      {/* Identity statement */}
      {profile.identityStatement ? (
        <View style={styles.identityCard}>
          <LinearGradient colors={["#120A05", "#180E06", "#0D0704"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <View style={styles.identityGlow} />
          <View style={styles.identityContent}>
            <Text style={styles.identityLabel}>YOUR IDENTITY</Text>
            <Text style={styles.identityStatement}>"{profile.identityStatement}"</Text>
          </View>
        </View>
      ) : null}

      {/* ═══════════════════════════════════════════════════════
          MORNING
          ═══════════════════════════════════════════════════════ */}
      <View style={styles.sectionCard}>
        <LinearGradient colors={["rgba(255,138,43,0.08)", "rgba(255,138,43,0.02)", "transparent"]} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.sectionLabel}>MORNING</Text>
        <Text style={styles.sectionTitle}>Morning Visualization</Text>
        <Text style={styles.sectionSub}>
          AI-generated from your identity · 3-5 min
        </Text>

        {loadingMorning && !morningScript ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Generating your morning audio...</Text>
          </View>
        ) : (
          <Pressable onPress={() => gate(handlePlayMorningAudio, "Morning Visualization")} style={({ pressed }) => [styles.primaryCta, isMorningPlaying && styles.primaryCtaActive, pressed && styles.ctaPressed]}>
            <Text style={[styles.ctaText, isMorningPlaying && styles.ctaTextMuted]}>
              {isMorningPlaying ? "Stop" : ritual.steps.visualization ? "Replay Morning Audio" : "Play Morning Audio"}
            </Text>
          </Pressable>
        )}

        {isMorningPlaying && (
          <Text style={styles.statusText}>Speaking {morningSpeech.currentParagraph + 1} of {morningSpeech.totalParagraphs}</Text>
        )}

        {/* Script preview — stays visible during playback */}
        {morningScript && (
          <View style={styles.scriptPreview}>
            <Text style={[styles.scriptPreviewText, isMorningPlaying && styles.scriptPreviewActive]} numberOfLines={isMorningPlaying ? undefined : 4}>{morningScript}</Text>
          </View>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════════
          DAY REINFORCEMENT
          ═══════════════════════════════════════════════════════ */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>DAY</Text>
        <Text style={styles.sectionTitle}>Robotic Affirming</Text>
        <Text style={styles.sectionSub}>
          Loop affirmations to impress the subconscious
        </Text>
        <Text style={styles.sectionSubDetail}>
          {DURATION_OPTIONS[selectedDuration].label} · looped
        </Text>

        {/* Affirmation preview */}
        <View style={styles.affirmationPreview}>
          {roboticAffirmations.map((text, i) => (
            <Text key={i} style={styles.affirmationLine}>{text}</Text>
          ))}
        </View>

        {/* Duration */}
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map((opt, i) => (
            <Pressable
              key={opt.label}
              onPress={() => { Haptics.selectionAsync(); setSelectedDuration(i); AsyncStorage.setItem(DURATION_KEY, String(i)).catch(() => {}); }}
              style={[styles.durationChip, selectedDuration === i && styles.durationChipActive]}
            >
              <Text style={[styles.durationText, selectedDuration === i && styles.durationTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Play */}
        <Pressable onPress={() => gate(handlePlayRobotic, "Affirmation Loop")} style={({ pressed }) => [styles.primaryCta, isRoboticPlaying && styles.primaryCtaActive, pressed && styles.ctaPressed]}>
          <Text style={[styles.ctaText, isRoboticPlaying && styles.ctaTextMuted]}>{isRoboticPlaying ? "Stop" : "Play Loop"}</Text>
        </Pressable>

        {isRoboticPlaying && (
          <Text style={styles.statusText}>Speaking {affirmSpeech.currentIndex + 1} of {roboticAffirmations.length}</Text>
        )}

        {/* Edit */}
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowEditor(true); }} style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]} hitSlop={8}>
          <Text style={styles.editBtnText}>Edit Affirmations</Text>
        </Pressable>
      </View>

      {/* ═══════════════════════════════════════════════════════
          NIGHT REFLECTION
          ═══════════════════════════════════════════════════════ */}
      <View style={[styles.sectionCard, styles.nightCard]}>
        <Text style={styles.sectionLabel}>NIGHT</Text>
        <Text style={styles.sectionTitle}>Night Reflection</Text>
        <Text style={styles.sectionSub}>
          Log evidence your life is shifting · then sleep with your night audio
        </Text>

        {/* Reflection form */}
        {showReflection ? (
          <View style={styles.reflectionForm}>
            <View style={styles.typeRow}>
              {EVIDENCE_TYPES.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => { Haptics.selectionAsync(); setReflectionType(t.id); }}
                  style={[styles.typeChip, reflectionType === t.id && styles.typeChipActive]}
                >
                  <Text style={[styles.typeChipText, reflectionType === t.id && styles.typeChipTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.reflectionInput}
              value={reflectionTitle}
              onChangeText={setReflectionTitle}
              placeholder="What happened?"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.reflectionInput, styles.reflectionTextArea]}
              value={reflectionBody}
              onChangeText={setReflectionBody}
              placeholder="Describe the moment..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <Pressable onPress={handleLogReflection} style={({ pressed }) => [styles.primaryCta, pressed && styles.ctaPressed]}>
              <Text style={styles.ctaText}>Log Reflection</Text>
            </Pressable>
            <Pressable onPress={() => setShowReflection(false)} style={styles.cancelReflectionBtn} hitSlop={8}>
              <Text style={styles.cancelReflectionText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => gate(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowReflection(true); }, "Night Reflection")}
            style={({ pressed }) => [styles.secondaryCta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.secondaryCtaText}>
              {ritual.steps.evidence ? "Add Another Reflection" : "Log Tonight's Reflection"}
            </Text>
          </Pressable>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionSubtitle}>Night Visualization</Text>
        <Text style={styles.sectionSub}>
          AI-generated · calm & immersive · 8-12 min
        </Text>

        {loadingNight && !nightScript ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.textMuted} />
            <Text style={styles.loadingText}>Generating your night audio...</Text>
          </View>
        ) : (
          <Pressable onPress={() => gate(handlePlayNight, "Night Visualization")} style={({ pressed }) => [styles.nightCta, isNightPlaying && styles.nightCtaActive, pressed && styles.ctaPressed]}>
            <Text style={styles.nightCtaText}>{isNightPlaying ? "Stop" : "Play Night Audio"}</Text>
          </Pressable>
        )}

        {isNightPlaying && (
          <Text style={styles.statusText}>Speaking {nightSpeech.currentParagraph + 1} of {nightSpeech.totalParagraphs}</Text>
        )}

        {/* Script preview — stays visible during playback */}
        {nightScript && (
          <View style={styles.scriptPreview}>
            <Text style={[styles.scriptPreviewText, isNightPlaying && styles.scriptPreviewActive]} numberOfLines={isNightPlaying ? undefined : 4}>{nightScript}</Text>
          </View>
        )}
      </View>

      {/* Editor Modal */}
      <AffirmationEditorModal visible={showEditor} affirmations={roboticAffirmations} onSave={saveAffirmations} onClose={() => setShowEditor(false)} />

      {/* Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={hidePaywall} featureName={featureName} />
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  /* Streak Hero */
  streakHero: { alignItems: "center", paddingVertical: spacing["2xl"], paddingHorizontal: spacing.xl, marginBottom: spacing.xl, borderRadius: radius.large, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,138,43,0.12)", backgroundColor: "rgba(13,9,6,0.8)" },
  streakGreeting: { fontFamily: fonts.body, fontSize: 14, color: "rgba(255,240,225,0.6)", marginBottom: spacing.md },
  streakNumber: { fontFamily: fonts.editorial, fontSize: 52, color: colors.primary, lineHeight: 58 },
  streakLabel: { fontFamily: fonts.body, fontSize: 14, color: "rgba(255,240,225,0.55)", marginBottom: spacing.lg },
  streakDots: { flexDirection: "row", gap: spacing.sm },
  streakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,138,43,0.15)", borderWidth: 1, borderColor: "rgba(255,138,43,0.2)" },
  streakDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  identityCard: { borderRadius: radius.large, overflow: "hidden", marginBottom: spacing["2xl"], borderWidth: 1, borderColor: "rgba(255,138,43,0.15)" },
  identityGlow: { position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "#FF8A2B", opacity: 0.06 },
  identityContent: { padding: spacing["2xl"] },
  identityLabel: { fontFamily: fonts.body, fontSize: 11, letterSpacing: 2.5, color: colors.primary, textTransform: "uppercase", marginBottom: spacing.lg },
  identityStatement: { fontFamily: fonts.editorial, fontSize: 20, lineHeight: 30, color: "#FFFFFF" },

  sectionCard: { borderRadius: radius.large, padding: spacing["2xl"], marginBottom: spacing.xl, borderWidth: 1, borderColor: "rgba(255,138,43,0.08)", overflow: "hidden", backgroundColor: "rgba(13,9,6,0.8)" },
  nightCard: { borderColor: "rgba(255,255,255,0.03)" },
  sectionLabel: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 3, color: "rgba(255,138,43,0.4)", textTransform: "uppercase", marginBottom: spacing.md },
  sectionTitle: { ...typography.headline, fontSize: 22, lineHeight: 30, marginBottom: spacing.xs },
  sectionSubtitle: { ...typography.headline, fontSize: 17, lineHeight: 24, marginBottom: spacing.xs },
  sectionSub: { fontFamily: fonts.body, fontSize: 14, color: "rgba(255,240,225,0.6)", marginBottom: spacing.xl, lineHeight: 20 },
  sectionSubDetail: { fontFamily: fonts.body, fontSize: 12, color: "rgba(255,240,225,0.45)", marginBottom: spacing.xl, marginTop: -spacing.lg },

  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: spacing.xl },

  primaryCta: { borderRadius: 28, paddingVertical: spacing.lg + 2, alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,138,43,0.7)", backgroundColor: "transparent" },
  primaryCtaActive: { borderColor: colors.neutralGray },
  ctaPressed: { backgroundColor: colors.primaryMuted, transform: [{ scale: 0.97 }] },
  ctaText: { ...typography.button, fontSize: 16, letterSpacing: 0.3, color: colors.primary },
  ctaTextMuted: { color: colors.textSecondary },

  secondaryCta: { borderRadius: radius.pill, paddingVertical: spacing.lg, alignItems: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
  secondaryCtaText: { fontFamily: fonts.headline, fontSize: 15, color: colors.textSecondary, letterSpacing: 0.3 },

  nightCta: { borderRadius: radius.pill, paddingVertical: spacing.lg + 2, alignItems: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
  nightCtaActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  nightCtaText: { fontFamily: fonts.headline, fontSize: 15, color: colors.textSecondary, letterSpacing: 0.3 },

  statusText: { ...typography.caption, fontSize: 13, color: colors.primary, textAlign: "center", marginTop: spacing.md },
  loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: spacing.xl, gap: spacing.md },
  loadingText: { ...typography.caption, fontSize: 13, color: colors.textMuted },

  scriptPreview: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: radius.medium, padding: spacing.lg, marginTop: spacing.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  scriptPreviewText: { fontFamily: fonts.editorial, fontSize: 13, lineHeight: 20, color: "rgba(255,240,225,0.5)" },
  scriptPreviewActive: { color: "rgba(255,240,225,0.7)", fontSize: 15, lineHeight: 24 },

  affirmationPreview: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: radius.medium, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  affirmationLine: { fontFamily: fonts.editorial, fontSize: 14, lineHeight: 22, color: "rgba(255,240,225,0.6)", marginBottom: spacing.xs },

  durationRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  durationChip: { flex: 1, paddingVertical: spacing.sm + 2, alignItems: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  durationChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  durationText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  durationTextActive: { color: colors.primary },

  editBtn: { alignItems: "center", paddingVertical: spacing.lg, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  editBtnPressed: { opacity: 0.7 },
  editBtnText: { fontFamily: fonts.headline, fontSize: 14, color: colors.primary, letterSpacing: 0.3 },

  // Night reflection form
  reflectionForm: { marginBottom: spacing.md },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  typeChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
  typeChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  typeChipText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  typeChipTextActive: { color: colors.primary },
  reflectionInput: { ...typography.body, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.surfaceMuted, borderRadius: radius.medium, padding: spacing.lg, borderWidth: 0.5, borderColor: colors.border, marginBottom: spacing.md },
  reflectionTextArea: { minHeight: 80, textAlignVertical: "top" },
  cancelReflectionBtn: { alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.sm },
  cancelReflectionText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});

// ─── Editor Styles ────────────────────────────────────────────

const editorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { ...typography.headline, fontSize: 18 },
  cancelText: { fontFamily: fonts.body, fontSize: 16, color: colors.textSecondary },
  saveText: { fontFamily: fonts.headline, fontSize: 16, color: colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing["5xl"] },
  hint: { ...typography.editorial, fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 20 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.medium, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  reorderBtns: { gap: 2 },
  reorderBtn: { width: 24, height: 20, alignItems: "center", justifyContent: "center" },
  reorderText: { fontSize: 12, color: colors.textMuted },
  input: { ...typography.body, fontSize: 14, color: colors.textPrimary, flex: 1, paddingVertical: spacing.sm },
  removeBtn: { fontSize: 13, color: colors.textMuted, paddingLeft: spacing.sm },
  addRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  addInput: { ...typography.body, fontSize: 14, color: colors.textPrimary, flex: 1, backgroundColor: colors.surface, borderRadius: radius.medium, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border },
  addBtn: { width: 48, height: 48, borderRadius: radius.medium, borderWidth: 1, borderColor: "rgba(255,138,43,0.7)", backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  addBtnText: { fontSize: 22, color: colors.primary, marginTop: -1 },
  countLabel: { ...typography.caption, fontSize: 12, color: colors.textMuted, marginTop: spacing.lg, textAlign: "center" },
});
