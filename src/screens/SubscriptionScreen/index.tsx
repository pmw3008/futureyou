/**
 * SubscriptionScreen
 *
 * Subscription management screen accessible from Identity tab.
 * Shows plan, status, renewal date. Links to manage/restore/support.
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "../../components";
import { colors, spacing, radius, fonts } from "../../theme";
import { useSubscription } from "../../context/SubscriptionContext";

export default function SubscriptionScreen() {
  const { isPremium, isTrialing, plan, status, expirationDate, restorePurchases } =
    useSubscription();

  const handleManage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "ios") {
      Linking.openURL("https://apps.apple.com/account/subscriptions");
    } else {
      Linking.openURL(
        "https://play.google.com/store/account/subscriptions"
      );
    }
  }, []);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const success = await restorePurchases();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Restored", "Your subscription has been restored.");
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any active subscriptions."
        );
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  }, [restorePurchases]);

  const handleSupport = useCallback(() => {
    Linking.openURL("mailto:support@futureyou.app");
  }, []);

  const formatDate = (iso: string | null): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusLabel = (): string => {
    switch (status) {
      case "active":
        return "Active";
      case "trialing":
        return "Free Trial";
      case "expired":
        return "Expired";
      default:
        return "No Subscription";
    }
  };

  const planLabel = (): string => {
    if (!plan) return "—";
    return plan === "annual" ? "Annual ($29.99/yr)" : "Weekly ($5.99/wk)";
  };

  return (
    <ScreenContainer>
      <View style={s.header}>
        <Text style={s.title}>Subscription</Text>
        <Text style={s.subtitle}>Manage your FutureYou premium plan</Text>
      </View>

      {/* Status card */}
      <View style={s.statusCard}>
        <LinearGradient
          colors={[
            isPremium ? "rgba(255,138,43,0.10)" : "rgba(255,255,255,0.03)",
            "transparent",
          ]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={s.statusRow}>
          <Text style={s.statusLabel}>Status</Text>
          <View style={s.statusBadge}>
            <View
              style={[
                s.statusDot,
                isPremium ? s.statusDotActive : s.statusDotInactive,
              ]}
            />
            <Text
              style={[
                s.statusValue,
                isPremium ? s.statusValueActive : s.statusValueInactive,
              ]}
            >
              {statusLabel()}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.statusRow}>
          <Text style={s.statusLabel}>Plan</Text>
          <Text style={s.statusValue}>{planLabel()}</Text>
        </View>

        <View style={s.divider} />

        <View style={s.statusRow}>
          <Text style={s.statusLabel}>
            {isTrialing ? "Trial Ends" : "Renewal Date"}
          </Text>
          <Text style={s.statusValue}>{formatDate(expirationDate)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        {isPremium && (
          <Pressable
            onPress={handleManage}
            style={({ pressed }) => [s.actionBtn, pressed && s.actionBtnPressed]}
          >
            <Text style={s.actionBtnText}>Manage Subscription</Text>
            <Text style={s.actionBtnArrow}>{">"}</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleRestore}
          style={({ pressed }) => [s.actionBtn, pressed && s.actionBtnPressed]}
        >
          <Text style={s.actionBtnText}>Restore Purchases</Text>
          <Text style={s.actionBtnArrow}>{">"}</Text>
        </Pressable>

        <Pressable
          onPress={handleSupport}
          style={({ pressed }) => [s.actionBtn, pressed && s.actionBtnPressed]}
        >
          <Text style={s.actionBtnText}>Contact Support</Text>
          <Text style={s.actionBtnArrow}>{">"}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    marginBottom: spacing["2xl"],
  },
  title: {
    fontFamily: fonts.editorial,
    fontSize: 42,
    color: "#F5EEE4",
    letterSpacing: -0.5,
    lineHeight: 46,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,240,225,0.7)",
    maxWidth: "85%",
  },

  statusCard: {
    borderRadius: radius.large,
    padding: spacing["2xl"],
    marginBottom: spacing["2xl"],
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.08)",
    backgroundColor: "rgba(13,9,6,0.8)",
    overflow: "hidden",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  statusLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,240,225,0.5)",
  },
  statusValue: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: "#F5EEE4",
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: colors.primary,
  },
  statusDotInactive: {
    backgroundColor: "rgba(255,240,225,0.2)",
  },
  statusValueActive: {
    color: colors.primary,
  },
  statusValueInactive: {
    color: "rgba(255,240,225,0.4)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginVertical: spacing.sm,
  },

  actions: {
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: radius.large,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.08)",
    backgroundColor: "rgba(13,9,6,0.8)",
  },
  actionBtnPressed: {
    backgroundColor: "rgba(255,138,43,0.04)",
    borderColor: "rgba(255,138,43,0.15)",
  },
  actionBtnText: {
    fontFamily: fonts.headline,
    fontSize: 15,
    color: "#F5EEE4",
    letterSpacing: 0.2,
  },
  actionBtnArrow: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: "rgba(255,240,225,0.3)",
  },
});
