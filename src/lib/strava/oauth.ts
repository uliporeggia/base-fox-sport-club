import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// No-op on native, required on web for the auth session to resolve when the
// popup redirects back — harmless to call unconditionally.
WebBrowser.maybeCompleteAuthSession();

/** Strava's mobile-optimized authorization screen — same params as the web endpoint. */
const STRAVA_AUTHORIZE_ENDPOINT = 'https://www.strava.com/oauth/mobile/authorize';

// `read` already returns the athlete's name and avatar in the token exchange
// response (see functions/src/strava/stravaApi.ts) — no need for a broader
// scope just to import name + photo (task 4.4).
const STRAVA_SCOPES = ['read'];

export type StravaAuthorizationResult = { outcome: 'code'; code: string } | { outcome: 'denied' };

/**
 * Opens the Strava authorization screen and resolves with the `code` on
 * success. PKCE is disabled because Strava's OAuth implementation does not
 * support it; `approval_prompt=auto` avoids re-prompting a visitor who
 * already authorized this app.
 */
export async function requestStravaAuthorization(clientId: string): Promise<StravaAuthorizationResult> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'basefox', path: 'strava-auth' });

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: STRAVA_SCOPES,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: false,
    extraParams: { approval_prompt: 'auto' },
  });

  const result = await request.promptAsync({ authorizationEndpoint: STRAVA_AUTHORIZE_ENDPOINT });

  if (result.type === 'success' && typeof result.params.code === 'string' && result.params.code.length > 0) {
    return { outcome: 'code', code: result.params.code };
  }

  // 'cancel' / 'dismiss' (visitor closed the browser) and 'error' (Strava
  // redirected back with `error=access_denied`) are both a denial from the
  // app's point of view — see strava-connection spec, "Autorização recusada".
  return { outcome: 'denied' };
}
