import { useEffect, useState } from 'react';
import { listBenefits } from '../../../data/benefitsRepository';
import type { Benefit, WithId } from '../../../data/types';

export interface UseBenefitsResult {
  benefits: WithId<Benefit>[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Catálogo de benefícios (telas 09/10), opcionalmente filtrado por categoria.
 * Retorna `active` e `coming_soon` juntos — a tela separa as duas seções
 * (tarefa 7.7), já que `benefitsRepository.listBenefits` não filtra por status.
 */
export function useBenefits(category?: string): UseBenefitsResult {
  const [benefits, setBenefits] = useState<WithId<Benefit>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    listBenefits({ category })
      .then((result) => {
        if (isMounted) setBenefits(result);
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
  }, [category]);

  return { benefits, isLoading, error };
}
