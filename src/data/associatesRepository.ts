import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  FieldValue,
  type Unsubscribe,
} from '@react-native-firebase/firestore';
import { typedCollection, withId } from './firestoreClient';
import type { Associate, MembershipStatus, WithId } from './types';

/**
 * `associates/{associateId}` — associateId is the Firebase Auth UID (see the
 * document-ID convention note at the top of src/data/types.ts).
 */

const associatesCollection = () => typedCollection<Associate>('associates');

export async function getAssociate(associateId: string): Promise<WithId<Associate> | null> {
  const snapshot = await getDoc(doc(associatesCollection(), associateId));
  if (!snapshot.exists()) return null;
  return withId(associateId, snapshot.data() as Associate);
}

/** Live updates to one associate's own document (profile screen, membership status, Strava connection state). */
export function subscribeAssociate(
  associateId: string,
  onChange: (associate: WithId<Associate> | null) => void,
): Unsubscribe {
  return onSnapshot(doc(associatesCollection(), associateId), (snapshot) => {
    onChange(snapshot.exists() ? withId(associateId, snapshot.data() as Associate) : null);
  });
}

export interface CreateAssociateInput {
  name: string;
  email: string;
  photo_url?: string | null;
}

/**
 * Creates the associate document on sign-up. `member_number` starts at 0 —
 * the member-number Cloud Function (onCreate trigger + transactional counter
 * in `config/counters`, see design.md) fills in the real value right after
 * this write; the app should not assume it is final until it changes.
 */
export async function createAssociate(
  associateId: string,
  input: CreateAssociateInput,
): Promise<void> {
  const associate: Omit<Associate, 'joined_at'> & { joined_at: FieldValue } = {
    name: input.name,
    email: input.email,
    photo_url: input.photo_url ?? null,
    member_number: 0,
    joined_at: FieldValue.serverTimestamp(),
    membership: { status: 'free', source: null, started_at: null },
    strava: { connected: false, athlete_id: null, username: null },
  };
  await setDoc(doc(associatesCollection(), associateId), associate as unknown as Associate);
}

export async function updateAssociateProfile(
  associateId: string,
  updates: Partial<Pick<Associate, 'name' | 'photo_url'>>,
): Promise<void> {
  await updateDoc(doc(associatesCollection(), associateId), updates);
}

export async function updateMembershipStatus(
  associateId: string,
  status: MembershipStatus,
  source: string | null = null,
): Promise<void> {
  await updateDoc(doc(associatesCollection(), associateId), {
    membership: {
      status,
      source,
      started_at: status === 'member' ? FieldValue.serverTimestamp() : null,
    },
  });
}

export async function updateStravaConnection(
  associateId: string,
  strava: Associate['strava'],
): Promise<void> {
  await updateDoc(doc(associatesCollection(), associateId), { strava });
}
