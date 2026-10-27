import { jest, describe, it, expect, beforeEach } from '@jest/globals';

type UserCredentialLike = { user: { uid: string } };

const mockCreateUserWithEmailAndPassword = jest.fn<
  (auth: unknown, email: string, password: string) => Promise<UserCredentialLike>
>();
const mockSignInWithEmailAndPassword = jest.fn<
  (auth: unknown, email: string, password: string) => Promise<UserCredentialLike>
>();
const mockUpdateProfile = jest.fn<(user: unknown, profile: { displayName?: string | null }) => Promise<void>>(
  async () => undefined,
);
const mockSendEmailVerification = jest.fn<(user: unknown) => Promise<void>>(async () => undefined);

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    mockCreateUserWithEmailAndPassword(...(args as Parameters<typeof mockCreateUserWithEmailAndPassword>)),
  signInWithEmailAndPassword: (...args: unknown[]) =>
    mockSignInWithEmailAndPassword(...(args as Parameters<typeof mockSignInWithEmailAndPassword>)),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...(args as Parameters<typeof mockUpdateProfile>)),
  sendEmailVerification: (...args: unknown[]) =>
    mockSendEmailVerification(...(args as Parameters<typeof mockSendEmailVerification>)),
}));

jest.mock('../../../data/associatesRepository', () => ({
  createAssociate: jest.fn(async () => undefined),
}));

import { signUpWithEmail, logInWithEmail } from '../emailPassword';

describe('signUpWithEmail — task 4.3', () => {
  beforeEach(() => {
    mockCreateUserWithEmailAndPassword.mockReset();
    mockUpdateProfile.mockClear();
    mockSendEmailVerification.mockClear();
  });

  it('reports e-mail já cadastrado without throwing', async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });

    const result = await signUpWithEmail({ name: 'Marina Alves', email: 'marina@example.com', password: '12345678' });

    expect(result).toEqual({ status: 'email_in_use' });
  });

  it('creates the account and sends the verification e-mail on success', async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'uid-1' } });

    const result = await signUpWithEmail({ name: 'Marina Alves', email: 'marina@example.com', password: '12345678' });

    expect(result).toEqual({ status: 'created' });
    expect(mockSendEmailVerification).toHaveBeenCalled();
  });
});

describe('logInWithEmail — task 4.5', () => {
  beforeEach(() => {
    mockSignInWithEmailAndPassword.mockReset();
  });

  it.each(['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'])(
    'maps %s to a generic invalid_credentials result',
    async (code) => {
      mockSignInWithEmailAndPassword.mockRejectedValueOnce({ code });

      const result = await logInWithEmail({ email: 'marina@example.com', password: 'wrong' });

      expect(result).toEqual({ status: 'invalid_credentials' });
    },
  );

  it('signs in on valid credentials', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'uid-1' } });

    const result = await logInWithEmail({ email: 'marina@example.com', password: 'correct' });

    expect(result).toEqual({ status: 'signed_in' });
  });
});
