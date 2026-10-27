import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import { useNotifications } from '../hooks/useNotifications';
import { groupByPeriod, type NotificationSection } from '../lib/groupByPeriod';
import { NotificationCard } from '../components/NotificationCard';
import type { NotificationRecord, WithId } from '../../../data/types';

/** How long the "não lida" highlight stays visible before the inbox auto-marks it read (9.3). */
const AUTO_MARK_AS_READ_DELAY_MS = 1500;

type ListItem =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'notification'; key: string; notification: WithId<NotificationRecord> };

function toListItems(sections: NotificationSection[]): ListItem[] {
  const items: ListItem[] = [];
  for (const section of sections) {
    items.push({ kind: 'header', key: `header-${section.key}`, label: section.label });
    section.items.forEach((notification) => {
      items.push({ kind: 'notification', key: notification.id, notification });
    });
  }
  return items;
}

/**
 * Tela 14 — caixa de entrada de notificações, agrupada por período (9.2),
 * com marcação automática ao visualizar e "marcar como lidos" (9.3). Fonte
 * de verdade do histórico — funciona por igual com a permissão de push
 * negada (ver "App funcional com a permissão negada" no spec).
 */
export default function NotificationsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { notifications, unreadCount, isLoading, markAllAsRead } = useNotifications();
  const autoMarkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHandledFocusRef = useRef(false);

  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) return;
    track('notifications_marked_read');
    void markAllAsRead();
  }, [unreadCount, markAllAsRead]);

  useFocusEffect(
    useCallback(() => {
      hasHandledFocusRef.current = false;
      return () => {
        if (autoMarkTimer.current) clearTimeout(autoMarkTimer.current);
      };
    }, []),
  );

  // `notifications_viewed` + the auto-mark-as-read timer both need the first
  // loaded snapshot, not just "screen focused" — so this runs off the data
  // itself rather than off useFocusEffect alone.
  React.useEffect(() => {
    if (notifications === null || hasHandledFocusRef.current) return;
    hasHandledFocusRef.current = true;
    track('notifications_viewed', { unread_count: unreadCount });
    if (unreadCount > 0) {
      autoMarkTimer.current = setTimeout(handleMarkAllAsRead, AUTO_MARK_AS_READ_DELAY_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally fires once per loaded snapshot, not on every unreadCount change
  }, [notifications]);

  const sections = groupByPeriod(notifications ?? []);
  const listItems = toListItems(sections);
  const isEmpty = notifications !== null && notifications.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth={2.2} strokeLinecap="round">
            <Path d="m15 6-6 6 6 6" />
          </Svg>
        </Pressable>
        <Pressable
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          accessibilityRole="button"
          accessibilityLabel="Marcar como lidos"
        >
          <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllTextDisabled]}>
            Marcar como lidos
          </Text>
        </Pressable>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Avisos</Text>
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhuma notificação por aqui</Text>
          <Text style={styles.emptyBody}>
            Quando o clube enviar um aviso — evento, parceria ou presença confirmada — ele aparece
            aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <Text style={styles.sectionLabel}>{item.label}</Text>
            ) : (
              <NotificationCard notification={item.notification} />
            )
          }
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
  headerRow: {
    flexShrink: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundWhite,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllText: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.md,
    color: colors.purple,
    paddingRight: spacing.xs,
  },
  markAllTextDisabled: {
    color: colors.textSecondary,
  },
  titleRow: {
    flexShrink: 0,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.hero,
    textTransform: 'uppercase',
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  sectionLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
