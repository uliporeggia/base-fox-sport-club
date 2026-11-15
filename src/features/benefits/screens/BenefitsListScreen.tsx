import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import type { BenefitsStackParamList, MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { useMemberAccess } from '../../../lib/membership/gate';
import { track } from '../../../lib/instrumentation';
import type { Benefit, WithId } from '../../../data/types';
import { useBenefits } from '../hooks/useBenefits';
import { BenefitCard } from '../components/BenefitCard';
import { CategoryFilter, type BenefitCategoryFilter } from '../components/CategoryFilter';
import { ComingSoonCard } from '../components/ComingSoonCard';

/**
 * `BenefitsList` está na `BenefitsTab` (aninhada no `Main` do root stack) —
 * o tipo composto é o que permite navegar tanto para `BenefitDetail` (mesmo
 * stack) quanto para `Paywall` (root stack) com segurança de tipos.
 */
type BenefitsListNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<BenefitsStackParamList, 'BenefitsList'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'BenefitsTab'>,
    NativeStackNavigationProp<RootStackParamList>
  >
>;

/**
 * Telas 09/10 — catálogo de benefícios. As duas variantes do mockup (plano
 * gratuito "bloqueado" vs. membro) são a MESMA árvore de componentes — a
 * única diferença é `hasMemberAccess`, vindo exclusivamente de
 * `useMemberAccess()` (contrato regra 4: nunca ler `membershipEnabled`
 * direto). Com a flag de membership desligada, `hasMemberAccess` é sempre
 * `true`, então esta tela renderiza como a variante de membro para todos —
 * nenhum caminho morto (tarefa 7.4).
 */
export default function BenefitsListScreen(): React.JSX.Element {
  const navigation = useNavigation<BenefitsListNavigationProp>();
  const { hasMemberAccess, isLoading: isGateLoading } = useMemberAccess();
  const [selectedCategory, setSelectedCategory] = useState<BenefitCategoryFilter>('Todas');

  const repositoryCategory = selectedCategory === 'Todas' ? undefined : selectedCategory;
  const { benefits, isLoading: isBenefitsLoading } = useBenefits(repositoryCategory);

  const activeBenefits = useMemo(() => benefits.filter((b) => b.status === 'active'), [benefits]);
  const comingSoonBenefits = useMemo(() => benefits.filter((b) => b.status === 'coming_soon'), [benefits]);

  const handleSelectCategory = useCallback((category: BenefitCategoryFilter) => {
    setSelectedCategory(category);
    track('benefits_filter_applied', { category: category === 'Todas' ? 'todas' : category });
  }, []);

  const handleBenefitPress = useCallback(
    (benefit: WithId<Benefit>) => {
      const locked = !hasMemberAccess;
      track('benefit_viewed', {
        benefit_id: benefit.id,
        partner: benefit.partner,
        category: benefit.category,
        locked,
      });
      if (locked) {
        navigation.navigate('Paywall', { source: 'benefit_detail', benefitId: benefit.id });
        return;
      }
      navigation.navigate('BenefitDetail', { benefitId: benefit.id });
    },
    [hasMemberAccess, navigation],
  );

  const isLoading = isGateLoading || isBenefitsLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Benefícios</Text>
        {!hasMemberAccess ? (
          <View style={styles.lockBanner}>
            <Text style={styles.lockBannerLabel}>Assine para desbloquear todos</Text>
          </View>
        ) : null}
      </View>

      <CategoryFilter selected={selectedCategory} onSelect={handleSelectCategory} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.purple} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} testID="benefits-scroll">
          {activeBenefits.map((benefit) => (
            <BenefitCard
              key={benefit.id}
              benefit={benefit}
              hasMemberAccess={hasMemberAccess}
              onPress={handleBenefitPress}
            />
          ))}

          {comingSoonBenefits.length > 0 ? (
            <View style={styles.comingSoonSection}>
              <Text style={styles.comingSoonTitle}>Novos parceiros</Text>
              <Text style={styles.comingSoonSubtitle}>
                Descontos em eventos e novos parceiros de alimentação e equipamentos chegando ao longo da
                temporada.
              </Text>
              {comingSoonBenefits.map((benefit) => (
                <ComingSoonCard key={benefit.id} benefit={benefit} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  // Sem a área segura o título "Benefícios" encostava na barra de status.
  // Todas as outras telas do app já usavam SafeAreaView; só as duas da
  // feature de benefícios ficaram de fora — resquício do trabalho em
  // paralelo, em que cada agente cuidava apenas dos próprios arquivos.
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.display,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  lockBanner: {
    backgroundColor: colors.chipBackground,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  lockBannerLabel: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.sm,
    color: colors.chipText,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  comingSoonSection: {
    marginTop: spacing.md,
  },
  comingSoonTitle: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.xs,
  },
  comingSoonSubtitle: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
});
