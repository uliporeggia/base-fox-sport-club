import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from '@react-native-firebase/firestore';
import { typedCollection, withId } from './firestoreClient';
import type { EventModality, EventRecord, WithId } from './types';

/** `events/{eventId}` — read-only for the app (see firestore.rules). */

const eventsCollection = () => typedCollection<EventRecord>('events');

export interface ListEventsOptions {
  /** Filter to a single modality — omit (or "todos" handled by the caller) for every modality. */
  modality?: EventModality;
  /** Only events starting at or after this instant. Defaults to now, for "upcoming" lists (05). */
  from?: Date;
}

export async function listEvents(options: ListEventsOptions = {}): Promise<WithId<EventRecord>[]> {
  const from = options.from ?? new Date();
  const constraints = [where('starts_at', '>=', Timestamp.fromDate(from))];
  if (options.modality) {
    constraints.push(where('modality', '==', options.modality));
  }
  const snapshot = await getDocs(
    query(eventsCollection(), ...constraints, orderBy('starts_at', 'asc')),
  );
  return snapshot.docs.map((d) => withId(d.id, d.data()));
}

export async function getEvent(eventId: string): Promise<WithId<EventRecord> | null> {
  const snapshot = await getDoc(doc(eventsCollection(), eventId));
  if (!snapshot.exists()) return null;
  return withId(eventId, snapshot.data() as EventRecord);
}

/** The single soonest upcoming event, for the Home "próximo evento" card (04/5.7). */
export async function getNextEvent(): Promise<WithId<EventRecord> | null> {
  const snapshot = await getDocs(
    query(
      eventsCollection(),
      where('starts_at', '>=', Timestamp.fromDate(new Date())),
      orderBy('starts_at', 'asc'),
      limit(1),
    ),
  );
  const [first] = snapshot.docs;
  return first ? withId(first.id, first.data()) : null;
}
