export const colors = {
  // ─── Core Darks ──────────────────────────────────────────────
  background: "#000000",       // Pure black
  surface: "#0D0906",          // Warm-tinted dark surface
  surfaceMuted: "#120D08",     // Muted warm surface
  surfaceWarm: "#1A1008",      // Warm dark surface

  // ─── Brand / Glow Accents ────────────────────────────────────
  primary: "#FF8A2B",          // Rich saturated orange
  primaryMuted: "#FF8A2B12",   // Subtle orange tint
  primaryLight: "#FF8A2B20",   // Light orange overlay
  gold: "#FFBA4A",             // Warm gold
  amber: "#FF8A2B",            // Core orange
  deepOrange: "#E5501A",       // Deep burnt orange
  coral: "#CC3B1A",            // Deep red-orange
  warmGlow: "#FFD88A",         // Warm cream glow
  ember: "#B83D15",            // Dark ember (deepest accent)

  // ─── Neutrals ────────────────────────────────────────────────
  warmBeige: "#241A10",        // Disabled / muted bg (warm-tinted)
  neutralGray: "#3D3228",      // Medium warm neutral
  divider: "#1A1410",          // Subtle warm separator
  border: "#251C14",           // Card borders (warm brown)

  // ─── Text ────────────────────────────────────────────────────
  textPrimary: "#F5EEE4",      // Warm cream text
  textSecondary: "#8A7A68",    // Warm muted text
  textMuted: "#7A6A58",        // Warm muted text (improved contrast)

  // ─── Legacy Aliases ──────────────────────────────────────────
  secondary: "#FF8A2B",
  accent: "#FFBA4A",
} as const;
