import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import type { EventRecord, WithId } from '../../../data/types';
import { timeRangeLabel } from '../lib/format';

interface Props {
  event: WithId<EventRecord>;
  hasMemberAccess: boolean;
  onBecomeMemberPress: () => void;
}

/**
 * Bloco de espaço VIP no detalhe (5.5) — só é renderizado pelo caller quando
 * `event.has_vip` é true; as duas variantes abaixo dependem exclusivamente
 * de `hasMemberAccess` (vindo de `useMemberAccess()`, nunca da flag crua).
 */
export function VipAccessBlock({ event, hasMemberAccess, onBecomeMemberPress }: Props): React.JSX.Element {
  if (hasMemberAccess) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Espaço VIP disponível</Text>
        {event.vip_window ? (
          <Text style={styles.window}>
            Janela de funcionamento: {timeRangeLabel(event.vip_window.starts_at, event.vip_window.ends_at)}
          </Text>
        ) : null}
        {event.vip_perks.length > 0 ? (
          <View style={styles.perksList}>
            {event.vip_perks.map((perk) => (
              <Text key={perk} style={styles.perk}>
                • {perk}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Espaço VIP</Text>
      <Text style={styles.locked}>Exclusivo para membros.</Text>
      <Pressable
        onPress={onBecomeMemberPress}
        style={styles.cta}
        accessibilityRole="button"
        accessibilityLabel="Assinar para acessar VIP"
      >
        <Text style={styles.ctaLabel}>Assinar para acessar VIP</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundTint,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.lg,
    color: colors.purple,
  },
  window: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  perksList: {
    marginTop: spacing.xxs,
    gap: 2,
  },
  perk: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  locked: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  cta: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  ctaLabel: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.base,
    color: colors.backgroundWhite,
  },
});
