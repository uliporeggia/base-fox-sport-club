import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, spacing, radii } from '../../../theme';
import { useMemberAccess } from '../../../lib/membership/gate';
import { track } from '../../../lib/instrumentation';
import { listEvents } from '../../../data/eventsRepository';
import { getOrCreateAccess } from '../../../data/vipAccessRepository';
import type { EventRecord, WithId } from '../../../data/types';
import type { VipStackParamList } from '../../../navigation/types';
import { useAssociateId } from '../hooks/useAssociateId';
import { formatDayMonth, formatWeekdayShort, formatWindow } from '../lib/format';
import { LockIcon, ChevronRightIcon, GenerateAccessIcon, perkIconFor } from '../lib/icons';

type Navigation = NativeStackNavigationProp<VipStackParamList, 'VipHub'>;

/**
 * Tela 07 — hub do Espaço VIP. The member/blocked variant is decided
 * exclusively by `useMemberAccess().hasMemberAccess` (never `membershipEnabled`
 * directly — contract rule 4): with the flag off, `hasMemberAccess` is always
 * `true`, so the "blocked" branch below simply never renders, matching the
 * "Hub liberado com a flag desligada" scenario without any extra branching.
 */
export default function VipHubScreen(): React.JSX.Element {
  const navigation = useNavigation<Navigation>();
  const rootNavigation = useNavigation();
  const { hasMemberAccess } = useMemberAccess();
  const associateId = useAssociateId();

  const [vipEvents, setVipEvents] = useState<WithId<EventRecord>[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadVipEvents = useCallback(async () => {
    try {
      const upcoming = await listEvents();
      setVipEvents(upcoming.filter((event) => event.has_vip && event.vip_window));
    } catch {
      setVipEvents([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVipEvents();
    }, [loadVipEvents]),
  );

  useEffect(() => {
    track('vip_hub_viewed');
  }, []);

  const nextVipEvent = vipEvents?.[0] ?? null;
  const upcomingVipEvents = vipEvents?.slice(1) ?? [];

  const handleGenerateAccess = useCallback(async () => {
    if (!nextVipEvent || !associateId || generating) return;
    setGenerating(true);
    try {
      await getOrCreateAccess(associateId, nextVipEvent.id);
      track('vip_access_generated', { event_id: nextVipEvent.id });
      navigation.navigate('VipQr', { eventId: nextVipEvent.id });
    } finally {
      setGenerating(false);
    }
  }, [nextVipEvent, associateId, generating, navigation]);

  const handleBecomeMember = useCallback(() => {
    rootNavigation.navigate('Paywall', { source: 'vip_hub' });
  }, [rootNavigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Espaço VIP</Text>
          {hasMemberAccess ? (
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>Membro</Text>
            </View>
          ) : (
            <View style={styles.lockedBadge}>
              <LockIcon size={12} color={colors.backgroundWhite} />
              <Text style={styles.lockedBadgeText}>Só membros</Text>
            </View>
          )}
        </View>

        <Text style={styles.description}>
          O lounge do clube dentro dos eventos: descanso, cortesias e a sua turma, antes e depois da
          prova.
        </Text>

        {vipEvents === null ? (
          <ActivityIndicator color={colors.backgroundWhite} style={styles.loading} testID="vip-hub-loading" />
        ) : nextVipEvent ? (
          <>
            <NextVipSpaceCard
              event={nextVipEvent}
              hasMemberAccess={hasMemberAccess}
              generating={generating}
              onGenerateAccess={handleGenerateAccess}
              onBecomeMember={handleBecomeMember}
            />

            {upcomingVipEvents.length > 0 && (
              <View style={styles.nextSection}>
                <Text style={styles.nextSectionLabel}>Depois</Text>
                {upcomingVipEvents.map((event) => (
                  <View key={event.id} style={styles.nextRow} testID={`vip-next-row-${event.id}`}>
                    <Text style={styles.nextRowDate}>{formatDayMonth(event.starts_at.toDate())}</Text>
                    <Text style={styles.nextRowName} numberOfLines={1}>
                      {event.name}
                    </Text>
                    <ChevronRightIcon />
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState} testID="vip-hub-empty-state">
            <Text style={styles.emptyStateTitle}>Nenhum espaço VIP agendado</Text>
            <Text style={styles.emptyStateBody}>
              Os próximos espaços serão anunciados em breve.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface NextVipSpaceCardProps {
  event: WithId<EventRecord>;
  hasMemberAccess: boolean;
  generating: boolean;
  onGenerateAccess: () => void;
  onBecomeMember: () => void;
}

function NextVipSpaceCard({
  event,
  hasMemberAccess,
  generating,
  onGenerateAccess,
  onBecomeMember,
}: NextVipSpaceCardProps): React.JSX.Element {
  const startsAt = event.starts_at.toDate();
  const vipWindow = event.vip_window;
  const scheduleLabel = vipWindow
    ? `${formatWeekdayShort(startsAt)} · ${formatWindow(vipWindow.starts_at.toDate(), vipWindow.ends_at.toDate())} · ${event.location}`
    : `${formatWeekdayShort(startsAt)} · ${event.location}`;

  return (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        <Image
          source={require('../../../../assets/brand/espaco-vip.jpg')}
          style={styles.cardImage}
          resizeMode="cover"
        />
        {!hasMemberAccess && <View style={styles.cardImageOverlay} />}
        <View style={styles.cardImageBadge}>
          <Text style={styles.cardImageBadgeText}>Próximo espaço</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeading}>
          <Text style={styles.cardEventName}>{event.name}</Text>
          <Text style={styles.cardSchedule}>{scheduleLabel}</Text>
        </View>

        <View style={styles.perksRow}>
          {event.vip_perks.map((perk) => {
            const PerkIconComponent = perkIconFor(perk);
            return (
              <View
                key={perk}
                style={[styles.perkChip, !hasMemberAccess && styles.perkChipLocked]}
              >
                <PerkIconComponent color={hasMemberAccess ? colors.purple : '#B3AABB'} />
                <Text style={[styles.perkLabel, !hasMemberAccess && styles.perkLabelLocked]}>{perk}</Text>
              </View>
            );
          })}
          {!hasMemberAccess && (
            <View style={styles.perksLockOverlay} pointerEvents="none">
              <LockIcon size={18} color={colors.backgroundWhite} />
            </View>
          )}
        </View>

        {hasMemberAccess ? (
          <Pressable
            style={({ pressed }) => [styles.generateButton, pressed && styles.generateButtonPressed]}
            onPress={onGenerateAccess}
            disabled={generating}
            testID="vip-generate-access-button"
          >
            {generating ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <>
                <GenerateAccessIcon />
                <Text style={styles.generateButtonLabel}>Gerar meu acesso</Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={styles.memberAccessBlock} testID="vip-member-access-block">
            <LockIcon size={16} color="#8A8094" />
            <Text style={styles.memberAccessBlockLabel}>Acesso de membro</Text>
          </View>
        )}
      </View>

      {!hasMemberAccess && (
        <View style={styles.becomeMemberBlock}>
          <Text style={styles.becomeMemberText}>
            Membros entram no espaço VIP em todos os eventos do clube.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.becomeMemberButton, pressed && styles.generateButtonPressed]}
            onPress={onBecomeMember}
            testID="vip-become-member-button"
          >
            <Text style={styles.becomeMemberButtonLabel}>Quero ser membro</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.purpleDeep,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.hero,
    color: colors.backgroundWhite,
    textTransform: 'uppercase',
  },
  memberBadge: {
    backgroundColor: colors.orange,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  memberBadgeText: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.purpleDeep,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  lockedBadgeText: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.backgroundWhite,
  },
  description: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * 1.45,
    color: '#E2D6EC',
  },
  loading: {
    marginTop: spacing.xxxl,
  },
  card: {
    borderRadius: radii.xxl,
    overflow: 'hidden',
    backgroundColor: colors.backgroundWhite,
  },
  cardImageWrap: {
    height: 150,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(34,9,47,0.35)',
  },
  cardImageBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.purple,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  cardImageBadgeText: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.backgroundWhite,
  },
  cardBody: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardHeading: {
    gap: 3,
  },
  cardEventName: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  cardSchedule: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  perksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    position: 'relative',
  },
  perkChip: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundTint,
  },
  perkChipLocked: {
    backgroundColor: '#F3F1F5',
  },
  perkLabel: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  perkLabelLocked: {
    color: '#8A8094',
  },
  perksLockOverlay: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    borderRadius: 20,
    backgroundColor: colors.purpleDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.backgroundWhite,
  },
  generateButton: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  generateButtonPressed: {
    opacity: 0.85,
  },
  generateButtonLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  memberAccessBlock: {
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: '#F3F1F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  memberAccessBlockLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#8A8094',
  },
  becomeMemberBlock: {
    margin: spacing.xl,
    marginTop: 0,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.purple,
    gap: spacing.md,
  },
  becomeMemberText: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.4,
    color: colors.backgroundWhite,
  },
  becomeMemberButton: {
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  becomeMemberButtonLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  nextSection: {
    gap: spacing.sm,
  },
  nextSectionLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.sm,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#C9B9D6',
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  nextRowDate: {
    width: 52,
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.lg,
    color: colors.orange,
  },
  nextRowName: {
    flex: 1,
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.lg,
    color: colors.backgroundWhite,
  },
  emptyState: {
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255,255,255,0.07)',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyStateTitle: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    color: colors.backgroundWhite,
  },
  emptyStateBody: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.md,
    color: '#E2D6EC',
  },
});
