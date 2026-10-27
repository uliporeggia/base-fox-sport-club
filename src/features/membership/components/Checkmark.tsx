import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../../theme';

interface CheckmarkProps {
  size?: number;
  color?: string;
}

/**
 * Checkmark glyph used by the membership benefit lists (telas 03/12) —
 * SVG stroke, stroke-width 2.4, color #F6730C per UI-REFERENCE.
 */
export function Checkmark({ size = 18, color = colors.orange }: CheckmarkProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12.5L9.5 18L20 6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
