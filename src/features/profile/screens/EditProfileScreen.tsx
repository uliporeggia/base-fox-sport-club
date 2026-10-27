import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import { currentUserHasPassword } from '../../../lib/auth';
import { updateAssociateProfile } from '../../../data/associatesRepository';
import type { ProfileStackParamList } from '../../../navigation/types';
import { useAssociateId } from '../hooks/useAssociateId';
import { useAssociate } from '../hooks/useAssociate';
import { Avatar } from '../components/Avatar';
import { ListRow, SectionCard, SectionLabel } from '../components/ListRow';
import { BackIcon, CameraIcon, ChevronIcon, LockIcon } from '../components/icons';
import { SetPasswordModal } from '../components/SetPasswordModal';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

/**
 * Tela 16 — "Seus dados" (editar nome e foto; e-mail travado; linha de
 * senha com dois estados) — tasks 8.7/8.7a. Fonte de verdade:
 * design/Base Fox - Tela 16 Editar dados.dc.html (fora do mockup original;
 * a tela não se chama "Editar dados pessoais" — esse é só o rótulo do item
 * no Perfil que leva até aqui).
 */
export default function EditProfileScreen({ navigation }: Props): React.JSX.Element {
  const associateId = useAssociateId();
  const { associate, isLoading } = useAssociate(associateId);

  // Seeded from `associate` once it loads — a direct setState call during
  // render, guarded by comparing against the previously-seeded id, is
  // React's own recommended pattern for "adjust state when a prop/value
  // becomes available" (https://react.dev/learn/you-might-not-need-an-effect),
  // and avoids needing an effect (and the extra render it would cost) for
  // what is otherwise a one-time initialization.
  const [seededAssociateId, setSeededAssociateId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  if (associate && associate.id !== seededAssociateId) {
    setSeededAssociateId(associate.id);
    setName(associate.name);
    setPhotoUri(associate.photo_url);
  }

  const [nameError, setNameError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Lazy initializer — a one-time, synchronous read of the current
  // Firebase Auth user, not an external subscription, so it belongs in
  // the initial state computation rather than in an effect.
  const [hasPassword, setHasPassword] = useState(() => currentUserHasPassword());
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const handleChangePhoto = async (): Promise<void> => {
    setPhotoError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError('Permita o acesso às fotos para trocar sua imagem.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = (): void => {
    setPhotoUri(null);
  };

  const handleSave = async (): Promise<void> => {
    if (!associateId) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('O nome não pode ficar em branco.');
      return;
    }
    setNameError(null);
    setSaveError(null);
    setIsSaving(true);
    try {
      await updateAssociateProfile(associateId, { name: trimmedName, photo_url: photoUri });
      navigation.goBack();
    } catch {
      setSaveError('Não foi possível salvar agora. Tente novamente em instantes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!associateId || isLoading || !associate) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingLabel}>Carregando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <BackIcon />
        </Pressable>

        <Text style={styles.title}>Seus dados</Text>

        <SectionLabel>Foto</SectionLabel>
        <View style={styles.photoCard}>
          <Avatar name={name || associate.name} photoUrl={photoUri} size={72} testID="edit-profile-avatar" />
          <View style={styles.photoActions}>
            <Pressable onPress={handleChangePhoto} style={styles.changePhotoButton} accessibilityRole="button" testID="edit-profile-change-photo">
              <CameraIcon />
              <Text style={styles.changePhotoLabel}>Alterar foto</Text>
            </Pressable>
            {photoUri ? (
              <Pressable onPress={handleRemovePhoto} accessibilityRole="button" testID="edit-profile-remove-photo">
                <Text style={styles.removePhotoLabel}>Remover foto</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}

        <SectionLabel>Nome</SectionLabel>
        <TextInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            setNameError(null);
          }}
          placeholder="Seu nome"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          autoComplete="name"
          style={styles.nameInput}
          testID="edit-profile-name-input"
        />
        <Text style={styles.helperText}>
          Aparece na sua saudação, no Perfil e no seu acesso ao espaço VIP.
        </Text>
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <SectionLabel>Acesso</SectionLabel>
        <SectionCard>
          <ListRow
            icon={<LockIcon color={colors.textSecondary} />}
            iconBackground={colors.backgroundTint}
            title="E-mail"
            titleColor={colors.textSecondary}
            subtitle={associate.email}
            bordered
          />
          <ListRow
            icon={<LockIcon color={hasPassword ? colors.textSecondary : colors.purple} />}
            iconBackground={colors.backgroundTint}
            title={hasPassword ? 'Alterar senha' : 'Definir uma senha'}
            titleColor={hasPassword ? '#B3A0C4' : undefined}
            subtitle={hasPassword ? undefined : 'Hoje você entra pelo Strava ou por link no e-mail'}
            right={hasPassword ? undefined : <ChevronIcon />}
            onPress={hasPassword ? undefined : () => setIsPasswordModalVisible(true)}
            disabled={hasPassword}
            testID="edit-profile-password-row"
          />
        </SectionCard>
        <Text style={styles.footerHint}>
          O e-mail não pode ser alterado nesta versão. Definir senha é opcional — ela não substitui o login por link.
        </Text>

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

        <Pressable
          onPress={isSaving ? undefined : handleSave}
          disabled={isSaving}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          accessibilityRole="button"
          testID="edit-profile-save-button"
        >
          <Text style={styles.saveLabel}>Salvar alterações</Text>
        </Pressable>
      </ScrollView>

      <SetPasswordModal
        visible={isPasswordModalVisible}
        onClose={() => setIsPasswordModalVisible(false)}
        onSuccess={() => setHasPassword(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingLabel: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: spacing.xxl,
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundWhite,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.hero,
    textTransform: 'uppercase',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  photoCard: {
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundWhite,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  photoActions: {
    flex: 1,
    gap: spacing.sm,
  },
  changePhotoButton: {
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundTint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  changePhotoLabel: {
    fontFamily: fontFamily.barlowBold,
    fontSize: fontSize.md,
    color: colors.purple,
  },
  removePhotoLabel: {
    textAlign: 'center',
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  nameInput: {
    height: 50,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.purple,
    backgroundColor: colors.backgroundWhite,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  helperText: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  footerHint: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.orange,
  },
  saveButton: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.textPrimary,
  },
});
