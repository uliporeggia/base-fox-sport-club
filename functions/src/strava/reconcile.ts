/**
 * Pure reconciliation decision — task 4.4c / strava-connection spec
 * "Reautorização reconcilia no mesmo associado". Kept dependency-free (no
 * Admin SDK) so it is unit-testable without mocking Firestore/Auth: the
 * caller (./index.ts) does the actual lookups and passes in the results.
 */

export interface ReconciliationLookups {
  /** Associate uid already linked to this Strava athlete (`strava.athlete_id` match), or `null`. */
  associateIdByAthleteId: string | null;
  /** Associate uid whose e-mail (Firebase Auth) matches the one supplied for this sign-up/login, or `null`. */
  associateIdByEmail: string | null;
}

export type ReconciliationDecision =
  | { action: 'use_existing'; associateId: string }
  | { action: 'create_new' };

/**
 * Athlete-id match wins over e-mail match (a Strava athlete, once linked,
 * identifies the same associate regardless of which e-mail is typed next
 * time — e.g. after the app's Strava application is replaced and
 * re-authorized, see "Reautorização após troca da aplicação Strava").
 * Falling back to the e-mail match is what satisfies "Cadastro via Strava
 * com e-mail já existente" — it keeps the same person from the e-mail and
 * the Strava paths from becoming two associates with two member numbers.
 */
export function decideStravaAssociate(lookups: ReconciliationLookups): ReconciliationDecision {
  if (lookups.associateIdByAthleteId) {
    return { action: 'use_existing', associateId: lookups.associateIdByAthleteId };
  }
  if (lookups.associateIdByEmail) {
    return { action: 'use_existing', associateId: lookups.associateIdByEmail };
  }
  return { action: 'create_new' };
}
