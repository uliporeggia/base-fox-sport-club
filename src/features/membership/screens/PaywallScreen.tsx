import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import { currentAssociateId } from '../../../data/firestoreClient';
import { updateMembershipStatus } from '../../../data/associatesRepository';
import { getBenefit } from '../../../data/benefitsRepository';
import type { Benefit, WithId } from '../../../data/types';
import { BenefitChecklist } from '../components/BenefitChecklist';
import { PrimaryCtaButton, SecondaryLinkButton } from '../components/MembershipActionButtons';
import type { PaywallSource, RootStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

/** Replaces digits with "•" so a masked discount reads e.g. "15% OFF" → "••% OFF" (design.md "Gate de membership" table). */
function maskDiscount(discount: string): string {
  return discount.replace(/\d/g, '•');
}

/** Keeps the first 2 characters of a coupon code visible, masks the rest — "o código do cupom parcialmente mascarado" (spec.md). */
function maskCode(code: string): string {
  if (code.length <= 2) return '•'.repeat(code.length);
  return `${code.slice(0, 2)}${'•'.repeat(code.length - 2)}`;
}

const GENERIC_ARGUMENT_BY_SOURCE: Record<PaywallSource, string> = {
  entry_flow: 'Garanta seu lugar no espaço VIP e os benefícios de associado desde já.',
  home_banner: 'Garanta seu lugar no espaço VIP e os benefícios de associado.',
  event_detail: 'Assine para liberar o espaço VIP deste evento.',
  vip_hub: 'Assine para ter acesso ao espaço VIP em todos os eventos.',
  // Fallback only — when the source is `benefit_detail` the card above
  // (locked coupon + partner) is shown instead of this generic text.
  benefit_detail: 'Assine para liberar este cupom e todos os benefícios de parceiros.',
  // Alguém que já é associado e está revendo o próprio plano no Perfil —
  // não chegou aqui por um recurso bloqueado, por isso o argumento é o
  // convite geral para fazer upgrade, não uma pitch sobre o que acabou de tocar.
  profile: 'Assine o plano membro e desbloqueie o espaço VIP, descontos nas inscrições e benefícios de parceiros.',
};

const CHECKLIST_ITEMS = [
  'Espaço VIP em todos os eventos',
  '15% de desconto nas inscrições',
  'Benefícios exclusivos de parceiros',
  'Cartão digital de associado',
];

/**
 * Tela 12 — assinatura contextual (paywall). Mounted only while
 * `membershipEnabled` is true — see RootNavigator.tsx. `route.params.source`
 * é a tela de origem (feeds `paywall_viewed`'s `source` param — a pergunta
 * comercial do piloto: qual tela vende a assinatura).
 */
export default function PaywallScreen({ route, navigation }: Props): React.JSX.Element {
  const { source, benefitId } = route.params;
  const [benefit, setBenefit] = useState<WithId<Benefit> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    track('paywall_viewed', {
      source,
      ...(benefitId ? { benefit_id: benefitId } : {}),
    });
  }, [source, benefitId]);

  useEffect(() => {
    if (source !== 'benefit_detail' || !benefitId) return;
    let cancelled = false;
    getBenefit(benefitId).then((result) => {
      if (!cancelled) setBenefit(result);
    });
    return () => {
      cancelled = true;
    };
  }, [source, benefitId]);

  const handleDecline = (): void => {
    track('membership_declined', { source });
    navigation.goBack();
  };

  const handleSubscribe = async (): Promise<void> => {
    const associateId = currentAssociateId();
    if (!associateId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateMembershipStatus(associateId, 'member', source);
      track('subscription_confirmed', { source });
      navigation.navigate('SubscriptionConfirmed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBenefitLocked = source === 'benefit_detail' && Boolean(benefitId);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={handleDecline} hitSlop={12} style={styles.closeButton}>
          <Text style={styles.closeGlyph}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Assinar</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isBenefitLocked ? (
          <View style={styles.lockedResourceCard}>
            <Text style={styles.lockedResourceLabel}>Cupom bloqueado</Text>
            <Text style={styles.lockedResourcePartner}>{benefit?.partner ?? 'Parceiro Base Fox'}</Text>
            {benefit?.discount ? (
              <Text style={styles.lockedResourceDiscount}>{maskDiscount(benefit.discount)}</Text>
            ) : null}
            {benefit?.code ? (
              <Text style={styles.lockedResourceCode}>{maskCode(benefit.code)}</Text>
            ) : null}
            <Text style={styles.argument}>
              Assine para liberar este cupom e todos os benefícios de parceiros.
            </Text>
          </View>
        ) : (
          <Text style={styles.argument}>{GENERIC_ARGUMENT_BY_SOURCE[source]}</Text>
        )}

        <Text style={styles.checklistHeading}>O que mais vem incluso</Text>
        <BenefitChecklist items={CHECKLIST_ITEMS} textColor={colors.textPrimary} />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryCtaButton
          label={isSubmitting ? 'Assinando…' : 'Assinar agora'}
          onPress={handleSubscribe}
          disabled={isSubmitting}
        />
        <SecondaryLinkButton
          label="Continuar sem assinar"
          onPress={handleDecline}
          color={colors.textSecondary}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  lockedResourceCard: {
    backgroundColor: colors.purpleDeep,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.xxs,
  },
  lockedResourceLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.sm,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  lockedResourcePartner: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xl,
    color: colors.backgroundWhite,
  },
  lockedResourceDiscount: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.display,
    color: colors.backgroundWhite,
  },
  lockedResourceCode: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.chipBackground,
    letterSpacing: 0.6,
  },
  argument: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  checklistHeading: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
});
