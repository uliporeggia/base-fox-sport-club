import {
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  FieldValue,
} from '@react-native-firebase/firestore';
import { typedCollection, withId } from './firestoreClient';
import type { Device, DevicePlatform, WithId } from './types';

/**
 * `devices/{deviceId}` — document ID is the push token itself, so
 * registering the same token twice (e.g. app relaunch) is an idempotent
 * upsert rather than a duplicate row. Tokens are keyed by device, not by
 * associate, per the "Push real" decision in design.md: one associate can
 * have more than one device.
 */

const devicesCollection = () => typedCollection<Device>('devices');

export async function registerDevice(
  associateId: string,
  pushToken: string,
  platform: DevicePlatform,
): Promise<void> {
  const data: Omit<Device, 'updated_at'> & { updated_at: FieldValue } = {
    associate_id: associateId,
    push_token: pushToken,
    platform,
    updated_at: FieldValue.serverTimestamp(),
  };
  await setDoc(doc(devicesCollection(), pushToken), data as unknown as Device);
}

/** Removes a single device token — called on logout (task 8.8) and when the push service reports a token as invalid (task 9.8). */
export async function removeDevice(pushToken: string): Promise<void> {
  await deleteDoc(doc(devicesCollection(), pushToken));
}

export async function listDevicesByAssociate(associateId: string): Promise<WithId<Device>[]> {
  const snapshot = await getDocs(
    query(devicesCollection(), where('associate_id', '==', associateId)),
  );
  return snapshot.docs.map((d) => withId(d.id, d.data()));
}
