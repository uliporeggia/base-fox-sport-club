import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fontFamily, fontSize, radii, spacing, shadows } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import { getNextEvent } from '../../../data/eventsRepository';
import type { EventRecord, WithId } from '../../../data/types';
import { requestEventsListResetToTodos } from '../lib/eventsListIntent';
import { dayLabel, monthShortLabel, weekdayTimeLabel } from '../lib/format';

/**
 * Bloco "Próximo evento" da Home (04/5.7) — atalho para o detalhe e para a
 * lista completa ("Ver todos" força o filtro de volta para "Todos", via
 * `eventsListIntent`, sem precisar de um parâmetro em `EventsStackParamList`).
 */
export function NextEventCard(): React.JSX.Element | null {
  const navigation = useNavigation();
  const [state, setState] = useState<'loading' | WithId<EventRecord> | null>('loading');

  useEffect(() => {
    let active = true;
    getNextEvent()
      .then((event) => {
        if (active) setState(event);
      })
      .catch(() => {
        if (active) setState(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const openEventDetail = (eventId: string) => {
    track('next_event_card_tapped', { event_id: eventId });
    navigation.navigate('Main', {
      screen: 'EventsTab',
      params: { screen: 'EventDetail', params: { eventId } },
    });
  };

  const openEventsList = () => {
    requestEventsListResetToTodos();
    navigation.navigate('Main', {
      screen: 'EventsTab',
      params: { screen: 'EventsList' },
    });
  };

  if (state === 'loading') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Próximo evento</Text>
        <Pressable onPress={openEventsList} accessibilityRole="button" accessibilityLabel="Ver todos">
          <Text style={styles.seeAll}>Ver todos</Text>
        </Pressable>
      </View>

      {state === null ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyLabel}>Nenhum evento agendado no momento.</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => openEventDetail(state.id)}
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel={state.name}
        >
          <View style={styles.dateColumn}>
            <Text style={styles.day}>{dayLabel(state.starts_at)}</Text>
            <Text style={styles.month}>{monthShortLabel(state.starts_at)}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.name} numberOfLines={2}>
              {state.name}
            </Text>
            <Text style={styles.detail}>{weekdayTimeLabel(state.starts_at)}</Text>
            <Text style={styles.detail}>{state.location}</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  seeAll: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.base,
    color: colors.purple,
  },
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
    justifyContent: 'center',
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
  emptyCard: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
