import React from "react";
import { Text, StyleSheet } from "react-native";
import { typography } from "../theme";

interface SectionLabelProps {
  children: string;
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
  },
});
