import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps, type TextInputInstance } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  errorMessage?: string | null;
}

/**
 * Labeled input reused by the cadastro (02) and login screens — mockup's
 * "Nome"/"E-mail"/"Senha" fields: 50px tall, 12px radius, 1.5px roxo border
 * when focused and 1px #DCD3E3 otherwise.
 */
export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, errorMessage, style, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          { borderColor: isFocused ? colors.purple : colors.border, borderWidth: isFocused ? 1.5 : 1 },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        cursorColor={colors.purple}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        {...inputProps}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.base,
    color: colors.textTertiary,
  },
  input: {
    height: 50,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundWhite,
  },
  error: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.orange,
  },
});
