import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius, typography, fonts } from "../../theme";
import { useUserProfile } from "../../context/UserProfileContext";

interface OnboardingProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingProps) {
  const { updateProfile, completeOnboarding } = useUserProfile();

  const [name, setName] = useState("");
  const [statement, setStatement] = useState("");

  const handleEnter = () => {
    updateProfile({
      name: name.trim() || "You",
      identityStatement: statement.trim(),
    });
    completeOnboarding();
    onComplete();
  };

  const handleSkip = () => {
    completeOnboarding();
    onComplete();
  };

  return (
    <View style={s.container}>
      <LinearGradient
        colors={["#000000", "#0D0906", "#080504", "#000000"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient warm glow */}
      <View style={s.ambientGlow}>
        <LinearGradient
          colors={["rgba(229,80,26,0.18)", "rgba(255,138,43,0.08)", "transparent"]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={["rgba(229,80,26,0.18)", "rgba(255,138,43,0.08)", "transparent"]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            style={s.flex}
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <Text style={s.title}>FutureYou</Text>
            <Text style={s.subtitle}>
              Two things before we begin.
            </Text>

            {/* Name */}
            <Text style={s.fieldLabel}>YOUR NAME</Text>
            <TextInput
              style={s.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="First name"
              placeholderTextColor={colors.textMuted}
              autoFocus
              autoCapitalize="words"
            />

            {/* Identity — short, low friction */}
            <Text style={s.fieldLabel}>ONE SENTENCE ABOUT WHO YOU ARE</Text>
            <TextInput
              style={s.statementInput}
              value={statement}
              onChangeText={setStatement}
              placeholder="I am a disciplined creator who moves with intention."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <Text style={s.hint}>
              You can change this anytime. Just write what feels true.
            </Text>

            {/* CTA — inside ScrollView so it moves with content */}
            <View style={s.bottomContainer}>
              <Pressable
                onPress={handleEnter}
                disabled={!name.trim()}
                style={({ pressed }) => [
                  s.ctaButton,
                  !name.trim() && s.ctaButtonDisabled,
                  pressed && name.trim() ? s.ctaButtonPressed : undefined,
                ]}
              >
                <Text
                  style={[s.ctaText, !name.trim() && s.ctaTextDisabled]}
                >
                  Enter FutureYou
                </Text>
              </Pressable>
              <Pressable onPress={handleSkip} style={s.skipButton}>
                <Text style={s.skipText}>Skip for now</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  ambientGlow: {
    position: "absolute",
    width: "140%",
    height: "50%",
    top: "5%",
    left: "-20%",
    borderRadius: 9999,
    overflow: "hidden",
    opacity: 0.8,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["5xl"],
    paddingBottom: spacing["2xl"],
    justifyContent: "space-between",
  },

  /* Header */
  title: {
    fontFamily: fonts.editorial,
    fontSize: 42,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    lineHeight: 46,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,240,225,0.7)",
    marginBottom: spacing["3xl"],
  },

  /* Fields */
  fieldLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 3,
    color: "rgba(255,138,43,0.4)",
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  nameInput: {
    fontFamily: fonts.headline,
    fontSize: 22,
    color: colors.textPrimary,
    backgroundColor: "rgba(13,9,6,0.8)",
    borderRadius: radius.large,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.08)",
    letterSpacing: -0.3,
    marginBottom: spacing["2xl"],
  },
  statementInput: {
    fontFamily: fonts.editorial,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textPrimary,
    backgroundColor: "rgba(13,9,6,0.8)",
    borderRadius: radius.large,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.08)",
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,240,225,0.5)",
    lineHeight: 18,
  },

  /* Bottom */
  bottomContainer: {
    paddingTop: spacing["2xl"],
    gap: spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,138,43,0.08)",
    marginTop: spacing["3xl"],
  },
  ctaButton: {
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.7)",
    backgroundColor: "transparent",
    borderRadius: 28,
    paddingVertical: spacing.lg + 2,
    width: "100%",
    alignItems: "center",
  },
  ctaButtonDisabled: {
    borderColor: colors.warmBeige,
    opacity: 0.35,
  },
  ctaButtonPressed: {
    backgroundColor: colors.primaryMuted,
    transform: [{ scale: 0.975 }],
  },
  ctaText: {
    ...typography.button,
    fontSize: 16,
    letterSpacing: 0.3,
    color: colors.primary,
  },
  ctaTextDisabled: {
    color: colors.textMuted,
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
});
