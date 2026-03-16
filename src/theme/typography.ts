import { TextStyle } from "react-native";
import { colors } from "./colors";

export const fonts = {
  headline: "AileronBold",
  editorial: "RelationshipOfMelodrame",
  body: "MuktaExtralight",
} as const;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fonts.headline,
    fontSize: 34,
    lineHeight: 40,
    color: colors.textPrimary,
    letterSpacing: -0.7,
  },
  headline: {
    fontFamily: fonts.headline,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
    letterSpacing: -0.7,
  },
  editorial: {
    fontFamily: fonts.editorial,
    fontSize: 18,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 25,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  button: {
    fontFamily: fonts.headline,
    fontSize: 15,
    lineHeight: 20,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontFamily: fonts.headline,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
} as const;
