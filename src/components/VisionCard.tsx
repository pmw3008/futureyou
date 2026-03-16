import React, { useRef, useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { colors, spacing, radius, fonts } from "../theme";
import type { UserProfile } from "../types";
import { usePaywallGate } from "../hooks/usePaywallGate";
import { PaywallModal } from "./PaywallModal";

interface VisionCardProps {
  profile: UserProfile;
}

export function VisionCard({ profile }: VisionCardProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { gate, paywallVisible, featureName, hidePaywall } = usePaywallGate();

  const handleShare = useCallback(async () => {
    if (!viewShotRef.current?.capture) return;
    setIsSharing(true);
    try {
      const uri = await viewShotRef.current.capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share Your Vision",
        });
      } else {
        Alert.alert("Sharing not available", "Sharing is not available on this device.");
      }
    } catch (err) {
      console.warn("[VisionCard] Share error:", err);
    } finally {
      setIsSharing(false);
    }
  }, []);

  const name = profile.name || "You";
  const identity = profile.identityStatement;
  const dreamLife = profile.idealDay;

  const hasContent = identity || dreamLife;

  if (!hasContent) return null;

  return (
    <View style={s.wrapper}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: "png", quality: 1 }}
        style={s.captureWrapper}
      >
        <View style={s.card}>
          <LinearGradient
            colors={["#0D0906", "#1A0E06", "#120A05", "#080504"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Warm glow accent */}
          <View style={s.glowOrb} />

          {/* Content */}
          <View style={s.cardContent}>
            <Text style={s.brandLabel}>FUTUREYOU</Text>

            <Text style={s.nameLabel}>{name}</Text>

            {identity ? (
              <View style={s.section}>
                <Text style={s.sectionLabel}>I AM BECOMING</Text>
                <Text style={s.identityText}>"{identity}"</Text>
              </View>
            ) : null}

            {dreamLife ? (
              <View style={s.section}>
                <Text style={s.sectionLabel}>MY DREAM LIFE</Text>
                <Text style={s.dreamText}>"{dreamLife}"</Text>
              </View>
            ) : null}

            <View style={s.footer}>
              <View style={s.footerLine} />
              <Text style={s.footerText}>This is my declaration.</Text>
            </View>
          </View>
        </View>
      </ViewShot>

      {/* Share button — outside capture area */}
      <Pressable
        onPress={() => gate(handleShare, "Share Vision")}
        disabled={isSharing}
        style={({ pressed }) => [
          s.shareBtn,
          pressed && s.shareBtnPressed,
          isSharing && s.shareBtnDisabled,
        ]}
      >
        <Text style={s.shareBtnText}>
          {isSharing ? "Preparing..." : "Share Your Vision"}
        </Text>
      </Pressable>

      {/* Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={hidePaywall} featureName={featureName} />
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    marginTop: spacing.xl,
    paddingTop: spacing["2xl"],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  captureWrapper: {
    borderRadius: radius.large,
    overflow: "hidden",
  },
  card: {
    borderRadius: radius.large,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.15)",
    minHeight: 320,
  },
  glowOrb: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FF8A2B",
    opacity: 0.06,
  },
  cardContent: {
    padding: spacing["2xl"],
    paddingVertical: spacing["3xl"],
  },
  brandLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 4,
    color: "rgba(255,138,43,0.5)",
    textTransform: "uppercase",
    marginBottom: spacing["2xl"],
  },
  nameLabel: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    marginBottom: spacing["2xl"],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.primary,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  identityText: {
    fontFamily: fonts.editorial,
    fontSize: 20,
    lineHeight: 30,
    color: "#FFFFFF",
  },
  dreamText: {
    fontFamily: fonts.editorial,
    fontSize: 17,
    lineHeight: 26,
    color: "rgba(255,240,225,0.85)",
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(255,138,43,0.3)",
    marginBottom: spacing.md,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
  },

  /* Share button */
  shareBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.7)",
    backgroundColor: "transparent",
    borderRadius: 28,
    paddingVertical: spacing.lg + 2,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  shareBtnPressed: {
    backgroundColor: colors.primaryMuted,
    transform: [{ scale: 0.97 }],
  },
  shareBtnDisabled: {
    opacity: 0.5,
  },
  shareBtnText: {
    fontFamily: fonts.headline,
    fontSize: 16,
    letterSpacing: 0.3,
    color: colors.primary,
  },
});
