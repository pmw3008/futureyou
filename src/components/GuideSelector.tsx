import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GUIDES } from "../config/voices";
import type { Guide } from "../config/voices";
import { colors } from "../theme/colors";

interface GuideSelectorProps {
  selectedGuideId: string;
  onSelect: (guideId: string) => void;
  compact?: boolean;
}

export function GuideSelector({
  selectedGuideId,
  onSelect,
  compact = false,
}: GuideSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Choose your guide</Text>
      <View style={compact ? styles.gridCompact : styles.grid}>
        {GUIDES.map((guide) => (
          <GuideCard
            key={guide.id}
            guide={guide}
            isSelected={selectedGuideId === guide.id}
            onPress={() => onSelect(guide.id)}
            compact={compact}
          />
        ))}
      </View>
    </View>
  );
}

function GuideCard({
  guide,
  isSelected,
  onPress,
  compact,
}: {
  guide: Guide;
  isSelected: boolean;
  onPress: () => void;
  compact: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        compact ? styles.cardCompact : styles.card,
        isSelected && styles.cardSelected,
      ]}
    >
      {isSelected && (
        <LinearGradient
          colors={["#FF8A2B15", "#FFBA4A10", "#E5501A08"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Mini orb indicator */}
      <View style={[styles.orbDot, isSelected && styles.orbDotActive]}>
        {isSelected && (
          <LinearGradient
            colors={["#FF8A2B", "#FFBA4A"]}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 6 }]}
          />
        )}
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.name, isSelected && styles.nameSelected]}>
          {guide.label}
        </Text>
        <Text style={styles.subtitle}>{guide.subtitle}</Text>
      </View>

      {isSelected && <View style={styles.checkDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    fontFamily: "AileronBold",
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  grid: {
    gap: 8,
  },
  gridCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    overflow: "hidden",
  },
  cardCompact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    overflow: "hidden",
    flexBasis: "47%",
    flexGrow: 1,
  },
  cardSelected: {
    borderColor: colors.primary,
    shadowColor: "#FF8A2B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  orbDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.neutralGray,
    overflow: "hidden",
  },
  orbDotActive: {
    backgroundColor: "transparent",
    shadowColor: "#FF8A2B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  textWrap: {
    flex: 1,
  },
  name: {
    fontFamily: "AileronBold",
    fontSize: 15,
    color: colors.textPrimary,
  },
  nameSelected: {
    color: "#fff",
  },
  subtitle: {
    fontFamily: "MuktaExtralight",
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
