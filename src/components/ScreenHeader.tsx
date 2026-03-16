import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { spacing, fonts } from "../theme";

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
}

export default function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing["3xl"],
    paddingTop: spacing.md,
  },
  title: {
    fontFamily: fonts.editorial,
    fontSize: 42,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    lineHeight: 46,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,240,225,0.7)",
    marginTop: spacing.md,
    maxWidth: "85%",
  },
});
