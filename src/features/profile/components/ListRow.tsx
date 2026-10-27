import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';

export interface ListRowProps {
  /** Icon shown in a tinted rounded square on the left — omitted for the plain "Dados" section rows (tela 15's mockup has no icon box there). */
  icon?: React.ReactNode;
  iconBackground?: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  /** Right-side slot — chevron, text action ("Desconectar") or a Switch. */
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Bottom separator — every row but the last one in a card. */
  bordered?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

/** One row of a Perfil "Conta"/"Dados" card (tela 15). */
export function ListRow({
  icon,
  iconBackground,
  title,
  subtitle,
  titleColor,
  right,
  onPress,
  disabled,
  bordered,
  testID,
  accessibilityLabel,
}: ListRowProps): React.JSX.Element {
  const content = (
    <View style={[styles.row, bordered && styles.rowBordered]}>
      {icon ? (
        <View style={[styles.iconBox, iconBackground ? { backgroundColor: iconBackground } : null]}>{icon}</View>
      ) : null}
      <View style={styles.textColumn}>
        <Text style={[styles.title, titleColor ? { color: titleColor } : null]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
      style={({ pressed }): ViewStyle => (pressed ? styles.pressed : styles.notPressed)}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rowBordered: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
  notPressed: {
    opacity: 1,
  },
});

export interface SectionCardProps {
  children: React.ReactNode;
}

/** White rounded card wrapping a group of `ListRow`s (tela 15's "Conta"/"Dados" cards). */
export function SectionCard({ children }: SectionCardProps): React.JSX.Element {
  return <View style={styles2.card}>{children}</View>;
}

const styles2 = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundWhite,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
});

export interface SectionLabelProps {
  children: React.ReactNode;
}

/** Uppercase section label ("Conta"/"Dados", tela 15). */
export function SectionLabel({ children }: SectionLabelProps): React.JSX.Element {
  return <Text style={labelStyles.label}>{children}</Text>;
}

const labelStyles = StyleSheet.create({
  label: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
});
