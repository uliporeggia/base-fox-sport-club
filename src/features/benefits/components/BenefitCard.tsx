import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radii, shadows, spacing } from '../../../theme';
import type { Benefit, WithId } from '../../../data/types';

/**
 * Cor do desconto mascarado ("••% OFF", tela 09) — literal do mockup, não faz
 * parte da paleta documentada em `src/theme/colors.ts` (não é meu arquivo).
 */
const MASKED_DISCOUNT_COLOR = '#B3A0C4';

/**
 * Descrição do card BLOQUEADO (tela 09 do mockup, literal).
 *
 * O card liberado mostra `benefit.description`, que é a copy da tela 10 e
 * **repete o valor do desconto por extenso** ("15% de desconto nas
 * inscrições"). Renderizar esse mesmo texto no card bloqueado anulava o
 * mascaramento do `••% OFF` duas linhas acima — o número que o gate esconde
 * aparecia logo abaixo dele. O mockup já previa copy própria para o estado
 * bloqueado; é esta.
 *
 * Trocar por mascaramento de dígitos seria frágil: qualquer descrição futura
 * ("válido até 31/12", "a partir de 2 unidades") viraria algo ilegível, e a
 * copy de parceiro não está sob nosso controle.
 */
const LOCKED_DESCRIPTION = 'Desconto exclusivo de membro';

interface BenefitCardProps {
  benefit: WithId<Benefit>;
  /** Vem exclusivamente de `useMemberAccess()` — nunca de `membershipEnabled` direto. */
  hasMemberAccess: boolean;
  onPress: (benefit: WithId<Benefit>) => void;
}

/**
 * Card de benefício ativo (telas 09/10). Parceiro e categoria sempre
 * legíveis; só o valor do desconto é mascarado sem acesso de membro
 * (tarefa 7.3) — o card inteiro continua tocável, o desvio para o paywall
 * acontece no `onPress` do chamador (tarefa 7.4).
 */
export function BenefitCard({ benefit, hasMemberAccess, onPress }: BenefitCardProps): React.JSX.Element {
  const locked = !hasMemberAccess;

  return (
    <Pressable
      onPress={() => onPress(benefit)}
      style={[styles.card, locked && styles.cardLocked]}
      accessibilityRole="button"
      accessibilityLabel={`${benefit.partner}, ${benefit.category}`}
      testID={`benefit-card-${benefit.id}`}
    >
      <View style={styles.headerRow}>
        <Text style={styles.partner}>{benefit.partner}</Text>
        <Text style={styles.category}>{benefit.category}</Text>
      </View>

      <Text style={[styles.discount, locked && styles.discountMasked]}>
        {locked ? '••% OFF' : benefit.discount}
      </Text>

      {locked ? (
        <Text style={styles.description}>{LOCKED_DESCRIPTION}</Text>
      ) : benefit.description ? (
        <Text style={styles.description}>{benefit.description}</Text>
      ) : null}

      <View style={styles.footerRow}>
        {locked ? (
          <View style={styles.lockedBadge} testID={`benefit-card-${benefit.id}-locked-badge`}>
            <Text style={styles.lockedBadgeLabel}>Bloqueado</Text>
          </View>
        ) : (
          <View style={styles.cta}>
            <Text style={styles.ctaLabel}>Ver cupom</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardLocked: {
    backgroundColor: colors.backgroundTint,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  partner: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  category: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  discount: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.xxl,
    color: colors.orange,
    marginBottom: spacing.xs,
  },
  discountMasked: {
    color: MASKED_DISCOUNT_COLOR,
  },
  description: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cta: {
    backgroundColor: colors.backgroundTint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  ctaLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.sm,
    color: colors.purple,
  },
  lockedBadge: {
    backgroundColor: colors.chipBackground,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  lockedBadgeLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.sm,
    color: colors.chipText,
  },
});
