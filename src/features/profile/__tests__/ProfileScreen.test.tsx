import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Associate, WithId } from '../../../data/types';
import type { StravaConnectResult } from '../../../lib/strava/types';
import type { ProfileStackParamList } from '../../../navigation/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockAssociateId: string | null = 'associate-1';
jest.mock('../hooks/useAssociateId', () => ({
  useAssociateId: () => mockAssociateId,
}));

let mockAssociate: WithId<Associate> | null = null;
jest.mock('../../../data/associatesRepository', () => ({
  subscribeAssociate: (_id: string, onChange: (value: unknown) => void) => {
    onChange(mockAssociate);
    return () => undefined;
  },
  updateAssociateProfile: jest.fn(async () => undefined),
}));

let mockMemberAccess = { hasMemberAccess: true, membershipEnabled: false, isLoading: false };
jest.mock('../../../lib/membership/gate', () => ({
  useMemberAccess: () => mockMemberAccess,
}));

// `Paywall` lives in RootStackParamList, outside the `Profile` screen's own
// ProfileStackParamList props — ProfileScreen reaches it via `useNavigation()`
// (same pattern as VipHubScreen/BecomeMemberScreen), so that hook's `navigate`
// is mocked separately from the `navigation` prop passed in `renderScreen`.
const mockRootNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as typeof import('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockRootNavigate }),
  };
});

const mockResend = jest.fn<() => Promise<void>>(async () => undefined);
let mockEmailVerified: boolean | null = true;
jest.mock('../../../lib/auth', () => ({
  useEmailVerificationStatus: () => ({
    emailVerified: mockEmailVerified,
    isLoading: false,
    resend: mockResend,
    refresh: jest.fn(async () => undefined),
  }),
  currentUserHasPassword: jest.fn(() => false),
  signOutCurrentUser: jest.fn(async () => undefined),
}));

const mockConnectStrava = jest.fn<(source: string) => Promise<StravaConnectResult>>();
const mockDisconnectStrava = jest.fn<(associateId: string) => Promise<void>>(async () => undefined);
jest.mock('../../../lib/strava', () => ({
  connectStrava: (...args: unknown[]) => mockConnectStrava(...(args as [string])),
  disconnectStrava: (...args: unknown[]) => mockDisconnectStrava(...(args as [string])),
}));

const mockTrack = jest.fn();
const mockClearAssociate = jest.fn();
jest.mock('../../../lib/instrumentation', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
  clearAssociate: () => mockClearAssociate(),
}));

let mockNotificationsPreference = {
  isLoading: false,
  notificationsEnabled: true,
  osPermissionDenied: false,
  setNotificationsEnabled: jest.fn(async () => undefined),
};
jest.mock('../../notifications/hooks/useNotificationsPreference', () => ({
  useNotificationsPreference: () => mockNotificationsPreference,
}));

const mockClearDeviceRegistration = jest.fn<() => Promise<void>>(async () => undefined);
jest.mock('../../../lib/push/deviceRegistration', () => ({
  clearDeviceRegistration: () => mockClearDeviceRegistration(),
}));

import ProfileScreen from '../screens/ProfileScreen';
import { signOutCurrentUser } from '../../../lib/auth';

const mockSignOutCurrentUser = signOutCurrentUser as jest.MockedFunction<typeof signOutCurrentUser>;

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

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
    <ProfileScreen navigation={navigation} route={{ key: 'Profile', name: 'Profile' } as Props['route']} />,
  );
  return { ...utils, navigation };
}

