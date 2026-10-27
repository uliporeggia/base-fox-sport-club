import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { SignUpResult } from '../../../lib/auth/types';
import type { StravaConnectResult, StravaConnectSource } from '../../../lib/strava/types';

jest.mock('../../../lib/membership/gate', () => ({
  useMemberAccess: () => ({ membershipEnabled: false, hasMemberAccess: true, isLoading: false }),
}));

const mockSignUpWithEmail = jest.fn<(input: { name: string; email: string; password: string }) => Promise<SignUpResult>>();
jest.mock('../../../lib/auth', () => ({
  signUpWithEmail: (...args: unknown[]) => mockSignUpWithEmail(...(args as Parameters<typeof mockSignUpWithEmail>)),
}));

const mockConnectStrava = jest.fn<
  (source: StravaConnectSource, options?: { email?: string }) => Promise<StravaConnectResult>
>();
jest.mock('../../../lib/strava', () => ({
  connectStrava: (...args: unknown[]) => mockConnectStrava(...(args as Parameters<typeof mockConnectStrava>)),
}));

import SignUpScreen from '../screens/SignUpScreen';
import type { EntryStackParamList } from '../../../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<EntryStackParamList, 'SignUp'>;

async function renderScreen() {
  const navigation = { navigate: jest.fn(), replace: jest.fn() } as unknown as Props['navigation'];
  const utils = await render(
    <SignUpScreen navigation={navigation} route={{ key: 'SignUp', name: 'SignUp' } as Props['route']} />,
  );
  return { ...utils, navigation };
}

describe('SignUpScreen — task 4.3', () => {
  beforeEach(() => {
    mockSignUpWithEmail.mockReset();
    mockConnectStrava.mockReset();
  });

  it('keeps "Criar conta" disabled while the password has fewer than 8 characters', async () => {
    const { getByTestId } = await renderScreen();

    await fireEvent.changeText(getByTestId('signup-name-input'), 'Marina Alves');
    await fireEvent.changeText(getByTestId('signup-email-input'), 'marina@example.com');
    await fireEvent.changeText(getByTestId('signup-password-input'), '1234567');

    await fireEvent.press(getByTestId('signup-submit-button'));

    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it('submits once name, e-mail and an 8+ character password are valid', async () => {
    mockSignUpWithEmail.mockResolvedValue({ status: 'created' });
    const { getByTestId } = await renderScreen();

    await fireEvent.changeText(getByTestId('signup-name-input'), 'Marina Alves');
    await fireEvent.changeText(getByTestId('signup-email-input'), 'marina@example.com');
    await fireEvent.changeText(getByTestId('signup-password-input'), '12345678');
    await fireEvent.press(getByTestId('signup-submit-button'));

    await waitFor(() =>
      expect(mockSignUpWithEmail).toHaveBeenCalledWith({
        name: 'Marina Alves',
        email: 'marina@example.com',
        password: '12345678',
      }),
    );
  });

  it('offers to log in instead when the e-mail is already registered', async () => {
    mockSignUpWithEmail.mockResolvedValue({ status: 'email_in_use' });
    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('signup-name-input'), 'Marina Alves');
    await fireEvent.changeText(getByTestId('signup-email-input'), 'marina@example.com');
    await fireEvent.changeText(getByTestId('signup-password-input'), '12345678');
    await fireEvent.press(getByTestId('signup-submit-button'));

    expect(await findByText('Esse e-mail já tem uma conta no Base Fox.')).toBeTruthy();
    expect(await findByText('Entrar na conta existente')).toBeTruthy();
  });

  it('degrades gracefully when Strava refuses for the athlete cap, keeping e-mail cadastro available', async () => {
    mockConnectStrava.mockResolvedValue({ status: 'unavailable_athlete_cap' });
    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('signup-email-input'), 'marina@example.com');
    await fireEvent.press(getByTestId('signup-strava-button'));

    expect(
      await findByText(
        'A conexão com o Strava está indisponível no momento. Você ainda pode criar sua conta com nome, e-mail e senha abaixo.',
      ),
    ).toBeTruthy();

    // The e-mail path must remain fully usable — never gated by the Strava outage.
    await fireEvent.changeText(getByTestId('signup-name-input'), 'Marina Alves');
    await fireEvent.changeText(getByTestId('signup-password-input'), '12345678');
    expect(getByTestId('signup-submit-button').props.accessibilityState.disabled).toBe(false);
  });

  it('degrades gracefully when Strava is not configured, keeping e-mail cadastro available', async () => {
    mockConnectStrava.mockResolvedValue({ status: 'unavailable_not_configured' });
    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('signup-email-input'), 'marina@example.com');
    await fireEvent.press(getByTestId('signup-strava-button'));

    expect(
      await findByText(
        'A conexão com o Strava está indisponível no momento. Você ainda pode criar sua conta com nome, e-mail e senha abaixo.',
      ),
    ).toBeTruthy();

    // The e-mail path must remain fully usable — never gated by the Strava outage.
    await fireEvent.changeText(getByTestId('signup-name-input'), 'Marina Alves');
    await fireEvent.changeText(getByTestId('signup-password-input'), '12345678');
    expect(getByTestId('signup-submit-button').props.accessibilityState.disabled).toBe(false);
  });

  it('requires a valid e-mail before opening the Strava authorization screen', async () => {
    const { getByTestId } = await renderScreen();

    await fireEvent.press(getByTestId('signup-strava-button'));

    expect(mockConnectStrava).not.toHaveBeenCalled();
  });
});
