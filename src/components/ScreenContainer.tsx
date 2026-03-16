import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import { RadialGlow } from "./RadialGlow";
import type { OrbPalette } from "./RadialGlow";

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Hide the radial glow background */
  noGlow?: boolean;
  /** Whether audio is playing — orb pulses */
  orbActive?: boolean;
  /** Orb color palette */
  orbPalette?: OrbPalette;
}

// Memoize RadialGlow separately so it doesn't rerender on children changes
const MemoizedGlow = React.memo(RadialGlow);

export default function ScreenContainer({
  children,
  noGlow,
  orbActive,
  orbPalette,
}: ScreenContainerProps) {
  return (
    <View style={styles.root}>
      {!noGlow && <MemoizedGlow isActive={orbActive} palette={orbPalette} />}
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing["5xl"],
  },
});
