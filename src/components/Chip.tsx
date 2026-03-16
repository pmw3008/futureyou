import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "../theme";

interface ChipProps {
  label: string;
  color?: string;
}

export default function Chip({ label, color = colors.primary }: ChipProps) {
  return (
    <View style={[styles.chip, { backgroundColor: color + "15" }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.caption,
    fontSize: 13,
  },
});
