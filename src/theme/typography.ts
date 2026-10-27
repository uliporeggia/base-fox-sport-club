/**
 * Base Fox Sport Club — typography tokens.
 *
 * Saira (500–800) for headings/labels, Barlow (400–700) for body text, as
 * loaded by `useAppFonts` (src/theme/fonts.ts) from @expo-google-fonts/*.
 */
export const fontFamily = {
  sairaMedium: 'Saira_500Medium',
  sairaSemiBold: 'Saira_600SemiBold',
  sairaBold: 'Saira_700Bold',
  sairaExtraBold: 'Saira_800ExtraBold',
  barlowRegular: 'Barlow_400Regular',
  barlowMedium: 'Barlow_500Medium',
  barlowSemiBold: 'Barlow_600SemiBold',
  barlowBold: 'Barlow_700Bold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  display: 28,
  hero: 34,
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.4,
} as const;

export const letterSpacing = {
  none: 0,
  wide: 0.3,
  wider: 0.6,
} as const;

export type FontFamilyToken = keyof typeof fontFamily;
