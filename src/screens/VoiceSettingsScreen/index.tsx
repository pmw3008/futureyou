import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  ScreenContainer,
  ScreenHeader,
  Card,
  Button,
  SectionLabel,
} from "../../components";
import { colors, spacing, radius, typography, fonts } from "../../theme";

type VoiceOption = "default-calm" | "default-bold" | "custom";

const VOICE_OPTIONS: { id: VoiceOption; label: string; description: string }[] = [
  {
    id: "default-calm",
    label: "Calm & Soothing",
    description: "A gentle, grounding voice for deep visualization",
  },
  {
    id: "default-bold",
    label: "Bold & Motivating",
    description: "An energizing voice that drives action",
  },
  {
    id: "custom",
    label: "Your Voice",
    description: "Upload a recording to hear affirmations in your own voice",
  },
];

export default function VoiceSettingsScreen() {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>("default-calm");

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Voice Settings"
        subtitle="Choose how you hear your truth"
      />

      {/* Voice Selection */}
      <SectionLabel>Select a Voice</SectionLabel>
      <View style={styles.voiceList}>
        {VOICE_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => setSelectedVoice(option.id)}
            style={({ pressed }) => [
              styles.voiceCard,
              selectedVoice === option.id && styles.voiceCardSelected,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.voiceCardLeft}>
              <View
                style={[
                  styles.radioOuter,
                  selectedVoice === option.id && styles.radioOuterSelected,
                ]}
              >
                {selectedVoice === option.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <View style={styles.voiceInfo}>
                <Text
                  style={[
                    styles.voiceLabel,
                    selectedVoice === option.id && styles.voiceLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.voiceDescription}>{option.description}</Text>
              </View>
            </View>
            {option.id !== "custom" && (
              <Pressable style={styles.previewButton}>
                <Text style={styles.previewText}>Preview</Text>
              </Pressable>
            )}
          </Pressable>
        ))}
      </View>

      {/* Upload Section — shown when custom is selected */}
      {selectedVoice === "custom" && (
        <Card style={styles.uploadCard}>
          <View style={styles.uploadIcon}>
            <Text style={styles.uploadIconText}>🎙</Text>
          </View>
          <Text style={styles.uploadTitle}>Upload Your Voice</Text>
          <Text style={styles.uploadDescription}>
            Record yourself reading a short passage. We'll use your voice to
            generate personalized affirmation loops.
          </Text>

          <View style={styles.uploadInstructions}>
            <Text style={styles.instructionStep}>
              1. Record yourself reading the sample text below
            </Text>
            <Text style={styles.instructionStep}>
              2. Upload the audio file (MP3, WAV, or M4A)
            </Text>
            <Text style={styles.instructionStep}>
              3. We'll clone your voice for affirmation playback
            </Text>
          </View>

          <Card style={styles.sampleTextCard}>
            <SectionLabel>Sample Text</SectionLabel>
            <Text style={styles.sampleText}>
              "I am becoming the highest version of myself. Every day I grow
              stronger, more focused, and more aligned with my purpose. I trust
              the process and I trust myself."
            </Text>
          </Card>

          <Pressable style={styles.uploadArea}>
            <Text style={styles.uploadAreaIcon}>+</Text>
            <Text style={styles.uploadAreaText}>Tap to upload audio file</Text>
            <Text style={styles.uploadAreaFormats}>
              MP3, WAV, or M4A \u00B7 Max 5 minutes
            </Text>
          </Pressable>

          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>
              Voice cloning coming soon — stay tuned
            </Text>
          </View>
        </Card>
      )}

      {/* Save Button */}
      <Button label="Save Voice Preference" variant="large" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  voiceList: {
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing["2xl"],
  },
  voiceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voiceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  voiceCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.lg,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceLabel: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  voiceLabelSelected: {
    color: colors.primary,
  },
  voiceDescription: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
  },
  previewButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  previewText: {
    fontFamily: fonts.headline,
    fontSize: 13,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },

  /* Upload */
  uploadCard: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.warmBeige,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  uploadIconText: {
    fontSize: 28,
  },
  uploadTitle: {
    ...typography.headline,
    fontSize: 20,
    marginBottom: spacing.md,
  },
  uploadDescription: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  uploadInstructions: {
    width: "100%",
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  instructionStep: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  sampleTextCard: {
    width: "100%",
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.xl,
  },
  sampleText: {
    ...typography.editorial,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  uploadArea: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.large,
    paddingVertical: spacing["3xl"],
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.lg,
  },
  uploadAreaIcon: {
    fontSize: 28,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  uploadAreaText: {
    fontFamily: fonts.headline,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  uploadAreaFormats: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  comingSoon: {
    backgroundColor: colors.warmBeige,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  comingSoonText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.primary,
  },
});
