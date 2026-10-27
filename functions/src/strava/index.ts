/**
 * Strava domain Cloud Functions — the OAuth code-for-token exchange (the
 * only place `client_secret` may live; it is never embedded in the app,
 * see design.md "Identificador da aplicação Strava obtido de configuração
 * remota") and the reconciliation of the degrade-gracefully path when the
 * athlete cap is hit (tasks 4.4/4.4a/4.4c).
 *
 * Exposed as a callable function (`onCall`), not `onRequest`:
 * `@react-native-firebase/functions` is now installed, so the client
 * invokes this over the callable SDK (src/lib/strava/callStravaExchange.ts)
 * instead of a hand-rolled fetch — no fixed region URL, no manual
 * `Authorization` header, no CORS configuration.
 *
 * Request data: `{ code: string, email?: string, source: 'sign_up' | 'login' | 'profile' }`.
 * `source: 'profile'` requires the caller to be signed in — the callable
 * SDK attaches the Firebase ID token automatically, and the platform
 * verifies it before this handler runs, surfacing as `request.auth` (the
 * associate connecting Strava from their own Perfil); the other two
 * sources run unauthenticated and either reconcile into an existing
 * associate or — only with `email` present — create a new one via
 * `getAuth().createUser({ email, ... })`. That `createUser` call is what
 * later makes "cadastro por e-mail de quem já entrou por Strava" surface as
 * the ordinary `auth/email-already-in-use` error on the e-mail cadastro path.
 *
 * Every "business" outcome (athlete cap reached, e-mail required, etc.) is
 * returned as a normal payload with a `status` field — only transport/auth
 * failures (invalid data, missing/invalid auth for `profile`) throw
 * `HttpsError`, which the callable SDK turns into a rejected promise on the
 * client. This keeps "Strava recusou por teto de atletas" (a business
 * outcome, never shown as an app failure) distinct from "a chamada falhou"
 * (a protocol/auth failure).
 */
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { exchangeStravaCode } from './stravaApi';
import { decideStravaAssociate } from './reconcile';

const STRAVA_CLIENT_SECRET = defineSecret('STRAVA_CLIENT_SECRET');

interface RequestData {
  code?: unknown;
  email?: unknown;
  source?: unknown;
}

interface AthletePayload {
  id: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  photo: string | null;
}

type ExchangeResponseBody =
  | { status: 'connected'; athlete: AthletePayload }
  | { status: 'signed_in'; isNewAssociate: boolean; customToken: string; athlete: AthletePayload }
  | { status: 'unavailable_athlete_cap' }
  | { status: 'email_required' }
  | { status: 'error'; reason?: string };

async function getStravaClientId(): Promise<string | null> {
  const snapshot = await getFirestore().doc('config/app').get();
  const clientId = snapshot.data()?.strava?.client_id;
  return typeof clientId === 'string' && clientId.length > 0 ? clientId : null;
}

export const stravaexchangecode = onCall<RequestData, Promise<ExchangeResponseBody>>(
  {
    secrets: [STRAVA_CLIENT_SECRET],
    // Explicit on purpose, even though functions/src/index.ts already pins
    // every v2 function to this region via setGlobalOptions(): this is an
    // `onCall`, not a Firestore trigger, so it has no database to inherit a
    // region from — it is the one function in this file that would
    // actually move (to the v2 default, `us-central1`) if the global
    // default were ever removed or misconfigured. The client that invokes
    // it (src/lib/strava/callStravaExchange.ts, `STRAVA_FUNCTIONS_REGION`)
    // must declare the same literal — keep both in sync.
    region: 'southamerica-east1',
  },
  async (request: CallableRequest<RequestData>) => {
    const data = request.data ?? {};
    const code = typeof data.code === 'string' ? data.code : null;
    const email = typeof data.email === 'string' && data.email.trim().length > 0 ? data.email.trim() : null;
    const source =
      data.source === 'profile' || data.source === 'sign_up' || data.source === 'login' ? data.source : null;

    if (!code || !source) {
      throw new HttpsError('invalid-argument', 'Request must include a valid "code" and "source".');
    }

    const callerUid = request.auth?.uid ?? null;

    if (source === 'profile' && !callerUid) {
      throw new HttpsError('unauthenticated', 'Sign in before connecting Strava from your profile.');
    }

    const clientId = await getStravaClientId();
    if (!clientId) {
      return { status: 'error', reason: 'strava_client_id_not_configured' };
    }

    const exchange = await exchangeStravaCode(code, clientId, STRAVA_CLIENT_SECRET.value());
    if (!exchange.ok) {
      return {
        status: exchange.reason === 'athlete_cap' ? 'unavailable_athlete_cap' : 'error',
        ...(exchange.reason === 'error' ? { reason: `strava_${exchange.status}` } : {}),
      };
    }

    const athlete = exchange.athlete;
    const athletePayload: AthletePayload = {
      id: String(athlete.id),
      username: athlete.username,
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      photo: athlete.profile,
    };
    const stravaField = { connected: true, athlete_id: athletePayload.id, username: athlete.username };

    if (source === 'profile') {
      // callerUid is non-null here (checked above).
      await getFirestore()
        .doc(`associates/${callerUid}`)
        .set({ strava: stravaField }, { merge: true });
      return { status: 'connected', athlete: athletePayload };
    }

    // sign_up / login — unauthenticated; reconcile by athlete_id, then by e-mail.
    const byAthlete = await getFirestore()
      .collection('associates')
      .where('strava.athlete_id', '==', athletePayload.id)
      .limit(1)
      .get();

    let associateIdByEmail: string | null = null;
    if (email) {
      try {
        const existingUser = await getAuth().getUserByEmail(email);
        associateIdByEmail = existingUser.uid;
      } catch {
        // No Firebase Auth user with this e-mail yet — fine.
      }
    }

    const decision = decideStravaAssociate({
      associateIdByAthleteId: byAthlete.empty ? null : byAthlete.docs[0].id,
      associateIdByEmail,
    });

    if (decision.action === 'use_existing') {
      const uid = decision.associateId;
      await getFirestore().doc(`associates/${uid}`).set({ strava: stravaField }, { merge: true });
      const customToken = await getAuth().createCustomToken(uid);
      return { status: 'signed_in', isNewAssociate: false, customToken, athlete: athletePayload };
    }

    // create_new — e-mail is mandatory to create a brand-new associate (4.4b).
    if (!email) {
      return { status: 'email_required' };
    }

    const displayName = [athlete.firstname, athlete.lastname].filter(Boolean).join(' ').trim() || 'Associado Base Fox';
    const newUser = await getAuth().createUser({
      email,
      displayName,
      ...(athlete.profile ? { photoURL: athlete.profile } : {}),
    });

    await getFirestore()
      .doc(`associates/${newUser.uid}`)
      .set({
        name: displayName,
        email,
        photo_url: athlete.profile ?? null,
        member_number: 0,
        joined_at: FieldValue.serverTimestamp(),
        membership: { status: 'free', source: null, started_at: null },
        strava: stravaField,
      });

    const customToken = await getAuth().createCustomToken(newUser.uid);
    return { status: 'signed_in', isNewAssociate: true, customToken, athlete: athletePayload };
  },
);
