import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2/options';

admin.initializeApp();

/**
 * Pins the region for every v2 function exported below — including ones
 * not yet written — to `southamerica-east1`, matching the Firestore
 * database's fixed location (design.md "Firebase: três projetos, e o
 * Firestore em São Paulo"; a v2 Firestore trigger must run in the same
 * region as the database it watches).
 *
 * This MUST run before `export * from './membership' | './notifications' |
 * './strava'` below: those statements `require()` the domain modules, and
 * each domain module calls `onDocumentCreated`/`onDocumentWritten`/`onCall`
 * at module-load time, which read global options via `getGlobalOptions()`
 * at that same moment (see makeEndpoint in
 * firebase-functions/lib/v2/providers/firestore.js and the v2 `onCall`
 * equivalent) — set this after those exports and the domain modules would
 * already be built before the default existed.
 *
 * Confirmed harmless for the four Firestore triggers already deployed
 * (`assignMemberNumber`, `onEventWrittenNotifyVip`,
 * `onRsvpCreatedNotifyAssociate`, `onBenefitWrittenNotifyNewPartner`): none
 * of them declares a `region` of its own, so each already runs wherever the
 * region resolves to — today that's `southamerica-east1`, inherited from
 * the Firestore trigger's database. Setting the *same* value here as the
 * global default doesn't move them; it just makes the value explicit
 * instead of implicit, and is what stops the next callable (no database to
 * inherit from — see './strava' below) from silently landing in the v2
 * default `us-central1` the way `stravaexchangecode` once did.
 */
setGlobalOptions({ region: 'southamerica-east1' });

/**
 * Re-exports every domain's Cloud Functions. Feature agents only add files
 * inside functions/src/<dominio>/ — nobody edits this file or
 * functions/package.json after the foundation wave.
 */
export * from './membership';
export * from './notifications';
export * from './strava';
