import { useCallback, useEffect, useState } from 'react';
import {
  cancelRsvp,
  confirmRsvp,
  listRsvpsByAssociate,
  subscribeRsvp,
} from '../../../data/rsvpsRepository';
import { maybeRequestPushPermission } from '../../../lib/push/permission';
import { track } from '../../../lib/instrumentation';
import type { EventModality } from '../../../data/types';

export interface UseRsvpParams {
  associateId: string | null;
  eventId: string;
  modality: EventModality;
  hasVip: boolean;
}

export interface UseRsvpResult {
  /** `null` while the associate's RSVP status for this event hasn't loaded yet. */
  isConfirmed: boolean | null;
  isSubmitting: boolean;
  toggle: () => Promise<void>;
}

/**
 * Confirm/cancel presence (5.6), available to both plans. Live-subscribes
 * via `rsvpsRepository.subscribeRsvp` so the confirmed state survives
 * closing and reopening the app (persisted in Firestore, not local state).
 *
 * The mandatory seam: right after the associate's FIRST EVER confirmed
 * RSVP (checked via `listRsvpsByAssociate` before writing the new one, not
 * after — a second RSVP on a different event then correctly sees a
 * non-empty prior list and skips the permission call), it calls
 * `maybeRequestPushPermission('first_rsvp')` from `src/lib/push/permission.ts`.
 */
export function useRsvp({ associateId, eventId, modality, hasVip }: UseRsvpParams): UseRsvpResult {
  const [isConfirmed, setIsConfirmed] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!associateId) {
      setIsConfirmed(null);
      return;
    }
    setIsConfirmed(null);
    return subscribeRsvp(associateId, eventId, (rsvp) => {
      setIsConfirmed(rsvp !== null);
    });
  }, [associateId, eventId]);

  const toggle = useCallback(async () => {
    if (!associateId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isConfirmed) {
        await cancelRsvp(associateId, eventId);
        track('rsvp_cancelled', { event_id: eventId, modality, has_vip: hasVip });
      } else {
        const priorRsvps = await listRsvpsByAssociate(associateId);
        const isFirstEver = priorRsvps.length === 0;
        await confirmRsvp(associateId, eventId);
        track('rsvp_confirmed', { event_id: eventId, modality, has_vip: hasVip });
        if (isFirstEver) {
          await maybeRequestPushPermission('first_rsvp');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [associateId, eventId, isConfirmed, isSubmitting, modality, hasVip]);

  return { isConfirmed, isSubmitting, toggle };
}
