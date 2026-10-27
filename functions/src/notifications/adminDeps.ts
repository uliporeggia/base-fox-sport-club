import { getFirestore, FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { DispatchDeps } from './dispatch';
import { sendExpoPushNotifications } from './expoPushClient';

/** Firestore 'in' queries accept at most 30 values. */
const WHERE_IN_CHUNK_SIZE = 30;

/** The real, Admin-SDK-backed `DispatchDeps` — the only place in this domain that touches Firestore directly. */
export function firestoreDispatchDeps(): DispatchDeps {
  const db = getFirestore();
  return {
    async writeNotification(associateId, payload) {
      await db.collection('notifications').add({
        associate_id: associateId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        created_at: FieldValue.serverTimestamp(),
        read_at: null,
      });
    },

    async listDeviceTokens(associateIds) {
      if (associateIds.length === 0) return [];
      const results: { token: string; associateId: string }[] = [];
      for (let i = 0; i < associateIds.length; i += WHERE_IN_CHUNK_SIZE) {
        const chunk = associateIds.slice(i, i + WHERE_IN_CHUNK_SIZE);
        const snapshot = await db.collection('devices').where('associate_id', 'in', chunk).get();
        snapshot.forEach((doc: QueryDocumentSnapshot) => {
          results.push({ token: doc.id, associateId: doc.get('associate_id') as string });
        });
      }
      return results;
    },

    async deleteDevice(token) {
      await db.collection('devices').doc(token).delete();
    },

    sendPush: sendExpoPushNotifications,
  };
}

/** Every associate's UID — the audience for the two broadcast notification types (event_with_vip, new_partner). */
export async function listAllAssociateIds(): Promise<string[]> {
  const snapshot = await getFirestore().collection('associates').select().get();
  return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.id);
}
