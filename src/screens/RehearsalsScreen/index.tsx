import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  ScreenContainer,
  ScreenHeader,
  Card,
  Button,
  SectionLabel,
  IconButton,
} from "../../components";
import { colors, spacing, typography } from "../../theme";

const RITUALS = [
  {
    category: "Visualization",
    title: "Step Into Your Future Self",
    description:
      "A guided mental rehearsal to embody the identity you are becoming.",
  },
  {
    category: "Affirmation",
    title: "I Am Worthy of Everything I Desire",
    description:
      "Repeat core beliefs that rewire your subconscious patterns.",
  },
  {
    category: "Embodiment",
    title: "Move Like the Person You're Becoming",
    description:
      "A short somatic practice to anchor your new identity in your body.",
  },
];

export default function RehearsalsScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader
        title="Rehearsals"
        subtitle="Your private identity rituals"
      />

      {RITUALS.map((ritual, index) => (
        <Card key={index}>
          <View style={styles.cardTop}>
            <SectionLabel>{ritual.category}</SectionLabel>
            <IconButton icon="•••" size={34} />
          </View>

          <Text style={styles.ritualTitle}>{ritual.title}</Text>
          <Text style={styles.ritualDescription}>{ritual.description}</Text>

          <View style={styles.cardActions}>
            <Button label="Begin" style={styles.beginButton} />
            <IconButton icon="♡" />
          </View>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  ritualTitle: {
    ...typography.headline,
    fontSize: 20,
    lineHeight: 28,
    marginBottom: spacing.sm,
  },
  ritualDescription: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing["2xl"],
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  beginButton: {
    flex: 1,
  },
});
