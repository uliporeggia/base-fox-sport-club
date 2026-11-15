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
      style={styles.scroller}
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
  /**
   * Uma ScrollView horizontal colocada como filha de um container em coluna
   * cresce no eixo vertical para ocupar o espaço livre, e os chips crescem
   * junto — eles não têm altura própria, só padding. O resultado é um chip de
   * ~430px de altura quando a lista abaixo é curta, que foi como o bug
   * apareceu: filtrando por "Alimentação" sobram dois cards, e toda a folga
   * da tela vai para os chips. Com a lista cheia o defeito se esconde, que é
   * por que ele passou pela validação anterior.
   *
   * `flexGrow: 0` faz a barra medir o próprio conteúdo; `flexShrink: 0`
   * impede o oposto, ela ser espremida quando a lista é longa.
   */
  scroller: {
    flexGrow: 0,
    flexShrink: 0,
  },
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
