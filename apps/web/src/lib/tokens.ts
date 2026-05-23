// Mirrors apps/mobile/constants/theme.ts + sintonia-design-system tokens.js
export const T = {
  bg: "#0A172B",
  surface: "#1A2744",
  surfaceLight: "#243354",
  dialBg: "#162038",
  dialBorder: "#2A3A5C",

  primary: "#D3773F",
  secondary: "#AAC573",
  accent: "#F5A623",
  coral: "#FF6B6B",
  pink: "#E84393",
  sky: "#74B9FF",
  mint: "#55EFC4",
  yellow: "#F8E71C",
  lavender: "#A29BFE",
  orange: "#FF9F43",

  zone4: "#E8573D",
  zone3: "#F5A623",
  zone2: "#F8E71C",

  text: "#FFFFFF",
  textMuted: "#8B9DC3",
  textDark: "#0F1B2D",
  needle: "#FFFFFF",
  pivot: "#E8573D",

  fontDisplay: "var(--font-display)",
  fontBody: "var(--font-body)",
} as const;

export type Tokens = typeof T;
