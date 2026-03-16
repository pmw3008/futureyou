import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, shadows, typography } from "../theme";

interface SegmentedControlProps {
  tabs: readonly string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function SegmentedControl({
  tabs,
  activeTab,
  onTabChange,
}: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => onTabChange(tab)}
        >
          <Text
            style={[styles.label, activeTab === tab && styles.labelActive]}
          >
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.medium,
    padding: 4,
    marginBottom: spacing["2xl"],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.medium - 3,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  label: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textMuted,
  },
  labelActive: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textPrimary,
  },
});
