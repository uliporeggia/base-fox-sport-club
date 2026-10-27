import React from 'react';
import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';

interface PrimaryCtaButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Orange primary CTA — "Quero ser membro" (03), "Assinar agora" (12). Height 56, per UI-REFERENCE. */
export function PrimaryCtaButton({ label, onPress, disabled, style }: PrimaryCtaButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        disabled ? styles.primaryDisabled : null,
        pressed && !disabled ? styles.primaryPressed : null,
        style,
      ]}
    >
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

interface SecondaryLinkButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
}

/** Text-only secondary action — "Continuar no plano gratuito" (03), "Continuar sem assinar" (12), "Voltar para home" (13). */
export function SecondaryLinkButton({
  label,
  onPress,
  color = colors.chipBackground,
}: SecondaryLinkButtonProps): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={styles.link} hitSlop={8}>
      <Text style={[styles.linkLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  primaryPressed: {
    opacity: 0.85,
  },
  primaryDisabled: {
    opacity: 0.6,
  },
  primaryLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  link: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  linkLabel: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.md,
  },
});
