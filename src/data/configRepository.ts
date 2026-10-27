import { doc, getDoc, onSnapshot, type Unsubscribe } from '@react-native-firebase/firestore';
import { typedCollection } from './firestoreClient';
import type { ConfigApp } from './types';

/**
 * The single point of access to `config/app`.
 *
 * `membershipEnabled` SHALL only ever be read through this repository, and
 * from there only by `src/lib/membership/gate.ts` — see that module and the
 * "Gate de membership" decision in design.md. No other repository, screen or
 * component may read this document.
 */

const configCollection = () => typedCollection<ConfigApp>('config');

/** Greenfield default: membership hidden, no Strava app registered yet. */
const DEFAULT_APP_CONFIG: ConfigApp = {
  membershipEnabled: false,
  strava: { client_id: '' },
};

export async function getAppConfig(): Promise<ConfigApp> {
  const snapshot = await getDoc(doc(configCollection(), 'app'));
  if (!snapshot.exists()) {
    return DEFAULT_APP_CONFIG;
  }
  const data = snapshot.data();
  return {
    membershipEnabled: data?.membershipEnabled ?? DEFAULT_APP_CONFIG.membershipEnabled,
    strava: {
      client_id: data?.strava?.client_id ?? DEFAULT_APP_CONFIG.strava.client_id,
    },
  };
}

/**
 * Live updates to `config/app`, so toggling `membershipEnabled` in the
 * Firestore console reaches the app without a new build or app restart.
 * Returns an unsubscribe function.
 */
export function subscribeAppConfig(onChange: (config: ConfigApp) => void): Unsubscribe {
  return onSnapshot(
    doc(configCollection(), 'app'),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(DEFAULT_APP_CONFIG);
        return;
      }
      const data = snapshot.data();
      onChange({
        membershipEnabled: data?.membershipEnabled ?? DEFAULT_APP_CONFIG.membershipEnabled,
        strava: {
          client_id: data?.strava?.client_id ?? DEFAULT_APP_CONFIG.strava.client_id,
        },
      });
    },
    // A listener error is indistinguishable from "document really doesn't
    // exist" — unlike `!snapshot.exists()` above, it does not mean the
    // membership flag was ever actually turned off. Deliberately does NOT
    // call `onChange` here: with `membershipEnabled` on, emitting the
    // default on a transient error would flip every member back to
    // free-plan behavior for the rest of the session (see gate.ts, whose
    // `useMemberAccess` only updates its state from an `onChange` call — not
    // calling it here just leaves that last known value in place). Swallowed
    // on purpose; there is nothing actionable for the caller to do with a
    // Firestore listener error it didn't ask to see.
    () => undefined,
  );
}

/** Convenience accessor for the Strava `client_id` — the `client_secret` never lives here or in the app. */
export async function getStravaClientId(): Promise<string> {
  const config = await getAppConfig();
  return config.strava.client_id;
}
