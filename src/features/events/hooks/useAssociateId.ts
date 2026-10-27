import { useEffect, useState } from 'react';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';

/**
 * The signed-in associate's UID, or `null` before the auth state resolves
 * or when nobody is signed in. Uses `@react-native-firebase/auth` directly
 * (not Firestore — contract rule 3 only restricts the Firestore SDK to the
 * repository layer), mirroring the same pattern `src/screens/HomeScreen.tsx`
 * already uses.
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
