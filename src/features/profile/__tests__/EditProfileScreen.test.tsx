import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Associate, WithId } from '../../../data/types';
import type { SetPasswordResult } from '../../../lib/auth/types';
import type { ProfileStackParamList } from '../../../navigation/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockAssociateId: string | null = 'associate-1';
jest.mock('../hooks/useAssociateId', () => ({
  useAssociateId: () => mockAssociateId,
}));

let mockAssociate: WithId<Associate> | null = null;
const mockUpdateAssociateProfile = jest.fn<
  (associateId: string, updates: Partial<Pick<Associate, 'name' | 'photo_url'>>) => Promise<void>
>(async () => undefined);
jest.mock('../../../data/associatesRepository', () => ({
  subscribeAssociate: (_id: string, onChange: (value: unknown) => void) => {
    onChange(mockAssociate);
    return () => undefined;
  },
  updateAssociateProfile: (...args: unknown[]) =>
    mockUpdateAssociateProfile(...(args as Parameters<typeof mockUpdateAssociateProfile>)),
}));

let mockHasPassword = false;
const mockSetPasswordForCurrentUser = jest.fn<(password: string) => Promise<SetPasswordResult>>();
jest.mock('../../../lib/auth', () => ({
  currentUserHasPassword: () => mockHasPassword,
  setPasswordForCurrentUser: (...args: unknown[]) =>
    mockSetPasswordForCurrentUser(...(args as Parameters<typeof mockSetPasswordForCurrentUser>)),
}));

const mockRequestMediaLibraryPermissionsAsync = jest.fn(async () => ({ granted: true, status: 'granted' }));
const mockLaunchImageLibraryAsync = jest.fn(async () => ({
  canceled: false,
  assets: [{ uri: 'file:///chosen-photo.jpg' }],
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestMediaLibraryPermissionsAsync(),
  launchImageLibraryAsync: () => mockLaunchImageLibraryAsync(),
}));

import EditProfileScreen from '../screens/EditProfileScreen';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

function makeAssociate(overrides: Partial<Associate> = {}): WithId<Associate> {
  return {
    id: 'associate-1',
    name: 'Marina Alves',
    email: 'marina.alves@email.com',
    photo_url: null,
    member_number: 428,
    joined_at: {} as Associate['joined_at'],
    membership: { status: 'free', source: null, started_at: null },
    strava: { connected: false, athlete_id: null, username: null },
    ...overrides,
  };
}

async function renderScreen() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() } as unknown as Props['navigation'];
  const utils = await render(
    <EditProfileScreen
      navigation={navigation}
      route={{ key: 'EditProfile', name: 'EditProfile' } as Props['route']}
    />,
  );
  return { ...utils, navigation };
}

describe('EditProfileScreen — tela 16', () => {
  beforeEach(() => {
    mockAssociateId = 'associate-1';
    mockAssociate = makeAssociate();
    mockHasPassword = false;
    mockUpdateAssociateProfile.mockClear();
    mockSetPasswordForCurrentUser.mockReset();
    mockRequestMediaLibraryPermissionsAsync.mockClear();
    mockLaunchImageLibraryAsync.mockClear();
  });

  it('seeds the name field from the associate and never shows e-mail/password fields for editing', async () => {
    const { getByTestId, queryByPlaceholderText } = await renderScreen();

    expect(getByTestId('edit-profile-name-input').props.value).toBe('Marina Alves');
    // E-mail is shown read-only via a ListRow, never as an editable TextInput.
    expect(queryByPlaceholderText('seu@email.com')).toBeNull();
  });

  it('blocks saving an empty name', async () => {
    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('edit-profile-name-input'), '   ');
    await fireEvent.press(getByTestId('edit-profile-save-button'));

    expect(await findByText('O nome não pode ficar em branco.')).toBeTruthy();
    expect(mockUpdateAssociateProfile).not.toHaveBeenCalled();
  });

  it('saves the trimmed name and photo through associatesRepository', async () => {
    const { getByTestId } = await renderScreen();

    await fireEvent.changeText(getByTestId('edit-profile-name-input'), '  Marina A. Silva  ');
    await fireEvent.press(getByTestId('edit-profile-save-button'));

    await waitFor(() =>
      expect(mockUpdateAssociateProfile).toHaveBeenCalledWith('associate-1', {
        name: 'Marina A. Silva',
        photo_url: null,
      }),
    );
  });

  it('picks a new photo through expo-image-picker and includes it on save', async () => {
    const { getByTestId } = await renderScreen();

    await fireEvent.press(getByTestId('edit-profile-change-photo'));

    await waitFor(() => expect(mockLaunchImageLibraryAsync).toHaveBeenCalled());
    await fireEvent.press(getByTestId('edit-profile-save-button'));

    await waitFor(() =>
      expect(mockUpdateAssociateProfile).toHaveBeenCalledWith('associate-1', {
        name: 'Marina Alves',
        photo_url: 'file:///chosen-photo.jpg',
      }),
    );
  });

  describe('password row — two states (8.7a)', () => {
    it('offers "Definir uma senha" for an associate without one', async () => {
      mockHasPassword = false;
      const { getByText } = await renderScreen();

      expect(getByText('Definir uma senha')).toBeTruthy();
    });

    it('shows "Alterar senha" locked for an associate who already has a password, with no way to open the modal', async () => {
      mockHasPassword = true;
      const { getByText, queryByTestId } = await renderScreen();

      expect(getByText('Alterar senha')).toBeTruthy();
      // Locked state renders a plain row — not a Pressable — so there is no
      // tappable element to open the "definir senha" modal.
      expect(queryByTestId('edit-profile-password-row')).toBeNull();
    });

    it('opens the modal, sets the password and flips the row to locked', async () => {
      mockSetPasswordForCurrentUser.mockResolvedValue({ status: 'set' });
      const { getByTestId, getByText, queryByText } = await renderScreen();

      await fireEvent.press(getByTestId('edit-profile-password-row'));
      await fireEvent.changeText(getByTestId('set-password-input'), 'umaSenhaForte1');
      await fireEvent.changeText(getByTestId('set-password-confirm-input'), 'umaSenhaForte1');
      await fireEvent.press(getByTestId('set-password-submit'));

      await waitFor(() => expect(mockSetPasswordForCurrentUser).toHaveBeenCalledWith('umaSenhaForte1'));
      expect(await getByText('Alterar senha')).toBeTruthy();
      expect(queryByText('Definir uma senha')).toBeNull();
    });

    it('shows an honest message instead of a silent failure on requires-recent-login', async () => {
      mockSetPasswordForCurrentUser.mockResolvedValue({ status: 'requires_recent_login' });
      const { getByTestId, findByText } = await renderScreen();

      await fireEvent.press(getByTestId('edit-profile-password-row'));
      await fireEvent.changeText(getByTestId('set-password-input'), 'umaSenhaForte1');
      await fireEvent.changeText(getByTestId('set-password-confirm-input'), 'umaSenhaForte1');
      await fireEvent.press(getByTestId('set-password-submit'));

      expect(await findByText('Por segurança, saia e entre novamente para definir uma senha.')).toBeTruthy();
    });
  });
});
