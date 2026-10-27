import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import { subscribeAssociate } from '../../../data/associatesRepository';
import type { Associate, WithId } from '../../../data/types';
import { Checkmark } from '../components/Checkmark';
import { PrimaryCtaButton, SecondaryLinkButton } from '../components/MembershipActionButtons';
import type { RootStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SubscriptionConfirmed'>;

/** `nº 0428` — zero-padded to 4 digits, as shown in the mockup (telas 08/13). */
function formatMemberNumber(memberNumber: number): string {
  return `nº ${String(memberNumber).padStart(4, '0')}`;
}

function formatStartedAt(startedAt: Associate['membership']['started_at']): string | null {
  if (!startedAt) return null;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    startedAt.toDate(),
  );
}

/**
 * Tela 13 — assinatura confirmada, com o cartão digital de associado (nome,
 * data de início como membro e número de associado — spec.md "Confirmação
 * de assinatura sem cobrança"). Mounted only while `membershipEnabled` is
 * true — see RootNavigator.tsx. A promoção em si acontece em PaywallScreen
 * (updateMembershipStatus); esta tela só lê o documento já atualizado.
 */
export default function SubscriptionConfirmedScreen({ navigation }: Props): React.JSX.Element {
  const [associate, setAssociate] = useState<WithId<Associate> | null>(null);

  useEffect(() => {
    const auth = getAuth(getApp());
    let unsubscribeAssociate: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeAssociate?.();
      if (!user) {
        setAssociate(null);
        return;
      }
      unsubscribeAssociate = subscribeAssociate(user.uid, setAssociate);
    });

    return () => {
      unsubscribeAssociate?.();
      unsubscribeAuth();
    };
  }, []);

  const startedAtLabel = associate ? formatStartedAt(associate.membership.started_at) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Checkmark size={44} color={colors.orange} />
        </View>

        <Text style={styles.title}>Bem-vindo ao plano membro!</Text>
        <Text style={styles.subtitle}>Você já tem acesso a todas as vantagens</Text>

        {associate ? (
          <View style={styles.card}>
            <Text style={styles.cardBrand}>BASE FOX SPORT CLUB</Text>
            <Text style={styles.cardName}>{associate.name}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardMemberNumber}>{formatMemberNumber(associate.member_number)}</Text>
              {startedAtLabel ? <Text style={styles.cardSince}>Membro desde {startedAtLabel}</Text> : null}
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <PrimaryCtaButton
            label="Ir para o Espaço VIP"
            onPress={() =>
              navigation.navigate('Main', { screen: 'VipTab', params: { screen: 'VipHub' } })
            }
          />
          <SecondaryLinkButton
            label="Voltar para home"
            onPress={() => navigation.navigate('Main', { screen: 'HomeTab', params: { screen: 'Home' } })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.purpleDeep,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  iconBadge: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.hero,
    color: colors.backgroundWhite,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.xl,
    color: colors.chipBackground,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.backgroundWhite,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardBrand: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.sm,
    color: colors.purple,
    letterSpacing: 0.6,
  },
  cardName: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMemberNumber: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  cardSince: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.base,
    color: colors.textTertiary,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
