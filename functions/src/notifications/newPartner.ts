import type { NotificationPayload } from './types';

/** Duck-typed subset of `benefits/{benefitId}` this module needs — see `src/data/types.ts#Benefit` on the app side. */
export interface BenefitDocData {
  category: string;
}

/** "Nova parceria fechada" — fires once, on the transition into `status === 'active'`. Broadcast to every associate. */
export function buildNewPartnerPayload(benefit: BenefitDocData, benefitId: string): NotificationPayload {
  return {
    type: 'new_partner',
    title: 'Nova parceria fechada',
    body: `Um novo parceiro de ${benefit.category.toLowerCase()} chega ao clube. Detalhes em breve em Benefícios.`,
    data: { benefitId },
  };
}
