import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, typography, fonts } from "../../theme";
import { useUserProfile } from "../../context/UserProfileContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { GuideSelector } from "../../components/GuideSelector";
import { VisionCard } from "../../components/VisionCard";

// ─── Identity Prompts ─────────────────────────────────────────

const IDENTITY_PROMPTS: {
  key: "identityStatement" | "idealDay";
  question: string;
  placeholder: string;
}[] = [
  {
    key: "identityStatement",
    question: "Who are you becoming?",
    placeholder: "I am a disciplined, magnetic creator living on my own terms.",
  },
  {
    key: "idealDay",
    question: "What does your dream life look like?",
    placeholder: "I wake early, train hard, create freely, and end the night in deep peace.",
  },
];

// ─── Prompt Card Component ────────────────────────────────────

function PromptCard({
  question,
  value,
  placeholder,
  onSave,
}: {
  question: string;
  value: string;
  placeholder: string;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);

  const handleBlur = useCallback(() => {
    setFocused(false);
    if (text.trim() !== value) {
      onSave(text.trim());
    }
  }, [text, value, onSave]);

  return (
    <View style={[s.promptCard, focused && s.promptCardFocused]}>
      <Text style={s.promptQuestion}>{question}</Text>
      <TextInput
        style={s.promptInput}
        value={text}
        onChangeText={setText}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────

export default function IdentityScreen() {
  const { profile, updateProfile, setSelectedGuide } = useUserProfile();
  const { isPremium, isTrialing } = useSubscription();
  const navigation = useNavigation<any>();
  const [nameText, setNameText] = useState(profile.name);

  const saveField = useCallback(
    (key: string, value: string) => {
      updateProfile({ [key]: value });
    },
    [updateProfile]
  );

  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#000000", "#0D0906", "#080504", "#000000"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Warm ambient glow */}
      <View style={s.ambientGlow}>
        <LinearGradient
          colors={["rgba(229,80,26,0.22)", "rgba(255,138,43,0.10)", "transparent"]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={["rgba(229,80,26,0.22)", "rgba(255,138,43,0.10)", "transparent"]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView style={s.safe} edges={["top"]}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={s.flex}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Text style={s.screenTitle}>Identity</Text>
            <Text style={s.screenSubtitle}>
              These two answers shape everything — your scripts, affirmations, and visualizations.
            </Text>

            {/* Name */}
            <View style={s.nameSection}>
              <Text style={s.fieldLabel}>YOUR NAME</Text>
              <TextInput
                style={s.nameInput}
                value={nameText}
                onChangeText={setNameText}
                onBlur={() => {
                  if (nameText.trim() !== profile.name) {
                    updateProfile({ name: nameText.trim() });
                  }
                }}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Identity Prompts */}
            {IDENTITY_PROMPTS.map((prompt) => (
              <PromptCard
                key={prompt.key}
                question={prompt.question}
                value={profile[prompt.key]}
                placeholder={prompt.placeholder}
                onSave={(text) => saveField(prompt.key, text)}
              />
            ))}

            {/* Guide Voice */}
            <View style={s.guideSection}>
              <Text style={s.fieldLabel}>GUIDE VOICE</Text>
              <GuideSelector
                selectedGuideId={profile.selectedGuideId}
                onSelect={setSelectedGuide}
              />
            </View>

            {/* Vision Card */}
            <VisionCard profile={profile} />

            {/* Subscription Link */}
            <View style={s.subscriptionSection}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }
                  navigation.navigate("Subscription");
                }}
                style={({ pressed }) => [
                  s.subscriptionBtn,
                  pressed && s.subscriptionBtnPressed,
                ]}
              >
                <View style={s.subscriptionBtnInner}>
                  <Text style={s.subscriptionBtnText}>Manage Subscription</Text>
                  <View style={s.subscriptionBadge}>
                    <Text style={s.subscriptionBadgeText}>
                      {isPremium
                        ? isTrialing
                          ? "TRIAL"
                          : "ACTIVE"
                        : "FREE"}
                    </Text>
                  </View>
                </View>
                <Text style={s.subscriptionArrow}>{">"}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  ambientGlow: {
    position: "absolute",
    width: "140%",
    height: "50%",
    top: 0,
    left: "-20%",
    borderRadius: 9999,
    overflow: "hidden",
    opacity: 0.9,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing["5xl"],
  },

  /* Header */
  screenTitle: {
    fontFamily: fonts.editorial,
    fontSize: 42,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    lineHeight: 46,
    marginBottom: spacing.sm,
  },
  screenSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,240,225,0.7)",
    marginBottom: spacing["3xl"],
    maxWidth: "85%",
  },

  /* Name */
  nameSection: {
    marginBottom: spacing["2xl"],
  },
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
  },

  /* Prompt Cards */
  promptCard: {
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.08)",
    borderRadius: radius.large,
    backgroundColor: "rgba(13,9,6,0.8)",
    padding: spacing.xl,
    overflow: "hidden",
  },
  promptCardFocused: {
    borderColor: "rgba(255,138,43,0.3)",
  },
  promptQuestion: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.lg,
  },
  promptInput: {
    fontFamily: fonts.editorial,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
    padding: 0,
  },

  /* Guide Section */
  guideSection: {
    marginTop: spacing.xl,
    paddingTop: spacing["2xl"],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,138,43,0.08)",
  },

  /* Subscription */
  subscriptionSection: {
    marginTop: spacing["2xl"],
    paddingTop: spacing["2xl"],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,138,43,0.08)",
  },
  subscriptionBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: radius.large,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.08)",
    backgroundColor: "rgba(13,9,6,0.8)",
  },
  subscriptionBtnPressed: {
    backgroundColor: "rgba(255,138,43,0.04)",
    borderColor: "rgba(255,138,43,0.15)",
  },
  subscriptionBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  subscriptionBtnText: {
    fontFamily: fonts.headline,
    fontSize: 15,
    color: "#F5EEE4",
    letterSpacing: 0.2,
  },
  subscriptionBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,138,43,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.2)",
  },
  subscriptionBadgeText: {
    fontFamily: fonts.headline,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.primary,
  },
  subscriptionArrow: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: "rgba(255,240,225,0.3)",
  },
});
