import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const mockGetFunctions = jest.fn<(app: unknown, region: string) => { __tag: string }>(() => ({
  __tag: 'functions-instance',
}));
const mockCallable = jest.fn<(body: unknown) => Promise<{ data: unknown }>>();
const mockHttpsCallable = jest.fn<(functions: unknown, name: string) => typeof mockCallable>(() => mockCallable);

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({ __tag: 'app-instance' })),
}));

// `HttpsError` is declared inside the factory (not referenced from outer
// scope) so a real class — not a hoisting-order TDZ reference — backs the
// mocked module; the test imports it back out below to build instances
// that are `instanceof` the very same class `callStravaExchange.ts` checks
// against.
jest.mock('@react-native-firebase/functions', () => {
  class MockHttpsError extends Error {
    code: string;
    constructor(code: string, message?: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    getFunctions: (...args: unknown[]) => mockGetFunctions(...(args as Parameters<typeof mockGetFunctions>)),
    httpsCallable: (...args: unknown[]) => mockHttpsCallable(...(args as Parameters<typeof mockHttpsCallable>)),
    HttpsError: MockHttpsError,
  };
});

import { HttpsError } from '@react-native-firebase/functions';
import { invokeStravaExchange } from '../callStravaExchange';

describe('invokeStravaExchange', () => {
  beforeEach(() => {
    mockGetFunctions.mockClear();
    mockCallable.mockReset();
    mockHttpsCallable.mockClear();
  });

  it('calls the "stravaexchangecode" callable on the declared region and returns its data', async () => {
    mockCallable.mockResolvedValue({ data: { status: 'connected', athlete: { id: '1' } } });

    const result = await invokeStravaExchange({ code: 'abc', source: 'login' });

    expect(mockGetFunctions).toHaveBeenCalledWith({ __tag: 'app-instance' }, 'southamerica-east1');
    expect(mockHttpsCallable).toHaveBeenCalledWith({ __tag: 'functions-instance' }, 'stravaexchangecode');
    expect(mockCallable).toHaveBeenCalledWith({ code: 'abc', source: 'login' });
    expect(result).toEqual({ status: 'connected', athlete: { id: '1' } });
  });

  it('maps an HttpsError to a generic, safe {status: "error"} — never a business status', async () => {
    mockCallable.mockRejectedValue(new HttpsError('unauthenticated', 'Sign in required.'));

    const result = await invokeStravaExchange({ code: 'abc', source: 'profile' });

    expect(result).toEqual({ status: 'error', reason: 'unauthenticated' });
  });

  it('does not confuse a protocol HttpsError with "authorization_denied" or "unavailable_athlete_cap"', async () => {
    mockCallable.mockRejectedValue(new HttpsError('invalid-argument', 'bad request'));

    const result = await invokeStravaExchange({ code: '', source: 'sign_up' });

    expect(result.status).toBe('error');
    expect(result.status).not.toBe('authorization_denied');
    expect(result.status).not.toBe('unavailable_athlete_cap');
  });

  it('falls back to the error message for a non-HttpsError failure', async () => {
    mockCallable.mockRejectedValue(new Error('network down'));

    const result = await invokeStravaExchange({ code: 'abc', source: 'login' });

    expect(result).toEqual({ status: 'error', reason: 'network down' });
  });

  it('falls back to a generic reason when the rejection is not even an Error', async () => {
    mockCallable.mockRejectedValue('boom');

    const result = await invokeStravaExchange({ code: 'abc', source: 'login' });

    expect(result).toEqual({ status: 'error', reason: 'network_error' });
  });
});

describe('region agreement with the deployed function', () => {
  // The client (this file's `STRAVA_FUNCTIONS_REGION`) and the Cloud
  // Function (functions/src/strava/index.ts's `onCall` `region` option)
  // live in two separately-built packages — no shared constant or build
  // step connects them (and this project's agent-ownership rules keep it
  // that way: no agent may add cross-package build infra on its own). A
  // mismatch here is exactly the bug class that motivated this test: both
  // sides once silently agreed on the *wrong* region (`us-central1`)
  // because nothing checked them against each other. This reads both
  // source files directly and asserts the literal still matches, so a
  // future edit to just one side fails CI instead of failing silently in
  // production.
  it('declares the same region literal in callStravaExchange.ts and functions/src/strava/index.ts', () => {
    const clientSource = fs.readFileSync(path.join(__dirname, '..', 'callStravaExchange.ts'), 'utf8');
    const functionSource = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', '..', 'functions', 'src', 'strava', 'index.ts'),
      'utf8',
    );

    const clientMatch = clientSource.match(/const STRAVA_FUNCTIONS_REGION = '([^']+)'/);
    const functionMatch = functionSource.match(/region:\s*'([^']+)'/);

    expect(clientMatch).not.toBeNull();
    expect(functionMatch).not.toBeNull();
    expect(clientMatch?.[1]).toBe(functionMatch?.[1]);
    expect(clientMatch?.[1]).toBe('southamerica-east1');
  });
});
