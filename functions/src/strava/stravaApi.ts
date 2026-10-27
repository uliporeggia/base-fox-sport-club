/**
 * Low-level Strava OAuth token exchange — the only place the app's
 * `client_secret` is used (contract: it never reaches the app).
 */

export interface StravaAthleteSummary {
  id: number;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  /** Avatar URL ("large" size) — null for athletes without a custom photo. */
  profile: string | null;
}

export interface StravaTokenExchangeSuccess {
  ok: true;
  athlete: StravaAthleteSummary;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface StravaTokenExchangeFailure {
  ok: false;
  reason: 'athlete_cap' | 'error';
  status: number;
  detail: string;
}

export type StravaTokenExchangeResult = StravaTokenExchangeSuccess | StravaTokenExchangeFailure;

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

/**
 * Exchanges an OAuth authorization `code` for a Strava access token.
 *
 * Classifying the failure: a visitor who denies authorization on Strava's
 * screen never produces a `code` in the first place — expo-auth-session
 * intercepts that client-side (src/lib/strava/oauth.ts), so any non-2xx
 * response reaching this function is an application-level failure, not a
 * user decision. The Strava Developer Program's 2026 athlete cap
 * (design.md "Strava: API paga e com teto de atletas") has no publicly
 * documented, stable error shape at the time of writing; HTTP 403 — the
 * status Strava's API uses for authorization/app-limit errors — is treated
 * as the cap signal, and every other non-2xx as a generic error. Both
 * degrade identically on the client side (`unavailable_athlete_cap` /
 * `error`, see strava-connection spec "Degradação elegante"), so refining
 * this mapping later never requires an app change — only this function.
 */
export async function exchangeStravaCode(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<StravaTokenExchangeResult> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return {
      ok: false,
      reason: response.status === 403 ? 'athlete_cap' : 'error',
      status: response.status,
      detail,
    };
  }

  const body = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete: {
      id: number;
      username: string | null;
      firstname: string | null;
      lastname: string | null;
      profile: string | null;
    };
  };

  return {
    ok: true,
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: body.expires_at,
    athlete: {
      id: body.athlete.id,
      username: body.athlete.username ?? null,
      firstname: body.athlete.firstname ?? null,
      lastname: body.athlete.lastname ?? null,
      profile: body.athlete.profile ?? null,
    },
  };
}
