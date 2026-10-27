/** Base Fox Sport Club — border radius scale, as seen in the mockup's cards/buttons/frame. */
export const radii = {
  sm: 6,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 20,
  pill: 24,
  frame: 36,
} as const;

export type RadiusToken = keyof typeof radii;
