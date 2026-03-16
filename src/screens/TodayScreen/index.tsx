import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScreenContainer,
  Card,
  Button,
  SectionLabel,
} from "../../components";
import {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  fonts,
} from "../../theme";
import { useUserProfile } from "../../context/UserProfileContext";
import { useRitual } from "../../context/RitualContext";
import { useAffirmationSpeech } from "../../hooks/useSpeech";
import { VIBE_OPTIONS, RITUAL_STEPS, EVIDENCE_TYPES } from "../../types";
import type { RitualStep, EvidenceType } from "../../types";
import { getAssignedVisualization } from "../../config/visualizations";
import { getAssignedAffirmationSet } from "../../config/affirmations";
import VisualizationPlayerScreen from "../VisualizationPlayerScreen";

export default function TodayScreen() {
  const { profile } = useUserProfile();
  const {
    today,
    ritual,
    completeStep,
    completedCount,
    totalSteps,
    standard,
    setStandard,
    addEvidence,
  } = useRitual();

  const vibeInfo = VIBE_OPTIONS.find((v) => v.id === profile.vibe);

  // Content assignments
  const todayViz = useMemo(
    () => getAssignedVisualization(profile.vibe, today),
    [profile.vibe, today]
  );
  const todayAffirmation = useMemo(
    () => getAssignedAffirmationSet(profile.vibe, today),
    [profile.vibe, today]
  );

  // Player state
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerMode, setPlayerMode] = useState<"listen" | "read">("listen");

  // Affirmation speech — uses ElevenLabs via selected guide
  const affirmationSpeech = useAffirmationSpeech(
    profile.selectedGuideId
  );

  // Standard form state
  const [showStandardForm, setShowStandardForm] = useState(false);
  const [tempFocus, setTempFocus] = useState(standard?.focus ?? "");
  const [tempAction, setTempAction] = useState(standard?.action ?? "");
  const [tempStandard, setTempStandard] = useState(standard?.standard ?? "");
  const [tempReframe, setTempReframe] = useState(standard?.reframe ?? "");

  // Evidence form state
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("manifestation");
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceBody, setEvidenceBody] = useState("");

  // Find next uncompleted step
  const nextStep = useMemo(() => {
    return RITUAL_STEPS.find((s) => !ritual.steps[s.id]) ?? null;
  }, [ritual.steps]);

  if (showPlayer) {
    return (
      <VisualizationPlayerScreen
        visualization={todayViz}
        onBack={() => {
          setShowPlayer(false);
          if (!ritual.steps.visualization) {
            completeStep("visualization");
          }
        }}
        initialMode={playerMode}
      />
    );
  }

  const handleSaveStandard = () => {
    if (tempFocus.trim() && tempAction.trim() && tempStandard.trim() && tempReframe.trim()) {
      setStandard({
        focus: tempFocus.trim(),
        action: tempAction.trim(),
        standard: tempStandard.trim(),
        reframe: tempReframe.trim(),
      });
      setShowStandardForm(false);
    }
  };

  const handleLogEvidence = () => {
    if (evidenceTitle.trim() && evidenceBody.trim()) {
      addEvidence({
        type: evidenceType,
        title: evidenceTitle.trim(),
        body: evidenceBody.trim(),
      });
      setEvidenceTitle("");
      setEvidenceBody("");
      setShowEvidenceForm(false);
    }
  };

  const handlePlayAffirmation = () => {
    if (affirmationSpeech.status === "playing") {
      affirmationSpeech.stop();
      if (!ritual.steps.affirmation) {
        completeStep("affirmation");
      }
    } else {
      affirmationSpeech.playLoop(todayAffirmation.affirmations);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Good afternoon,";
    return "Good evening,";
  };

  const renderStepCard = (step: typeof RITUAL_STEPS[number], index: number) => {
    const isCompleted = ritual.steps[step.id];
    const isNext = nextStep?.id === step.id;

    return (
      <View key={step.id} style={[styles.stepCard, isNext && styles.stepCardActive]}>
        {isNext && (
          <LinearGradient
            colors={["rgba(255,138,43,0.08)", "rgba(255,138,43,0.02)"]}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        <View style={styles.stepHeader}>
          <View style={styles.stepLeft}>
            <View
              style={[
                styles.stepDot,
                isCompleted && styles.stepDotComplete,
                isNext && styles.stepDotActive,
              ]}
            >
              {isCompleted ? (
                <Text style={styles.stepCheck}>✓</Text>
              ) : (
                <Text style={styles.stepNumber}>{index + 1}</Text>
              )}
            </View>
            <View style={styles.stepInfo}>
              <Text
                style={[
                  styles.stepTitle,
                  isCompleted && styles.stepTitleComplete,
                ]}
              >
                {step.title}
              </Text>
              {!isCompleted && (
                <Text style={styles.stepDescription}>{step.description}</Text>
              )}
            </View>
          </View>
          {isCompleted && (
            <Text style={styles.stepCompleteBadge}>Done</Text>
          )}
        </View>

        {/* Expanded content for the next step */}
        {isNext && renderStepContent(step.id)}
      </View>
    );
  };

  const renderStepContent = (stepId: RitualStep) => {
    switch (stepId) {
      case "visualization":
        return (
          <View style={styles.stepContent}>
            <Text style={styles.contentTitle}>{todayViz.title}</Text>
            <Text style={styles.contentSub}>{todayViz.description}</Text>
            {vibeInfo && (
              <Text style={styles.contentWhy}>
                Assigned for your {vibeInfo.label} energy
              </Text>
            )}
            <View style={styles.contentActions}>
              <Button
                label="Listen"
                style={styles.contentBtn}
                onPress={() => {
                  setPlayerMode("listen");
                  setShowPlayer(true);
                }}
              />
              <Button
                label="Read"
                variant="outline"
                style={styles.contentBtn}
                onPress={() => {
                  setPlayerMode("read");
                  setShowPlayer(true);
                }}
              />
            </View>
          </View>
        );

      case "affirmation":
        return (
          <View style={styles.stepContent}>
            <Text style={styles.contentTitle}>{todayAffirmation.title}</Text>
            <Text style={styles.contentSub}>
              {todayAffirmation.affirmations.length} affirmations · {todayAffirmation.duration}
            </Text>
            <Button
              label={
                affirmationSpeech.status === "playing"
                  ? "Stop Loop"
                  : "Speak Loop"
              }
              onPress={handlePlayAffirmation}
            />
            {affirmationSpeech.status === "playing" && (
              <Text style={styles.playingStatus}>
                Speaking {affirmationSpeech.currentIndex + 1} of{" "}
                {todayAffirmation.affirmations.length}
              </Text>
            )}
          </View>
        );

      case "standard":
        if (showStandardForm) {
          return (
            <View style={styles.stepContent}>
              {[
                { label: "Today's focus", value: tempFocus, set: setTempFocus, placeholder: "What am I focused on today?" },
                { label: "One action", value: tempAction, set: setTempAction, placeholder: "One thing I will do today" },
                { label: "My standard", value: tempStandard, set: setTempStandard, placeholder: "The standard I'm holding today" },
                { label: "If I doubt", value: tempReframe, set: setTempReframe, placeholder: "If I feel doubt, I'll remember..." },
              ].map((field) => (
                <View key={field.label} style={styles.formField}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={field.value}
                    onChangeText={field.set}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ))}
              <Button label="Set My Standard" onPress={handleSaveStandard} />
            </View>
          );
        }
        return (
          <View style={styles.stepContent}>
            <Text style={styles.contentSub}>
              Define your focus, action, standard, and reframe for today.
            </Text>
            <Button
              label="Set Today's Standard"
              onPress={() => setShowStandardForm(true)}
            />
          </View>
        );

      case "evidence":
        if (showEvidenceForm) {
          return (
            <View style={styles.stepContent}>
              <View style={styles.typeRow}>
                {EVIDENCE_TYPES.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => setEvidenceType(t.id)}
                    style={[
                      styles.typeChip,
                      evidenceType === t.id && styles.typeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        evidenceType === t.id && styles.typeChipTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.formInput}
                value={evidenceTitle}
                onChangeText={setEvidenceTitle}
                placeholder="What happened?"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={evidenceBody}
                onChangeText={setEvidenceBody}
                placeholder="Describe the moment..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Button label="Log Evidence" onPress={handleLogEvidence} />
            </View>
          );
        }
        return (
          <View style={styles.stepContent}>
            <Text style={styles.contentSub}>
              What shifted for you today? Capture proof your reality is changing.
            </Text>
            <Button
              label="Log Evidence"
              onPress={() => setShowEvidenceForm(true)}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScreenContainer>
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>{getTimeGreeting()}</Text>
        <Text style={styles.greetingName}>{profile.name}</Text>
      </View>

      {/* Identity Card */}
      <View style={styles.identityCard}>
        <LinearGradient
          colors={["#110E08", "#150F08", "#0A0704"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.identityGlow} />
        <View style={styles.identityContent}>
          <Text style={styles.identityLabel}>YOUR IDENTITY</Text>
          <Text style={styles.identityStatement}>
            "{profile.identityStatement}"
          </Text>
          {vibeInfo && (
            <View style={styles.vibeBadge}>
              <Text style={styles.vibeText}>{vibeInfo.label}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDots}>
          {RITUAL_STEPS.map((step) => (
            <View
              key={step.id}
              style={[
                styles.progressDot,
                ritual.steps[step.id] && styles.progressDotComplete,
                nextStep?.id === step.id && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          {completedCount} of {totalSteps} rituals complete
        </Text>
      </View>

      {/* Today's Standard (if set) */}
      {standard && (
        <View style={styles.standardBanner}>
          <Text style={styles.standardLabel}>TODAY'S FOCUS</Text>
          <Text style={styles.standardValue}>{standard.focus}</Text>
        </View>
      )}

      {/* Ritual Steps */}
      {RITUAL_STEPS.map((step, index) => renderStepCard(step, index))}

      {/* All Complete */}
      {completedCount === totalSteps && (
        <View style={styles.allCompleteCard}>
          <LinearGradient
            colors={["rgba(255,138,43,0.12)", "rgba(255,212,138,0.06)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginBottom: spacing.md }} />
          <Text style={styles.allCompleteTitle}>Ritual Complete</Text>
          <Text style={styles.allCompleteBody}>
            You showed up for yourself today. Every ritual strengthens who you're becoming.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greetingContainer: { marginBottom: spacing.xl },
  greeting: {
    ...typography.body,
    fontSize: 16,
    color: colors.textSecondary,
  },
  greetingName: {
    ...typography.display,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.8,
  },

  identityCard: {
    borderRadius: radius.large,
    overflow: "hidden",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.15)",
    ...shadows.medium,
  },
  identityGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FF8A2B",
    opacity: 0.06,
  },
  identityContent: { padding: spacing["2xl"] },
  identityLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 2.5,
    color: colors.primary,
    textTransform: "uppercase",
    marginBottom: spacing.lg,
  },
  identityStatement: {
    fontFamily: fonts.editorial,
    fontSize: 20,
    lineHeight: 30,
    color: "#FFFFFF",
    marginBottom: spacing.xl,
  },
  vibeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,138,43,0.1)",
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.15)",
  },
  vibeEmoji: { fontSize: 14, marginRight: spacing.xs },
  vibeText: { fontFamily: fonts.body, fontSize: 12, color: colors.primary },

  // Progress
  progressContainer: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  progressDots: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warmBeige,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressDotComplete: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressDotActive: {
    backgroundColor: "transparent",
    borderColor: colors.primary,
    borderWidth: 2,
  },
  progressText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textMuted,
  },

  // Standard banner
  standardBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  standardLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primary,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  standardValue: {
    ...typography.body,
    fontSize: 15,
    color: colors.textPrimary,
  },

  // Step cards
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  stepCardActive: {
    borderColor: "rgba(255,138,43,0.3)",
    ...shadows.glow,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warmBeige,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepDotComplete: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotActive: {
    backgroundColor: "transparent",
    borderColor: colors.primary,
    borderWidth: 2,
  },
  stepCheck: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: "#FFFFFF",
  },
  stepNumber: {
    fontFamily: fonts.headline,
    fontSize: 13,
    color: colors.textMuted,
  },
  stepInfo: { flex: 1 },
  stepTitle: {
    ...typography.headline,
    fontSize: 16,
  },
  stepTitleComplete: {
    color: colors.textSecondary,
  },
  stepDescription: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepCompleteBadge: {
    fontFamily: fonts.headline,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Step content (expanded)
  stepContent: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contentTitle: {
    ...typography.headline,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  contentSub: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  contentWhy: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing.xl,
  },
  contentActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  contentBtn: { flex: 1 },
  playingStatus: {
    ...typography.caption,
    fontSize: 13,
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.md,
  },

  // Standard form
  formField: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    ...typography.label,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  formInput: {
    ...typography.body,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.medium,
    padding: spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Evidence type chips
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  typeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  typeChipText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: colors.primary,
  },

  // All complete
  allCompleteCard: {
    borderRadius: radius.large,
    padding: spacing["3xl"],
    alignItems: "center",
    overflow: "hidden",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.2)",
  },
  allCompleteEmoji: {
    fontSize: 32,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  allCompleteTitle: {
    ...typography.headline,
    fontSize: 22,
    marginBottom: spacing.sm,
  },
  allCompleteBody: {
    ...typography.editorial,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 23,
  },
});
