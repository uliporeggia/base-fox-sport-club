import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import { Timestamp } from '@react-native-firebase/firestore';
import BenefitsListScreen from '../screens/BenefitsListScreen';
import { listBenefits } from '../../../data/benefitsRepository';
import { useMemberAccess } from '../../../lib/membership/gate';
import { track } from '../../../lib/instrumentation';
import type { Benefit, WithId } from '../../../data/types';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

jest.mock('../../../data/benefitsRepository');
// Factory form (not bare automock): automocking would still `require` the
// real gate.ts to infer its shape, which pulls in AsyncStorage — not mocked
// in src/test/setup.ts (not my file) and not needed here since the hook
// itself is fully replaced below.
jest.mock('../../../lib/membership/gate', () => ({ useMemberAccess: jest.fn() }));
jest.mock('../../../lib/instrumentation');

const mockListBenefits = listBenefits as jest.MockedFunction<typeof listBenefits>;
const mockUseMemberAccess = useMemberAccess as jest.MockedFunction<typeof useMemberAccess>;
const mockTrack = track as jest.MockedFunction<typeof track>;

function makeBenefit(overrides: Partial<Benefit> & { id: string }): WithId<Benefit> {
  const { id, ...rest } = overrides;
  return {
    id,
    partner: 'Inscrições Base Fox',
    category: 'Eventos',
    discount: '15% OFF',
    description: '15% de desconto nas inscrições de eventos do clube',
    code: 'BASEFOX15',
    external_url: 'https://inscricoes.example.com',
    usage_note: 'Vale para todos os eventos próprios do clube.',
    valid_until: Timestamp.fromDate(new Date(2026, 11, 31)),
    status: 'active',
    ...rest,
  };
}

const activeBenefit = makeBenefit({ id: 'b1' });

function makeComingSoonBenefit(id: string, partner: string, category: string): WithId<Benefit> {
  return makeBenefit({
    id,
    partner,
    category,
    discount: null,
    description: '',
    code: null,
    external_url: null,
    usage_note: null,
    valid_until: null,
    status: 'coming_soon',
  });
}

// Os 3 parceiros "Em breve" confirmados pelo orquestrador (correção sobre o UI-REFERENCE.md).
const comingSoonBenefits = [
  makeComingSoonBenefit('cs1', 'Cafeteria parceira', 'Alimentação'),
  makeComingSoonBenefit('cs2', 'Nutrição esportiva', 'Alimentação'),
  makeComingSoonBenefit('cs3', 'Loja de corrida e trilha', 'Equipamentos'),
];

beforeEach(() => {
  jest.clearAllMocks();
  mockListBenefits.mockResolvedValue([activeBenefit, ...comingSoonBenefits]);
});

