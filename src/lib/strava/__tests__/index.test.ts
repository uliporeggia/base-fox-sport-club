import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { StravaAuthorizationResult } from '../oauth';
import type { ExchangeRequestBody, ExchangeResponseBody } from '../callStravaExchange';
import type { Associate } from '../../../data/types';

const mockRequestStravaAuthorization = jest.fn<(clientId: string) => Promise<StravaAuthorizationResult>>();
jest.mock('../oauth', () => ({
  requestStravaAuthorization: (...args: unknown[]) =>
    mockRequestStravaAuthorization(...(args as Parameters<typeof mockRequestStravaAuthorization>)),
}));

const mockInvokeStravaExchange = jest.fn<(body: ExchangeRequestBody) => Promise<ExchangeResponseBody>>();
jest.mock('../callStravaExchange', () => ({
  invokeStravaExchange: (...args: unknown[]) =>
    mockInvokeStravaExchange(...(args as Parameters<typeof mockInvokeStravaExchange>)),
}));

const mockGetStravaClientId = jest.fn<() => Promise<string>>(async () => 'client-123');
jest.mock('../../../data/configRepository', () => ({
  getStravaClientId: (...args: unknown[]) =>
    mockGetStravaClientId(...(args as Parameters<typeof mockGetStravaClientId>)),
}));

const mockUpdateStravaConnection = jest.fn<
  (associateId: string, strava: Associate['strava']) => Promise<void>
>(async () => undefined);
jest.mock('../../../data/associatesRepository', () => ({
  updateStravaConnection: (...args: unknown[]) =>
    mockUpdateStravaConnection(...(args as Parameters<typeof mockUpdateStravaConnection>)),
}));

const mockSignInWithCustomToken = jest.fn<(auth: unknown, token: string) => Promise<void>>(async () => undefined);
const mockSendEmailVerification = jest.fn<(user: unknown) => Promise<void>>(async () => undefined);
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'mock-uid' } })),
  signInWithCustomToken: (...args: unknown[]) =>
    mockSignInWithCustomToken(...(args as Parameters<typeof mockSignInWithCustomToken>)),
  sendEmailVerification: (...args: unknown[]) =>
    mockSendEmailVerification(...(args as Parameters<typeof mockSendEmailVerification>)),
}));

import { connectStrava, disconnectStrava } from '../index';

describe('connectStrava — tasks 4.4/4.4a/4.4b', () => {
  beforeEach(() => {
    mockRequestStravaAuthorization.mockReset();
    mockInvokeStravaExchange.mockReset();
    mockGetStravaClientId.mockReset();
    mockGetStravaClientId.mockResolvedValue('client-123');
    mockSignInWithCustomToken.mockClear();
    mockSendEmailVerification.mockClear();
  });

  it('never opens the Strava browser for sign_up without an e-mail (4.4b)', async () => {
    const result = await connectStrava('sign_up');

    expect(result).toEqual({ status: 'email_required' });
    expect(mockRequestStravaAuthorization).not.toHaveBeenCalled();
  });

  it('returns authorization_denied without touching the server when the visitor denies/cancels', async () => {
    mockRequestStravaAuthorization.mockResolvedValue({ outcome: 'denied' });

    const result = await connectStrava('sign_up', { email: 'marina@example.com' });

    expect(result).toEqual({ status: 'authorization_denied' });
    expect(mockInvokeStravaExchange).not.toHaveBeenCalled();
  });

  it('returns unavailable_not_configured when client_id is not configured (4.4a)', async () => {
    mockGetStravaClientId.mockResolvedValue('');

    const result = await connectStrava('sign_up', { email: 'marina@example.com' });

    expect(result).toEqual({ status: 'unavailable_not_configured' });
    expect(mockRequestStravaAuthorization).not.toHaveBeenCalled();
  });

  it('degrades to unavailable_athlete_cap when the backend reports the athlete cap was reached (4.4a)', async () => {
    mockRequestStravaAuthorization.mockResolvedValue({ outcome: 'code', code: 'auth-code' });
    mockInvokeStravaExchange.mockResolvedValue({ status: 'unavailable_athlete_cap' });

    const result = await connectStrava('sign_up', { email: 'marina@example.com' });

    expect(result).toEqual({ status: 'unavailable_athlete_cap' });
  });

  it('signs the associate in via custom token on a reconciled or new account', async () => {
    mockRequestStravaAuthorization.mockResolvedValue({ outcome: 'code', code: 'auth-code' });
    mockInvokeStravaExchange.mockResolvedValue({
      status: 'signed_in',
      isNewAssociate: false,
      customToken: 'token-abc',
      athlete: { id: '42', username: 'marina', firstname: 'Marina', lastname: 'Alves', photo: null },
    });

    const result = await connectStrava('login');

    expect(mockSignInWithCustomToken).toHaveBeenCalledWith(expect.anything(), 'token-abc');
    expect(result).toEqual({
      status: 'connected',
      isNewAssociate: false,
      athlete: { athleteId: '42', username: 'marina', firstName: 'Marina', lastName: 'Alves', photoUrl: null },
    });
    // Reconciled into an existing associate — no fresh verification e-mail needed.
    expect(mockSendEmailVerification).not.toHaveBeenCalled();
  });

  it('sends the verification e-mail for a brand-new associate (4.4d applies to the Strava path too)', async () => {
    mockRequestStravaAuthorization.mockResolvedValue({ outcome: 'code', code: 'auth-code' });
    mockInvokeStravaExchange.mockResolvedValue({
      status: 'signed_in',
      isNewAssociate: true,
      customToken: 'token-xyz',
      athlete: { id: '99', username: 'nova', firstname: 'Nova', lastname: 'Atleta', photo: null },
    });

    await connectStrava('sign_up', { email: 'nova@example.com' });

    expect(mockSendEmailVerification).toHaveBeenCalled();
  });
});

describe('disconnectStrava — strava-connection spec', () => {
  beforeEach(() => {
    mockSignInWithCustomToken.mockClear();
  });

  it('clears the vínculo without touching the Firebase Auth session', async () => {
    await disconnectStrava('associate-1');

    expect(mockUpdateStravaConnection).toHaveBeenCalledWith('associate-1', {
      connected: false,
      athlete_id: null,
      username: null,
    });
    expect(mockSignInWithCustomToken).not.toHaveBeenCalled();
  });
});
