import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NotificationsScreen from '../features/notifications/screens/NotificationsScreen';
import type { NotificationsStackParamList } from './types';

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

/**
 * Mounted at the Root level (see RootNavigator.tsx), not as a tab — reached
 * only via the Home header bell and the Perfil "Notificações" row.
 */
export default function NotificationsStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
