import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius, typography, fonts } from "../../theme";
import { useSpeechPlayer } from "../../hooks/useSpeech";
import { useUserProfile } from "../../context/UserProfileContext";
import { GuideSelector } from "../../components/GuideSelector";
import { getGuideById } from "../../config/voices";
import type { Visualization } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface VisualizationPlayerScreenProps {
  visualization: Visualization;
  onBack: () => void;
  initialMode?: "listen" | "read";
}

export default function VisualizationPlayerScreen({
  visualization,
  onBack,
  initialMode = "listen",
}: VisualizationPlayerScreenProps) {
  const { profile, setSelectedGuide } = useUserProfile();
  const speechPlayer = useSpeechPlayer(
    profile.voiceSettings.visualizationVoice,
    profile.selectedGuideId
  );
  const [mode, setMode] = useState<"listen" | "read">(initialMode);
  const [isSaved, setIsSaved] = useState(visualization.isSaved);
  const [showGuideSelector, setShowGuideSelector] = useState(false);
  const selectedGuide = getGuideById(profile.selectedGuideId);

  // Animated orb glow
  const orbPulse = useRef(new Animated.Value(1)).current;
  const orbOpacity = useRef(new Animated.Value(0.5)).current;
  const innerGlow = useRef(new Animated.Value(0.3)).current;

  const paragraphs = visualization.script
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const isPlaying = speechPlayer.status === "playing";
  const isPaused = speechPlayer.status === "paused";
  const isActive = isPlaying || isPaused;

  // Hypnotic breathing orb animation
  useEffect(() => {
    if (isPlaying) {
      const breathe = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(orbPulse, {
              toValue: 1.12,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(orbOpacity, {
              toValue: 0.85,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(innerGlow, {
              toValue: 0.7,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(orbPulse, {
              toValue: 0.95,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(orbOpacity, {
              toValue: 0.4,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(innerGlow, {
              toValue: 0.2,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      breathe.start();
      return () => breathe.stop();
    } else {
      // Subtle idle pulse
      const idle = Animated.loop(
        Animated.sequence([
          Animated.timing(orbOpacity, {
            toValue: 0.6,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(orbOpacity, {
            toValue: 0.35,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      );
      idle.start();
      orbPulse.setValue(1);
      innerGlow.setValue(0.3);
      return () => idle.stop();
    }
  }, [isPlaying, orbPulse, orbOpacity, innerGlow]);

  const handlePlayPause = () => {
    speechPlayer.togglePlayPause(visualization.script);
  };

  const handleStop = () => {
    speechPlayer.stop();
  };

  const progress =
    speechPlayer.totalParagraphs > 0
      ? (speechPlayer.currentParagraph + (isPlaying ? 0.5 : 0)) /
        speechPlayer.totalParagraphs
      : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#000000", "#050302", "#0A0704", "#050302", "#000000"]}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>VISUALIZATION</Text>
          </View>
          <Pressable onPress={() => setIsSaved(!isSaved)}>
            <Text style={[styles.saveIcon, isSaved && styles.saveIconActive]}>
              {isSaved ? "♥" : "♡"}
            </Text>
          </Pressable>
        </View>

        {mode === "listen" ? (
          <View style={styles.listenContainer}>
            {/* Orb / Portal — the hero element */}
            <View style={styles.orbContainer}>
              {/* Outermost glow ring */}
              <Animated.View
                style={[
                  styles.orbRing3,
                  {
                    transform: [{ scale: orbPulse }],
                    opacity: Animated.multiply(orbOpacity, 0.15),
                  },
                ]}
              />
              {/* Middle glow ring */}
              <Animated.View
                style={[
                  styles.orbRing2,
                  {
                    transform: [{ scale: orbPulse }],
                    opacity: Animated.multiply(orbOpacity, 0.3),
                  },
                ]}
              />
              {/* Inner glow ring */}
              <Animated.View
                style={[
                  styles.orbRing1,
                  {
                    transform: [{ scale: orbPulse }],
                    opacity: Animated.multiply(orbOpacity, 0.5),
                  },
                ]}
              />
              {/* Core orb */}
              <Animated.View
                style={[
                  styles.orbCore,
                  {
                    transform: [{ scale: orbPulse }],
                    opacity: orbOpacity,
                  },
                ]}
              >
                <LinearGradient
                  colors={["#FF8A2B", "#FFBA4A", "#E5501A"]}
                  style={styles.orbGradient}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.8, y: 1 }}
                />
              </Animated.View>
              {/* Center inner glow */}
              <Animated.View
                style={[styles.orbInnerGlow, { opacity: innerGlow }]}
              />
              {/* Center dot */}
              <View style={styles.orbDot} />
            </View>

            {/* Title */}
            <Text style={styles.vizTitle}>{visualization.title}</Text>
            <Text style={styles.vizSubtitle}>
              {formatDuration(visualization.duration)} · Close your eyes and
              breathe
            </Text>

            {/* Status */}
            {isActive && (
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    isPlaying
                      ? styles.statusDotActive
                      : styles.statusDotPaused,
                  ]}
                />
                <Text style={styles.statusText}>
                  {isPlaying ? "Speaking" : "Paused"}
                  {speechPlayer.totalParagraphs > 0 &&
                    ` · ${speechPlayer.currentParagraph + 1}/${speechPlayer.totalParagraphs}`}
                </Text>
              </View>
            )}

            {/* Controls */}
            <View style={styles.controlsRow}>
              <Pressable
                onPress={handleStop}
                disabled={!isActive}
                style={({ pressed }) => [
                  styles.controlBtn,
                  !isActive && styles.controlBtnDisabled,
                  pressed && isActive && styles.controlBtnPressed,
                ]}
              >
                <Text
                  style={[
                    styles.controlBtnIcon,
                    !isActive && styles.controlBtnIconDisabled,
                  ]}
                >
                  ■
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePlayPause}
                style={({ pressed }) => [
                  styles.playBtn,
                  pressed && styles.playBtnPressed,
                ]}
              >
                <LinearGradient
                  colors={["#FF8A2B", "#FFBA4A"]}
                  style={styles.playBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.playBtnIcon}>
                  {isPlaying ? "⏸" : "▶"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMode("read")}
                style={({ pressed }) => [
                  styles.controlBtn,
                  pressed && styles.controlBtnPressed,
                ]}
              >
                <Text style={styles.controlBtnIcon}>☰</Text>
              </Pressable>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={["#FF8A2B", "#FFBA4A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(progress * 100, 1)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Guide Label — tap to open selector */}
            <Pressable
              onPress={() => setShowGuideSelector(!showGuideSelector)}
              style={styles.guideLabelBtn}
            >
              <View style={styles.guideDotSmall} />
              <Text style={styles.voiceLabel}>
                {selectedGuide
                  ? `${selectedGuide.label} · ${selectedGuide.subtitle}`
                  : "Choose your guide"}
              </Text>
              <Text style={styles.guideCaret}>
                {showGuideSelector ? "▾" : "▸"}
              </Text>
            </Pressable>

            {/* Guide Selector Panel */}
            {showGuideSelector && (
              <View style={styles.guideSelectorWrap}>
                <GuideSelector
                  selectedGuideId={profile.selectedGuideId}
                  onSelect={(id) => {
                    setSelectedGuide(id);
                    setShowGuideSelector(false);
                  }}
                  compact
                />
              </View>
            )}
          </View>
        ) : (
          /* Read Mode */
          <ScrollView
            style={styles.readScroll}
            contentContainerStyle={styles.readContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.readHeader}>
              <Text style={styles.readTitle}>{visualization.title}</Text>
              <Text style={styles.readSubtitle}>
                {formatDuration(visualization.duration)} · Read at your own pace
              </Text>
            </View>

            {paragraphs.map((paragraph, index) => (
              <Text
                key={index}
                style={[
                  styles.readParagraph,
                  isActive &&
                    index === speechPlayer.currentParagraph &&
                    styles.readParagraphActive,
                  isActive &&
                    index < speechPlayer.currentParagraph &&
                    styles.readParagraphDone,
                ]}
              >
                {paragraph}
              </Text>
            ))}

            <View style={styles.readActions}>
              <Pressable
                onPress={() => setMode("listen")}
                style={styles.readActionBtn}
              >
                <Text style={styles.readActionText}>Switch to Listen</Text>
              </Pressable>
              <Pressable
                onPress={handlePlayPause}
                style={styles.readActionBtn}
              >
                <Text style={styles.readActionText}>
                  {isPlaying ? "Pause" : "Play Audio"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const ORB_SIZE = 160;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  safe: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 20,
    color: "rgba(255,255,255,0.7)",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
  },
  saveIcon: {
    fontSize: 22,
    color: "rgba(255,255,255,0.4)",
  },
  saveIconActive: {
    color: colors.coral,
  },

  /* Listen Mode */
  listenContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["3xl"],
  },

  /* Orb */
  orbContainer: {
    width: ORB_SIZE * 2.2,
    height: ORB_SIZE * 2.2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing["2xl"],
  },
  orbRing3: {
    position: "absolute",
    width: ORB_SIZE * 2,
    height: ORB_SIZE * 2,
    borderRadius: ORB_SIZE,
    backgroundColor: "#FF8A2B",
  },
  orbRing2: {
    position: "absolute",
    width: ORB_SIZE * 1.5,
    height: ORB_SIZE * 1.5,
    borderRadius: ORB_SIZE * 0.75,
    backgroundColor: "#FFBA4A",
  },
  orbRing1: {
    position: "absolute",
    width: ORB_SIZE * 1.2,
    height: ORB_SIZE * 1.2,
    borderRadius: ORB_SIZE * 0.6,
    backgroundColor: "#FF8A2B",
  },
  orbCore: {
    position: "absolute",
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: "hidden",
  },
  orbGradient: {
    width: "100%",
    height: "100%",
  },
  orbInnerGlow: {
    position: "absolute",
    width: ORB_SIZE * 0.5,
    height: ORB_SIZE * 0.5,
    borderRadius: ORB_SIZE * 0.25,
    backgroundColor: "#FFFFFF",
  },
  orbDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 10,
  },

  /* Title */
  vizTitle: {
    fontFamily: fonts.headline,
    fontSize: 26,
    lineHeight: 34,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  vizSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    marginBottom: spacing["2xl"],
  },

  /* Status */
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusDotActive: {
    backgroundColor: "#FFBA4A",
  },
  statusDotPaused: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  statusText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },

  /* Controls */
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["2xl"],
    marginBottom: spacing["2xl"],
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  controlBtnDisabled: {
    opacity: 0.3,
  },
  controlBtnPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.8,
  },
  controlBtnIcon: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
  },
  controlBtnIconDisabled: {
    color: "rgba(255,255,255,0.2)",
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  playBtnGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  playBtnPressed: {
    transform: [{ scale: 0.94 }],
  },
  playBtnIcon: {
    fontSize: 28,
    color: "#FFFFFF",
    marginLeft: 3,
    zIndex: 2,
  },

  /* Progress */
  progressContainer: {
    width: SCREEN_WIDTH * 0.6,
    marginBottom: spacing.xl,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },

  /* Guide Label */
  guideLabelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  guideDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF8A2B",
  },
  voiceLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
  },
  guideCaret: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
  },
  guideSelectorWrap: {
    marginTop: 12,
    width: "100%",
    paddingHorizontal: 8,
  },

  /* Read Mode */
  readScroll: {
    flex: 1,
  },
  readContent: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["5xl"],
  },
  readHeader: {
    marginBottom: spacing["3xl"],
    paddingTop: spacing.xl,
  },
  readTitle: {
    fontFamily: fonts.headline,
    fontSize: 26,
    lineHeight: 34,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  readSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.35)",
  },
  readParagraph: {
    fontFamily: fonts.editorial,
    fontSize: 18,
    lineHeight: 30,
    color: "rgba(255,255,255,0.75)",
    marginBottom: spacing["2xl"],
  },
  readParagraphActive: {
    color: "#FFFFFF",
    backgroundColor: "rgba(255,138,43,0.1)",
    borderRadius: radius.small,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: -spacing.md,
  },
  readParagraphDone: {
    color: "rgba(255,255,255,0.25)",
  },

  /* Read Actions */
  readActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  readActionBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },
  readActionText: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
});
