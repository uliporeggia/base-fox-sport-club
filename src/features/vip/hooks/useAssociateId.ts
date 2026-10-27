import { useEffect, useState } from 'react';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';

/**
 * The signed-in associate's UID (Firebase Auth), or `null` while there is
 * none — same `getAuth`/`onAuthStateChanged` pattern already used by
 * `src/screens/HomeScreen.tsx` and `src/lib/membership/gate.ts`. This reads
 * only Firebase Auth, never Firestore directly (contract rule 3 is about
 * the Firestore SDK), so it doesn't bypass the repository layer.
 */
export function useAssociateId(): string | null {
  const [associateId, setAssociateId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(getApp());
    return onAuthStateChanged(auth, (user) => {
      setAssociateId(user?.uid ?? null);
    });
  }, []);

  return associateId;
}
