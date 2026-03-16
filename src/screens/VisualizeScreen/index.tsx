import React, { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScreenContainer,
  ScreenHeader,
  Card,
  Button,
  SectionLabel,
} from "../../components";
import { colors, spacing, radius, shadows, typography, fonts } from "../../theme";
import { useUserProfile } from "../../context/UserProfileContext";
import { useRitual } from "../../context/RitualContext";
import { VIBE_OPTIONS } from "../../types";
import type { Visualization } from "../../types";
import { VISUALIZATIONS, getAssignedVisualization } from "../../config/visualizations";
import VisualizationPlayerScreen from "../VisualizationPlayerScreen";

export default function VisualizeScreen() {
  const { profile } = useUserProfile();
  const { today, ritual, completeStep } = useRitual();
  const [selectedViz, setSelectedViz] = useState<Visualization | null>(null);
  const [playerMode, setPlayerMode] = useState<"listen" | "read">("listen");
  const [savedIds, setSavedIds] = useState<Set<string>>(
    new Set(VISUALIZATIONS.filter((v) => v.isSaved).map((v) => v.id))
  );

  const todayViz = useMemo(
    () => getAssignedVisualization(profile.vibe, today),
    [profile.vibe, today]
  );
  const vibeInfo = VIBE_OPTIONS.find((v) => v.id === profile.vibe);

  const libraryVizs = VISUALIZATIONS.filter((v) => v.id !== todayViz.id);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)} min`;

  const openPlayer = (viz: Visualization, mode: "listen" | "read") => {
    setPlayerMode(mode);
    setSelectedViz(viz);
  };

  if (selectedViz) {
    return (
      <VisualizationPlayerScreen
        visualization={selectedViz}
        onBack={() => {
          // If they played today's assigned viz, mark step complete
          if (selectedViz.id === todayViz.id && !ritual.steps.visualization) {
            completeStep("visualization");
          }
          setSelectedViz(null);
        }}
        initialMode={playerMode}
      />
    );
  }

  const isVizDone = ritual.steps.visualization;

  return (
    <ScreenContainer>
      <ScreenHeader title="Visualize" subtitle="See it before you live it" />

      {/* Today's Assigned Visualization */}
      <View style={styles.todayCard}>
        <LinearGradient
          colors={["rgba(255,138,43,0.1)", "rgba(255,138,43,0.03)", "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.todayGlow} />

        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>
            {isVizDone ? "✓ Completed" : "Today's Visualization"}
          </Text>
        </View>

        <Text style={styles.todayTitle}>{todayViz.title}</Text>
        <Text style={styles.todayDescription}>{todayViz.description}</Text>

        {vibeInfo && (
          <Text style={styles.todayWhy}>
            Assigned for your {vibeInfo.label} energy
          </Text>
        )}

        <View style={styles.todayActions}>
          <Button
            label="Listen"
            style={styles.actionBtn}
            onPress={() => openPlayer(todayViz, "listen")}
          />
          <Button
            label="Read Script"
            variant="outline"
            style={styles.actionBtn}
            onPress={() => openPlayer(todayViz, "read")}
          />
        </View>
        <Text style={styles.todayDuration}>
          {formatDuration(todayViz.duration)} visualization
        </Text>
      </View>

      {/* Library */}
      {libraryVizs.length > 0 && (
        <>
          <Text style={styles.libraryTitle}>Explore More</Text>

          {libraryVizs.map((viz) => (
            <Pressable key={viz.id} onPress={() => openPlayer(viz, "listen")}>
              <Card>
                <View style={styles.cardTop}>
                  <SectionLabel>
                    {viz.category.charAt(0).toUpperCase() + viz.category.slice(1)}
                  </SectionLabel>
                  <Text style={styles.duration}>{formatDuration(viz.duration)}</Text>
                </View>
                <Text style={styles.vizTitle}>{viz.title}</Text>
                <Text style={styles.vizDescription}>{viz.description}</Text>
                <View style={styles.cardActions}>
                  <Button
                    label="Listen"
                    style={styles.cardBtn}
                    onPress={() => openPlayer(viz, "listen")}
                  />
                  <Button
                    label="Read"
                    variant="outline"
                    style={styles.cardBtn}
                    onPress={() => openPlayer(viz, "read")}
                  />
                  <Pressable
                    onPress={() => toggleSave(viz.id)}
                    style={styles.saveButton}
                  >
                    <Text
                      style={[
                        styles.saveIcon,
                        savedIds.has(viz.id) && styles.saveIconActive,
                      ]}
                    >
                      {savedIds.has(viz.id) ? "♥" : "♡"}
                    </Text>
                  </Pressable>
                </View>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      {/* Generate */}
      <Card style={styles.generateCard}>
        <View style={styles.generateContent}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
          <View style={styles.generateText}>
            <Text style={styles.generateTitle}>New Visualization</Text>
            <Text style={styles.generateDescription}>
              Generate a personalized visualization based on your identity
            </Text>
          </View>
        </View>
        <Button label="Generate" variant="outline" />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Today's card
  todayCard: {
    borderRadius: radius.large,
    padding: spacing["2xl"],
    marginBottom: spacing["2xl"],
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.2)",
    overflow: "hidden",
    backgroundColor: colors.surface,
    ...shadows.glow,
  },
  todayGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FF8A2B",
    opacity: 0.06,
  },
  todayBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.15)",
  },
  todayBadgeText: {
    fontFamily: fonts.headline,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  todayTitle: {
    ...typography.headline,
    fontSize: 22,
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  todayDescription: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  todayWhy: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing["2xl"],
  },
  todayActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionBtn: { flex: 1 },
  todayDuration: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },

  // Library
  libraryTitle: {
    ...typography.headline,
    fontSize: 18,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  duration: { ...typography.caption, fontSize: 12, color: colors.textMuted },
  vizTitle: {
    ...typography.headline,
    fontSize: 18,
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  vizDescription: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing["2xl"],
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardBtn: { flex: 1 },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  saveIcon: { fontSize: 18, color: colors.textMuted },
  saveIconActive: { color: colors.coral },

  // Generate
  generateCard: {
    borderStyle: "dashed" as any,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  generateContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  generateIcon: {
    fontSize: 24,
    color: colors.primary,
    marginRight: spacing.lg,
  },
  generateText: { flex: 1 },
  generateTitle: {
    ...typography.headline,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  generateDescription: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
