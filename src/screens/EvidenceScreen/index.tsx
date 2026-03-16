import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  ScreenContainer,
  ScreenHeader,
} from "../../components";
import { colors, spacing, radius, typography, fonts } from "../../theme";
import { useRitual } from "../../context/RitualContext";
import { useUserProfile } from "../../context/UserProfileContext";
import { useCustomLoops } from "../../context/CustomLoopsContext";
import type { EvidenceEntry } from "../../types";
import { generateAffirmationFromEvidence } from "../../utils/generateAffirmation";
import { usePaywallGate } from "../../hooks/usePaywallGate";
import { PaywallModal } from "../../components/PaywallModal";

// ─── Prompt Starters ──────────────────────────────────────────

const PROMPT_STARTERS = [
  "I showed up for\u2026",
  "I chose differently when\u2026",
  "I noticed I\u2026",
  "Today I proved\u2026",
];

// ─── Timeline Entry Component ─────────────────────────────────

function TimelineEntry({
  entry,
  isFirst,
  onDelete,
}: {
  entry: EvidenceEntry;
  isFirst: boolean;
  onDelete: (id: string) => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDelete(true);
  }, []);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete this proof entry?",
      undefined,
      [
        { text: "Cancel", style: "cancel", onPress: () => setShowDelete(false) },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete(entry.id);
          },
        },
      ]
    );
  }, [entry.id, onDelete]);

  return (
    <Pressable
      onLongPress={handleLongPress}
      onPress={() => showDelete && setShowDelete(false)}
      style={({ pressed }) => [
        s.entryCard,
        isFirst && s.entryCardFirst,
        pressed && !showDelete && s.entryCardPressed,
      ]}
    >
      <LinearGradient
        colors={[
          isFirst ? "rgba(255,138,43,0.06)" : "rgba(255,138,43,0.02)",
          "transparent",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Warm accent line on left */}
      <View style={[s.entryAccent, isFirst && s.entryAccentActive]} />

      <View style={s.entryContent}>
        <Text style={s.entryBody}>{entry.body}</Text>
      </View>

      {/* Delete affordance — appears on long press */}
      {showDelete && (
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [s.deleteBtn, pressed && s.deleteBtnPressed]}
          hitSlop={12}
        >
          <Text style={s.deleteBtnText}>{"\u00D7"}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────

export default function EvidenceScreen() {
  const { evidence, addEvidence, removeEvidence, getStreak, todayEvidenceCount } = useRitual();
  const { profile } = useUserProfile();
  const { customLoops, addLoop, updateLoop } = useCustomLoops();

  const { gate, paywallVisible, featureName, hidePaywall } = usePaywallGate();

  const [body, setBody] = useState("");

  // AI affirmation generation state
  const [generatedAffirmation, setGeneratedAffirmation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [affirmationSaved, setAffirmationSaved] = useState(false);

  const streak = useMemo(() => getStreak(), [getStreak]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: { date: string; label: string; entries: EvidenceEntry[] }[] = [];
    const seen = new Set<string>();

    for (const entry of evidence) {
      if (!seen.has(entry.date)) {
        seen.add(entry.date);
        const d = new Date(entry.date + "T12:00:00");
        const today = new Date();
        const isToday =
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear();
        const label = isToday
          ? "Today"
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        groups.push({
          date: entry.date,
          label,
          entries: evidence.filter((e) => e.date === entry.date),
        });
      }
    }
    return groups;
  }, [evidence]);

  // Last 7 days for streak dots
  const last7Days = useMemo(() => {
    const dateSet = new Set(evidence.map((e) => e.date));
    const days: boolean[] = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const check = new Date(d);
      check.setDate(d.getDate() - i);
      const key = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, "0")}-${String(check.getDate()).padStart(2, "0")}`;
      days.push(dateSet.has(key));
    }
    return days;
  }, [evidence]);

  const handleLog = async () => {
    const text = body.trim();
    if (!text) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const entry: Omit<EvidenceEntry, "id" | "date"> = {
      type: "identity-proof",
      title: text.length > 60 ? text.slice(0, 60) + "..." : text,
      body: text,
    };
    addEvidence(entry);

    // Generate an affirmation from this evidence
    setIsGenerating(true);
    setGeneratedAffirmation(null);
    setAffirmationSaved(false);
    try {
      const fullEntry: EvidenceEntry = {
        ...entry,
        id: "temp",
        date: new Date().toISOString().slice(0, 10),
      };
      const affirmation = await generateAffirmationFromEvidence(fullEntry, profile);
      setGeneratedAffirmation(affirmation);
    } catch {
      setGeneratedAffirmation(null);
    }
    setIsGenerating(false);

    setBody("");
  };

  const handleSaveAffirmation = () => {
    if (!generatedAffirmation) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const existing = customLoops.find((l) => l.title === "From My Evidence");
    if (existing) {
      const updated = [...existing.affirmations, generatedAffirmation];
      updateLoop(existing.id, { affirmations: updated });
    } else {
      addLoop({
        title: "From My Evidence",
        subtitle: "Affirmations born from real proof",
        affirmations: [generatedAffirmation],
        duration: "3 min",
      });
    }

    setAffirmationSaved(true);
  };

  const handlePromptChip = useCallback((starter: string) => {
    Haptics.selectionAsync();
    setBody(starter);
  }, []);

  const handleDeleteEntry = useCallback((id: string) => {
    removeEvidence(id);
  }, [removeEvidence]);

  return (
    <ScreenContainer>
      {/* ── Header ────────────────────────────────────────────── */}
      <View style={s.heroHeader}>
        <Text style={s.heroTitle}>Proof</Text>
        <Text style={s.heroSubtitle}>
          Document the moments that prove you're already becoming who you said you'd be.
        </Text>
      </View>

      {/* ── Streak ────────────────────────────────────────────── */}
      <View style={s.streakCard}>
        <LinearGradient
          colors={["rgba(255,138,43,0.10)", "rgba(229,80,26,0.04)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={s.streakInner}>
          <View style={s.streakLeft}>
            <Text style={s.streakValue}>{streak}</Text>
            <Text style={s.streakLabel}>day streak</Text>
          </View>
          <View style={s.streakRight}>
            <View style={s.streakDots}>
              {last7Days.map((active, i) => (
                <View
                  key={i}
                  style={[s.dot, active && s.dotActive]}
                />
              ))}
            </View>
            <Text style={s.streakCaption}>
              {todayEvidenceCount > 0
                ? `${todayEvidenceCount} logged today`
                : "nothing yet today"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Log Form ──────────────────────────────────────────── */}
      <View style={s.logCard}>
        <LinearGradient
          colors={["rgba(255,138,43,0.08)", "rgba(255,186,74,0.03)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Decorative glow orb */}
        <View style={s.logGlowOrb} />

        <Text style={s.inputLabel}>WHAT PROOF DID YOU NOTICE?</Text>
        <TextInput
          style={s.textInput}
          value={body}
          onChangeText={setBody}
          placeholder="A sign, a shift, a moment of courage..."
          placeholderTextColor="rgba(122,106,88,0.6)"
          multiline
          textAlignVertical="top"
        />

        {/* Prompt starters */}
        {!body.trim() && (
          <View style={s.promptChips}>
            {PROMPT_STARTERS.map((starter) => (
              <Pressable
                key={starter}
                onPress={() => handlePromptChip(starter)}
                style={({ pressed }) => [s.promptChip, pressed && s.promptChipPressed]}
              >
                <Text style={s.promptChipText}>{starter}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => gate(handleLog, "Log Proof")}
          style={({ pressed }) => [
            s.logBtn,
            pressed && s.logBtnPressed,
            !body.trim() && s.logBtnDisabled,
          ]}
          disabled={!body.trim()}
        >
          <LinearGradient
            colors={
              body.trim()
                ? ["rgba(255,138,43,0.15)", "rgba(229,80,26,0.08)"]
                : ["transparent", "transparent"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={[s.logBtnText, !body.trim() && s.logBtnTextDisabled]}>
            Log Proof
          </Text>
        </Pressable>
      </View>

      {/* ── Generated Affirmation ─────────────────────────────── */}
      {isGenerating && (
        <View style={s.genCard}>
          <LinearGradient
            colors={["rgba(255,138,43,0.06)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.genRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={s.genLabel}>Transforming proof into affirmation...</Text>
          </View>
        </View>
      )}

      {generatedAffirmation && !isGenerating && (
        <View style={s.affirmCard}>
          <LinearGradient
            colors={["rgba(255,138,43,0.12)", "rgba(229,80,26,0.06)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Warm glow accent */}
          <View style={s.affirmGlow} />

          <Text style={s.affirmLabel}>YOUR PROOF BECAME AN AFFIRMATION</Text>
          <Text style={s.affirmText}>{generatedAffirmation}</Text>

          {affirmationSaved ? (
            <View style={s.savedIndicator}>
              <View style={s.savedDot} />
              <Text style={s.affirmSaved}>Added to your loop</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleSaveAffirmation}
              style={({ pressed }) => [s.saveBtn, pressed && s.saveBtnPressed]}
            >
              <LinearGradient
                colors={["rgba(255,138,43,0.12)", "rgba(255,138,43,0.04)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={s.saveBtnText}>Save to Loop</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── Timeline ──────────────────────────────────────────── */}
      {groupedEntries.length > 0 && (
        <View style={s.timelineSection}>
          <View style={s.timelineHeader}>
            <View style={s.timelineLine} />
            <Text style={s.timelineTitle}>TIMELINE</Text>
            <View style={s.timelineLine} />
          </View>

          {groupedEntries.map((group) => (
            <View key={group.date} style={s.dateGroup}>
              <Text style={s.dateLabel}>{group.label}</Text>
              {group.entries.map((entry, i) => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  isFirst={i === 0}
                  onDelete={handleDeleteEntry}
                />
              ))}
            </View>
          ))}

          <Text style={s.timelineHint}>Long press any entry to delete</Text>
        </View>
      )}

      {/* ── Empty State ───────────────────────────────────────── */}
      {groupedEntries.length === 0 && (
        <View style={s.emptyState}>
          <LinearGradient
            colors={["rgba(255,138,43,0.06)", "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.emptyOrb} />
          <Text style={s.emptyTitle}>No proof logged yet</Text>
          <Text style={s.emptyBody}>
            Every sign, every synchronicity, every moment of courage adds up.
          </Text>
        </View>
      )}

      {/* Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={hidePaywall} featureName={featureName} />
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  /* Hero Header */
  heroHeader: {
    marginBottom: spacing["3xl"],
    paddingTop: spacing.md,
  },
  heroTitle: {
    fontFamily: fonts.editorial,
    fontSize: 42,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    lineHeight: 46,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,240,225,0.7)",
    marginTop: spacing.md,
    maxWidth: "85%",
  },

  /* Streak */
  streakCard: {
    borderRadius: radius.large,
    overflow: "hidden",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.08)",
    backgroundColor: "rgba(13,9,6,0.8)",
  },
  streakInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing["2xl"],
  },
  streakLeft: {
    alignItems: "flex-start",
  },
  streakRight: {
    alignItems: "flex-end",
  },
  streakValue: {
    fontFamily: fonts.editorial,
    fontSize: 52,
    lineHeight: 56,
    color: colors.primary,
  },
  streakLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 2,
    color: "rgba(255,138,43,0.5)",
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  streakDots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,138,43,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.15)",
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  streakCaption: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "rgba(255,240,225,0.3)",
    letterSpacing: 0.5,
  },

  /* Log Form */
  logCard: {
    borderRadius: radius.large,
    padding: spacing["2xl"],
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.1)",
    overflow: "hidden",
    backgroundColor: "rgba(13,9,6,0.9)",
  },
  logGlowOrb: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FF8A2B",
    opacity: 0.03,
  },
  inputLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 3,
    color: "rgba(255,138,43,0.4)",
    textTransform: "uppercase",
    marginBottom: spacing.lg,
  },
  textInput: {
    fontFamily: fonts.editorial,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textPrimary,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: radius.medium,
    padding: spacing.lg,
    paddingTop: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    minHeight: 110,
    marginBottom: spacing.lg,
  },
  promptChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  promptChip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.08)",
    backgroundColor: "rgba(255,138,43,0.04)",
  },
  promptChipPressed: {
    backgroundColor: "rgba(255,138,43,0.12)",
    borderColor: "rgba(255,138,43,0.25)",
  },
  promptChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,240,225,0.6)",
  },
  logBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.5)",
    borderRadius: radius.pill,
    paddingVertical: spacing.lg + 2,
    alignItems: "center",
    overflow: "hidden",
  },
  logBtnPressed: {
    borderColor: colors.primary,
    transform: [{ scale: 0.975 }],
  },
  logBtnDisabled: {
    borderColor: "rgba(255,138,43,0.12)",
    opacity: 0.5,
  },
  logBtnText: {
    fontFamily: fonts.headline,
    fontSize: 15,
    letterSpacing: 0.8,
    color: colors.primary,
  },
  logBtnTextDisabled: {
    color: "rgba(255,138,43,0.35)",
  },

  /* Generated Affirmation */
  genCard: {
    borderRadius: radius.large,
    padding: spacing["2xl"],
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.06)",
    overflow: "hidden",
    backgroundColor: "rgba(13,9,6,0.8)",
  },
  genRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  genLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,240,225,0.4)",
    flex: 1,
  },
  affirmCard: {
    borderRadius: radius.large,
    padding: spacing["2xl"],
    paddingVertical: spacing["3xl"],
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.12)",
    overflow: "hidden",
    backgroundColor: "rgba(13,9,6,0.9)",
  },
  affirmGlow: {
    position: "absolute",
    top: -30,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FF8A2B",
    opacity: 0.04,
  },
  affirmLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 3,
    color: "rgba(255,138,43,0.45)",
    textTransform: "uppercase",
    marginBottom: spacing.xl,
  },
  affirmText: {
    fontFamily: fonts.editorial,
    fontSize: 22,
    lineHeight: 32,
    color: "#FFFFFF",
    marginBottom: spacing["2xl"],
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.4)",
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    overflow: "hidden",
  },
  saveBtnPressed: {
    borderColor: colors.primary,
    transform: [{ scale: 0.975 }],
  },
  saveBtnText: {
    fontFamily: fonts.headline,
    fontSize: 13,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  savedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  savedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  affirmSaved: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,138,43,0.6)",
    letterSpacing: 0.3,
  },

  /* Timeline */
  timelineSection: {
    marginTop: spacing.lg,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing["2xl"],
  },
  timelineLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,138,43,0.12)",
  },
  timelineTitle: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 4,
    color: "rgba(255,138,43,0.35)",
    textTransform: "uppercase",
  },
  dateGroup: {
    marginBottom: spacing.xl,
  },
  dateLabel: {
    fontFamily: fonts.headline,
    fontSize: 11,
    letterSpacing: 2,
    color: "rgba(255,240,225,0.3)",
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  timelineHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "rgba(255,240,225,0.15)",
    textAlign: "center",
    marginTop: spacing.sm,
    letterSpacing: 0.3,
  },

  /* Entry Cards */
  entryCard: {
    borderRadius: radius.medium,
    marginBottom: spacing.sm + 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    overflow: "hidden",
    backgroundColor: "rgba(13,9,6,0.7)",
    flexDirection: "row",
    alignItems: "stretch",
  },
  entryCardFirst: {
    borderColor: "rgba(255,138,43,0.08)",
  },
  entryCardPressed: {
    backgroundColor: "rgba(255,138,43,0.03)",
  },
  entryAccent: {
    width: 2,
    backgroundColor: "rgba(255,138,43,0.08)",
  },
  entryAccentActive: {
    backgroundColor: "rgba(255,138,43,0.3)",
  },
  entryContent: {
    flex: 1,
    padding: spacing.lg,
    paddingVertical: spacing.lg + 2,
  },
  entryBody: {
    fontFamily: fonts.editorial,
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(255,240,225,0.6)",
  },

  /* Delete Button */
  deleteBtn: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(204,59,26,0.08)",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(204,59,26,0.1)",
  },
  deleteBtnPressed: {
    backgroundColor: "rgba(204,59,26,0.15)",
  },
  deleteBtnText: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: "rgba(204,59,26,0.6)",
  },

  /* Empty State */
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing["4xl"],
    paddingHorizontal: spacing["2xl"],
    marginTop: spacing.xl,
    borderRadius: radius.large,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.05)",
    backgroundColor: "rgba(13,9,6,0.5)",
  },
  emptyOrb: {
    position: "absolute",
    top: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FF8A2B",
    opacity: 0.03,
  },
  emptyTitle: {
    fontFamily: fonts.editorial,
    fontSize: 20,
    color: "rgba(255,240,225,0.4)",
    marginBottom: spacing.md,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,240,225,0.2)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "80%",
  },
});
