import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemberAccess } from '../lib/membership/gate';
import OnboardingScreen from '../features/entry/screens/OnboardingScreen';
import SignUpScreen from '../features/entry/screens/SignUpScreen';
import LoginScreen from '../features/entry/screens/LoginScreen';
import BecomeMemberScreen from '../features/membership/screens/BecomeMemberScreen';
import type { EntryStackParamList } from './types';

const Stack = createNativeStackNavigator<EntryStackParamList>();

/**
 * Onboarding → Cadastro → (Torne-se membro, condicional) → Início.
 * `BecomeMember` (tela 03) só entra no grafo com a flag de membership ligada
 * — ver "Gate de membership" em design.md. O agente de entrada decide
 * dentro de cada tela (não aqui) se pula para `BecomeMember` ou direto para
 * `Main` após o cadastro (task 4.6).
 */
export default function EntryStack(): React.JSX.Element {
  const { membershipEnabled } = useMemberAccess();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      {membershipEnabled ? (
        <Stack.Screen name="BecomeMember" component={BecomeMemberScreen} />
      ) : null}
    </Stack.Navigator>
  );
}
