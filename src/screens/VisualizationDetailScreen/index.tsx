import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius, shadows, typography, fonts } from "../../theme";
import { Card, Button } from "../../components";
import { useSpeechPlayer } from "../../hooks/useSpeech";
import { useUserProfile } from "../../context/UserProfileContext";
import type { Visualization } from "../../types";

interface VisualizationDetailScreenProps {
  visualization: Visualization;
  onBack: () => void;
}

export default function VisualizationDetailScreen({
  visualization,
  onBack,
}: VisualizationDetailScreenProps) {
  const { profile } = useUserProfile();
  const speechPlayer = useSpeechPlayer(profile.voiceSettings.visualizationVoice);
  const [showScript, setShowScript] = useState(false);
  const [isSaved, setIsSaved] = useState(visualization.isSaved);

  const paragraphs = visualization.script
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const handlePlayPause = () => {
    speechPlayer.togglePlayPause(visualization.script);
  };

  const handleStop = () => {
    speechPlayer.stop();
  };

  const isPlaying = speechPlayer.status === "playing";
  const isPaused = speechPlayer.status === "paused";
  const isActive = isPlaying || isPaused;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Pressable onPress={() => setIsSaved(!isSaved)}>
          <Text style={styles.saveIcon}>{isSaved ? "♥" : "♡"}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <Text style={styles.category}>
          {visualization.category.charAt(0).toUpperCase() +
            visualization.category.slice(1)}
        </Text>
        <Text style={styles.title}>{visualization.title}</Text>
        <Text style={styles.description}>{visualization.description}</Text>
        <Text style={styles.duration}>
          {formatDuration(visualization.duration)}
        </Text>

        {/* Playback Controls */}
        <View style={styles.controlsCard}>
          {/* Status */}
          {isActive && (
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {isPlaying ? "Speaking..." : "Paused"}
                {speechPlayer.totalParagraphs > 0 &&
                  ` · Paragraph ${speechPlayer.currentParagraph + 1} of ${speechPlayer.totalParagraphs}`}
              </Text>
            </View>
          )}

          {/* Main Controls */}
          <View style={styles.controlsRow}>
            <Pressable
              onPress={handleStop}
              disabled={!isActive}
              style={({ pressed }) => [
                styles.controlButton,
                styles.stopButton,
                !isActive && styles.controlButtonDisabled,
                pressed && isActive && styles.controlButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.controlIcon,
                  !isActive && styles.controlIconDisabled,
                ]}
              >
                ■
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePlayPause}
              style={({ pressed }) => [
                styles.controlButton,
                styles.playButton,
                pressed && styles.playButtonPressed,
              ]}
            >
              <Text style={styles.playIcon}>
                {isPlaying ? "⏸" : "▶"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowScript(!showScript)}
              style={({ pressed }) => [
                styles.controlButton,
                styles.scriptToggle,
                showScript && styles.scriptToggleActive,
                pressed && styles.controlButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.controlIcon,
                  showScript && styles.scriptToggleIconActive,
                ]}
              >
                📄
              </Text>
            </Pressable>
          </View>

          {/* Voice indicator */}
          <Text style={styles.voiceLabel}>
            Voice: {profile.voiceSettings.visualizationVoice === "human_feminine"
              ? "Feminine"
              : "Masculine"}
          </Text>
        </View>

        {/* Script View */}
        {showScript && (
          <View style={styles.scriptContainer}>
            <Text style={styles.scriptHeader}>Script</Text>
            {paragraphs.map((paragraph, index) => (
              <Text
                key={index}
                style={[
                  styles.scriptParagraph,
                  isActive &&
                    index === speechPlayer.currentParagraph &&
                    styles.scriptParagraphActive,
                  isActive &&
                    index < speechPlayer.currentParagraph &&
                    styles.scriptParagraphDone,
                ]}
              >
                {paragraph}
              </Text>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Button
            label={showScript ? "Hide Script" : "Show Script"}
            variant="outline"
            onPress={() => setShowScript(!showScript)}
            style={styles.actionBtn}
          />
          <Button
            label="Regenerate"
            variant="outline"
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
  },
  backText: {
    fontFamily: fonts.headline,
    fontSize: 15,
    color: colors.primary,
  },
  saveIcon: {
    fontSize: 22,
    color: colors.primary,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["5xl"],
  },

  /* Title */
  category: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.display,
    fontSize: 28,
    lineHeight: 36,
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 25,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  duration: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing["3xl"],
  },

  /* Controls Card */
  controlsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    padding: spacing["2xl"],
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: spacing["2xl"],
    alignItems: "center",
    ...shadows.small,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  statusText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  controlButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
  stopButton: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    ...shadows.medium,
  },
  playButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.92,
  },
  playIcon: {
    fontSize: 24,
    color: colors.surface,
    marginLeft: 2,
  },
  controlIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  controlIconDisabled: {
    color: colors.textMuted,
  },
  scriptToggle: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  scriptToggleActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  scriptToggleIconActive: {
    color: colors.primary,
  },
  voiceLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },

  /* Script */
  scriptContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    padding: spacing["2xl"],
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: spacing["2xl"],
  },
  scriptHeader: {
    ...typography.label,
    marginBottom: spacing.xl,
  },
  scriptParagraph: {
    ...typography.editorial,
    fontSize: 16,
    lineHeight: 26,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  scriptParagraphActive: {
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginHorizontal: -spacing.sm,
  },
  scriptParagraphDone: {
    color: colors.textMuted,
  },

  /* Actions */
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