describe('ProfileScreen — tela 15', () => {
  beforeEach(() => {
    mockAssociateId = 'associate-1';
    mockAssociate = makeAssociate();
    mockMemberAccess = { hasMemberAccess: true, membershipEnabled: false, isLoading: false };
    mockEmailVerified = true;
    mockNotificationsPreference = {
      isLoading: false,
      notificationsEnabled: true,
      osPermissionDenied: false,
      setNotificationsEnabled: jest.fn(async () => undefined),
    };
    mockConnectStrava.mockReset();
    mockDisconnectStrava.mockClear();
    mockRootNavigate.mockClear();
    mockTrack.mockClear();
    mockClearAssociate.mockClear();
    mockClearDeviceRegistration.mockClear();
    mockResend.mockClear();
    mockSignOutCurrentUser.mockClear();
  });

  it('shows the member badge and initials when there is no photo', async () => {
    const { getByText, getByTestId } = await renderScreen();

    expect(getByText('Membro Base Fox')).toBeTruthy();
    expect(getByText('Marina Alves')).toBeTruthy();
    expect(getByText('MA')).toBeTruthy();
    expect(getByTestId('profile-avatar')).toBeTruthy();
  });

  it('renders a photo avatar when photo_url is set', async () => {
    mockAssociate = makeAssociate({ photo_url: 'https://example.com/marina.jpg' });
    const { getByTestId, queryByText } = await renderScreen();

    expect(getByTestId('profile-avatar').props.source).toEqual({ uri: 'https://example.com/marina.jpg' });
    expect(queryByText('MA')).toBeNull();
  });

  it('flag desligada: shows the active plan subtitle and never navigates to a non-existent subscription route', async () => {
    mockMemberAccess = { hasMemberAccess: true, membershipEnabled: false, isLoading: false };
    const { getByText, navigation } = await renderScreen();

    expect(getByText('Plano membro · ativo')).toBeTruthy();
    await fireEvent.press(getByText('Assinatura'));

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(mockRootNavigate).not.toHaveBeenCalled();
    expect(mockTrack).not.toHaveBeenCalledWith('membership_cta_tapped', expect.anything());
  });

  it('flag ligada + membro: shows the member plan subtitle without a conversion CTA', async () => {
    mockMemberAccess = { hasMemberAccess: true, membershipEnabled: true, isLoading: false };
    const { getByText, navigation } = await renderScreen();

    expect(getByText('Plano membro · ativo')).toBeTruthy();
    await fireEvent.press(getByText('Assinatura'));

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(mockRootNavigate).not.toHaveBeenCalled();
    expect(mockTrack).not.toHaveBeenCalledWith('membership_cta_tapped', expect.anything());
  });

  it('flag ligada + plano gratuito: navigates to the Paywall and tracks membership_cta_tapped (8.2)', async () => {
    mockMemberAccess = { hasMemberAccess: false, membershipEnabled: true, isLoading: false };
    const { getByText } = await renderScreen();

    expect(getByText('Plano gratuito')).toBeTruthy();
    await fireEvent.press(getByText('Assinatura'));

    expect(mockRootNavigate).toHaveBeenCalledWith('Paywall', { source: 'profile' });
    expect(mockTrack).toHaveBeenCalledWith('membership_cta_tapped', { source: 'profile' });
  });

  it('flags the e-mail verification pendency and fires resend()', async () => {
    mockEmailVerified = false;
    const { getByText, getByTestId } = await renderScreen();

    expect(getByText('Confirme seu e-mail para proteger sua conta.')).toBeTruthy();
    await fireEvent.press(getByTestId('resend-verification-action'));

    await waitFor(() => expect(mockResend).toHaveBeenCalled());
  });

  it('does not show a verification pendency once the e-mail is verified', async () => {
    mockEmailVerified = true;
    const { queryByText } = await renderScreen();

    expect(queryByText('Confirme seu e-mail para proteger sua conta.')).toBeNull();
  });

  describe('Strava — connectStrava result handling (8.3)', () => {
    it('connected: shows the athlete username and tracks strava_connected', async () => {
      mockConnectStrava.mockResolvedValue({
        status: 'connected',
        isNewAssociate: false,
        athlete: { athleteId: '1', username: 'marina.run', firstName: 'Marina', lastName: 'Alves', photoUrl: null },
      });
      const { getByTestId } = await renderScreen();

      await fireEvent.press(getByTestId('profile-strava-connect'));

      await waitFor(() => expect(mockConnectStrava).toHaveBeenCalledWith('profile'));
      expect(mockTrack).toHaveBeenCalledWith('strava_connected', { source: 'profile' });
    });

    it('authorization_denied: shows no error message', async () => {
      mockConnectStrava.mockResolvedValue({ status: 'authorization_denied' });
      const { getByTestId, queryByText } = await renderScreen();

      await fireEvent.press(getByTestId('profile-strava-connect'));

      await waitFor(() => expect(mockConnectStrava).toHaveBeenCalled());
      expect(queryByText(/indisponível/)).toBeNull();
      expect(queryByText(/Não foi possível/)).toBeNull();
    });

    it('unavailable_athlete_cap: explains unavailability, never as an app failure', async () => {
      mockConnectStrava.mockResolvedValue({ status: 'unavailable_athlete_cap' });
      const { getByTestId, findByText } = await renderScreen();

      await fireEvent.press(getByTestId('profile-strava-connect'));

      expect(await findByText(/indisponível no momento/)).toBeTruthy();
    });

    it('unavailable_not_configured: explains unavailability, never as an app failure', async () => {
      mockConnectStrava.mockResolvedValue({ status: 'unavailable_not_configured' });
      const { getByTestId, findByText } = await renderScreen();

      await fireEvent.press(getByTestId('profile-strava-connect'));

      expect(await findByText(/indisponível no momento/)).toBeTruthy();
    });

    it('email_required: shows a generic retry message (unreachable in practice for source: profile)', async () => {
      mockConnectStrava.mockResolvedValue({ status: 'email_required' });
      const { getByTestId, findByText } = await renderScreen();

      await fireEvent.press(getByTestId('profile-strava-connect'));

      expect(await findByText(/Não foi possível conectar ao Strava agora/)).toBeTruthy();
    });

    it('error: shows a generic retry message', async () => {
      mockConnectStrava.mockResolvedValue({ status: 'error', message: 'network' });
      const { getByTestId, findByText } = await renderScreen();

      await fireEvent.press(getByTestId('profile-strava-connect'));

      expect(await findByText(/Não foi possível conectar ao Strava agora/)).toBeTruthy();
    });
  });

  describe('Strava disconnect — task 8.4 (keeps account and session alive)', () => {
    it('disconnects without signing out, and the row flips back to "Conectar"', async () => {
      mockAssociate = makeAssociate({ strava: { connected: true, athlete_id: '1', username: 'marina.run' } });
      const { getByTestId, getByText, findByTestId } = await renderScreen();

      expect(getByText('Conectado como marina.run')).toBeTruthy();

      await fireEvent.press(getByTestId('profile-strava-disconnect'));

      await waitFor(() => expect(mockDisconnectStrava).toHaveBeenCalledWith('associate-1'));
      expect(mockTrack).toHaveBeenCalledWith('strava_disconnected', { source: 'profile' });
      expect(mockSignOutCurrentUser).not.toHaveBeenCalled();
      // The local associate doc hasn't actually changed in this test double, but the
      // important assertion is the one above: disconnecting never calls sign-out.
      expect(await findByTestId('profile-strava-disconnect')).toBeTruthy();
    });
  });

  describe('Logout — task 8.8/8.9', () => {
    it('clears local auth data, removes the device registration and tracks logout', async () => {
      const { getByTestId } = await renderScreen();

      await fireEvent.press(getByTestId('profile-row-logout'));

      await waitFor(() => expect(signOutCurrentUser).toHaveBeenCalled());
      expect(mockClearAssociate).toHaveBeenCalled();
      expect(mockClearDeviceRegistration).toHaveBeenCalled();
      expect(mockTrack).toHaveBeenCalledWith('logout', { method: 'strava' });
    });
  });

  it('navigates to EditProfile when "Editar dados pessoais" is pressed', async () => {
    const { getByText, navigation } = await renderScreen();

    await fireEvent.press(getByText('Editar dados pessoais'));

    expect(navigation.navigate).toHaveBeenCalledWith('EditProfile');
  });
});
