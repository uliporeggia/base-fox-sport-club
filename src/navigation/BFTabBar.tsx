import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fontFamily, fontSize } from '../theme';
import type { MainTabParamList } from './types';

/**
 * Custom tab bar replicating design/BFTabBar.dc.html: 5 tabs, the center one
 * (Espaço VIP) elevated in a round button. Active tint is purple, except the
 * center button which flips to orange while active.
 */

type TabKey = keyof MainTabParamList;

const TAB_ORDER: TabKey[] = ['HomeTab', 'EventsTab', 'VipTab', 'BenefitsTab', 'ProfileTab'];

const TAB_LABEL: Record<TabKey, string> = {
  HomeTab: 'Início',
  EventsTab: 'Eventos',
  VipTab: 'Espaço VIP',
  BenefitsTab: 'Benefícios',
  ProfileTab: 'Perfil',
};

function TabIcon({ tab, color }: { tab: TabKey; color: string }): React.JSX.Element | null {
  switch (tab) {
    case 'HomeTab':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round">
          <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </Svg>
      );
    case 'EventsTab':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
          <Rect x={3} y={5} width={18} height={16} rx={2} />
          <Path d="M3 10h18M8 3v4M16 3v4" />
        </Svg>
      );
    case 'BenefitsTab':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round">
          <Path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
          <Circle cx={7.5} cy={7.5} r={1.5} />
        </Svg>
      );
    case 'ProfileTab':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
          <Circle cx={12} cy={8} r={4} />
          <Path d="M4 21a8 8 0 0 1 16 0" />
        </Svg>
      );
    case 'VipTab':
      return null; // rendered as the elevated button, not a stroke icon
  }
}

export function BFTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.JSX.Element {
  return (
    <View style={styles.bar}>
      {TAB_ORDER.map((tab) => {
        const routeIndex = state.routes.findIndex((route) => route.name === tab);
        if (routeIndex === -1) return null;
        const route = state.routes[routeIndex];
        const isFocused = state.index === routeIndex;
        const { options } = descriptors[route.key];
        const tabBarAccessibilityLabel = options.tabBarAccessibilityLabel;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const color = isFocused ? colors.purple : colors.tabInactive;

        if (tab === 'VipTab') {
          return (
            <Pressable
              key={tab}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tabBarAccessibilityLabel}
              style={styles.tabItem}
            >
              <View style={[styles.vipButton, { backgroundColor: isFocused ? colors.orange : colors.purple }]}>
                <Image source={require('../../assets/brand/logo-symbol-white.png')} style={styles.vipButtonLogo} resizeMode="contain" />
              </View>
              <Text style={[styles.tabLabel, { color, fontWeight: isFocused ? '700' : '500' }]} numberOfLines={1}>
                {TAB_LABEL[tab]}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={tabBarAccessibilityLabel}
            style={styles.tabItem}
          >
            <TabIcon tab={tab} color={color} />
            <Text style={[styles.tabLabel, { color, fontWeight: isFocused ? '700' : '500' }]}>{TAB_LABEL[tab]}</Text>
          </Pressable>
        );
      })}
      <View pointerEvents="none" style={styles.homeIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 88,
    paddingTop: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.backgroundWhite,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.xs,
  },
  vipButton: {
    width: 54,
    height: 54,
    marginTop: -26,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.backgroundWhite,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  },
  vipButtonLogo: {
    width: 34,
    height: 34,
  },
  homeIndicator: {
    position: 'absolute',
    left: '50%',
    bottom: 8,
    width: 134,
    height: 5,
    marginLeft: -67,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
  },
});
