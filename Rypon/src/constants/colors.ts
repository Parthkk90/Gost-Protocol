/**
 * Color constants matching the HTML design system
 * Primary color: #6d13ec (purple)
 */

export const Colors = {
  primary: "#6d13ec",

  // Backgrounds
  backgroundLight: "#f7f6f8",
  backgroundDark: "#181022",

  // Surfaces
  surfaceDark: "#251b30",
  surfaceDark2: "#241e30",
  cardDark: "#231b2e",
  inputBg: "#2d243a",

  // Text colors
  textPrimary: "#FFFFFF",
  textSecondary: "#a89db9",
  textTertiary: "#64748b",

  // Status colors
  success: "#10b981",
  successLight: "#14F195",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",

  // Gradients
  gradientStart: "#9945FF",
  gradientEnd: "#14F195",

  // Borders
  borderLight: "#e2e8f0",
  borderDark: "rgba(255, 255, 255, 0.05)",

  // Transparent overlays
  overlay: "rgba(0, 0, 0, 0.5)",
  glassEffect: "rgba(255, 255, 255, 0.03)",

  // Token colors
  bitcoin: "#F7931A",
  usdc: "#2775CA",
} as const;

export type ColorKey = keyof typeof Colors;
