import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import type { Benefit, WithId } from '../../../data/types';

interface ComingSoonCardProps {
  benefit: WithId<Benefit>;
}

/**
 * Parceiro "Em breve" (tarefa 7.7). Sempre um `View` puro, nunca `Pressable`
 * — isso garante estruturalmente que o item não abre detalhe nem aciona o
 * paywall, para qualquer plano. Nunca mascarado (não há desconto definido).
 */
export function ComingSoonCard({ benefit }: ComingSoonCardProps): React.JSX.Element {
  return (
    <View style={styles.card} testID={`coming-soon-card-${benefit.id}`}>
      <View style={styles.headerRow}>
        <Text style={styles.partner}>{benefit.partner}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>EM BREVE</Text>
        </View>
      </View>
      <Text style={styles.meta}>Novo parceiro · {benefit.category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  partner: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.chipBackground,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  badgeLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xs,
    color: colors.chipText,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  meta: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
