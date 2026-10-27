/**
 * Base Fox Sport Club — color tokens.
 * Source: design/README.md (identidade visual) + design/Base Fox - Mockup MVP-print.dc.html
 */
export const colors = {
  // Brand
  purple: '#5A1886',
  purpleDeep: '#22092F',
  orange: '#F6730C',
  strava: '#FC4C02',

  // Text
  textPrimary: '#160B1E',
  textSecondary: '#6E6478',
  textTertiary: '#3B3045',

  // Backgrounds
  backgroundMuted: '#E9E5ED',
  backgroundTint: '#F1EAF6',
  backgroundWhite: '#FFFFFF',

  // Supporting tones seen in the mockup (borders, disabled states, chips)
  border: '#DCD3E3',
  borderMuted: '#ECE6F1',
  chipBackground: '#E2D6EC',
  chipText: '#22092F',
  tabInactive: '#7A7086',
} as const;

export type ColorToken = keyof typeof colors;
