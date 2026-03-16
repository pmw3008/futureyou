import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing, radius, shadows } from "../theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: string;
  shadow?: "small" | "medium" | "large";
}

export default function Card({
  children,
  style,
  accent,
  shadow = "small",
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        shadows[shadow],
        accent ? styles.accented : undefined,
        accent ? { borderLeftColor: accent } : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    padding: spacing["2xl"],
    marginBottom: spacing["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
  },
  accented: {
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
});
