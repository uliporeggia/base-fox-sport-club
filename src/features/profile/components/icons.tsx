import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme';

/** Chevron used by every navigable row — path lifted from the mockup's own `<svg>` (design/Base Fox - Mockup MVP-print.dc.html, tela 15). */
export function ChevronIcon({ color = colors.textSecondary }: { color?: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="m9 6 6 6-6 6" />
    </Svg>
  );
}

/** Strava glyph — same path as the mockup's "Strava" row icon. */
export function StravaIcon({ color = colors.backgroundWhite }: { color?: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="round">
      <Path d="M3 20 10 6l7 14M13 20l3-6 3 6" />
    </Svg>
  );
}

/** Bell glyph — same path as the mockup's "Notificações" row icon. */
export function BellIcon({ color = colors.purple }: { color?: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </Svg>
  );
}

/** Membership badge glyph for the "Assinatura" row — a simple ribbon/medal shape (no dedicated mockup icon; tela 15 uses the club logo image, which doesn't tint well as a flat icon on a light background). */
export function MembershipIcon({ color = colors.purple }: { color?: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
      <Path d="M8 3h8l-1.5 9h-5L8 3z" />
      <Path d="M9.5 12 7 21l5-2.5L17 21l-2.5-9" />
    </Svg>
  );
}

/** Padlock glyph — same path as the mockup's "E-mail"/"Definir senha" row icons (Tela 16). */
export function LockIcon({ color = colors.purple }: { color?: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
      <Rect x={4} y={10} width={16} height={10} rx={2} />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

/** Logout glyph — same path as the mockup's "Sair" row icon. */
export function LogoutIcon({ color = '#C2410C' }: { color?: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10" />
    </Svg>
  );
}

/** Back arrow — same path used across every stack screen's back button (e.g. src/features/notifications/screens/NotificationsScreen.tsx). */
export function BackIcon({ color = colors.textPrimary }: { color?: string }): React.JSX.Element {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round">
      <Path d="m15 6-6 6 6 6" />
    </Svg>
  );
}

/** Camera glyph — same path as the mockup's "Alterar foto" button icon (Tela 16). */
export function CameraIcon({ color = colors.purple }: { color?: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 18V8a1 1 0 0 1 1-1h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <Path d="M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
    </Svg>
  );
}
