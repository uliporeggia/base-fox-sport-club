import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import { setPasswordForCurrentUser } from '../../../lib/auth';

const MIN_PASSWORD_LENGTH = 8;

export interface SetPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called once the password was actually linked (or Firebase reports one already was) — the caller flips the row to "Alterar senha". */
  onSuccess: () => void;
}

/**
 * Task 8.7a — "Definir uma senha" (tela 16). No screen is designed for this
 * step (UI-REFERENCE.md: "modal de criação de senha (fora do mockup)"), so
 * this is a minimal in-app modal rather than a new stack screen.
 */
export function SetPasswordModal({ visible, onClose, onSuccess }: SetPasswordModalProps): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await setPasswordForCurrentUser(password);
      switch (result.status) {
        case 'set':
        case 'already_has_password':
          reset();
          onSuccess();
          onClose();
          return;
        case 'requires_recent_login':
          setErrorMessage('Por segurança, saia e entre novamente para definir uma senha.');
          return;
        case 'error':
          setErrorMessage('Não foi possível definir sua senha agora. Tente novamente em instantes.');
          return;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = password.length > 0 && confirmPassword.length > 0 && !isSubmitting;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Definir uma senha</Text>
          <Text style={styles.subtitle}>Hoje você entra pelo Strava ou por link no e-mail. Isso não substitui esse acesso.</Text>

          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setErrorMessage(null);
            }}
            placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            autoComplete="password-new"
            style={styles.input}
            testID="set-password-input"
          />
          <TextInput
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setErrorMessage(null);
            }}
            placeholder="Confirme a senha"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            autoComplete="password-new"
            style={styles.input}
            testID="set-password-confirm-input"
          />

          {errorMessage ? (
            <Text style={styles.errorMessage} accessibilityLiveRegion="polite">
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            accessibilityRole="button"
            testID="set-password-submit"
          >
            <Text style={styles.submitLabel}>Definir senha</Text>
          </Pressable>

          <Pressable onPress={handleClose} accessibilityRole="button" testID="set-password-cancel">
            <Text style={styles.cancelLabel}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(34,9,47,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.backgroundWhite,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  input: {
    height: 50,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  errorMessage: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.orange,
  },
  submitButton: {
    height: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.textPrimary,
  },
  cancelLabel: {
    textAlign: 'center',
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