describe('BenefitsListScreen', () => {
  it('abre com "Todas" selecionado e mostra o desconto visível para quem tem acesso de membro, parceiro e categoria legíveis', async () => {
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: false, isLoading: false });

    const { findByText, getByTestId } = await render(<BenefitsListScreen />);

    expect(await findByText('15% OFF')).toBeTruthy();
    const card = getByTestId('benefit-card-b1');
    expect(card).toBeTruthy();
    expect(within(card).getByText('Inscrições Base Fox')).toBeTruthy();
    expect(within(card).getByText('Eventos')).toBeTruthy();
    await waitFor(() => expect(mockListBenefits).toHaveBeenCalledWith({ category: undefined }));
  });

  it('mascara o desconto sem acesso de membro, mantendo parceiro e categoria legíveis, com a marcação de bloqueado', async () => {
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: false, membershipEnabled: true, isLoading: false });

    const { findByText, queryByText, getByTestId } = await render(<BenefitsListScreen />);

    expect(await findByText('••% OFF')).toBeTruthy();
    expect(queryByText('15% OFF')).toBeNull();
    const card = getByTestId('benefit-card-b1');
    expect(within(card).getByText('Inscrições Base Fox')).toBeTruthy();
    expect(within(card).getByText('Eventos')).toBeTruthy();
    expect(await findByText('Bloqueado')).toBeTruthy();

    // A descrição do estado liberado repete o desconto por extenso ("15% de
    // desconto nas inscrições..."), o que anulava o mascaramento duas linhas
    // acima. O card bloqueado usa a copy própria da tela 09.
    expect(within(card).getByText('Desconto exclusivo de membro')).toBeTruthy();
    expect(queryByText('15% de desconto nas inscrições de eventos do clube')).toBeNull();
  });

  it('não exibe dígito algum no card bloqueado — nenhuma copy de parceiro pode furar o mascaramento', async () => {
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: false, membershipEnabled: true, isLoading: false });

    const { findByText, getByTestId } = await render(<BenefitsListScreen />);
    await findByText('••% OFF');

    // Asserção estrutural, não de uma string: o ponto do gate é que o VALOR do
    // desconto não apareça sem acesso de membro. Qualquer dígito renderizado
    // dentro do card é, por definição, um vazamento — venha ele da descrição,
    // do nome do parceiro ou de uma copy futura que ninguém reviu.
    const card = getByTestId('benefit-card-b1');
    expect(within(card).queryAllByText(/\d/)).toHaveLength(0);
  });

  it('filtra por categoria ao tocar um chip e instrumenta benefits_filter_applied', async () => {
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: false, isLoading: false });

    const { findByText, getByTestId } = await render(<BenefitsListScreen />);
    await findByText('15% OFF');

    await fireEvent.press(getByTestId('benefits-category-Eventos'));

    expect(mockTrack).toHaveBeenCalledWith('benefits_filter_applied', { category: 'Eventos' });
    await waitFor(() => expect(mockListBenefits).toHaveBeenCalledWith({ category: 'Eventos' }));
  });

  it('toque em benefício bloqueado vai ao paywall contextual com o detalhe do benefício como origem', async () => {
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: false, membershipEnabled: true, isLoading: false });

    const { findByText, getByTestId } = await render(<BenefitsListScreen />);
    await findByText('••% OFF');

    await fireEvent.press(getByTestId('benefit-card-b1'));

    expect(mockTrack).toHaveBeenCalledWith('benefit_viewed', {
      benefit_id: 'b1',
      partner: 'Inscrições Base Fox',
      category: 'Eventos',
      locked: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith('Paywall', { source: 'benefit_detail', benefitId: 'b1' });
  });

  it('toque em benefício ativo abre o detalhe direto quando hasMemberAccess é true (inclusive com a flag desligada)', async () => {
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: false, isLoading: false });

    const { findByText, getByTestId } = await render(<BenefitsListScreen />);
    await findByText('15% OFF');

    await fireEvent.press(getByTestId('benefit-card-b1'));

    expect(mockTrack).toHaveBeenCalledWith('benefit_viewed', {
      benefit_id: 'b1',
      partner: 'Inscrições Base Fox',
      category: 'Eventos',
      locked: false,
    });
    expect(mockNavigate).toHaveBeenCalledWith('BenefitDetail', { benefitId: 'b1' });
  });

  it('exibe os 3 parceiros "Em breve", nenhum tocável — sem onPress, não abrem detalhe nem acionam o paywall', async () => {
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: false, membershipEnabled: true, isLoading: false });

    const { findByText, getByTestId, getAllByText } = await render(<BenefitsListScreen />);
    await findByText('••% OFF');

    for (const { id, partner } of [
      { id: 'cs1', partner: 'Cafeteria parceira' },
      { id: 'cs2', partner: 'Nutrição esportiva' },
      { id: 'cs3', partner: 'Loja de corrida e trilha' },
    ]) {
      const card = getByTestId(`coming-soon-card-${id}`);
      expect(within(card).getByText(partner)).toBeTruthy();
      expect(card.props.onPress).toBeUndefined();
    }
    expect(getAllByText('EM BREVE')).toHaveLength(3);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
