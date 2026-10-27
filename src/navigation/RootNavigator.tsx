import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { useMemberAccess } from '../lib/membership/gate';
import { logScreenView } from '../lib/instrumentation';
import { registerNotificationResponseHandler } from '../lib/push/notificationResponse';
import { useEmailLinkSignIn } from '../lib/auth';
import { colors } from '../theme';
import EntryStack from './EntryStack';
import TabNavigator from './TabNavigator';
import NotificationsStack from './NotificationsStack';
import PaywallScreen from '../features/membership/screens/PaywallScreen';
import SubscriptionConfirmedScreen from '../features/membership/screens/SubscriptionConfirmedScreen';
import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * The navigation container + root switch (Entry vs Main) + the automatic
 * `screen_view` listener (task 2.3). `Paywall` and `SubscriptionConfirmed`
 * (telas 12/13) are only registered while membership is enabled — this is
 * what satisfies task 3.3 ("nenhum caminho alcança as telas 03, 12 e 13" com
 * a flag desligada) without any feature agent needing to edit this file.
 */
export default function RootNavigator(): React.JSX.Element {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const { membershipEnabled } = useMemberAccess();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const routeNameRef = useRef<string | undefined>(undefined);
  const notificationUnsubscribeRef = useRef<(() => void) | null>(null);

  // Mounted globally (not just in LoginScreen, which also calls this same
  // hook for its own UI feedback) so login-by-link completes even with the
  // app cold-started straight from the link — the account-recovery path for
  // whoever signed up via Strava and never set a password can't depend on
  // LoginScreen already being on screen. `onAuthStateChanged` above already
  // reacts to the resulting session; no extra wiring needed here beyond
  // mounting the hook so its effect runs.
  useEmailLinkSignIn();

  useEffect(() => {
    const auth = getAuth(getApp());
    return onAuthStateChanged(auth, (user) => setIsSignedIn(Boolean(user)));
  }, []);

  // Cleans up the listener registered in `onReady` below on unmount. Kept as
  // a separate effect (rather than inline in `onReady`) since `onReady` is a
  // one-shot callback, not a hook, and has no cleanup phase of its own.
  useEffect(() => {
    return () => {
      notificationUnsubscribeRef.current?.();
      notificationUnsubscribeRef.current = null;
    };
  }, []);

  if (isSignedIn === null) {
    // TODO(4.6 entrada): substituir por uma splash screen real enquanto a sessão é verificada.
    return <View style={{ flex: 1, backgroundColor: colors.purpleDeep }} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
        // Task 9.9 — wired here (not a top-level useEffect) because on cold
        // start the navigator isn't ready yet when the app's first effects
        // run, and navigating before that is a no-op that loses the intent
        // to land in the inbox.
        if (!notificationUnsubscribeRef.current) {
          notificationUnsubscribeRef.current = registerNotificationResponseHandler(() =>
            navigationRef.navigate('Notifications', { screen: 'Notifications' }),
          );
        }
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.getCurrentRoute()?.name;
        if (currentRouteName && currentRouteName !== previousRouteName) {
          logScreenView(currentRouteName);
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isSignedIn ? (
          <RootStack.Screen name="Main" component={TabNavigator} />
        ) : (
          <RootStack.Screen name="Entry" component={EntryStack} />
        )}
        <RootStack.Screen name="Notifications" component={NotificationsStack} />
        {membershipEnabled ? (
          <>
            <RootStack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
            <RootStack.Screen
              name="SubscriptionConfirmed"
              component={SubscriptionConfirmedScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : null}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
