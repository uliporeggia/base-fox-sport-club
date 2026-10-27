import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemberAccess } from '../../../lib/membership/gate';
import { track } from '../../../lib/instrumentation';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import { PrimaryCtaButton } from './MembershipActionButtons';
import type { RootStackParamList } from '../../../navigation/types';

/**
 * Bloco "Torne-se membro" da Home (04) — oculto quando `hasMemberAccess` é
 * true (flag desligada OU associado já é membro). Importado por
 * src/screens/HomeScreen.tsx; só o agente de membership edita este arquivo.
 */
export function MembershipBanner(): React.JSX.Element | null {
  const { hasMemberAccess, isLoading } = useMemberAccess();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (isLoading || hasMemberAccess) return null;

  const handleSubscribePress = (): void => {
    track('membership_cta_tapped', { source: 'home_banner' });
    navigation.navigate('Paywall', { source: 'home_banner' });
  };

  return (
    <View style={styles.card}>
      <Image
        source={require('../../../../assets/brand/logo-symbol-white.png')}
        style={styles.watermark}
        resizeMode="contain"
      />
      <Text style={styles.title}>Torne-se membro</Text>
      <Text style={styles.subtitle}>
        Espaço VIP em todos os eventos, descontos e benefícios exclusivos de parceiros.
      </Text>
      <PrimaryCtaButton label="Quero ser membro" onPress={handleSubscribePress} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.purple,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    width: 110,
    height: 110,
    opacity: 0.1,
  },
  title: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xl,
    color: colors.backgroundWhite,
  },
  subtitle: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.md,
    color: colors.chipBackground,
  },
  cta: {
    height: 48,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xl,
  },
});
