import type { ViewStyle } from 'react-native';
import { colors } from './colors';

/**
 * Base Fox Sport Club — elevation tokens.
 *
 * React Native's shadow props are iOS-only (shadowColor/Offset/Opacity/Radius);
 * `elevation` covers Android. Both are included on every token.
 */
export const shadows: Record<'card' | 'frame' | 'vipButton', ViewStyle> = {
  card: {
    shadowColor: colors.purpleDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  frame: {
    shadowColor: colors.purpleDeep,
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.45,
    shadowRadius: 60,
    elevation: 10,
  },
  vipButton: {
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  },
};
