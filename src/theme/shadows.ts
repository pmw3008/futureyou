import { Platform } from "react-native";

export const shadows = {
  small: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  }),
  medium: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
    },
    android: { elevation: 4 },
    default: {},
  }),
  large: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 28,
    },
    android: { elevation: 8 },
    default: {},
  }),
  glow: Platform.select({
    ios: {
      shadowColor: "#FF8A2B",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
    },
    android: { elevation: 6 },
    default: {},
  }),
  warmGlow: Platform.select({
    ios: {
      shadowColor: "#E5501A",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 30,
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const;
