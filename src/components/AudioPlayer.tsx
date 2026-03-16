import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, radius, shadows, typography } from "../theme";
import useAudioPlayer from "../hooks/useAudioPlayer";

interface AudioPlayerProps {
  source: number;
  title?: string;
  subtitle?: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  source,
  title = "Affirmation Loop",
  subtitle = "Tap play to begin",
}: AudioPlayerProps) {
  const { isPlaying, isLoaded, durationMs, positionMs, progress, togglePlayPause, load } =
    useAudioPlayer(source);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {isPlaying ? "Playing..." : subtitle}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progress * 100, 100)}%` },
            ]}
          />
          {/* Knob */}
          <View
            style={[
              styles.progressKnob,
              { left: `${Math.min(progress * 100, 100)}%` },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
          <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={togglePlayPause}
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.playButtonPressed,
          ]}
        >
          <Text style={styles.playIcon}>{isPlaying ? "⏸" : "▶"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    padding: spacing["2xl"],
    borderWidth: 0.5,
    borderColor: colors.border,
    ...shadows.small,
  },

  /* Header */
  header: {
    marginBottom: spacing.xl,
  },
  headerText: {},
  title: {
    ...typography.headline,
    fontSize: 17,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textMuted,
  },

  /* Progress */
  progressContainer: {
    marginBottom: spacing["2xl"],
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.warmBeige,
    borderRadius: 2,
    position: "relative",
    justifyContent: "center",
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    position: "absolute",
    left: 0,
    top: 0,
  },
  progressKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    position: "absolute",
    top: -5.5,
    marginLeft: -7,
    ...shadows.small,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm + 2,
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    fontVariant: ["tabular-nums"],
  },

  /* Controls */
  controls: {
    alignItems: "center",
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.medium,
  },
  playButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.92,
  },
  playIcon: {
    fontSize: 20,
    color: colors.surface,
    marginLeft: 2,
  },
});
