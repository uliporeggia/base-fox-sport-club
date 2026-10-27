import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { dispatchNotification } from './dispatch';
import { firestoreDispatchDeps, listAllAssociateIds } from './adminDeps';
import { buildEventWithVipPayload, type EventDocData } from './eventWithVip';
import { buildRsvpConfirmedPayload } from './rsvpConfirmed';
import { buildNewPartnerPayload, type BenefitDocData } from './newPartner';

/**
 * Task 9.7 — the three Firestore-trigger entry points, each a thin layer
 * (read the event, decide whether it's the business moment that deserves a
 * notification, build the payload, call `dispatchNotification`) on top of
 * the pure logic in `dispatch.ts`/`eventWithVip.ts`/`rsvpConfirmed.ts`/
 * `newPartner.ts`. This is the shape design.md asks for so the logic
 * survives a hosting migration — the trigger itself has no branching logic
 * of its own beyond "did the business moment just happen".
 */

/** "Novo evento com espaço VIP": fires once, on the `has_vip` false → true transition (publication). */
export const onEventWrittenNotifyVip = onDocumentWritten('events/{eventId}', async (event) => {
  const before = event.data?.before?.data() as EventDocData | undefined;
  const after = event.data?.after?.data() as EventDocData | undefined;
  if (!after) return; // deleted — nothing to announce

  const hadVip = Boolean(before?.has_vip);
  const hasVip = Boolean(after.has_vip);
  if (hadVip || !hasVip) return;

  const payload = buildEventWithVipPayload(after, event.params.eventId);
  const associateIds = await listAllAssociateIds();
  await dispatchNotification(associateIds, payload, firestoreDispatchDeps());
});

/** "Presença confirmada": fires for every new `rsvps/{rsvpId}`, targeting only the associate who confirmed. */
export const onRsvpCreatedNotifyAssociate = onDocumentCreated('rsvps/{rsvpId}', async (event) => {
  const rsvp = event.data?.data() as { associate_id: string; event_id: string } | undefined;
  if (!rsvp) return;

  const eventSnapshot = await getFirestore().collection('events').doc(rsvp.event_id).get();
  const eventData = eventSnapshot.data() as EventDocData | undefined;
  if (!eventData) return;

  const payload = buildRsvpConfirmedPayload(eventData, rsvp.event_id);
  await dispatchNotification([rsvp.associate_id], payload, firestoreDispatchDeps());
});

/** "Nova parceria fechada": fires once, on the `status` transition into `'active'` (covers both a benefit created already-active and one later activated). */
export const onBenefitWrittenNotifyNewPartner = onDocumentWritten('benefits/{benefitId}', async (event) => {
  const before = event.data?.before?.data() as (BenefitDocData & { status?: string }) | undefined;
  const after = event.data?.after?.data() as (BenefitDocData & { status?: string }) | undefined;
  if (!after) return; // deleted

  const wasActive = before?.status === 'active';
  const isActive = after.status === 'active';
  if (wasActive || !isActive) return;

  const payload = buildNewPartnerPayload(after, event.params.benefitId);
  const associateIds = await listAllAssociateIds();
  await dispatchNotification(associateIds, payload, firestoreDispatchDeps());
});
