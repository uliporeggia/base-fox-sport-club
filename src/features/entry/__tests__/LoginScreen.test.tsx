import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { LogInResult, SendLoginLinkResult } from '../../../lib/auth/types';
import type { StravaConnectResult, StravaConnectSource } from '../../../lib/strava/types';

const mockLogInWithEmail = jest.fn<(input: { email: string; password: string }) => Promise<LogInResult>>();
const mockSendLoginLink = jest.fn<(email: string) => Promise<SendLoginLinkResult>>();
jest.mock('../../../lib/auth', () => ({
  logInWithEmail: (...args: unknown[]) => mockLogInWithEmail(...(args as Parameters<typeof mockLogInWithEmail>)),
  sendLoginLink: (...args: unknown[]) => mockSendLoginLink(...(args as Parameters<typeof mockSendLoginLink>)),
  useEmailLinkSignIn: () => ({ result: null, retryWithEmail: jest.fn(), reset: jest.fn() }),
}));

const mockConnectStrava = jest.fn<
  (source: StravaConnectSource, options?: { email?: string }) => Promise<StravaConnectResult>
>();
jest.mock('../../../lib/strava', () => ({
  connectStrava: (...args: unknown[]) => mockConnectStrava(...(args as Parameters<typeof mockConnectStrava>)),
}));

import LoginScreen from '../screens/LoginScreen';
import type { EntryStackParamList } from '../../../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<EntryStackParamList, 'Login'>;

async function renderScreen() {
  const navigation = { navigate: jest.fn(), replace: jest.fn() } as unknown as Props['navigation'];
  const utils = await render(
    <LoginScreen navigation={navigation} route={{ key: 'Login', name: 'Login' } as Props['route']} />,
  );
  return { ...utils, navigation };
}

describe('LoginScreen — task 4.5', () => {
  beforeEach(() => {
    mockLogInWithEmail.mockReset();
    mockConnectStrava.mockReset();
    mockSendLoginLink.mockReset();
  });

  it('keeps "Entrar" disabled until both e-mail and senha are filled', async () => {
    const { getByTestId } = await renderScreen();
    expect(getByTestId('login-submit-button').props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(getByTestId('login-email-input'), 'marina@example.com');
    expect(getByTestId('login-submit-button').props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(getByTestId('login-password-input'), 'whatever');
    expect(getByTestId('login-submit-button').props.accessibilityState.disabled).toBe(false);
  });

  it('shows a generic invalid-credentials message that does not reveal which field is wrong', async () => {
    mockLogInWithEmail.mockResolvedValue({ status: 'invalid_credentials' });
    const { getByTestId, findByText, queryByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('login-email-input'), 'marina@example.com');
    await fireEvent.changeText(getByTestId('login-password-input'), 'wrong-password');
    await fireEvent.press(getByTestId('login-submit-button'));

    const message = await findByText('E-mail ou senha incorretos.');
    expect(message).toBeTruthy();
    // Never a message that singles out one field as the culprit.
    expect(queryByText(/e-mail não encontrado/i)).toBeNull();
    expect(queryByText(/senha incorreta$/i)).toBeNull();
  });

  it('offers the e-mail cadastro path when Strava hits the athlete cap', async () => {
    mockConnectStrava.mockResolvedValue({ status: 'unavailable_athlete_cap' });
    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.press(getByTestId('login-strava-button'));

    expect(
      await findByText('A conexão com o Strava está indisponível no momento. Use o link por e-mail abaixo para entrar.'),
    ).toBeTruthy();
  });

  it('offers the e-mail cadastro path when Strava is not configured', async () => {
    mockConnectStrava.mockResolvedValue({ status: 'unavailable_not_configured' });
    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.press(getByTestId('login-strava-button'));

    expect(
      await findByText('A conexão com o Strava está indisponível no momento. Use o link por e-mail abaixo para entrar.'),
    ).toBeTruthy();
  });
});
