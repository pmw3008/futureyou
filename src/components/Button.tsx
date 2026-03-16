import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, radius, typography } from "../theme";

type ButtonVariant = "primary" | "outline" | "large";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  disabled?: boolean;
}

/**
 * Luxury outline button — thin border, transparent bg.
 * Fills with gradient on press.
 */
export default function Button({
  label,
  onPress,
  variant = "primary",
  style,
  disabled,
}: ButtonProps) {
  const isLarge = variant === "large";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isLarge && styles.large,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {pressed && !disabled && (
            <LinearGradient
              colors={["#FF8A2B", "#FFBA4A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
            />
          )}
          <Text
            style={[
              styles.text,
              isLarge && styles.largeText,
              pressed && !disabled && styles.textPressed,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: "rgba(255,138,43,0.7)",
    backgroundColor: "transparent",
    borderRadius: 28,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["2xl"],
    alignItems: "center",
    overflow: "hidden",
  },
  large: {
    paddingVertical: spacing.xl - 4,
  },
  pressed: {
    transform: [{ scale: 0.975 }],
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    ...typography.button,
    color: colors.primary,
    zIndex: 2,
  },
  largeText: {
    fontSize: 16,
  },
  textPressed: {
    color: "#1A1008",
  },
});
