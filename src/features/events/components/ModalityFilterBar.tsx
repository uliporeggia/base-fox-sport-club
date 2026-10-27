import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import type { EventModalityFilter } from '../../../navigation/types';

const OPTIONS: { value: EventModalityFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'corrida', label: 'Corrida' },
  { value: 'trilha', label: 'Trilha' },
  { value: 'trekking', label: 'Trekking' },
];

interface Props {
  value: EventModalityFilter;
  onChange: (value: EventModalityFilter) => void;
}

/** Filtro por modalidade (5.2) — "Todos" é o estado inicial, sem filtro por organizador. */
export function ModalityFilterBar({ value, onChange }: Props): React.JSX.Element {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isActive && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.chipBackground,
  },
  chipActive: {
    backgroundColor: colors.purple,
  },
  label: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.base,
    color: colors.chipText,
  },
  labelActive: {
    color: colors.backgroundWhite,
  },
});
