import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../../../theme';

/** "Marina Alves" → "MA", "Marina" → "M" — mirrors the mockup's avatar fallback (tela 15/16). */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export interface AvatarProps {
  name: string;
  photoUrl: string | null;
  size?: number;
  testID?: string;
}

/** Round avatar — photo when available, initials otherwise (task 8.1/8.7). */
export function Avatar({ name, photoUrl, size = 72, testID }: AvatarProps): React.JSX.Element {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[styles.image, dimensionStyle]}
        accessibilityLabel="Foto do perfil"
        testID={testID}
      />
    );
  }

  return (
    <View style={[styles.fallback, dimensionStyle]} testID={testID}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 3,
    borderColor: colors.orange,
  },
  fallback: {
    backgroundColor: colors.backgroundTint,
    borderWidth: 3,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fontFamily.sairaExtraBold,
    color: colors.purple,
  },
});
