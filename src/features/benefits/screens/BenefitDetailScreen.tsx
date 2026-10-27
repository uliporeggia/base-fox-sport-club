import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import type { BenefitsStackParamList } from '../../../navigation/types';
import { track } from '../../../lib/instrumentation';
import { useBenefit } from '../hooks/useBenefit';

type Props = NativeStackScreenProps<BenefitsStackParamList, 'BenefitDetail'>;

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** "31 de dezembro de 2026" — formatação manual (sem `Intl`, instável sob Hermes/jest). */
function formatValidUntil(date: Date): string {
  return `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`;
}

const COPY_CONFIRMATION_MS = 2000;

/**
 * Tela 11 — detalhe do benefício. Só monta para quem tem acesso de membro —
 * o desvio pro paywall acontece antes, no `onPress` da lista (tarefa 7.4).
 *
 * O modelo de dados (`src/data/types.ts`, não é meu arquivo) não tem um campo
 * `title` dedicado: `discount` ("15% OFF") é exibido como o título em
 * destaque e `description` como o texto de apoio — ver NOTAS do relatório.
 *
 * Ações de resgate (tarefa 7.6): "Copiar código" e "Ir para as inscrições"
 * são independentes — cada uma só aparece se o campo correspondente
 * (`code` / `external_url`) existir no benefício.
 */
export default function BenefitDetailScreen({ route }: Props): React.JSX.Element {
  const { benefitId } = route.params;
  const { benefit, isLoading } = useBenefit(benefitId);
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyCode = useCallback(async () => {
    if (!benefit?.code) return;
    await Clipboard.setStringAsync(benefit.code);
    track('benefit_code_copied', { benefit_id: benefit.id, partner: benefit.partner });
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setIsCopied(true);
    copyTimeoutRef.current = setTimeout(() => setIsCopied(false), COPY_CONFIRMATION_MS);
  }, [benefit]);

  const handleOpenExternalUrl = useCallback(async () => {
    if (!benefit?.external_url) return;
    track('benefit_link_opened', { benefit_id: benefit.id, partner: benefit.partner });
    await WebBrowser.openBrowserAsync(benefit.external_url);
  }, [benefit]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }

  if (!benefit) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFound}>Benefício não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="benefit-detail-scroll">
      <View style={styles.headerRow}>
        <Text style={styles.category}>{benefit.category}</Text>
        <Text style={styles.partner}>{benefit.partner}</Text>
      </View>

      {benefit.discount ? <Text style={styles.title}>{benefit.discount}</Text> : null}
      <Text style={styles.description}>{benefit.description}</Text>

      {benefit.code ? (
        <View style={styles.codeBox} testID="benefit-detail-code">
          <Text style={styles.codeLabel}>{benefit.code}</Text>
        </View>
      ) : null}

      {benefit.code ? (
        <Pressable
          style={styles.primaryButton}
          onPress={handleCopyCode}
          accessibilityRole="button"
          testID="benefit-detail-copy-code"
        >
          <Text style={styles.primaryButtonLabel}>{isCopied ? 'Código copiado!' : 'Copiar código'}</Text>
        </Pressable>
      ) : null}

      {benefit.external_url ? (
        <Pressable
          style={styles.secondaryButton}
          onPress={handleOpenExternalUrl}
          accessibilityRole="button"
          testID="benefit-detail-open-link"
        >
          <Text style={styles.secondaryButtonLabel}>Ir para as inscrições</Text>
        </Pressable>
      ) : null}

      {benefit.usage_note ? <Text style={styles.usageNote}>{benefit.usage_note}</Text> : null}

      {benefit.valid_until ? (
        <Text style={styles.validUntil}>Válido até {formatValidUntil(benefit.valid_until.toDate())}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundWhite,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundWhite,
  },
  notFound: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  category: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  partner: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.display,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  codeBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundTint,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  codeLabel: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: fontSize.xxl,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  primaryButton: {
    backgroundColor: colors.backgroundTint,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.md,
    color: colors.purple,
  },
  secondaryButton: {
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  secondaryButtonLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  usageNote: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  validUntil: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
