/**
 * OnboardingScreen
 *
 * Collects three things:
 *   1. Name (required)
 *   2. Identity statement — "I am..." (optional)
 *   3. Dream life — vivid description (optional but powers the taste experience)
 *
 * The dream life input is the most important for conversion — it's what
 * generates the personalized visualization they hear before the paywall.
 * The more detail they write, the more personal the taste feels,
 * and the higher the conversion rate.
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, typography, fonts } from "../../theme";
import { useUserProfile } from "../../context/UserProfileContext";

interface OnboardingProps {
  onComplete: () => void;
}

type Step = "name" | "identity" | "dreamlife";

export default function OnboardingScreen({ onComplete }: OnboardingProps) {
  const { updateProfile, completeOnboarding } = useUserProfile();

  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [statement, setStatement] = useState("");
  const [dreamLife, setDreamLife] = useState("");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const identityInputRef = useRef<TextInput>(null);
  const dreamInputRef = useRef<TextInput>(null);

  const animateTransition = (nextStep: Step) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      // Wait one frame for the new content to render before fading in —
      // prevents the flash caused by autoFocus + KeyboardAvoidingView
      // fighting the animation mid-transition.
      requestAnimationFrame(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Focus input after animation completes so the keyboard
          // doesn't interfere with the fade-in layout.
          if (nextStep === "identity") {
            identityInputRef.current?.focus();
          } else if (nextStep === "dreamlife") {
            dreamInputRef.current?.focus();
          }
        });
      });
    });
  };

  const handleFinish = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    updateProfile({
      name: name.trim() || "You",
      identityStatement: statement.trim(),
      idealDay: dreamLife.trim(),
    });
    completeOnboarding();
    onComplete();
  };

  const handleSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    updateProfile({
      name: name.trim() || "You",
      identityStatement: statement.trim(),
      idealDay: dreamLife.trim(),
    });
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
        >
          <ScrollView
            style={s.flex}
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Progress dots */}
            <View style={s.progressRow}>
              <View style={[s.progressDot, step === "name" && s.progressDotActive]} />
              <View style={[s.progressDot, step === "identity" && s.progressDotActive]} />
              <View style={[s.progressDot, step === "dreamlife" && s.progressDotActive]} />
            </View>

            <Animated.View style={[s.stepContent, { opacity: fadeAnim }]}>
              {/* ═══ Step 1: Name ═══ */}
              {step === "name" && (
                <>
                  <Text style={s.title}>FutureYou</Text>
                  <Text style={s.subtitle}>
                    Let's start with who you are.
                  </Text>

                  <Text style={s.fieldLabel}>YOUR FIRST NAME</Text>
                  <TextInput
                    style={s.nameInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="First name"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => name.trim() && animateTransition("identity")}
                  />

                  <View style={s.bottomContainer}>
                    <Pressable
                      onPress={() => animateTransition("identity")}
                      disabled={!name.trim()}
                      style={({ pressed }) => [
                        s.ctaButton,
                        !name.trim() && s.ctaButtonDisabled,
                        pressed && name.trim() ? s.ctaButtonPressed : undefined,
                      ]}
                    >
                      <Text style={[s.ctaText, !name.trim() && s.ctaTextDisabled]}>
                        Continue
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* ═══ Step 2: Identity Statement ═══ */}
              {step === "identity" && (
                <>
                  <Text style={s.stepTitle}>
                    {name.trim() ? `${name.trim()}, who are you becoming?` : "Who are you becoming?"}
                  </Text>
                  <Text style={s.stepSubtitle}>
                    Write one sentence about the person you're stepping into.
                  </Text>

                  <Text style={s.fieldLabel}>YOUR IDENTITY</Text>
                  <TextInput
                    ref={identityInputRef}
                    style={s.statementInput}
                    value={statement}
                    onChangeText={setStatement}
                    placeholder="I am a disciplined creator who moves with intention and builds with purpose."
                    placeholderTextColor="rgba(255,240,225,0.25)"
                    multiline
                    textAlignVertical="top"
                  />
                  <Text style={s.hint}>
                    Present tense. As if it's already true.
                  </Text>

                  <View style={s.bottomContainer}>
                    <Pressable
                      onPress={() => animateTransition("dreamlife")}
                      style={({ pressed }) => [
                        s.ctaButton,
                        pressed && s.ctaButtonPressed,
                      ]}
                    >
                      <Text style={s.ctaText}>Continue</Text>
                    </Pressable>
                    <Pressable onPress={() => animateTransition("dreamlife")} style={s.skipButton}>
                      <Text style={s.skipText}>Skip for now</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* ═══ Step 3: Dream Life ═══ */}
              {step === "dreamlife" && (
                <>
                  <Text style={s.stepTitle}>
                    Describe your dream life{"\n"}in vivid detail.
                  </Text>
                  <Text style={s.stepSubtitle}>
                    The more detail you give, the more personal your experience will be.
                  </Text>

                  <Text style={s.fieldLabel}>YOUR DREAM LIFE</Text>
                  <TextInput
                    ref={dreamInputRef}
                    style={s.dreamInput}
                    value={dreamLife}
                    onChangeText={setDreamLife}
                    placeholder={"I wake up in my ocean-view apartment. I train hard, create freely, and my work impacts thousands. Money flows easily. My relationships are deep. I end the night in total peace..."}
                    placeholderTextColor="rgba(255,240,225,0.2)"
                    multiline
                    textAlignVertical="top"
                  />
                  <Text style={s.hint}>
                    Money, lifestyle, body, relationships, career — paint the full picture.
                  </Text>

                  <View style={s.bottomContainer}>
                    <Pressable
                      onPress={handleFinish}
                      style={({ pressed }) => [
                        s.ctaButtonFilled,
                        pressed && s.ctaButtonFilledPressed,
                      ]}
                    >
                      <LinearGradient
                        colors={["#FF8A2B", "#E5501A"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Text style={s.ctaTextFilled}>See Your Future</Text>
                    </Pressable>
                    <Pressable onPress={handleSkip} style={s.skipButton}>
                      <Text style={s.skipText}>Skip for now</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Animated.View>
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
    paddingTop: spacing["3xl"],
    paddingBottom: spacing["2xl"],
    justifyContent: "space-between",
  },

  /* Progress */
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing["3xl"],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,138,43,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.2)",
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  stepContent: {
    flex: 1,
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
  stepTitle: {
    fontFamily: fonts.editorial,
    fontSize: 32,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,240,225,0.7)",
    marginBottom: spacing["3xl"],
  },
  stepSubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,240,225,0.5)",
    marginBottom: spacing["2xl"],
    maxWidth: "90%",
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
    marginBottom: spacing.md,
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
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  dreamInput: {
    fontFamily: fonts.editorial,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textPrimary,
    backgroundColor: "rgba(13,9,6,0.8)",
    borderRadius: radius.large,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.08)",
    minHeight: 160,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,240,225,0.4)",
    lineHeight: 18,
  },

  /* Bottom */
  bottomContainer: {
    paddingTop: spacing["2xl"],
    gap: spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,138,43,0.08)",
    marginTop: spacing["2xl"],
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

  /* Filled CTA — final step only */
  ctaButtonFilled: {
    borderRadius: 28,
    paddingVertical: spacing.lg + 4,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    minHeight: 56,
  },
  ctaButtonFilledPressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.9,
  },
  ctaTextFilled: {
    fontFamily: fonts.headline,
    fontSize: 17,
    color: "#000000",
    letterSpacing: 0.5,
  },

  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,240,225,0.25)",
  },
});
