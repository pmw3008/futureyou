/**
 * PaywallScreen
 *
 * Full-screen paywall shown after onboarding. Cinematic luxury design.
 * Conversion-optimized: social proof → features → pricing → CTA.
 * Annual plan pre-selected (higher LTV).
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, fonts } from "../../theme";
import { useSubscription } from "../../context/SubscriptionContext";

interface PaywallScreenProps {
  onSuccess: () => void;
}

const FEATURES = [
  "Personalized morning & night visualizations",
  "Subconscious identity programming loops",
  "Daily ritual system with streak tracking",
  "Proof journaling — AI turns evidence into affirmations",
  "Future Self Vision card you can share",
];

type PlanOption = "weekly" | "annual";

export default function PaywallScreen({ onSuccess }: PaywallScreenProps) {
  const { packages, purchasePackage, restorePurchases } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>("annual");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePurchase = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setIsPurchasing(true);

    try {
      // Find the matching package
      const pkg = packages.find((p) => {
        const id = p.product.identifier.toLowerCase();
        if (selectedPlan === "annual") {
          return id.includes("annual") || id.includes("yearly");
        }
        return id.includes("weekly") || id.includes("week");
      });

      if (pkg) {
        const success = await purchasePackage(pkg);
        if (success) {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
          onSuccess();
          return;
        }
      } else {
        // No packages available (RevenueCat not configured) — skip for dev
        console.warn("[Paywall] No matching package found, skipping in dev");
        onSuccess();
        return;
      }
    } catch {
      Alert.alert("Purchase Failed", "Something went wrong. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  }, [packages, selectedPlan, purchasePackage, onSuccess]);

  const handleRestore = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setIsRestoring(true);

    try {
      const success = await restorePurchases();
      if (success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        onSuccess();
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any active subscriptions to restore."
        );
      }
    } catch {
      Alert.alert("Restore Failed", "Something went wrong. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  }, [restorePurchases, onSuccess]);

  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#000000", "#0D0906", "#080504", "#000000"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient glow */}
      <View style={s.ambientGlow}>
        <LinearGradient
          colors={[
            "rgba(229,80,26,0.18)",
            "rgba(255,138,43,0.08)",
            "transparent",
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.heroTitle}>Continue your{"\n"}daily ritual</Text>
            <Text style={s.heroSubtitle}>
              Unlock your full personalized identity transformation
            </Text>
          </View>

          {/* Social proof */}
          <View style={s.socialProof}>
            <View style={s.socialDot} />
            <Text style={s.socialText}>
              Join 10,000+ people transforming their identity
            </Text>
          </View>

          {/* Features */}
          <View style={s.featureList}>
            {FEATURES.map((feature) => (
              <View key={feature} style={s.featureRow}>
                <Text style={s.featureCheck}>{"✓"}</Text>
                <Text style={s.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Pricing cards */}
          <View style={s.pricingRow}>
            {/* Weekly */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync().catch(() => {});
                }
                setSelectedPlan("weekly");
              }}
              style={[
                s.pricingCard,
                selectedPlan === "weekly" && s.pricingCardSelected,
              ]}
            >
              <Text style={s.planName}>Weekly</Text>
              <Text style={s.planPrice}>$5.99</Text>
              <Text style={s.planPeriod}>per week</Text>
              <Text style={s.planTrial}>3-day free trial</Text>
              <Text style={s.planBadge}>FLEXIBLE</Text>
            </Pressable>

            {/* Annual */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync().catch(() => {});
                }
                setSelectedPlan("annual");
              }}
              style={[
                s.pricingCard,
                s.pricingCardAnnual,
                selectedPlan === "annual" && s.pricingCardSelected,
              ]}
            >
              {selectedPlan === "annual" && (
                <LinearGradient
                  colors={[
                    "rgba(255,138,43,0.08)",
                    "rgba(255,138,43,0.02)",
                  ]}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <Text style={s.planName}>Annual</Text>
              <Text style={s.planPrice}>$59</Text>
              <Text style={s.planPeriod}>per year</Text>
              <Text style={s.planWeekly}>$1.13/week</Text>
              <Text style={s.planTrial}>3-day free trial</Text>
              <View style={s.bestValueBadge}>
                <LinearGradient
                  colors={["rgba(255,138,43,0.25)", "rgba(229,80,26,0.15)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={s.bestValueText}>SAVE 81%</Text>
              </View>
            </Pressable>
          </View>

          {/* CTA — filled gradient (the ONE exception to outline buttons for conversion) */}
          <Pressable
            onPress={handlePurchase}
            disabled={isPurchasing}
            style={({ pressed }) => [
              s.ctaBtn,
              pressed && s.ctaBtnPressed,
              isPurchasing && s.ctaBtnDisabled,
            ]}
          >
            <LinearGradient
              colors={["#FF8A2B", "#E5501A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={s.ctaText}>Start Your Free Trial</Text>
            )}
          </Pressable>

          {/* Footer */}
          <Text style={s.cancelNote}>
            Cancel anytime. No charge for 3 days.
          </Text>

          <View style={s.footerLinks}>
            <Pressable
              onPress={handleRestore}
              disabled={isRestoring}
              hitSlop={12}
            >
              <Text style={s.footerLink}>
                {isRestoring ? "Restoring..." : "Restore Purchases"}
              </Text>
            </Pressable>
            <Text style={s.footerDot}>{"·"}</Text>
            <Pressable
              onPress={() => Linking.openURL("https://futureyou.app/terms")}
              hitSlop={12}
            >
              <Text style={s.footerLink}>Terms</Text>
            </Pressable>
            <Text style={s.footerDot}>{"·"}</Text>
            <Pressable
              onPress={() => Linking.openURL("https://futureyou.app/privacy")}
              hitSlop={12}
            >
              <Text style={s.footerLink}>Privacy</Text>
            </Pressable>
          </View>
        </ScrollView>
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
    height: "40%",
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
    paddingBottom: spacing["3xl"],
  },

  /* Hero */
  hero: {
    alignItems: "center",
    paddingTop: spacing["4xl"],
    paddingBottom: spacing["2xl"],
  },
  heroTitle: {
    fontFamily: fonts.editorial,
    fontSize: 36,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    lineHeight: 42,
    textAlign: "center",
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: "rgba(255,240,225,0.6)",
    marginTop: spacing.md,
    textAlign: "center",
  },

  /* Social proof */
  socialProof: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing["2xl"],
  },
  socialDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  socialText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,240,225,0.5)",
    letterSpacing: 0.3,
  },

  /* Features */
  featureList: {
    marginBottom: spacing["2xl"],
    paddingHorizontal: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md + 2,
    gap: spacing.md,
  },
  featureCheck: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.primary,
    marginTop: 1,
  },
  featureText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,240,225,0.7)",
    lineHeight: 20,
    flex: 1,
  },

  /* Pricing */
  pricingRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing["2xl"],
  },
  pricingCard: {
    flex: 1,
    borderRadius: radius.large,
    padding: spacing.xl,
    paddingVertical: spacing["2xl"],
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(13,9,6,0.8)",
    overflow: "hidden",
  },
  pricingCardAnnual: {},
  pricingCardSelected: {
    borderColor: "rgba(255,138,43,0.5)",
    borderWidth: 2,
  },
  planName: {
    fontFamily: fonts.headline,
    fontSize: 12,
    letterSpacing: 1.5,
    color: "rgba(255,240,225,0.5)",
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  planPrice: {
    fontFamily: fonts.editorial,
    fontSize: 32,
    color: "#F5EEE4",
    lineHeight: 36,
  },
  planPeriod: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,240,225,0.4)",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  planWeekly: {
    fontFamily: fonts.headline,
    fontSize: 13,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  planTrial: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "rgba(255,240,225,0.35)",
    marginTop: spacing.xs,
  },
  planBadge: {
    fontFamily: fonts.headline,
    fontSize: 10,
    letterSpacing: 1.5,
    color: "rgba(255,240,225,0.35)",
    marginTop: spacing.md,
  },
  bestValueBadge: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  bestValueText: {
    fontFamily: fonts.headline,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.primary,
  },

  /* CTA */
  ctaBtn: {
    borderRadius: 28,
    paddingVertical: spacing.lg + 4,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    minHeight: 56,
  },
  ctaBtnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  ctaBtnDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    fontFamily: fonts.headline,
    fontSize: 17,
    color: "#000000",
    letterSpacing: 0.5,
  },

  /* Footer */
  cancelNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,240,225,0.35)",
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  footerLink: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,240,225,0.3)",
  },
  footerDot: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,240,225,0.15)",
  },
});
