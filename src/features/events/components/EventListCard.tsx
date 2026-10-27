import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing, shadows } from '../../../theme';
import type { EventRecord, WithId } from '../../../data/types';
import {
  dayLabel,
  monthShortLabel,
  modalityWithDistanceLabel,
  organizerLabel,
  weekdayTimeLabel,
} from '../lib/format';

interface Props {
  event: WithId<EventRecord>;
  onPress: (eventId: string) => void;
}

/** Card do evento na lista (05) — dia, mês, modalidade+distância, nome, horário, local, organizador e marcação VIP (5.3). */
export function EventListCard({ event, onPress }: Props): React.JSX.Element {
  return (
    <Pressable
      onPress={() => onPress(event.id)}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={event.name}
    >
      <View style={styles.dateColumn}>
        <Text style={styles.day}>{dayLabel(event.starts_at)}</Text>
        <Text style={styles.month}>{monthShortLabel(event.starts_at)}</Text>
      </View>
      <View style={styles.infoColumn}>
        <View style={styles.titleRow}>
          <Text style={styles.modality}>{modalityWithDistanceLabel(event.modality, event.distance)}</Text>
          {event.has_vip ? (
            <View style={styles.vipBadge}>
              <Text style={styles.vipBadgeLabel}>VIP</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {event.name}
        </Text>
        <Text style={styles.detail}>
          {weekdayTimeLabel(event.starts_at)} · {event.location}
        </Text>
        <Text style={styles.organizer}>Organizador: {organizerLabel(event.organizer)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.lg,
    backgroundColor: colors.backgroundWhite,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  dateColumn: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.display,
    color: colors.purple,
    lineHeight: fontSize.display,
  },
  month: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  infoColumn: {
    flex: 1,
    gap: spacing.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modality: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.base,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  vipBadge: {
    backgroundColor: colors.orange,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  vipBadgeLabel: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.xs,
    color: colors.backgroundWhite,
  },
  name: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  detail: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  organizer: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});
