import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockSignOut = jest.fn<(auth: unknown) => Promise<void>>(async () => undefined);

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'uid-1' } })),
  signOut: (...args: unknown[]) => mockSignOut(...(args as Parameters<typeof mockSignOut>)),
}));

// Same async-storage test double already used by src/lib/membership/__tests__/gate.test.ts.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOutCurrentUser } from '../logout';
import { PENDING_EMAIL_KEY } from '../emailLink';

describe('signOutCurrentUser — task 8.8', () => {
  beforeEach(async () => {
    mockSignOut.mockClear();
    await AsyncStorage.setItem(PENDING_EMAIL_KEY, 'marina@example.com');
  });

  it('clears the pending e-mail-link entry and signs out of Firebase Auth', async () => {
    await signOutCurrentUser();

    expect(await AsyncStorage.getItem(PENDING_EMAIL_KEY)).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('still signs out even if the local cleanup fails', async () => {
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(signOutCurrentUser()).resolves.toBeUndefined();
    expect(mockSignOut).toHaveBeenCalled();
  });
});
