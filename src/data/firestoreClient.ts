import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  type Firestore,
  type CollectionReference,
  type DocumentData,
  type QueryDocumentSnapshot,
} from '@react-native-firebase/firestore';
import { getAuth, type Auth } from '@react-native-firebase/auth';

/**
 * Internal singleton accessors shared by every repository in src/data.
 * Not part of the public repository API — screens/components never import
 * this module directly (rule 3 of the contract: no SDK access outside the
 * repository layer).
 */

let firestore: Firestore | null = null;

export function db(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getApp());
  }
  return firestore;
}

let auth: Auth | null = null;

export function firebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getApp());
  }
  return auth;
}

/** The signed-in associate's UID, or `null` if nobody is signed in. Throws nothing — callers decide how to handle `null`. */
export function currentAssociateId(): string | null {
  return firebaseAuth().currentUser?.uid ?? null;
}

/** Combines a Firestore document snapshot's data with its ID, the shape every repository returns. */
export function withId<T>(id: string, data: T): T & { id: string } {
  return { ...data, id };
}

/**
 * A top-level collection reference typed as `T`, via a pass-through
 * converter (the raw Firestore document shape already matches `T`, field for
 * field — see src/data/types.ts). Every repository builds its queries off of
 * this instead of calling `collection()` directly, so the (de)serialization
 * boundary lives in exactly one place.
 */
export function typedCollection<T extends DocumentData>(
  path: string,
): CollectionReference<T, T> {
  return collection(db(), path).withConverter<T, T>({
    toFirestore: (modelObject) => modelObject as T,
    fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>) =>
      snapshot.data() as T,
  });
}
