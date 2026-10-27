import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable, HttpsError } from '@react-native-firebase/functions';
import type { StravaConnectSource } from './types';

/**
 * Invoker for the `stravaexchangecode` callable Cloud Function
 * (functions/src/strava/index.ts), via `@react-native-firebase/functions`.
 *
 * No URL, no manual `Authorization` header, no CORS: the callable SDK
 * attaches the signed-in user's ID token automatically (the function only
 * requires it for `source: 'profile'`) and parses the `{ data: ... }`
 * envelope on both sides.
 *
 * Region: `southamerica-east1`, matching the Firestore database's fixed
 * location and every other deployed function (functions/src/index.ts's
 * `setGlobalOptions({ region: 'southamerica-east1' })`) — not the v2
 * default. The callable has no database of its own to inherit a region
 * from, so `functions/src/strava/index.ts` declares `region:
 * 'southamerica-east1'` explicitly on its `onCall` options, redundant with
 * the global default on purpose. The two sides (this constant and that
 * `onCall` option) must change together — the client SDK does not infer
 * the function's region, so a mismatch here fails or misroutes the Strava
 * code-for-token exchange silently. `src/lib/strava/__tests__/callStravaExchange.test.ts`
 * has a test that reads both source files and asserts they still agree.
 */
const STRAVA_FUNCTIONS_REGION = 'southamerica-east1';

export interface ExchangeRequestBody {
  code: string;
  email?: string;
  source: StravaConnectSource;
}

interface ExchangeAthletePayload {
  id: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  photo: string | null;
}

export type ExchangeResponseBody =
  | { status: 'connected'; athlete: ExchangeAthletePayload }
  | { status: 'signed_in'; isNewAssociate: boolean; customToken: string; athlete: ExchangeAthletePayload }
  | { status: 'unavailable_athlete_cap' }
  | { status: 'email_required' }
  | { status: 'error'; reason?: string };

export async function invokeStravaExchange(body: ExchangeRequestBody): Promise<ExchangeResponseBody> {
  try {
    const functions = getFunctions(getApp(), STRAVA_FUNCTIONS_REGION);
    const exchange = httpsCallable<ExchangeRequestBody, ExchangeResponseBody>(functions, 'stravaexchangecode');
    const result = await exchange(body);
    return result.data;
  } catch (error) {
    if (error instanceof HttpsError) {
      return { status: 'error', reason: error.code };
    }
    return { status: 'error', reason: error instanceof Error ? error.message : 'network_error' };
  }
}
