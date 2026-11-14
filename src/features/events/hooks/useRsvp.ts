import { useCallback, useEffect, useState } from 'react';
import {
  cancelRsvp,
  confirmRsvp,
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
 * RSVP (a decisão de pedir ou não é de `maybeRequestPushPermission`, não
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
        await confirmRsvp(associateId, eventId);
        track('rsvp_confirmed', { event_id: eventId, modality, has_vip: hasVip });
        // Chamado em TODA confirmação, não só na primeira. Quem decide se há
        // algo a fazer é `maybeRequestPushPermission`: ela pede a permissão no
        // máximo uma vez na vida do aparelho e, havendo permissão, garante que
        // este aparelho esteja em `devices`.
        //
        // Antes havia um segundo portão aqui, com `listRsvpsByAssociate` para
        // detectar "primeiro RSVP de todos". Ele tornava o registro do token
        // inalcançável para sempre depois da primeira vez — inclusive no caso
        // comum de logout e novo login, que remove o token de `devices` e
        // nunca mais o recoloca, porque nenhum RSVP seguinte é "o primeiro".
        // Encontrado em aparelho em 14/11/2026, com `devices` vazio.
        //
        // Além de corrigir isso, concentrar a política num lugar só elimina
        // uma leitura no Firestore a cada confirmação.
        await maybeRequestPushPermission('first_rsvp');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [associateId, eventId, isConfirmed, isSubmitting, modality, hasVip]);

  return { isConfirmed, isSubmitting, toggle };
}
