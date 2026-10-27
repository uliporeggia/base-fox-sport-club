/**
 * Public Strava integration API — the ONLY module of src/lib/strava that
 * other agents should import from (oauth.ts and callStravaExchange.ts are
 * internals). This is the seam the Perfil agent builds against next wave.
 *
 * ---------------------------------------------------------------------------
 * connectStrava(source, options?): Promise<StravaConnectResult>
 * ---------------------------------------------------------------------------
 *   source:
 *     - 'sign_up' — no Firebase user signed in yet, from the cadastro
 *       screen (02). `options.email` is REQUIRED (4.4b — Strava never
 *       returns an e-mail): missing it resolves locally to
 *       `{ status: 'email_required' }` WITHOUT opening the Strava browser,
 *       so no athlete-cap slot is spent on an attempt that cannot finish.
 *     - 'login' — no Firebase user signed in yet, from the login screen.
 *       No e-mail is collected upfront; if the Strava athlete has never
 *       been linked to an associate, resolves to `{ status: 'email_required' }`
 *       and the caller should route the visitor to the e-mail cadastro.
 *     - 'profile' — caller MUST already be signed in (Firebase Auth). Only
 *       links/relinks the Strava account to the current associate; never
 *       touches the Firebase Auth session. `options.email` is ignored.
 *
 *   Returns one of (see ./types.ts for the full discriminated union):
 *     - { status: 'connected', isNewAssociate, athlete } — success. For
 *       'sign_up'/'login' the associate is already signed in (via Firebase
 *       custom token) by the time this resolves — callers do not need to
 *       call any other sign-in function.
 *     - { status: 'authorization_denied' } — visitor closed/denied the
 *       Strava prompt. Never present this as an app failure.
 *     - { status: 'unavailable_athlete_cap' } — Strava refused: the app's
 *       athlete cap was reached (4.4a). Keep the e-mail cadastro/login
 *       available; never present this as an app failure either.
 *     - { status: 'unavailable_not_configured' } — Strava integration not yet
 *       configured (client_id is empty). Same treatment as unavailable_athlete_cap:
 *       non-transient unavailability, not a system error.
 *     - { status: 'email_required' } — see above.
 *     - { status: 'error', message } — anything else (network, unexpected
 *       server response). Safe to show a generic transient-error message.
 *
 * ---------------------------------------------------------------------------
 * disconnectStrava(associateId): Promise<void>
 * ---------------------------------------------------------------------------
 *   Removes the local vínculo (connected/athlete_id/username) via
 *   associatesRepository. Never touches the Firebase Auth session — for
 *   associates who signed up via Strava, disconnecting must NOT end the
 *   session (strava-connection spec).
 *
 * Missing dependency this API's transport needs but cannot install:
 * `@react-native-firebase/functions` (see callStravaExchange.ts) — reported
 * to the orchestrator.
 */
import { getApp } from '@react-native-firebase/app';
import { getAuth, signInWithCustomToken, sendEmailVerification } from '@react-native-firebase/auth';
import { updateStravaConnection } from '../../data/associatesRepository';
import { requestStravaAuthorization } from './oauth';
import { invokeStravaExchange, type ExchangeResponseBody } from './callStravaExchange';
import { getStravaClientId } from '../../data/configRepository';
import type { StravaAthleteInfo, StravaConnectResult, StravaConnectSource } from './types';

export type { StravaAthleteInfo, StravaConnectResult, StravaConnectSource } from './types';

export async function connectStrava(
  source: StravaConnectSource,
  options?: { email?: string },
): Promise<StravaConnectResult> {
  if (source === 'sign_up' && !options?.email) {
    return { status: 'email_required' };
  }

  const clientId = await getStravaClientId();
  if (!clientId) {
    return { status: 'unavailable_not_configured' };
  }

  const authorization = await requestStravaAuthorization(clientId);
  if (authorization.outcome === 'denied') {
    return { status: 'authorization_denied' };
  }

  const response = await invokeStravaExchange({
    code: authorization.code,
    email: options?.email,
    source,
  });

  return handleExchangeResponse(response);
}

export async function disconnectStrava(associateId: string): Promise<void> {
  await updateStravaConnection(associateId, { connected: false, athlete_id: null, username: null });
}

async function handleExchangeResponse(response: ExchangeResponseBody): Promise<StravaConnectResult> {
  switch (response.status) {
    case 'unavailable_athlete_cap':
      return { status: 'unavailable_athlete_cap' };
    case 'email_required':
      return { status: 'email_required' };
    case 'error':
      return { status: 'error', message: response.reason ?? 'unknown_error' };
    case 'connected':
      // source === 'profile': already signed in, the function only updated Firestore.
      return { status: 'connected', isNewAssociate: false, athlete: toAthleteInfo(response.athlete) };
    case 'signed_in': {
      await signInWithCustomToken(getAuth(getApp()), response.customToken);
      if (response.isNewAssociate) {
        // Spec "Verificação de e-mail": every cadastro path sends it, Strava included (4.4d).
        const user = getAuth(getApp()).currentUser;
        if (user) await sendEmailVerification(user).catch(() => undefined);
      }
      return {
        status: 'connected',
        isNewAssociate: response.isNewAssociate,
        athlete: toAthleteInfo(response.athlete),
      };
    }
    default:
      return { status: 'error', message: 'unexpected_response' };
  }
}

function toAthleteInfo(athlete: {
  id: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  photo: string | null;
}): StravaAthleteInfo {
  return {
    athleteId: athlete.id,
    username: athlete.username,
    firstName: athlete.firstname,
    lastName: athlete.lastname,
    photoUrl: athlete.photo,
  };
}
