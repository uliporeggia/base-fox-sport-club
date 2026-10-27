import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  FieldValue,
} from '@react-native-firebase/firestore';
import { typedCollection, withId } from './firestoreClient';
import { getEvent } from './eventsRepository';
import type { VipAccess, VipAccessQrPayload, WithId } from './types';

/**
 * `vip_accesses/{accessId}` — document ID is the deterministic pair
 * `${associate_id}_${event_id}`, mirroring rsvpsRepository: generating an
 * access for the same associate/event twice reuses the same document instead
 * of issuing a new one (task 6.3, "reaproveitando registro existente").
 */

const vipAccessesCollection = () => typedCollection<VipAccess>('vip_accesses');

function accessId(associateId: string, eventId: string): string {
  return `${associateId}_${eventId}`;
}

export async function getAccess(
  associateId: string,
  eventId: string,
): Promise<WithId<VipAccess> | null> {
  const id = accessId(associateId, eventId);
  const snapshot = await getDoc(doc(vipAccessesCollection(), id));
  if (!snapshot.exists()) return null;
  return withId(id, snapshot.data() as VipAccess);
}

/**
 * Creates (or reuses) the VIP access for an associate/event pair. Validity
 * is derived from the event's own `vip_window.ends_at` — never a fixed
 * duration, per the "QR de acesso" decision in design.md. Throws if the
 * event has no VIP window (`has_vip` false or `vip_window` missing); callers
 * should never reach this path for such an event (see vip-access spec, the
 * hub hides the generate action in that case).
 */
export async function getOrCreateAccess(
  associateId: string,
  eventId: string,
): Promise<WithId<VipAccess>> {
  const existing = await getAccess(associateId, eventId);
  if (existing && !existing.revoked_at) {
    return existing;
  }

  const event = await getEvent(eventId);
  if (!event?.has_vip || !event.vip_window) {
    throw new Error(`Event ${eventId} has no VIP window — cannot issue a VIP access.`);
  }

  const id = accessId(associateId, eventId);
  const ref = doc(vipAccessesCollection(), id);
  const data: Omit<VipAccess, 'issued_at'> & { issued_at: FieldValue } = {
    associate_id: associateId,
    event_id: eventId,
    issued_at: FieldValue.serverTimestamp(),
    expires_at: event.vip_window.ends_at,
    revoked_at: null,
  };
  await setDoc(ref, data as unknown as VipAccess);
  const snapshot = await getDoc(ref);
  return withId(id, snapshot.data() as VipAccess);
}

export async function revokeAccess(associateId: string, eventId: string): Promise<void> {
  await updateDoc(doc(vipAccessesCollection(), accessId(associateId, eventId)), {
    revoked_at: FieldValue.serverTimestamp(),
  });
}

/**
 * Pure assembly of the structured, versioned QR payload from an already
 * fetched access — no network call, so the QR screen (08) renders from data
 * already in hand and works without connectivity at the door (task 6.6).
 */
export function buildQrPayload(access: WithId<VipAccess>): VipAccessQrPayload {
  return {
    v: 1,
    access: access.id,
    associate: access.associate_id,
    event: access.event_id,
    exp: access.expires_at.toDate().toISOString(),
  };
}
