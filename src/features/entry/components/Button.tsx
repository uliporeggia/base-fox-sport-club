import React from 'react';
import { Pressable, Text, View, StyleSheet, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';

export type ButtonVariant = 'primary' | 'strava' | 'outline';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

/**
 * Shared CTA used across onboarding (01), cadastro (02) and login — the
 * three variants seen in the mockup: laranja (ação primária), Strava
 * (#FC4C02) e contorno (ações secundárias claras sobre fundo roxo).
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  testID,
  accessibilityLabel,
}: ButtonProps): React.JSX.Element {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'strava' && styles.strava,
        variant === 'outline' && styles.outline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.backgroundWhite : colors.textPrimary} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.label,
              variant === 'strava' && styles.labelStrava,
              variant === 'outline' && styles.labelOutline,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.orange,
  },
  strava: {
    backgroundColor: colors.strava,
    minHeight: 54,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.textPrimary,
  },
  labelStrava: {
    fontFamily: fontFamily.barlowBold,
    fontSize: fontSize.lg,
    textTransform: 'none',
    color: colors.backgroundWhite,
  },
  labelOutline: {
    color: colors.backgroundWhite,
  },
});
