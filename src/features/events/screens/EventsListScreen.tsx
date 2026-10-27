import React, { useCallback, useState } from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, spacing } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import type { EventsStackParamList, EventModalityFilter } from '../../../navigation/types';
import { useEvents } from '../hooks/useEvents';
import { groupEventsByMonth } from '../lib/groupEvents';
import { consumeEventsListResetToTodos } from '../lib/eventsListIntent';
import { ModalityFilterBar } from '../components/ModalityFilterBar';
import { EventListCard } from '../components/EventListCard';
import { EmptyState } from '../components/EmptyState';

type NavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EventsList'>;

const EMPTY_MESSAGE_BY_FILTER: Record<EventModalityFilter, string> = {
  todos: 'Novos eventos serão anunciados em breve.',
  corrida: 'Nenhuma corrida agendada no momento. Novos eventos serão anunciados em breve.',
  trilha: 'Nenhuma trilha agendada no momento. Novos eventos serão anunciados em breve.',
  trekking: 'Nenhum trekking agendado no momento. Novos eventos serão anunciados em breve.',
};

/**
 * Tela 05 — lista de eventos, agrupada por mês, com filtro por modalidade (5.1/5.2/5.3).
 * O filtro é estado local: a native-stack mantém esta tela montada atrás do
 * detalhe (06), então ele sobrevive ao "voltar" sem qualquer parâmetro de
 * navegação (5.4). O único reset externo é o "Ver todos" da Home, sinalizado
 * via `eventsListIntent` e consumido no foco desta tela.
 */
export default function EventsListScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const [filter, setFilter] = useState<EventModalityFilter>('todos');
  const eventsState = useEvents(filter);
  const status = eventsState.status;
  const events = eventsState.status === 'loaded' ? eventsState.events : [];

  useFocusEffect(
    useCallback(() => {
      if (consumeEventsListResetToTodos()) {
        setFilter('todos');
      }
    }, []),
  );

  const handleFilterChange = useCallback((value: EventModalityFilter) => {
    setFilter(value);
    track('events_filter_applied', { filter_modality: value });
  }, []);

  const handleOpenEvent = useCallback(
    (eventId: string) => {
      navigation.navigate('EventDetail', { eventId });
    },
    [navigation],
  );

  const groups = groupEventsByMonth(events);
  const sections = groups.map((group) => ({ title: group.label, data: group.events, key: group.key }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Eventos</Text>
        <ModalityFilterBar value={filter} onChange={handleFilterChange} />
      </View>

      {status === 'loaded' && events.length === 0 ? (
        <EmptyState title="Nenhum evento por aqui" message={EMPTY_MESSAGE_BY_FILTER[filter]} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          renderItem={({ item }) => <EventListCard event={item} onPress={handleOpenEvent} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.display,
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  separator: {
    height: spacing.md,
  },
  sectionSeparator: {
    height: spacing.lg,
  },
});
