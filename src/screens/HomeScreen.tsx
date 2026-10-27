import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { subscribeAssociate } from '../data/associatesRepository';
import { colors, fontFamily, fontSize, spacing, radii } from '../theme';
import { track } from '../lib/instrumentation';
import { MembershipBanner } from '../features/membership/components/MembershipBanner';
import { NextEventCard } from '../features/events/components/NextEventCard';
import { VipTeaser } from '../features/vip/components/VipTeaser';
import { NotificationsBell } from '../features/notifications/components/NotificationsBell';

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia,';
  if (hour < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

/**
 * Tela 04 — Início. Composed from one stub per feature; only the
 * entrada/auth agent edits this file — every other agent fills in its own
 * component instead (contract seam #4):
 *   - src/features/membership/components/MembershipBanner.tsx
 *   - src/features/events/components/NextEventCard.tsx
 *   - src/features/vip/components/VipTeaser.tsx
 *   - src/features/notifications/components/NotificationsBell.tsx
 */
export default function HomeScreen(): React.JSX.Element {
  const [associateFirstName, setAssociateFirstName] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(getApp());
    let unsubscribeAssociate: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeAssociate?.();
      if (!user) {
        setAssociateFirstName(null);
        return;
      }
      unsubscribeAssociate = subscribeAssociate(user.uid, (associate) => {
        setAssociateFirstName(associate?.name.split(' ')[0] ?? null);
      });
    });

    return () => {
      unsubscribeAssociate?.();
      unsubscribeAuth();
    };
  }, []);

  // Task 4.8 — `home_viewed`, distinct from the automatic `screen_view`
  // logged by RootNavigator. Plain mount effect (not `useFocusEffect`): this
  // screen is also rendered standalone, with no NavigationContainer, by the
  // foundation's test seam (src/test/foundation.smoke.test.tsx) — a
  // navigation-context hook here would break that test.
  useEffect(() => {
    track('home_viewed');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/brand/logo-symbol-white.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingLabel}>{timeOfDayGreeting()}</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {associateFirstName ?? 'Associado'}
            </Text>
          </View>
          <NotificationsBell />
        </View>

        <MembershipBanner />
        <NextEventCard />
        <VipTeaser />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundTint,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 30,
    height: 30,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
  },
  greetingLabel: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  greetingName: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
});
