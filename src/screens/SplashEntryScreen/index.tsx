import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");
const GLOW_SIZE = width * 1.4;

interface SplashEntryScreenProps {
  onComplete: () => void;
}

export function SplashEntryScreen({ onComplete }: SplashEntryScreenProps) {
  const glowScale = useRef(new Animated.Value(0.3)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(24)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Warm light materializes from darkness
    const glowAppear = Animated.parallel([
      Animated.timing(glowScale, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    // Phase 2: Title rises from the warmth
    const titleReveal = Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    // Phase 3: Subtitle fades in
    const subtitleReveal = Animated.timing(subtitleOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    });

    // Phase 4: Everything fades out
    const exit = Animated.timing(fadeOut, {
      toValue: 0,
      duration: 400,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

    Animated.sequence([
      Animated.delay(200),
      glowAppear,
      Animated.delay(200),
      titleReveal,
      Animated.delay(100),
      subtitleReveal,
      Animated.delay(900),
      exit,
    ]).start(() => {
      onComplete();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* Warm dark gradient base */}
      <LinearGradient
        colors={["#000000", "#0D0906", "#080504", "#000000"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Diffused warm light source */}
      <Animated.View
        style={[
          styles.glowWrapper,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      >
        {/* Deep red-orange core */}
        <LinearGradient
          colors={[
            "rgba(229,80,26,0.50)",
            "rgba(255,138,43,0.30)",
            "rgba(255,186,74,0.08)",
            "transparent",
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[
            "rgba(229,80,26,0.50)",
            "rgba(255,138,43,0.30)",
            "rgba(255,186,74,0.08)",
            "transparent",
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[
            "rgba(204,59,26,0.40)",
            "rgba(229,80,26,0.25)",
            "rgba(255,138,43,0.06)",
            "transparent",
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[
            "rgba(255,138,43,0.45)",
            "rgba(255,186,74,0.20)",
            "transparent",
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Hot center accent */}
        <LinearGradient
          colors={["rgba(255,186,74,0.30)", "rgba(229,80,26,0.15)", "transparent"]}
          start={{ x: 0.45, y: 0.4 }}
          end={{ x: 0.7, y: 0.75 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Blur diffusion — inside glow wrapper so it only blurs the glow, not the text */}
        <BlurView
          intensity={60}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Title */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        <Text style={styles.title}>FutureYou</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View
        style={[styles.subtitleContainer, { opacity: subtitleOpacity }]}
      >
        <Text style={styles.subtitle}>step into your highest self</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  glowWrapper: {
    position: "absolute",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: 9999,
    overflow: "hidden",
    top: height * 0.5 - GLOW_SIZE * 0.5,
    left: width * 0.5 - GLOW_SIZE * 0.5,
  },
  textContainer: {
    alignItems: "center",
    zIndex: 10,
  },
  title: {
    fontFamily: "RelationshipOfMelodrame",
    fontSize: 44,
    color: "#F5EEE4",
    letterSpacing: 2,
  },
  subtitleContainer: {
    marginTop: 16,
    alignItems: "center",
    zIndex: 10,
  },
  subtitle: {
    fontFamily: "MuktaExtralight",
    fontSize: 15,
    color: "rgba(255,240,225,0.85)",
    letterSpacing: 3.5,
    textTransform: "lowercase",
  },
});
