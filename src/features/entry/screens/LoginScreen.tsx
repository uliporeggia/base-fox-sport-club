import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, spacing, radii } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import { logInWithEmail, sendLoginLink, useEmailLinkSignIn } from '../../../lib/auth';
import { connectStrava } from '../../../lib/strava';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import type { EntryStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<EntryStackParamList, 'Login'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }: Props): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stravaMessage, setStravaMessage] = useState<string | null>(null);
  const [isConnectingStrava, setIsConnectingStrava] = useState(false);

  const [linkEmailError, setLinkEmailError] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);

  const emailLinkSignIn = useEmailLinkSignIn();
  const [confirmEmail, setConfirmEmail] = useState('');

  useEffect(() => {
    if (emailLinkSignIn.result?.status === 'signed_in') {
      track('login', { method: 'email' });
    }
  }, [emailLinkSignIn.result]);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setInvalidCredentials(false);
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await logInWithEmail({ email: email.trim(), password });
      if (result.status === 'signed_in') {
        track('login', { method: 'email' });
        return;
      }
      if (result.status === 'invalid_credentials') {
        setInvalidCredentials(true);
        return;
      }
      setSubmitError('Não foi possível entrar agora. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStravaLogin = async () => {
    setStravaMessage(null);
    setIsConnectingStrava(true);
    try {
      const result = await connectStrava('login');
      switch (result.status) {
        case 'connected':
          track('login', { method: 'strava' });
          return;
        case 'authorization_denied':
          return;
        case 'unavailable_athlete_cap':
        case 'unavailable_not_configured':
          setStravaMessage(
            'A conexão com o Strava está indisponível no momento. Use o link por e-mail abaixo para entrar.',
          );
          return;
        case 'email_required':
          setStravaMessage('Essa conta do Strava ainda não tem cadastro no Base Fox. Crie uma conta com seu e-mail.');
          return;
        case 'error':
          setStravaMessage('Não foi possível conectar ao Strava agora. Tente novamente.');
          return;
      }
    } finally {
      setIsConnectingStrava(false);
    }
  };

  const handleSendLoginLink = async () => {
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setLinkEmailError('Informe um e-mail válido para receber o link de acesso.');
      return;
    }
    setLinkEmailError(null);
    setLinkMessage(null);
    setIsSendingLink(true);
    try {
      const result = await sendLoginLink(trimmedEmail);
      if (result.status === 'sent') {
        setLinkMessage('Se esse e-mail tiver uma conta, enviamos um link de acesso. Abra-o neste aparelho para entrar.');
      } else {
        setLinkMessage('Não foi possível enviar o link agora. Tente novamente.');
      }
    } finally {
      setIsSendingLink(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image
            source={require('../../../../assets/brand/logo-basefox-white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>Acesse sua conta Base Fox.</Text>
        </View>

        <View style={styles.form}>
          <Button
            label="Entrar com Strava"
            onPress={handleStravaLogin}
            variant="strava"
            loading={isConnectingStrava}
            testID="login-strava-button"
          />
          {stravaMessage ? <Text style={styles.infoMessage}>{stravaMessage}</Text> : null}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>ou com e-mail</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextField
            label="E-mail"
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setInvalidCredentials(false);
              setLinkEmailError(null);
            }}
            testID="login-email-input"
          />
          <TextField
            label="Senha"
            placeholder="Sua senha"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setInvalidCredentials(false);
            }}
            testID="login-password-input"
          />

          {invalidCredentials ? (
            <Text style={styles.errorMessage}>E-mail ou senha incorretos.</Text>
          ) : null}
          {submitError ? <Text style={styles.errorMessage}>{submitError}</Text> : null}

          <Button
            label="Entrar"
            onPress={handleLogin}
            disabled={!canSubmit}
            loading={isSubmitting}
            testID="login-submit-button"
          />

          <View style={styles.linkSection}>
            <Text
              style={styles.linkAction}
              onPress={handleSendLoginLink}
              accessibilityRole="button"
            >
              {isSendingLink ? 'Enviando link…' : 'Entrar por link de e-mail'}
            </Text>
            {linkEmailError ? <Text style={styles.errorMessage}>{linkEmailError}</Text> : null}
            {linkMessage ? <Text style={styles.infoMessage}>{linkMessage}</Text> : null}
          </View>

          {emailLinkSignIn.result?.status === 'needs_email' ? (
            <View style={styles.confirmEmailBox}>
              <Text style={styles.infoMessage}>
                Confirme o e-mail que recebeu o link para concluir a entrada neste aparelho.
              </Text>
              <TextField
                label="E-mail"
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={confirmEmail}
                onChangeText={setConfirmEmail}
                testID="login-confirm-email-input"
              />
              <Button
                label="Confirmar"
                onPress={() => emailLinkSignIn.retryWithEmail(confirmEmail.trim())}
                disabled={!EMAIL_PATTERN.test(confirmEmail.trim())}
              />
            </View>
          ) : null}
          {emailLinkSignIn.result?.status === 'no_account' ? (
            <Text style={styles.errorMessage}>Não encontramos uma conta para esse link. Crie sua conta primeiro.</Text>
          ) : null}

          <Text style={styles.signUpLinkRow}>
            Não tem conta?{' '}
            <Text style={styles.signUpLink} onPress={() => navigation.navigate('SignUp')}>
              Criar conta
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundTint,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: colors.purple,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  logo: {
    width: 112,
    height: 40,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.display,
    color: colors.backgroundWhite,
  },
  subtitle: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.lg,
    color: '#E2D6EC',
  },
  form: {
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.base,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  errorMessage: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.orange,
  },
  infoMessage: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.purple,
    backgroundColor: colors.backgroundTint,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  linkSection: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  linkAction: {
    fontFamily: fontFamily.barlowBold,
    fontSize: fontSize.md,
    color: colors.purple,
  },
  confirmEmailBox: {
    gap: spacing.md,
  },
  signUpLinkRow: {
    textAlign: 'center',
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  signUpLink: {
    fontFamily: fontFamily.barlowBold,
    color: colors.purple,
  },
});
