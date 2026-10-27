import React, { useRef, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, type TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, spacing, radii } from '../../../theme';
import { track } from '../../../lib/instrumentation';
import { useMemberAccess } from '../../../lib/membership/gate';
import { signUpWithEmail } from '../../../lib/auth';
import { connectStrava } from '../../../lib/strava';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import type { EntryStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<EntryStackParamList, 'SignUp'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen({ navigation }: Props): React.JSX.Element {
  const { membershipEnabled } = useMemberAccess();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailInUse, setEmailInUse] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const [stravaEmailError, setStravaEmailError] = useState<string | null>(null);
  const [stravaMessage, setStravaMessage] = useState<string | null>(null);
  const [isConnectingStrava, setIsConnectingStrava] = useState(false);

  const emailInputRef = useRef<TextInputInstance>(null);

  const isNameValid = name.trim().length > 0;
  const isEmailValid = EMAIL_PATTERN.test(email.trim());
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
  const canSubmitEmailForm = isNameValid && isEmailValid && isPasswordValid && !isSubmittingEmail;

  const goToNextEntryStep = () => {
    if (membershipEnabled) {
      navigation.replace('BecomeMember');
    }
    // Else: Firebase's auth-state listener in RootNavigator swaps straight to Início.
  };

  const handleCreateAccount = async () => {
    if (!canSubmitEmailForm) return;
    setEmailInUse(false);
    setSubmitError(null);
    setIsSubmittingEmail(true);
    try {
      const result = await signUpWithEmail({ name: name.trim(), email: email.trim(), password });
      if (result.status === 'created') {
        track('sign_up', { method: 'email' });
        goToNextEntryStep();
        return;
      }
      if (result.status === 'email_in_use') {
        setEmailInUse(true);
        return;
      }
      setSubmitError('Não foi possível criar sua conta agora. Tente novamente em instantes.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleStravaSignUp = async () => {
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setStravaEmailError('Informe um e-mail válido para continuar com o Strava.');
      emailInputRef.current?.focus();
      return;
    }
    setStravaEmailError(null);
    setStravaMessage(null);
    setIsConnectingStrava(true);
    try {
      const result = await connectStrava('sign_up', { email: trimmedEmail });
      switch (result.status) {
        case 'connected':
          // A visitor who already has an account (reconciled by athlete_id or
          // e-mail) is entering it, not creating a new one — report accordingly.
          track(result.isNewAssociate ? 'sign_up' : 'login', { method: 'strava' });
          goToNextEntryStep();
          return;
        case 'authorization_denied':
          // Spec: back to the cadastro screen, no error shown.
          return;
        case 'unavailable_athlete_cap':
        case 'unavailable_not_configured':
          setStravaMessage(
            'A conexão com o Strava está indisponível no momento. Você ainda pode criar sua conta com nome, e-mail e senha abaixo.',
          );
          return;
        case 'email_required':
          setStravaEmailError('Informe um e-mail válido para continuar com o Strava.');
          return;
        case 'error':
          setStravaMessage('Não foi possível conectar ao Strava agora. Tente novamente ou use o cadastro por e-mail.');
          return;
      }
    } finally {
      setIsConnectingStrava(false);
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
          <Text style={styles.title}>Crie sua conta</Text>
          <Text style={styles.subtitle}>Grátis. Escolha como prefere entrar.</Text>
        </View>

        <View style={styles.form}>
          <Button
            label="Cadastrar com Strava"
            onPress={handleStravaSignUp}
            variant="strava"
            loading={isConnectingStrava}
            disabled={isSubmittingEmail}
            testID="signup-strava-button"
          />
          <Text style={styles.stravaHint}>Importa seu nome e foto. Opcional.</Text>
          {stravaMessage ? (
            <Text style={styles.stravaMessage} accessibilityLiveRegion="polite">
              {stravaMessage}
            </Text>
          ) : null}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>ou com e-mail</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextField
            label="Nome"
            placeholder="Marina Alves"
            autoCapitalize="words"
            autoComplete="name"
            value={name}
            onChangeText={setName}
            testID="signup-name-input"
          />
          <TextField
            ref={emailInputRef}
            label="E-mail"
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setEmailInUse(false);
              setStravaEmailError(null);
            }}
            errorMessage={stravaEmailError}
            testID="signup-email-input"
          />
          <TextField
            label="Senha"
            placeholder="Mínimo de 8 caracteres"
            secureTextEntry
            autoComplete="password-new"
            value={password}
            onChangeText={setPassword}
            testID="signup-password-input"
          />

          {emailInUse ? (
            <View style={styles.emailInUseBox}>
              <Text style={styles.emailInUseText}>Esse e-mail já tem uma conta no Base Fox.</Text>
              <Text style={styles.emailInUseLink} onPress={() => navigation.navigate('Login')}>
                Entrar na conta existente
              </Text>
            </View>
          ) : null}
          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <Button
            label="Criar conta"
            onPress={handleCreateAccount}
            disabled={!canSubmitEmailForm}
            loading={isSubmittingEmail}
            testID="signup-submit-button"
          />

          <Text style={styles.loginLinkRow}>
            Já tem conta?{' '}
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              Entrar
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
  stravaHint: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  stravaMessage: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.purple,
    backgroundColor: colors.backgroundTint,
    borderRadius: radii.md,
    padding: spacing.md,
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
  emailInUseBox: {
    gap: spacing.xxs,
  },
  emailInUseText: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  emailInUseLink: {
    fontFamily: fontFamily.barlowBold,
    fontSize: fontSize.base,
    color: colors.purple,
  },
  submitError: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.orange,
  },
  loginLinkRow: {
    textAlign: 'center',
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  loginLink: {
    fontFamily: fontFamily.barlowBold,
    color: colors.purple,
  },
});
