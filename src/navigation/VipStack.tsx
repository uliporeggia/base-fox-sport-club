import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VipHubScreen from '../features/vip/screens/VipHubScreen';
import VipQrScreen from '../features/vip/screens/VipQrScreen';
import type { VipStackParamList } from './types';

const Stack = createNativeStackNavigator<VipStackParamList>();

export default function VipStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VipHub" component={VipHubScreen} />
      <Stack.Screen name="VipQr" component={VipQrScreen} />
    </Stack.Navigator>
  );
}
