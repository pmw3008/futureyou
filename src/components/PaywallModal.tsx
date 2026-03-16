/**
 * PaywallModal
 *
 * Condensed paywall modal triggered when non-premium users tap gated features.
 * Compact version of PaywallScreen — headline, pricing, CTA, restore.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, fonts } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

type PlanOption = "weekly" | "annual";

export function PaywallModal({
  visible,
  onClose,
  featureName,
}: PaywallModalProps) {
  const { packages, purchasePackage, restorePurchases } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>("annual");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePurchase = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPurchasing(true);

    try {
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onClose();
          return;
        }
      } else {
        // Dev mode — no packages configured
        console.warn("[PaywallModal] No matching package found");
        onClose();
        return;
      }
    } catch {
      Alert.alert("Purchase Failed", "Something went wrong. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  }, [packages, selectedPlan, purchasePackage, onClose]);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRestoring(true);

    try {
      const success = await restorePurchases();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
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
  }, [restorePurchases, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <LinearGradient
          colors={["#0D0906", "#080504", "#000000"]}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
          {/* Close */}
          <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
            <Text style={s.closeText}>{"✕"}</Text>
          </Pressable>

          <View style={s.content}>
            {/* Header */}
            <Text style={s.title}>Unlock FutureYou</Text>
            {featureName && (
              <Text style={s.subtitle}>
                {featureName} requires Premium
              </Text>
            )}

            {/* Pricing */}
            <View style={s.pricingRow}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedPlan("weekly");
                }}
                style={[
                  s.planCard,
                  selectedPlan === "weekly" && s.planCardSelected,
                ]}
              >
                <Text style={s.planPrice}>$5.99/wk</Text>
                <Text style={s.planLabel}>Flexible</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedPlan("annual");
                }}
                style={[
                  s.planCard,
                  selectedPlan === "annual" && s.planCardSelected,
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
                <Text style={s.planPrice}>$29.99/yr</Text>
                <Text style={s.planSavings}>Save 90%</Text>
                <Text style={s.planLabel}>Best Value</Text>
              </Pressable>
            </View>

            <Text style={s.trialNote}>3-day free trial on both plans</Text>

            {/* CTA */}
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
                <Text style={s.ctaText}>Start Free Trial</Text>
              )}
            </Pressable>

            <Text style={s.cancelNote}>Cancel anytime. No charge for 3 days.</Text>

            {/* Restore */}
            <Pressable
              onPress={handleRestore}
              disabled={isRestoring}
              hitSlop={12}
              style={s.restoreBtn}
            >
              <Text style={s.restoreText}>
                {isRestoring ? "Restoring..." : "Restore Purchases"}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  safe: {
    flex: 1,
  },
  closeBtn: {
    alignSelf: "flex-end",
    padding: spacing.xl,
  },
  closeText: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: "rgba(255,240,225,0.4)",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing["2xl"],
    justifyContent: "center",
    paddingBottom: spacing["4xl"],
  },

  /* Header */
  title: {
    fontFamily: fonts.editorial,
    fontSize: 34,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    lineHeight: 40,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: "rgba(255,240,225,0.5)",
    textAlign: "center",
    marginBottom: spacing["2xl"],
  },

  /* Pricing */
  pricingRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  planCard: {
    flex: 1,
    borderRadius: radius.large,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(13,9,6,0.8)",
    overflow: "hidden",
  },
  planCardSelected: {
    borderColor: "rgba(255,138,43,0.5)",
    borderWidth: 2,
  },
  planPrice: {
    fontFamily: fonts.editorial,
    fontSize: 22,
    color: "#F5EEE4",
    lineHeight: 26,
    marginBottom: spacing.xs,
  },
  planSavings: {
    fontFamily: fonts.headline,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  planLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "rgba(255,240,225,0.35)",
    marginTop: spacing.xs,
  },

  trialNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,240,225,0.3)",
    textAlign: "center",
    marginBottom: spacing["2xl"],
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

  cancelNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,240,225,0.3)",
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },

  restoreBtn: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  restoreText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,240,225,0.25)",
  },
});
