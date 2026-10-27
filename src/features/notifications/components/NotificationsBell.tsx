import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../theme';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Sino de notificações no cabeçalho da Home (04) — único ponto de entrada
 * (junto da linha "Notificações" do Perfil) para a caixa de entrada (14).
 * Matches design/Base Fox - Mockup MVP-print.dc.html's header bell exactly:
 * 44×44 white rounded tile, bell stroke icon, orange dot badge when there is
 * at least one unread notification.
 */
export function NotificationsBell(): React.JSX.Element | null {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

  return (
    <Pressable
      onPress={() => navigation.navigate('Notifications', { screen: 'Notifications' })}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : 'Notificações'
      }
    >
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth={1.8} strokeLinecap="round">
        <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <Path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      </Svg>
      {unreadCount > 0 ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: 13,
    backgroundColor: colors.backgroundWhite,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.orange,
    borderWidth: 2,
    borderColor: colors.backgroundWhite,
  },
});
