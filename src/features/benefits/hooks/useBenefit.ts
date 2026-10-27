import { useEffect, useState } from 'react';
import { getBenefit } from '../../../data/benefitsRepository';
import type { Benefit, WithId } from '../../../data/types';

export interface UseBenefitResult {
  benefit: WithId<Benefit> | null;
  isLoading: boolean;
  error: Error | null;
}

/** Detalhe de um único benefício (tela 11). */
export function useBenefit(benefitId: string): UseBenefitResult {
  const [benefit, setBenefit] = useState<WithId<Benefit> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getBenefit(benefitId)
      .then((result) => {
        if (isMounted) setBenefit(result);
      })
      .catch((err: unknown) => {
        if (isMounted) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [benefitId]);

  return { benefit, isLoading, error };
}
