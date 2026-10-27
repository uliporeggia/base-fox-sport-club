import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import { BenefitChecklist } from '../components/BenefitChecklist';
import { PrimaryCtaButton, SecondaryLinkButton } from '../components/MembershipActionButtons';
import type { RootStackParamList } from '../../../navigation/types';

/**
 * Tela 03 — Torne-se membro (fluxo de entrada, pulável). Mounted only while
 * `membershipEnabled` is true — see EntryStack.tsx. Sem nenhum valor em reais
 * (contract rule 2): o pitch é construído só sobre os benefícios inclusos.
 *
 * Navega para fora de EntryStackParamList (Paywall/Main são telas de root),
 * por isso o hook de navegação é tipado contra RootStackParamList em vez do
 * `navigation` prop do próprio EntryStack.
 */
export default function BecomeMemberScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSubscribePress = (): void => {
    track('membership_cta_tapped', { source: 'entry_flow' });
    navigation.navigate('Paywall', { source: 'entry_flow' });
  };

  const handleContinueFreePress = (): void => {
    track('membership_declined', { source: 'entry_flow' });
    navigation.navigate('Main', { screen: 'HomeTab', params: { screen: 'Home' } });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.hero}>
          <Image
            source={require('../../../../assets/brand/espaco-vip.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
        </View>

        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.content}>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>PLANO MEMBRO</Text>
            </View>

            <Text style={styles.title}>Seu lugar no espaço VIP</Text>

            <View style={styles.highlightCard}>
              <Text style={styles.highlightTitle}>Espaço VIP em todos os eventos</Text>
              <Text style={styles.highlightSubtitle}>
                Café, cerveja e food truck por conta do clube.
              </Text>
            </View>

            <BenefitChecklist
              items={[
                '15% de desconto nos eventos do clube',
                'Benefícios exclusivos de parceiros',
                'Cartão digital de associado',
              ]}
            />

            <View style={styles.actions}>
              <PrimaryCtaButton label="Quero ser membro" onPress={handleSubscribePress} />
              <SecondaryLinkButton label="Continuar no plano gratuito" onPress={handleContinueFreePress} />
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.purpleDeep,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    height: 330,
    width: '100%',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 9, 47, 0.55)',
  },
  safeArea: {
    flex: 1,
    marginTop: -spacing.xxxl,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
  badgeLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.sm,
    color: colors.purpleDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.hero,
    color: colors.backgroundWhite,
  },
  highlightCard: {
    backgroundColor: colors.purple,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.xxs,
  },
  highlightTitle: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xl,
    color: colors.backgroundWhite,
  },
  highlightSubtitle: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.md,
    color: colors.chipBackground,
  },
  actions: {
    gap: spacing.md,
  },
});
