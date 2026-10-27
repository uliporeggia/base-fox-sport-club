/// <reference types="jest" />
/**
 * Exercises the `stravaexchangecode` onCall handler directly via its
 * `.run(request)` escape hatch (what `firebase-functions`'s own `onCall`
 * exposes for exactly this: invoking the handler without going through the
 * HTTPS/CORS/App Check layer). `HttpsError` is asserted by code — the
 * unprefixed `invalid-argument` / `unauthenticated` etc. a callable client
 * receives — never by reaching for an HTTP status.
 */
import type { CallableRequest } from 'firebase-functions/v2/https';
import type { stravaexchangecode as StravaExchangeCode } from '../index';

type Request = Parameters<typeof StravaExchangeCode.run>[0];

/**
 * `firebase-functions/v2/https`'s real module transitively requires
 * `firebase-admin/app-check` -> `jwks-rsa` -> an ESM-only `jose` build that
 * this project's babel-jest transform (scoped to *.ts/*.tsx, not
 * node_modules) cannot load. None of that machinery is exercised by this
 * handler — it only needs `onCall` to hand back something with `.run`, and
 * `HttpsError` to carry a `code`/`message` — so it's faked out instead of
 * pulling in the real transport layer.
 */
// Captured so a test below can assert the region `stravaexchangecode` is
// declared with — named with the "mock" prefix so babel-plugin-jest-hoist
// allows referencing it from inside this hoisted factory (see the existing
// `mockExchangeStravaCode` reference further down for the same pattern).
// `var` (not `let`/`const`): this must already be defined — not merely
// declared-but-in-its-temporal-dead-zone — by the time the hoisted
// `import { stravaexchangecode } from '../index'` below runs, since babel
// hoists all imports (incl. that one, even though it's textually lower in
// this file) above ordinary statements. A `let` here throws
// "Cannot access before initialization"; `var` hoists with `undefined` and
// sidesteps the TDZ entirely.
// eslint-disable-next-line no-var
var mockOnCallOpts: unknown;

jest.mock('firebase-functions/v2/https', () => {
  class MockHttpsError extends Error {
    code: string;
    constructor(code: string, message?: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    onCall: (optsOrHandler: unknown, maybeHandler?: unknown) => {
      const handler = maybeHandler ?? optsOrHandler;
      mockOnCallOpts = maybeHandler ? optsOrHandler : undefined;
      return { run: handler };
    },
    HttpsError: MockHttpsError,
  };
});

const mockExchangeStravaCode = jest.fn();
jest.mock('../stravaApi', () => ({
  exchangeStravaCode: (...args: unknown[]) => mockExchangeStravaCode(...args),
}));

const mockFirestoreSet = jest.fn(async () => undefined);
let configClientId: string | null = 'client-123';
let athleteQueryDocs: { id: string }[] = [];

const mockFirestoreDoc = jest.fn((path: string) => {
  if (path === 'config/app') {
    return {
      get: jest.fn(async () => ({
        data: () => (configClientId ? { strava: { client_id: configClientId } } : undefined),
      })),
    };
  }
  return { set: mockFirestoreSet };
});

const mockFirestoreCollection = jest.fn(() => ({
  where: jest.fn(() => ({
    limit: jest.fn(() => ({
      get: jest.fn(async () => ({
        empty: athleteQueryDocs.length === 0,
        docs: athleteQueryDocs.map((d) => ({ id: d.id })),
      })),
    })),
  })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ doc: mockFirestoreDoc, collection: mockFirestoreCollection }),
  FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
}));

const mockGetUserByEmail = jest.fn();
const mockCreateCustomToken = jest.fn(async (uid: string) => `custom-token-${uid}`);
const mockCreateUser = jest.fn(async ({ email }: { email: string }) => ({ uid: `new-${email}` }));

jest.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    getUserByEmail: (...args: unknown[]) => mockGetUserByEmail(...args),
    createCustomToken: (...args: Parameters<typeof mockCreateCustomToken>) => mockCreateCustomToken(...args),
    createUser: (...args: Parameters<typeof mockCreateUser>) => mockCreateUser(...args),
  }),
}));

import { stravaexchangecode } from '../index';

function fakeRequest(data: Record<string, unknown>, uid: string | null = null): Request {
  return {
    data,
    auth: uid ? ({ uid } as CallableRequest<unknown>['auth']) : undefined,
    rawRequest: {} as CallableRequest<unknown>['rawRequest'],
    acceptsStreaming: false,
  } as Request;
}

