import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fontFamily, fontSize, spacing, radii } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import { listEvents } from '../../../data/eventsRepository';
import type { EventRecord, WithId } from '../../../data/types';
import { formatWeekdayShort, joinWithAnd } from '../lib/format';

/**
 * Bloco "Espaço VIP" da Home (04) — cabeçalho "Saiba mais" + teaser com
 * imagem de fundo, atalho para o hub (07). Importado por
 * src/screens/HomeScreen.tsx; só o agente de VIP edita este arquivo.
 */
export function VipTeaser(): React.JSX.Element | null {
  const navigation = useNavigation();
  const [nextVipEvent, setNextVipEvent] = useState<WithId<EventRecord> | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const upcoming = await listEvents();
      const nextWithVip = upcoming.find((event) => event.has_vip && event.vip_window) ?? null;
      setNextVipEvent(nextWithVip);
    } catch {
      setNextVipEvent(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  if (!nextVipEvent) return null;

  const handlePress = () => {
    track('vip_teaser_tapped', { event_id: nextVipEvent.id });
    navigation.navigate('Main', { screen: 'VipTab', params: { screen: 'VipHub' } });
  };

  const subtitle = [
    formatWeekdayShort(nextVipEvent.starts_at.toDate()),
    nextVipEvent.location,
    joinWithAnd(nextVipEvent.vip_perks),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Espaço VIP</Text>
        <Pressable onPress={handlePress} testID="vip-teaser-saiba-mais">
          <Text style={styles.headerLink}>Saiba mais</Text>
        </Pressable>
      </View>

      <Pressable onPress={handlePress} testID="vip-teaser-card">
        <View style={styles.imageWrap}>
          <Image
            source={require('../../../../assets/brand/espaco-vip.jpg')}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Espaço VIP confirmado</Text>
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.eventName} numberOfLines={1}>
              {nextVipEvent.name}
            </Text>
            <Text style={styles.eventSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerTitle: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  headerLink: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.md,
    color: colors.purple,
  },
  imageWrap: {
    position: 'relative',
    height: 190,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(34,9,47,0.55)',
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.orange,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  badgeText: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.purpleDeep,
  },
  textBlock: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    gap: 2,
  },
  eventName: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xl,
    color: colors.backgroundWhite,
  },
  eventSubtitle: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: '#E2D6EC',
  },
});
