import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Member-number counter — `config/counters.member_number`. Firestore has no
 * autoincrement; a transaction on this single document is the mechanism
 * (see "Número de associado atribuído no cadastro" in design.md). Contention
 * is irrelevant at the pilot's scale: a handful of sign-ups, never
 * concurrent at volume.
 */
const COUNTERS_COLLECTION = 'config';
const COUNTERS_DOC_ID = 'counters';
const ASSOCIATES_COLLECTION = 'associates';

/**
 * Assigns the next sequential `member_number` to every associate on
 * creation — identity-of-club, not an assinatura artifact: it's written the
 * same way whether `membershipEnabled` is on or off, and whether the
 * associate ends up on the free or member plan (spec.md "Número de
 * associado", scenarios "Número atribuído no cadastro" / "Números não se
 * repetem").
 */
export const assignMemberNumber = onDocumentCreated(
  `${ASSOCIATES_COLLECTION}/{associateId}`,
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    // Idempotency guard: if this trigger is ever retried (Cloud Functions
    // delivers "at least once"), don't hand out a second number to the same
    // associate — createAssociate() always writes `member_number: 0` as the
    // placeholder value (src/data/associatesRepository.ts), so a non-zero
    // value here means a previous invocation already finished the job.
    const existing = snapshot.data();
    if (typeof existing?.member_number === 'number' && existing.member_number > 0) {
      return;
    }

    const db = getFirestore();
    const countersRef = db.collection(COUNTERS_COLLECTION).doc(COUNTERS_DOC_ID);

    const memberNumber = await db.runTransaction(async (transaction) => {
      const countersSnapshot = await transaction.get(countersRef);
      const current = (countersSnapshot.data()?.member_number as number | undefined) ?? 0;
      const next = current + 1;
      transaction.set(countersRef, { member_number: next }, { merge: true });
      transaction.update(snapshot.ref, { member_number: next });
      return next;
    });

    logger.info('assignMemberNumber: assigned member_number', {
      associateId: event.params.associateId,
      memberNumber,
    });
  },
);
