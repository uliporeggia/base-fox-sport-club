import { useEffect, useState } from 'react';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';

/**
 * Live Firebase Auth UID for the signed-in associate, or `null` while
 * signed out. Same `onAuthStateChanged` shape as
 * `src/features/notifications/hooks/useAssociateId.ts` and
 * `src/lib/membership/gate.ts` — duplicated here (rather than imported)
 * because those files belong to other agents.
 */
export function useAssociateId(): string | null {
  const [associateId, setAssociateId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(getApp());
    return onAuthStateChanged(auth, (user) => setAssociateId(user?.uid ?? null));
  }, []);

  return associateId;
}
