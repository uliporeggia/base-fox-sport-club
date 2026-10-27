import {
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  FieldValue,
  type Unsubscribe,
} from '@react-native-firebase/firestore';
import { db, typedCollection, withId } from './firestoreClient';
import type { NotificationRecord, NotificationType, WithId } from './types';

/**
 * `notifications/{notificationId}` — the in-app inbox (14) is the source of
 * truth for the associate's notification history, independent of whether a
 * push was actually delivered (see "Push real" in design.md). Cloud
 * Functions write here with firebase-admin, outside this client repository;
 * `createNotification` exists for completeness and tests.
 */

const notificationsCollection = () => typedCollection<NotificationRecord>('notifications');

export async function listNotifications(associateId: string): Promise<WithId<NotificationRecord>[]> {
  const snapshot = await getDocs(
    query(
      notificationsCollection(),
      where('associate_id', '==', associateId),
      orderBy('created_at', 'desc'),
    ),
  );
  return snapshot.docs.map((d) => withId(d.id, d.data()));
}

/** Live inbox + unread badge (sino no cabeçalho da Home, task 9.4). */
export function subscribeNotifications(
  associateId: string,
  onChange: (notifications: WithId<NotificationRecord>[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      notificationsCollection(),
      where('associate_id', '==', associateId),
      orderBy('created_at', 'desc'),
    ),
    (snapshot) => onChange(snapshot.docs.map((d) => withId(d.id, d.data()))),
  );
}

export async function markAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(notificationsCollection(), notificationId), {
    read_at: FieldValue.serverTimestamp(),
  });
}

export async function markAllAsRead(associateId: string): Promise<void> {
  const snapshot = await getDocs(
    query(
      notificationsCollection(),
      where('associate_id', '==', associateId),
      where('read_at', '==', null),
    ),
  );
  if (snapshot.empty) return;
  const batch = writeBatch(db());
  snapshot.docs.forEach((d) => {
    batch.update(doc(notificationsCollection(), d.id), { read_at: FieldValue.serverTimestamp() });
  });
  await batch.commit();
}

export interface CreateNotificationInput {
  associate_id: string;
  type: NotificationType;
  title: string;
  body: string;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<WithId<NotificationRecord>> {
  const data: Omit<NotificationRecord, 'created_at' | 'read_at'> & {
    created_at: FieldValue;
    read_at: null;
  } = {
    associate_id: input.associate_id,
    type: input.type,
    title: input.title,
    body: input.body,
    created_at: FieldValue.serverTimestamp(),
    read_at: null,
  };
  const ref = await addDoc(notificationsCollection(), data as unknown as NotificationRecord);
  return withId(ref.id, data as unknown as NotificationRecord);
}
