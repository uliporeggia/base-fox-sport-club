import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../../theme';

interface ProgressDotsProps {
  total: number;
  activeIndex: number;
}

/** Onboarding (01) progress indicator — 3 dots, active one in laranja. */
export function ProgressDots({ total, activeIndex }: ProgressDotsProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: colors.orange,
    width: 20,
  },
});
