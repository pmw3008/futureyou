import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export type OrbPalette = "sunset" | "deepEnergy" | "cosmic" | "gold";

// Richer, more saturated palette matching the mood board:
// deep red-orange bleeding into amber, gold highlights
const PALETTES: Record<OrbPalette, { hot: string; warm: string; edge: string }> = {
  sunset: {
    hot: "rgba(229,80,26,0.45)",    // deep burnt orange core
    warm: "rgba(255,138,43,0.30)",   // rich amber mid
    edge: "rgba(255,186,74,0)",      // gold fade to nothing
  },
  deepEnergy: {
    hot: "rgba(184,61,21,0.40)",     // dark ember core
    warm: "rgba(229,80,26,0.28)",    // burnt orange mid
    edge: "rgba(204,59,26,0)",       // deep red fade
  },
  cosmic: {
    hot: "rgba(204,59,26,0.35)",     // red-orange core
    warm: "rgba(255,138,43,0.22)",   // warm orange mid
    edge: "rgba(255,186,74,0)",      // gold fade
  },
  gold: {
    hot: "rgba(255,186,74,0.40)",    // warm gold core
    warm: "rgba(255,216,138,0.25)",  // cream mid
    edge: "rgba(255,138,43,0)",      // orange fade
  },
};

const ORB_SIZE = SCREEN_WIDTH * 1.4;

interface RadialGlowProps {
  centerY?: number;
  intensity?: number;
  palette?: OrbPalette;
  isActive?: boolean;
}

/**
 * Single organic diffused light source.
 * Deep burnt orange / red-orange bleeding into amber gold on pure black.
 * No rings, no shapes. Just warmth radiating from a point.
 */
export function RadialGlow({
  centerY = 0.28,
  intensity = 1,
  palette = "sunset",
  isActive = false,
}: RadialGlowProps) {
  const cy = SCREEN_HEIGHT * centerY;
  const p = PALETTES[palette];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isActive) {
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 3600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 3600,
            useNativeDriver: true,
          }),
        ])
      );
      animRef.current.start();
    } else {
      if (animRef.current) {
        animRef.current.stop();
        animRef.current = null;
      }
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (animRef.current) {
        animRef.current.stop();
        animRef.current = null;
      }
    };
  }, [isActive, pulseAnim]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Pure black base */}
      <View style={[StyleSheet.absoluteFillObject, styles.blackBase]} />

      {/* Main diffused warm light */}
      <Animated.View
        style={[
          styles.orbWrapper,
          {
            width: ORB_SIZE,
            height: ORB_SIZE,
            top: cy - ORB_SIZE / 2,
            left: (SCREEN_WIDTH - ORB_SIZE) / 2,
            transform: [{ scale: pulseAnim }],
            opacity: intensity,
          },
        ]}
      >
        {/* Hot core — deep orange/red radiating outward */}
        <LinearGradient
          colors={[p.hot, p.warm, p.edge]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[p.hot, p.warm, p.edge]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[p.hot, p.warm, p.edge]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[p.hot, p.warm, p.edge]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Asymmetric warm shift — slight offset for organic feel */}
        <LinearGradient
          colors={[p.hot, "transparent"]}
          start={{ x: 0.4, y: 0.35 }}
          end={{ x: 0.8, y: 0.8 }}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.5 }]}
        />

        {/* Blur diffusion — inside orb so it only softens the glow, not screen content */}
        <BlurView
          intensity={80}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  blackBase: {
    backgroundColor: "#000000",
  },
  orbWrapper: {
    position: "absolute",
    borderRadius: 9999,
    overflow: "hidden",
  },
});
