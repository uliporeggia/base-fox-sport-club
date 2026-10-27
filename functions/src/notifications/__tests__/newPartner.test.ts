/// <reference types="jest" />
import { buildNewPartnerPayload } from '../newPartner';

describe('buildNewPartnerPayload', () => {
  it('builds the "Nova parceria fechada" notification, lower-casing the category', () => {
    const payload = buildNewPartnerPayload({ category: 'Alimentação' }, 'benefit-1');

    expect(payload.type).toBe('new_partner');
    expect(payload.title).toBe('Nova parceria fechada');
    expect(payload.body).toBe('Um novo parceiro de alimentação chega ao clube. Detalhes em breve em Benefícios.');
    expect(payload.data).toEqual({ benefitId: 'benefit-1' });
  });
});
