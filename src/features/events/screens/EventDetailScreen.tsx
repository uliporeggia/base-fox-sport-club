import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import { useMemberAccess } from '../../../lib/membership/gate';
import { getEvent } from '../../../data/eventsRepository';
import type { EventRecord, WithId } from '../../../data/types';
import type { EventsStackParamList } from '../../../navigation/types';
import { useAssociateId } from '../hooks/useAssociateId';
import { useRsvp } from '../hooks/useRsvp';
import {
  largeDateLabel,
  modalityWithDistanceLabel,
  organizerLabel,
  weekdayTimeLabel,
} from '../lib/format';
import { VipAccessBlock } from '../components/VipAccessBlock';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetail'>;

/**
 * Tela 06 — detalhe do evento (5.4/5.5/5.6). Sem campo de imagem de capa no
 * modelo de dados (`EventRecord` em src/data/types.ts não tem URL de capa) —
 * o cabeçalho usa um bloco de cor sólida com a modalidade no lugar de foto,
 * até existir um campo real para isso.
 */
export default function EventDetailScreen({ route }: Props): React.JSX.Element {
  const { eventId } = route.params;
  const navigation = useNavigation();
  const { hasMemberAccess } = useMemberAccess();
  const associateId = useAssociateId();

  const [event, setEvent] = useState<WithId<EventRecord> | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    setEvent(undefined);
    getEvent(eventId)
      .then((result) => {
        if (!active) return;
        setEvent(result);
        if (result) {
          track('event_viewed', { event_id: result.id });
        }
      })
      .catch(() => {
        if (active) setEvent(null);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  const rsvp = useRsvp({
    associateId,
    eventId,
    modality: event?.modality ?? 'corrida',
    hasVip: event?.has_vip ?? false,
  });

  if (event === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.loadingLabel}>Carregando evento…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (event === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={styles.loadingLabel}>Evento não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const showSecondaryRsvp = event.has_vip && !hasMemberAccess;
  const rsvpLabel = rsvp.isConfirmed
    ? 'Presença confirmada'
    : showSecondaryRsvp
      ? 'Confirmar só a presença'
      : 'Confirmar presença';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cover}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.coverDate}>{largeDateLabel(event.starts_at)}</Text>
          <Text style={styles.coverModality}>{modalityWithDistanceLabel(event.modality, event.distance)}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{event.name}</Text>
          <Text style={styles.detailLine}>{weekdayTimeLabel(event.starts_at)}</Text>
          <Text style={styles.detailLine}>{event.location}</Text>
          <Text style={styles.detailLine}>Organizador: {organizerLabel(event.organizer)}</Text>

          {event.has_vip ? (
            <VipAccessBlock
              event={event}
              hasMemberAccess={hasMemberAccess}
              onBecomeMemberPress={() => navigation.navigate('Paywall', { source: 'event_detail' })}
            />
          ) : null}

          {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

          <Pressable
            onPress={() => rsvp.toggle()}
            disabled={rsvp.isConfirmed === null || rsvp.isSubmitting}
            style={[
              styles.rsvpButton,
              showSecondaryRsvp && !rsvp.isConfirmed ? styles.rsvpButtonSecondary : styles.rsvpButtonPrimary,
            ]}
            accessibilityRole="button"
            accessibilityLabel={rsvpLabel}
          >
            <Text
              style={[
                styles.rsvpLabel,
                showSecondaryRsvp && !rsvp.isConfirmed ? styles.rsvpLabelSecondary : styles.rsvpLabelPrimary,
              ]}
            >
              {rsvpLabel}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BackButton({ onPress }: { onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Voltar">
      <Text style={styles.backButtonLabel}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingLabel: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  cover: {
    backgroundColor: colors.purple,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.xxs,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  backButtonLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xl,
    color: colors.backgroundWhite,
  },
  coverDate: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.hero,
    color: colors.backgroundWhite,
  },
  coverModality: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.md,
    color: colors.backgroundWhite,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  body: {
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  name: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  detailLine: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  description: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: fontSize.md * 1.4,
  },
  rsvpButton: {
    marginTop: spacing.xl,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpButtonPrimary: {
    backgroundColor: colors.orange,
  },
  rsvpButtonSecondary: {
    backgroundColor: colors.backgroundWhite,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  rsvpLabel: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.lg,
  },
  rsvpLabelPrimary: {
    color: colors.backgroundWhite,
  },
  rsvpLabelSecondary: {
    color: colors.orange,
  },
});
