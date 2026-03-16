import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  fonts,
} from "../../theme";
import { useUserProfile } from "../../context/UserProfileContext";
import { useCustomLoops } from "../../context/CustomLoopsContext";
import { GuideSelector } from "../../components/GuideSelector";
import { GUIDES } from "../../config/voices";
import {
  AFFIRMATION_SETS,
  getBedtimeLoop,
} from "../../config/affirmations";
import type { AffirmationSet } from "../../types";
import {
  BACKGROUND_AUDIO_OPTIONS,
} from "../../services/backgroundAudio";
import type { BackgroundAudioOption } from "../../services/backgroundAudio";

// ─── Duration & Pacing Options ────────────────────────────────

type DurationOption = { label: string; seconds: number };
const DURATION_OPTIONS: DurationOption[] = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "30 min", seconds: 1800 },
  { label: "Sleep", seconds: 0 },
];

type PacingOption = { id: string; label: string };
const PACING_OPTIONS: PacingOption[] = [
  { id: "calm", label: "Calm" },
  { id: "fast", label: "Fast" },
  { id: "sleep", label: "Sleep" },
];

// ─── Loop Editor Modal ────────────────────────────────────────

function LoopEditorModal({
  visible,
  onClose,
  onSave,
  initialTitle,
  initialAffirmations,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, affirmations: string[]) => void;
  initialTitle?: string;
  initialAffirmations?: string[];
}) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [affirmations, setAffirmations] = useState<string[]>(
    initialAffirmations ?? [""]
  );
  const [newAffirmation, setNewAffirmation] = useState("");

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle ?? "");
      setAffirmations(initialAffirmations ?? [""]);
      setNewAffirmation("");
    }
  }, [visible, initialTitle, initialAffirmations]);

  const addAffirmation = () => {
    if (newAffirmation.trim() && affirmations.length < 10) {
      setAffirmations([...affirmations, newAffirmation.trim()]);
      setNewAffirmation("");
    }
  };

  const removeAffirmation = (index: number) => {
    setAffirmations(affirmations.filter((_, i) => i !== index));
  };

  const updateAffirmation = (index: number, text: string) => {
    const updated = [...affirmations];
    updated[index] = text;
    setAffirmations(updated);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...affirmations];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setAffirmations(updated);
  };

  const moveDown = (index: number) => {
    if (index === affirmations.length - 1) return;
    const updated = [...affirmations];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setAffirmations(updated);
  };

  const handleSave = () => {
    const valid = affirmations.filter((a) => a.trim());
    if (title.trim() && valid.length > 0) {
      onSave(title.trim(), valid);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={editorStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={editorStyles.header}>
          <Pressable onPress={onClose}>
            <Text style={editorStyles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={editorStyles.headerTitle}>
            {initialTitle ? "Edit Loop" : "New Loop"}
          </Text>
          <Pressable onPress={handleSave}>
            <Text style={editorStyles.saveText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          style={editorStyles.scroll}
          contentContainerStyle={editorStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={editorStyles.label}>Loop Title</Text>
          <TextInput
            style={editorStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Money Identity"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={editorStyles.label}>
            Affirmations ({affirmations.length}/10)
          </Text>

          {affirmations.map((a, i) => (
            <View key={i} style={editorStyles.affirmationRow}>
              <View style={editorStyles.reorderBtns}>
                <Pressable onPress={() => moveUp(i)} style={editorStyles.reorderBtn}>
                  <Text style={editorStyles.reorderText}>↑</Text>
                </Pressable>
                <Pressable onPress={() => moveDown(i)} style={editorStyles.reorderBtn}>
                  <Text style={editorStyles.reorderText}>↓</Text>
                </Pressable>
              </View>
              <TextInput
                style={editorStyles.affirmationInput}
                value={a}
                onChangeText={(text) => updateAffirmation(i, text)}
                placeholder={`Affirmation ${i + 1}`}
                placeholderTextColor={colors.textMuted}
              />
              <Pressable onPress={() => removeAffirmation(i)}>
                <Text style={editorStyles.removeBtn}>X</Text>
              </Pressable>
            </View>
          ))}

          {affirmations.length < 10 && (
            <View style={editorStyles.addRow}>
              <TextInput
                style={[editorStyles.input, { flex: 1 }]}
                value={newAffirmation}
                onChangeText={setNewAffirmation}
                placeholder="Add affirmation..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={addAffirmation}
                returnKeyType="done"
              />
              <Pressable onPress={addAffirmation} style={editorStyles.addBtn}>
                <Text style={editorStyles.addBtnText}>+</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Customize Screen ────────────────────────────────────

interface Props {
  onBack: () => void;
}

export default function CustomizeLoopScreen({ onBack }: Props) {
  const { profile, setSelectedGuide } = useUserProfile();
  const { customLoops, addLoop, updateLoop, deleteLoop } = useCustomLoops();

  const [selectedDuration, setSelectedDuration] = useState(0);
  const [selectedPacing, setSelectedPacing] = useState(0);
  const [selectedBgAudio, setSelectedBgAudio] = useState<BackgroundAudioOption>("silence");
  const [showEditor, setShowEditor] = useState(false);
  const [editingLoop, setEditingLoop] = useState<AffirmationSet | null>(null);

  const handleSaveLoop = (title: string, affirmations: string[]) => {
    if (editingLoop) {
      updateLoop(editingLoop.id, { title, affirmations });
    } else {
      addLoop({
        title,
        subtitle: "Custom conditioning loop",
        affirmations,
        duration: `${affirmations.length} affirmations`,
      });
    }
    setEditingLoop(null);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>{"< Back"}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Customize</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Duration ──────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>DURATION</Text>
          <View style={styles.chipRow}>
            {DURATION_OPTIONS.map((d, i) => (
              <Pressable
                key={d.label}
                onPress={() => setSelectedDuration(i)}
                style={[
                  styles.chip,
                  selectedDuration === i && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedDuration === i && styles.chipTextActive,
                  ]}
                >
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ─── Voice ─────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>VOICE</Text>
          <GuideSelector
            selectedGuideId={profile.selectedGuideId}
            onSelect={setSelectedGuide}
            compact
          />

          {/* ─── Pacing ────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>PACING</Text>
          <View style={styles.chipRow}>
            {PACING_OPTIONS.map((p, i) => (
              <Pressable
                key={p.id}
                onPress={() => setSelectedPacing(i)}
                style={[
                  styles.chip,
                  selectedPacing === i && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedPacing === i && styles.chipTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ─── Background Audio ──────────────────────────────── */}
          <Text style={styles.sectionLabel}>BACKGROUND AUDIO</Text>
          <View style={styles.chipRow}>
            {BACKGROUND_AUDIO_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => setSelectedBgAudio(opt.id)}
                style={[
                  styles.chip,
                  selectedBgAudio === opt.id && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedBgAudio === opt.id && styles.chipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ─── Custom Loops ──────────────────────────────────── */}
          <Text style={styles.sectionLabel}>YOUR LOOPS</Text>

          {customLoops.length === 0 && (
            <Text style={styles.emptyText}>
              No custom loops yet. Create your first identity conditioning loop.
            </Text>
          )}

          {customLoops.map((loop) => (
            <View key={loop.id} style={styles.loopCard}>
              <Text style={styles.loopTitle}>{loop.title}</Text>
              <Text style={styles.loopMeta}>
                {loop.affirmations.length} affirmations
              </Text>
              <View style={styles.loopActions}>
                <Pressable
                  onPress={() => {
                    setEditingLoop(loop);
                    setShowEditor(true);
                  }}
                >
                  <Text style={styles.actionLink}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => deleteLoop(loop.id)}>
                  <Text style={styles.deleteLink}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable
            onPress={() => {
              setEditingLoop(null);
              setShowEditor(true);
            }}
            style={styles.createBtn}
          >
            <Text style={styles.createBtnIcon}>+</Text>
            <Text style={styles.createBtnText}>Create New Loop</Text>
          </Pressable>

          {/* ─── Built-in Loops ─────────────────────────────────── */}
          <Text style={styles.sectionLabel}>BUILT-IN LOOPS</Text>
          {AFFIRMATION_SETS.filter((s) => !s.isBedtime).map((set) => (
            <View key={set.id} style={styles.loopCard}>
              <Text style={styles.loopTitle}>{set.title}</Text>
              <Text style={styles.loopMeta}>
                {set.affirmations.length} affirmations · {set.duration}
              </Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Editor Modal */}
      <LoopEditorModal
        visible={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingLoop(null);
        }}
        onSave={handleSaveLoop}
        initialTitle={editingLoop?.title}
        initialAffirmations={editingLoop?.affirmations}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 70,
  },
  backText: {
    fontFamily: fonts.headline,
    fontSize: 15,
    color: colors.primary,
  },
  headerTitle: {
    ...typography.headline,
    fontSize: 18,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing["5xl"],
  },

  // Sections
  sectionLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },

  // Chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primary,
  },

  // Loop cards
  loopCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  loopTitle: {
    ...typography.headline,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  loopMeta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  loopActions: {
    flexDirection: "row",
    gap: spacing.xl,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionLink: {
    fontFamily: fonts.headline,
    fontSize: 13,
    color: colors.primary,
  },
  deleteLink: {
    fontFamily: fonts.headline,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed" as any,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  createBtnIcon: {
    fontSize: 20,
    color: colors.primary,
  },
  createBtnText: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.primary,
  },
});

// ─── Editor Modal Styles ──────────────────────────────────────

const editorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.headline, fontSize: 18 },
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
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing["5xl"] },
  label: {
    fontFamily: fonts.headline,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  input: {
    ...typography.body,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  affirmationRow: {
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
  reorderBtns: { gap: 2 },
  reorderBtn: {
    width: 24,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderText: { fontSize: 12, color: colors.textMuted },
  affirmationInput: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  removeBtn: { fontSize: 14, color: colors.textMuted, paddingLeft: spacing.sm },
  addRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.medium,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow,
  },
  addBtnText: { fontSize: 24, color: "#FFFFFF", marginTop: -2 },
});
