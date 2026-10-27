import { useEffect, useState } from 'react';
import { subscribeAssociate } from '../../../data/associatesRepository';
import type { Associate, WithId } from '../../../data/types';

export interface UseAssociateResult {
  associate: WithId<Associate> | null;
  isLoading: boolean;
}

/**
 * Live subscription to the signed-in associate's own `associates/{uid}`
 * document — name, e-mail, photo, membership status and Strava connection,
 * all the data the Perfil screen (15) and edit screen (16) need. `null`
 * `associateId` (signed out) resolves to `{ associate: null, isLoading:
 * false }` without ever touching Firestore.
 */
export function useAssociate(associateId: string | null): UseAssociateResult {
  // Only the subscription's own result lives in state — the "signed out"
  // case is derived at the return below instead of being written into
  // state from the effect (react-hooks/set-state-in-effect: an effect with
  // no subscription to set up has nothing to call setState for).
  const [subscription, setSubscription] = useState<UseAssociateResult>({ associate: null, isLoading: true });

  useEffect(() => {
    if (!associateId) return;
    return subscribeAssociate(associateId, (value) => {
      setSubscription({ associate: value, isLoading: false });
    });
  }, [associateId]);

  if (!associateId) {
    return { associate: null, isLoading: false };
  }
  return subscription;
}