describe('stravaexchangecode (onCall)', () => {
  beforeEach(() => {
    mockExchangeStravaCode.mockReset();
    mockFirestoreSet.mockClear();
    mockFirestoreDoc.mockClear();
    mockFirestoreCollection.mockClear();
    mockGetUserByEmail.mockReset();
    mockCreateCustomToken.mockClear();
    mockCreateUser.mockClear();
    configClientId = 'client-123';
    athleteQueryDocs = [];
  });

  it('throws unauthenticated for source "profile" without a caller', async () => {
    await expect(
      stravaexchangecode.run(fakeRequest({ code: 'abc', source: 'profile' })),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(mockExchangeStravaCode).not.toHaveBeenCalled();
  });

  it('throws invalid-argument when "code" is missing', async () => {
    await expect(
      stravaexchangecode.run(fakeRequest({ source: 'sign_up' })),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('throws invalid-argument when "source" is missing or not one of the known values', async () => {
    await expect(
      stravaexchangecode.run(fakeRequest({ code: 'abc', source: 'bogus' })),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('returns a business status, not an exception, when the athlete cap is reached', async () => {
    mockExchangeStravaCode.mockResolvedValue({ ok: false, reason: 'athlete_cap', status: 403, detail: '' });

    const result = await stravaexchangecode.run(fakeRequest({ code: 'abc', source: 'sign_up' }));

    expect(result).toEqual({ status: 'unavailable_athlete_cap' });
  });

  it('returns connected and writes the vínculo for an authenticated "profile" request', async () => {
    mockExchangeStravaCode.mockResolvedValue({
      ok: true,
      athlete: { id: 42, username: 'marina', firstname: 'Marina', lastname: 'Alves', profile: null },
      accessToken: 'at',
      refreshToken: 'rt',
      expiresAt: 0,
    });

    const result = await stravaexchangecode.run(fakeRequest({ code: 'abc', source: 'profile' }, 'uid-1'));

    expect(result).toEqual({
      status: 'connected',
      athlete: { id: '42', username: 'marina', firstname: 'Marina', lastname: 'Alves', photo: null },
    });
    expect(mockFirestoreDoc).toHaveBeenCalledWith('associates/uid-1');
    expect(mockFirestoreSet).toHaveBeenCalledWith(
      { strava: { connected: true, athlete_id: '42', username: 'marina' } },
      { merge: true },
    );
  });

  it('reconciles into an existing associate found by athlete_id for "login" and returns a custom token', async () => {
    mockExchangeStravaCode.mockResolvedValue({
      ok: true,
      athlete: { id: 7, username: 'nando', firstname: 'Nando', lastname: null, profile: null },
      accessToken: 'at',
      refreshToken: 'rt',
      expiresAt: 0,
    });
    athleteQueryDocs = [{ id: 'existing-uid' }];

    const result = await stravaexchangecode.run(fakeRequest({ code: 'abc', source: 'login' }));

    expect(result).toEqual({
      status: 'signed_in',
      isNewAssociate: false,
      customToken: 'custom-token-existing-uid',
      athlete: { id: '7', username: 'nando', firstname: 'Nando', lastname: null, photo: null },
    });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('creates a new associate and signs them in when nothing reconciles and an e-mail is present (sign_up)', async () => {
    mockExchangeStravaCode.mockResolvedValue({
      ok: true,
      athlete: { id: 99, username: 'nova', firstname: 'Nova', lastname: 'Atleta', profile: null },
      accessToken: 'at',
      refreshToken: 'rt',
      expiresAt: 0,
    });
    mockGetUserByEmail.mockRejectedValue(new Error('not found'));

    const result = await stravaexchangecode.run(
      fakeRequest({ code: 'abc', source: 'sign_up', email: 'nova@example.com' }),
    );

    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'nova@example.com', displayName: 'Nova Atleta' }),
    );
    expect(result).toEqual({
      status: 'signed_in',
      isNewAssociate: true,
      customToken: 'custom-token-new-nova@example.com',
      athlete: { id: '99', username: 'nova', firstname: 'Nova', lastname: 'Atleta', photo: null },
    });
  });

  it('returns email_required instead of creating an associate when no e-mail is available', async () => {
    mockExchangeStravaCode.mockResolvedValue({
      ok: true,
      athlete: { id: 5, username: 'sememail', firstname: null, lastname: null, profile: null },
      accessToken: 'at',
      refreshToken: 'rt',
      expiresAt: 0,
    });
    mockGetUserByEmail.mockRejectedValue(new Error('not found'));

    const result = await stravaexchangecode.run(fakeRequest({ code: 'abc', source: 'login' }));

    expect(result).toEqual({ status: 'email_required' });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('is declared in southamerica-east1 — this onCall has no Firestore trigger to inherit a region from, unlike the other functions in this project, so it must say so explicitly (matches the client: src/lib/strava/callStravaExchange.ts, STRAVA_FUNCTIONS_REGION)', () => {
    expect(mockOnCallOpts).toMatchObject({ region: 'southamerica-east1' });
  });
});
