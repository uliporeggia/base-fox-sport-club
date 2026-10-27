import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BenefitsListScreen from '../features/benefits/screens/BenefitsListScreen';
import BenefitDetailScreen from '../features/benefits/screens/BenefitDetailScreen';
import type { BenefitsStackParamList } from './types';

const Stack = createNativeStackNavigator<BenefitsStackParamList>();

export default function BenefitsStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BenefitsList" component={BenefitsListScreen} />
      <Stack.Screen name="BenefitDetail" component={BenefitDetailScreen} />
    </Stack.Navigator>
  );
}
