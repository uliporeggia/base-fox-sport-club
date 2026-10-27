import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Checkmark } from './Checkmark';
import { colors, fontFamily, fontSize, spacing } from '../../../theme';

interface BenefitChecklistProps {
  items: string[];
  /** Text color — white on the dark (#22092F) membership screens. */
  textColor?: string;
}

/** Shared checkmark + label list for the membership pitch (tela 03) and the contextual paywall (tela 12). */
export function BenefitChecklist({
  items,
  textColor = colors.backgroundWhite,
}: BenefitChecklistProps): React.JSX.Element {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <Checkmark />
          <Text style={[styles.text, { color: textColor }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.lg,
  },
});
