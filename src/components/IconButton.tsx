import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme";

interface IconButtonProps {
  icon: string;
  onPress?: () => void;
  size?: number;
}

export default function IconButton({
  icon,
  onPress,
  size = 44,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    backgroundColor: colors.warmBeige,
    transform: [{ scale: 0.94 }],
  },
  icon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
