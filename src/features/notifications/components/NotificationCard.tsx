import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import type { NotificationRecord, NotificationType, WithId } from '../../../data/types';
import { relativeTime } from '../lib/relativeTime';

/** Icon tile per notification type — tela 14 of the mockup. */
function NotificationIcon({ type }: { type: NotificationType }): React.JSX.Element {
  if (type === 'event_with_vip') {
    return (
      <View style={[styles.iconTile, { backgroundColor: colors.orange }]}>
        <Image
          source={require('../../../../assets/brand/logo-symbol-white.png')}
          style={styles.iconLogo}
          resizeMode="contain"
        />
      </View>
    );
  }
  if (type === 'rsvp_confirmed') {
    return (
      <View style={[styles.iconTile, { backgroundColor: colors.backgroundTint }]}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.purple} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="m5 12.5 4.5 4.5L19 7.5" />
        </Svg>
      </View>
    );
  }
  // new_partner
  return (
    <View style={[styles.iconTile, { backgroundColor: colors.backgroundTint }]}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.purple} strokeWidth={2} strokeLinejoin="round">
        <Path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
        <Circle cx={7.5} cy={7.5} r={1.5} />
      </Svg>
    </View>
  );
}

export interface NotificationCardProps {
  notification: WithId<NotificationRecord>;
  now?: Date;
}

/** One card in the grouped inbox list (14) — unread ones carry the orange dot next to the title. */
export function NotificationCard({ notification, now }: NotificationCardProps): React.JSX.Element {
  const isUnread = notification.read_at === null;
  return (
    <View
      style={styles.card}
      accessibilityRole="text"
      accessibilityLabel={`${notification.title}${isUnread ? ', não lida' : ''}`}
    >
      <NotificationIcon type={notification.type} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{notification.title}</Text>
          {isUnread ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.body}>{notification.body}</Text>
        <Text style={styles.time}>{relativeTime(notification.created_at.toDate(), now)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundWhite,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconTile: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLogo: {
    width: 30,
    height: 30,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  unreadDot: {
    marginTop: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
  body: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.4,
    color: colors.textTertiary,
  },
  time: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
});
