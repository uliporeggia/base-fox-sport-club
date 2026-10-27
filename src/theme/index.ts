import { colors } from './colors';
import { fontFamily, fontSize, lineHeight, letterSpacing } from './typography';
import { spacing } from './spacing';
import { radii } from './radii';
import { shadows } from './shadows';

export { colors } from './colors';
export type { ColorToken } from './colors';
export { fontFamily, fontSize, lineHeight, letterSpacing } from './typography';
export type { FontFamilyToken } from './typography';
export { spacing } from './spacing';
export type { SpacingToken } from './spacing';
export { radii } from './radii';
export type { RadiusToken } from './radii';
export { shadows } from './shadows';
export { useAppFonts } from './fonts';

/** Single-import convenience bundle: `import { theme } from '@/theme'`. */
export const theme = {
  colors,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  spacing,
  radii,
  shadows,
  layout: {
    frameWidth: 390,
    frameHeight: 844,
    tabBarHeight: 88,
  },
} as const;

export type Theme = typeof theme;
