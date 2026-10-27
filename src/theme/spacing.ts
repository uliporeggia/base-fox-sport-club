/** Base Fox Sport Club — spacing scale (4px base unit, as seen across the mockup's gaps/padding). */
export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 24,
  xxxl: 28,
} as const;

export type SpacingToken = keyof typeof spacing;
