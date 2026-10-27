import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, spacing, radii } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import { getAccess, buildQrPayload } from '../../../data/vipAccessRepository';
import { getEvent } from '../../../data/eventsRepository';
import { getAssociate } from '../../../data/associatesRepository';
import type { Associate, EventRecord, VipAccessQrPayload, WithId } from '../../../data/types';
import type { VipStackParamList } from '../../../navigation/types';
import { useAssociateId } from '../hooks/useAssociateId';
import { formatMemberNumber, formatWeekdayFull, formatWindow } from '../lib/format';
import { ClockIcon, CloseIcon } from '../lib/icons';

type Props = NativeStackScreenProps<VipStackParamList, 'VipQr'>;

interface QrData {
  payload: VipAccessQrPayload | null;
  event: WithId<EventRecord> | null;
  associate: WithId<Associate> | null;
}

/**
 * Tela 08 — QR code de acesso. Renders from data already fetched (6.6): the
 * only repository call here is `vipAccessRepository.getAccess`, a read of a
 * document the hub's "Gerar meu acesso" already created/reused moments ago —
 * never `getOrCreateAccess` (which could write). Once that read resolves,
 * `buildQrPayload` is a pure, synchronous assembly with no network
 * involvement at all, so the QR itself never depends on connectivity at the
 * door.
 */
export default function VipQrScreen({ route, navigation }: Props): React.JSX.Element {
  const { eventId } = route.params;
  const associateId = useAssociateId();
  const [status, setStatus] = useState<'loading' | 'ready' | 'not_found'>('loading');
  const [data, setData] = useState<QrData>({ payload: null, event: null, associate: null });

  useEffect(() => {
    if (!associateId) return;
    let cancelled = false;

    async function load() {
      try {
        const [access, event, associate] = await Promise.all([
          getAccess(associateId as string, eventId),
          getEvent(eventId),
          getAssociate(associateId as string),
        ]);
        if (cancelled) return;

        const payload = access ? buildQrPayload(access) : null;
        setData({ payload, event, associate });
        setStatus(payload ? 'ready' : 'not_found');
        track('vip_qr_viewed', { event_id: eventId, has_access: Boolean(payload) });
      } catch {
        if (cancelled) return;
        setStatus('not_found');
        track('vip_qr_viewed', { event_id: eventId, has_access: false });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [associateId, eventId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          testID="vip-qr-close-button"
        >
          <CloseIcon />
        </Pressable>
        <Text style={styles.topBarTitle}>Seu acesso</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {status === 'loading' && (
        <ActivityIndicator color={colors.backgroundWhite} style={styles.loading} testID="vip-qr-loading" />
      )}

      {status === 'not_found' && (
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>
            Não encontramos seu acesso a este espaço. Volte ao hub e gere o acesso novamente.
          </Text>
        </View>
      )}

      {status === 'ready' && data.payload && data.event && data.associate && (
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeading}>
              <Text style={styles.eyebrow}>Espaço VIP</Text>
              <Text style={styles.eventName}>{data.event.name}</Text>
              {data.event.vip_window && (
                <Text style={styles.eventSchedule}>
                  {formatWeekdayFull(data.event.starts_at.toDate())} ·{' '}
                  {formatWindow(data.event.vip_window.starts_at.toDate(), data.event.vip_window.ends_at.toDate())}
                </Text>
              )}
            </View>

            <View style={styles.qrWrap} testID="vip-qr-code">
              <QRCode
                value={JSON.stringify(data.payload)}
                size={220}
                color={colors.textPrimary}
                backgroundColor={colors.backgroundWhite}
                logo={require('../../../../assets/brand/logo-symbol-white.png')}
                logoSize={44}
                logoBackgroundColor={colors.purple}
                logoBorderRadius={8}
                logoMargin={2}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.associateBlock}>
              <Text style={styles.associateName}>{data.associate.name}</Text>
              <Text style={styles.associateMemberNumber}>
                Membro Base Fox · nº {formatMemberNumber(data.associate.member_number)}
              </Text>
            </View>
          </View>

          <View style={styles.validityPill}>
            <ClockIcon size={16} color={colors.textPrimary} />
            <Text style={styles.validityPillLabel}>Válido para o evento de hoje</Text>
          </View>

          <Text style={styles.instructions}>Mostre este código na entrada do espaço.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.purple,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    color: colors.backgroundWhite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topBarSpacer: {
    width: 44,
  },
  loading: {
    marginTop: spacing.xxxl,
  },
  notFound: {
    padding: spacing.xxl,
  },
  notFoundText: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.backgroundWhite,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: radii.xxl,
    backgroundColor: colors.backgroundWhite,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.xl,
  },
  cardHeading: {
    alignItems: 'center',
    gap: 2,
  },
  eyebrow: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.base,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.purple,
  },
  eventName: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  eventSchedule: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  qrWrap: {
    width: 250,
    height: 250,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: '100%',
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  associateBlock: {
    alignItems: 'center',
    gap: 2,
  },
  associateName: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  associateMemberNumber: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  validityPill: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.orange,
  },
  validityPillLabel: {
    fontFamily: fontFamily.barlowBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  instructions: {
    marginTop: spacing.md,
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: '#E2D6EC',
  },
});
