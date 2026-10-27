import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

/**
 * Line icons for the Espaço VIP screens, traced from
 * `design/Base Fox - Mockup MVP-print.dc.html` (telas 07/08) — the mockup
 * draws them as inline stroked SVG paths with no icon library, so this file
 * reproduces the same paths via `react-native-svg` (already a dependency
 * for the QR code) instead of pulling in an icon package.
 */

export interface VipIconProps {
  size?: number;
  color?: string;
}

export function CoffeeIcon({ size = 22, color = '#5A1886' }: VipIconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z" />
      <Path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3" />
    </Svg>
  );
}

export function BeerIcon({ size = 22, color = '#5A1886' }: VipIconProps): React.JSX.Element {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M6 8h10v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" />
      <Path d="M16 11h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M6 8a3 3 0 0 1 5-2.5A3 3 0 0 1 16 8" />
    </Svg>
  );
}

export function FoodTruckIcon({ size = 22, color = '#5A1886' }: VipIconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round">
      <Path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
      <Circle cx={7} cy={17.5} r={1.8} />
      <Circle cx={17} cy={17.5} r={1.8} />
    </Svg>
  );
}

/** Generic fallback for a `vip_perks` entry that doesn't match a known icon. */
export function PerkIcon({ size = 22, color = '#5A1886' }: VipIconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </Svg>
  );
}

export function LockIcon({ size = 16, color = '#FFFFFF' }: VipIconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
      <Rect x={4} y={11} width={16} height={10} rx={2} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}

export function ClockIcon({ size = 16, color = '#160B1E' }: VipIconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 18, color = '#C9B9D6' }: VipIconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="m9 6 6 6-6 6" />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color = '#FFFFFF' }: VipIconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round">
      <Path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function GenerateAccessIcon({ size = 20, color = '#160B1E' }: VipIconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Rect x={3} y={3} width={7} height={7} rx={1} />
      <Rect x={14} y={3} width={7} height={7} rx={1} />
      <Rect x={3} y={14} width={7} height={7} rx={1} />
      <Path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
    </Svg>
  );
}

/** Maps a `vip_perks` label (free text from the event document) to a known icon, with a generic fallback. */
export function perkIconFor(label: string): (props: VipIconProps) => React.JSX.Element {
  const normalized = label.toLowerCase();
  if (normalized.includes('café') || normalized.includes('cafe')) return CoffeeIcon;
  if (normalized.includes('cerveja')) return BeerIcon;
  if (normalized.includes('food truck') || normalized.includes('truck')) return FoodTruckIcon;
  return PerkIcon;
}
