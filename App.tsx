import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppFonts, colors } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { initSentry } from './src/lib/observability/sentry';
import { AppErrorBoundary } from './src/lib/observability/ErrorBoundary';

// Sentry.init runs once at module load, before the first render, so it
// captures everything — including errors thrown while fonts are loading.
initSentry();

export default function App(): React.JSX.Element {
  const { fontsLoaded } = useAppFonts();

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.purpleDeep }} />;
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
