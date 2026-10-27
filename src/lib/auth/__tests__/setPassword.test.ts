import { jest, describe, it, expect, beforeEach } from '@jest/globals';

type CredentialLike = { __kind: 'email_credential'; email: string; password: string };

const mockLinkWithCredential = jest.fn<(user: unknown, credential: unknown) => Promise<unknown>>();
const mockCredential = jest.fn<(email: string, password: string) => CredentialLike>(
  (email, password) => ({ __kind: 'email_credential', email, password }),
);

let mockCurrentUser: { email: string | null; providerData: { providerId: string }[] } | null = null;

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({ get currentUser() { return mockCurrentUser; } })),
  EmailAuthProvider: {
    credential: (...args: unknown[]) => mockCredential(...(args as [string, string])),
  },
  linkWithCredential: (...args: unknown[]) =>
    mockLinkWithCredential(...(args as Parameters<typeof mockLinkWithCredential>)),
}));

import { setPasswordForCurrentUser, currentUserHasPassword } from '../setPassword';

describe('setPasswordForCurrentUser — task 8.7a', () => {
  beforeEach(() => {
    mockLinkWithCredential.mockReset();
    mockCredential.mockClear();
    mockCurrentUser = { email: 'marina@example.com', providerData: [] };
  });

  it('links a password credential to the current Strava-only account', async () => {
    mockLinkWithCredential.mockResolvedValueOnce(undefined);

    const result = await setPasswordForCurrentUser('umaSenhaForte1');

    expect(result).toEqual({ status: 'set' });
    expect(mockCredential).toHaveBeenCalledWith('marina@example.com', 'umaSenhaForte1');
    expect(mockLinkWithCredential).toHaveBeenCalled();
  });

  it('maps requires-recent-login to an honest, non-crashing result', async () => {
    mockLinkWithCredential.mockRejectedValueOnce({ code: 'auth/requires-recent-login' });

    const result = await setPasswordForCurrentUser('umaSenhaForte1');

    expect(result).toEqual({ status: 'requires_recent_login' });
  });

  it('maps provider-already-linked to already_has_password instead of throwing', async () => {
    mockLinkWithCredential.mockRejectedValueOnce({ code: 'auth/provider-already-linked' });

    const result = await setPasswordForCurrentUser('umaSenhaForte1');

    expect(result).toEqual({ status: 'already_has_password' });
  });

  it('returns a generic error without a signed-in user', async () => {
    mockCurrentUser = null;

    const result = await setPasswordForCurrentUser('umaSenhaForte1');

    expect(result.status).toBe('error');
    expect(mockLinkWithCredential).not.toHaveBeenCalled();
  });
});

describe('currentUserHasPassword', () => {
  beforeEach(() => {
    mockCurrentUser = null;
  });

  it('is false when nobody is signed in', () => {
    expect(currentUserHasPassword()).toBe(false);
  });

  it('is false for a Strava-only account', () => {
    mockCurrentUser = { email: 'marina@example.com', providerData: [{ providerId: 'strava.com' }] };
    expect(currentUserHasPassword()).toBe(false);
  });

  it('is true once a password provider is linked', () => {
    mockCurrentUser = {
      email: 'marina@example.com',
      providerData: [{ providerId: 'password' }],
    };
    expect(currentUserHasPassword()).toBe(true);
  });
});
