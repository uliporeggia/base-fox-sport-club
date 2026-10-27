/**
 * Root-level error boundary (task 2.2). Wraps `Sentry.ErrorBoundary` so a
 * render-time exception anywhere in the tree is both captured by Sentry
 * (with the navigation breadcrumbs `logScreenView` already dropped — see
 * `../instrumentation`) and shown as a recoverable screen instead of a blank
 * app or a native crash.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
}

function Fallback({ resetError }: { resetError: () => void }): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Algo deu errado</Text>
      <Text style={styles.message}>
        Encontramos um erro inesperado. Toque para tentar de novo — se continuar acontecendo, feche
        e abra o app novamente.
      </Text>
      <Pressable style={styles.button} onPress={resetError}>
        <Text style={styles.buttonLabel}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

export function AppErrorBoundary({ children }: Props): React.JSX.Element {
  return (
    <Sentry.ErrorBoundary fallback={({ resetError }) => <Fallback resetError={resetError} />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purpleDeep,
    paddingHorizontal: spacing.xxl,
  },
  title: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xl,
    color: colors.backgroundWhite,
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: fontFamily.barlowRegular,
    fontSize: fontSize.md,
    color: colors.backgroundMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  button: {
    backgroundColor: colors.orange,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
  },
  buttonLabel: {
    fontFamily: fontFamily.sairaSemiBold,
    fontSize: fontSize.md,
    color: colors.backgroundWhite,
  },
});
