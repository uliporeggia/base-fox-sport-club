import { useEffect, useState } from 'react';
import type AsyncStorageType from '@react-native-async-storage/async-storage';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { subscribeAppConfig } from '../../data/configRepository';
import { subscribeAssociate } from '../../data/associatesRepository';
import type { MembershipStatus } from '../../data/types';

/**
 * The ONLY reader of `membershipEnabled` in the app (contract rule 4). No
 * other screen, component or repository may read that flag directly —
 * everyone else consumes `hasMemberAccess` from `useMemberAccess()` below.
 *
 * See "Gate de membership" in design.md for the full rationale.
 */

/** Pure derivation: flag off ⇒ everyone behaves like a member, always. */
export function computeMemberAccess(
  membershipEnabled: boolean,
  membershipStatus: MembershipStatus,
): boolean {
  return !membershipEnabled || membershipStatus === 'member';
}

export interface MemberAccess {
  hasMemberAccess: boolean;
  membershipEnabled: boolean;
  isLoading: boolean;
}

/**
 * Last-known-value cache for `membershipEnabled` (task 3.1 — "configuração
 * remota indisponível" in spec.md: apply the last known value and, absent
 * that, the hardcoded default, without blocking app usage). This is on top
 * of whatever `configRepository.subscribeAppConfig` already does; it does
 * not change that function's own default (`membershipEnabled: false`) for a
 * missing/never-synced doc.
 */
const LAST_KNOWN_MEMBERSHIP_ENABLED_KEY = '@base-fox/membership/last-known-membership-enabled';

/**
 * Lazily (and defensively) resolves the AsyncStorage module. Loaded via a
 * runtime `require` — not a static top-level `import` — so that an
 * unlinked/un-mocked native module (e.g. in a test file this agent doesn't
 * own and that renders this hook transitively, without AsyncStorage set up)
 * can never crash module evaluation for every importer of `gate.ts`; it
 * just means the last-known-value cache is unavailable for that run, same
 * as any other storage failure handled below.
 */
function loadAsyncStorage(): typeof AsyncStorageType | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
}

async function readLastKnownMembershipEnabled(): Promise<boolean | null> {
  try {
    const storage = loadAsyncStorage();
    if (!storage) return null;
    const raw = await storage.getItem(LAST_KNOWN_MEMBERSHIP_ENABLED_KEY);
    return raw === null ? null : raw === 'true';
  } catch {
    // Storage unavailable — fall through to configRepository's own default.
    return null;
  }
}

function persistLastKnownMembershipEnabled(value: boolean): void {
  const storage = loadAsyncStorage();
  if (!storage) return;
  storage.setItem(LAST_KNOWN_MEMBERSHIP_ENABLED_KEY, value ? 'true' : 'false').catch(() => {
    // Best-effort cache: a write failure only means the next cold start
    // falls back to the hardcoded default instead of the last known value.
  });
}

/**
 * Live-subscribes to `config/app` (via configRepository) and to the
 * signed-in associate's own document. Seeds `membershipEnabled` from the
 * last known value (persisted to AsyncStorage) while the live subscription's
 * first event is still pending, so a cold start with no connectivity keeps
 * the flag's last known state instead of flashing the hardcoded default.
 */
export function useMemberAccess(): MemberAccess {
  const [membershipEnabled, setMembershipEnabled] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('free');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [associateLoaded, setAssociateLoaded] = useState(false);

  useEffect(() => {
    let liveValueReceived = false;
    let cancelled = false;

    readLastKnownMembershipEnabled().then((lastKnown) => {
      if (cancelled || liveValueReceived || lastKnown === null) return;
      setMembershipEnabled(lastKnown);
    });

    const unsubscribeConfig = subscribeAppConfig((config) => {
      liveValueReceived = true;
      setMembershipEnabled(config.membershipEnabled);
      setConfigLoaded(true);
      persistLastKnownMembershipEnabled(config.membershipEnabled);
    });

    return () => {
      cancelled = true;
      unsubscribeConfig();
    };
  }, []);

  useEffect(() => {
    const auth = getAuth(getApp());
    let unsubscribeAssociate: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeAssociate?.();
      if (!user) {
        setMembershipStatus('free');
        setAssociateLoaded(true);
        return;
      }
      unsubscribeAssociate = subscribeAssociate(user.uid, (associate) => {
        setMembershipStatus(associate?.membership.status ?? 'free');
        setAssociateLoaded(true);
      });
    });

    return () => {
      unsubscribeAssociate?.();
      unsubscribeAuth();
    };
  }, []);

  return {
    hasMemberAccess: computeMemberAccess(membershipEnabled, membershipStatus),
    membershipEnabled,
    isLoading: !configLoaded || !associateLoaded,
  };
}
