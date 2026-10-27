import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';

/** As 3 categorias do filtro (tarefa 7.1) — "Todas" é o estado inicial, não uma categoria de dado. */
export const BENEFIT_CATEGORIES = ['Alimentação', 'Equipamentos', 'Eventos'] as const;

export type BenefitCategoryFilter = (typeof BENEFIT_CATEGORIES)[number] | 'Todas';

const OPTIONS: BenefitCategoryFilter[] = ['Todas', ...BENEFIT_CATEGORIES];

interface CategoryFilterProps {
  selected: BenefitCategoryFilter;
  onSelect: (category: BenefitCategoryFilter) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps): React.JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="benefits-category-filter"
    >
      {OPTIONS.map((option) => {
        const isActive = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.chip, isActive && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            testID={`benefits-category-${option}`}
          >
            <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundTint,
  },
  chipActive: {
    backgroundColor: colors.purple,
  },
  chipLabel: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  chipLabelActive: {
    color: colors.backgroundWhite,
  },
});
