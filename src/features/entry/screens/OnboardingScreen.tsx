import React, { useEffect, useState } from 'react';
import { View, Text, Image, ImageBackground, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, spacing, radii } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import { useOnboardingSeen } from '../hooks/useOnboardingSeen';
import { ProgressDots } from '../components/ProgressDots';
import { Button } from '../components/Button';
import type { EntryStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<EntryStackParamList, 'Onboarding'>;

interface StepContent {
  title: string;
  subtitle: string;
}

const STEPS: StepContent[] = [
  {
    title: 'O clube que vai até você',
    subtitle:
      'Sem sede fixa: a Base Fox monta seu espaço nas corridas de rua, trilhas e aventuras onde você estiver.',
  },
  {
    title: 'Seu espaço VIP em cada evento',
    subtitle:
      'Membros descansam, encontram a turma e aproveitam as cortesias do clube antes e depois da prova.',
  },
  {
    title: 'Vantagens que crescem com o clube',
    subtitle:
      'Descontos em eventos e novos parceiros de alimentação e equipamentos chegando ao longo da temporada.',
  },
];

const TOTAL_STEPS = STEPS.length;

/**
 * Tela 01 — Onboarding, 3 passos (task 4.1/4.2/4.8).
 *
 * The onboarding-already-seen check happens HERE instead of in EntryStack
 * (navigation is not this agent's file): on mount, if AsyncStorage already
 * has the flag, this screen immediately `replace`s itself with `SignUp`
 * before painting anything, so it is never re-shown to a returning visitor.
 */
export default function OnboardingScreen({ navigation }: Props): React.JSX.Element | null {
  const { hasSeenOnboarding, markOnboardingSeen } = useOnboardingSeen();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (hasSeenOnboarding === true) {
      navigation.replace('SignUp');
    }
  }, [hasSeenOnboarding, navigation]);

  useEffect(() => {
    if (hasSeenOnboarding === false) {
      track('onboarding_step_view', { step: String(stepIndex + 1) });
    }
    // Only re-fire when the step actually changes once onboarding is confirmed unseen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, hasSeenOnboarding]);

  if (hasSeenOnboarding !== false) {
    // Loading the AsyncStorage flag, or already redirecting away — render nothing to avoid a flash of step 1.
    return <View style={styles.blank} />;
  }

  const isLastStep = stepIndex === TOTAL_STEPS - 1;
  const step = STEPS[stepIndex];

  const goToSignUp = async () => {
    await markOnboardingSeen();
    navigation.replace('SignUp');
  };

  const handleSkip = async () => {
    track('onboarding_skipped', { step: String(stepIndex + 1) });
    await goToSignUp();
  };

  const handleAdvance = async () => {
    if (isLastStep) {
      await goToSignUp();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  };

  return (
    <View style={styles.container}>
      <Background stepIndex={stepIndex} />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <View />
          <Pressable onPress={handleSkip} accessibilityRole="button" accessibilityLabel="Pular onboarding">
            <Text style={styles.skipLabel}>Pular</Text>
          </Pressable>
        </View>

        <StepArt stepIndex={stepIndex} />

        <View style={styles.footer}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
          <View style={styles.footerBottomRow}>
            <ProgressDots total={TOTAL_STEPS} activeIndex={stepIndex} />
            <Button
              label={isLastStep ? 'Começar' : 'Avançar'}
              onPress={handleAdvance}
              variant="primary"
              testID="onboarding-advance"
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Background({ stepIndex }: { stepIndex: number }): React.JSX.Element {
  if (stepIndex === 0) {
    return (
      <ImageBackground
        source={require('../../../../assets/brand/espaco-vip.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <View style={styles.darkOverlay} />
      </ImageBackground>
    );
  }
  return <View style={[StyleSheet.absoluteFill, styles.solidBackground]} />;
}

function StepArt({ stepIndex }: { stepIndex: number }): React.JSX.Element {
  if (stepIndex === 0) {
    return (
      <View style={styles.logoRow}>
        <Image
          source={require('../../../../assets/brand/logo-basefox-white.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (stepIndex === 1) {
    return (
      <View style={styles.card}>
        <Image
          source={require('../../../../assets/brand/espaco-vip.jpg')}
          style={styles.cardPhoto}
          resizeMode="cover"
        />
        <Text style={styles.cardHeader}>Cortesias do espaço</Text>
        <View style={styles.amenitiesRow}>
          <Amenity icon="☕" label="Café" />
          <Amenity icon="🍺" label="Cerveja" />
          <Amenity icon="🚚" label="Food truck" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.benefitCardsRow}>
      <View style={[styles.benefitCard, styles.benefitCardPrimary, { transform: [{ rotate: '-2deg' }] }]}>
        <View style={styles.benefitBadgePurple}>
          <Image
            source={require('../../../../assets/brand/logo-symbol-white.png')}
            style={styles.benefitBadgeIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.benefitCardTitlePrimary}>15% nas inscrições</Text>
        <Text style={styles.benefitCardSubtitlePrimary}>Eventos do clube</Text>
        <Text style={styles.benefitHighlight}>15%</Text>
      </View>

      <View style={[styles.benefitCard, styles.benefitCardOutline, { transform: [{ rotate: '1.5deg' }] }]}>
        <Text style={styles.benefitCardTitle}>Equipamentos</Text>
        <Text style={styles.benefitCardSubtitle}>Novo parceiro</Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonLabel}>EM BREVE</Text>
        </View>
      </View>

      <View style={[styles.benefitCard, styles.benefitCardOutline, { transform: [{ rotate: '-1deg' }] }]}>
        <Text style={styles.benefitCardTitle}>Alimentação</Text>
        <Text style={styles.benefitCardSubtitle}>Novo parceiro</Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonLabel}>EM BREVE</Text>
        </View>
      </View>
    </View>
  );
}

function Amenity({ icon, label }: { icon: string; label: string }): React.JSX.Element {
  return (
    <View style={styles.amenity}>
      <Text style={styles.amenityIcon}>{icon}</Text>
      <Text style={styles.amenityLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  blank: {
    flex: 1,
    backgroundColor: colors.purpleDeep,
  },
  container: {
    flex: 1,
    backgroundColor: colors.purpleDeep,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(34,9,47,0.55)',
  },
  solidBackground: {
    backgroundColor: colors.purpleDeep,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  skipLabel: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.md,
    color: colors.backgroundWhite,
  },
  logoRow: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 132,
    height: 48,
  },
  footer: {
    gap: spacing.md,
  },
  title: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.hero,
    color: colors.backgroundWhite,
  },
  subtitle: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.xl,
    color: '#E2D6EC',
  },
  footerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  cardPhoto: {
    width: '100%',
    height: 190,
    borderRadius: radii.lg,
  },
  cardHeader: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.purple,
  },
  amenitiesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  amenity: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundTint,
  },
  amenityIcon: {
    fontSize: fontSize.xxl,
  },
  amenityLabel: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.base,
    color: colors.textTertiary,
  },
  benefitCardsRow: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  benefitCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xxs,
  },
  benefitCardPrimary: {
    backgroundColor: colors.backgroundWhite,
  },
  benefitCardOutline: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  benefitBadgePurple: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  benefitBadgeIcon: {
    width: 20,
    height: 20,
  },
  benefitCardTitlePrimary: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  benefitCardSubtitlePrimary: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  benefitHighlight: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.xxl,
    color: colors.orange,
  },
  benefitCardTitle: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    color: colors.backgroundWhite,
  },
  benefitCardSubtitle: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: '#C9B9D6',
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2D6EC',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xxs,
  },
  comingSoonLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.purpleDeep,
  },
});
