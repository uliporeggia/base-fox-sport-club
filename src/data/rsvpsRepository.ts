import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  FieldValue,
  type Unsubscribe,
} from '@react-native-firebase/firestore';
import { typedCollection, withId } from './firestoreClient';
import type { Rsvp, WithId } from './types';

/**
 * `rsvps/{rsvpId}` — document ID is the deterministic pair
 * `${associate_id}_${event_id}`, so confirming twice is idempotent and
 * looking up "did I RSVP to this event" never needs a query.
 */

const rsvpsCollection = () => typedCollection<Rsvp>('rsvps');

function rsvpId(associateId: string, eventId: string): string {
  return `${associateId}_${eventId}`;
}

export async function getRsvp(
  associateId: string,
  eventId: string,
): Promise<WithId<Rsvp> | null> {
  const id = rsvpId(associateId, eventId);
  const snapshot = await getDoc(doc(rsvpsCollection(), id));
  if (!snapshot.exists()) return null;
  return withId(id, snapshot.data() as Rsvp);
}

export function subscribeRsvp(
  associateId: string,
  eventId: string,
  onChange: (rsvp: WithId<Rsvp> | null) => void,
): Unsubscribe {
  const id = rsvpId(associateId, eventId);
  return onSnapshot(doc(rsvpsCollection(), id), (snapshot) => {
    onChange(snapshot.exists() ? withId(id, snapshot.data() as Rsvp) : null);
  });
}

/** Confirms presence at an event. Safe to call again for the same pair — it just overwrites `confirmed_at`. */
export async function confirmRsvp(associateId: string, eventId: string): Promise<WithId<Rsvp>> {
  const id = rsvpId(associateId, eventId);
  const ref = doc(rsvpsCollection(), id);
  const data: Omit<Rsvp, 'confirmed_at'> & { confirmed_at: FieldValue } = {
    associate_id: associateId,
    event_id: eventId,
    confirmed_at: FieldValue.serverTimestamp(),
  };
  await setDoc(ref, data as unknown as Rsvp);
  const snapshot = await getDoc(ref);
  return withId(id, snapshot.data() as Rsvp);
}

export async function cancelRsvp(associateId: string, eventId: string): Promise<void> {
  await deleteDoc(doc(rsvpsCollection(), rsvpId(associateId, eventId)));
}

export async function listRsvpsByAssociate(associateId: string): Promise<WithId<Rsvp>[]> {
  const snapshot = await getDocs(query(rsvpsCollection(), where('associate_id', '==', associateId)));
  return snapshot.docs.map((d) => withId(d.id, d.data()));
}
