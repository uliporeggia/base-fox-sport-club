/** Public types of src/lib/strava — see index.ts for the full API contract. */

export type StravaConnectSource = 'sign_up' | 'login' | 'profile';

export interface StravaAthleteInfo {
  athleteId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
}

export type StravaConnectResult =
  /** Success — new or reconciled associate now connected to Strava. */
  | { status: 'connected'; isNewAssociate: boolean; athlete: StravaAthleteInfo }
  /** The visitor closed the Strava authorization screen or denied access — never shown as a system error (4.4/strava-connection spec). */
  | { status: 'authorization_denied' }
  /** Strava refused the authorization because the app's athlete cap was reached (4.4a/design.md "Strava: API paga e com teto de atletas"). */
  | { status: 'unavailable_athlete_cap' }
  /**
   * The Strava integration is not configured yet (client_id is empty in config).
   * The app is not yet registered with Strava (task 0.2, blocked on Strava review).
   * Treat the same as unavailable_athlete_cap: non-transient unavailability, not an app failure.
   */
  | { status: 'unavailable_not_configured' }
  /**
   * Sign-up/login found no existing associate to reconcile with and no e-mail
   * was available to create one. For `source: 'sign_up'` this is returned
   * locally, before ever opening the Strava browser, when `options.email` is
   * missing (4.4b). For `source: 'login'`, it can also come back from the
   * server when the Strava athlete has never been linked to any associate —
   * the caller should guide the visitor to the e-mail cadastro instead.
   */
  | { status: 'email_required' }
  /** Anything else (network failure, unexpected server response). */
  | { status: 'error'; message: string };
