import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Timestamp } from '@react-native-firebase/firestore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import BenefitDetailScreen from '../screens/BenefitDetailScreen';
import { getBenefit } from '../../../data/benefitsRepository';
import { track } from '../../../lib/instrumentation';
import type { Benefit, WithId } from '../../../data/types';
import type { BenefitsStackParamList } from '../../../navigation/types';

// `expo-clipboard`/`expo-web-browser` have no global mock in src/test/setup.ts
// (not my file) — mocked locally here, same as the repository and instrumentation.
jest.mock('../../../data/benefitsRepository');
jest.mock('../../../lib/instrumentation');
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({ type: 'opened' })) }));

const mockGetBenefit = getBenefit as jest.MockedFunction<typeof getBenefit>;
const mockTrack = track as jest.MockedFunction<typeof track>;
const mockSetStringAsync = Clipboard.setStringAsync as jest.MockedFunction<typeof Clipboard.setStringAsync>;
const mockOpenBrowserAsync = WebBrowser.openBrowserAsync as jest.MockedFunction<typeof WebBrowser.openBrowserAsync>;

type Props = NativeStackScreenProps<BenefitsStackParamList, 'BenefitDetail'>;

function makeProps(benefitId = 'b1'): Props {
  return {
    route: { key: 'BenefitDetail-key', name: 'BenefitDetail', params: { benefitId } },
    navigation: {} as Props['navigation'],
  } as Props;
}

function makeBenefit(overrides: Partial<Benefit> = {}): WithId<Benefit> {
  return {
    id: 'b1',
    partner: 'Inscrições Base Fox',
    category: 'Eventos',
    discount: '15% OFF',
    description: '15% de desconto nas inscrições de eventos do clube',
    code: 'BASEFOX15',
    external_url: 'https://inscricoes.example.com',
    usage_note: 'Vale para todos os eventos próprios do clube.',
    valid_until: Timestamp.fromDate(new Date(2026, 11, 31)),
    status: 'active',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BenefitDetailScreen', () => {
  it('mostra categoria, parceiro, título (desconto), descrição, condições de uso e validade', async () => {
    mockGetBenefit.mockResolvedValue(makeBenefit());

    const { findByText } = await render(<BenefitDetailScreen {...makeProps()} />);

    expect(await findByText('Eventos')).toBeTruthy();
    expect(await findByText('Inscrições Base Fox')).toBeTruthy();
    expect(await findByText('15% OFF')).toBeTruthy();
    expect(await findByText('15% de desconto nas inscrições de eventos do clube')).toBeTruthy();
    expect(await findByText('Vale para todos os eventos próprios do clube.')).toBeTruthy();
    expect(await findByText('Válido até 31 de dezembro de 2026')).toBeTruthy();
    expect(await findByText('BASEFOX15')).toBeTruthy();
  });

  it('exibe só "Copiar código" quando o benefício só tem código', async () => {
    mockGetBenefit.mockResolvedValue(makeBenefit({ external_url: null }));

    const { findByTestId, queryByTestId } = await render(<BenefitDetailScreen {...makeProps()} />);

    expect(await findByTestId('benefit-detail-copy-code')).toBeTruthy();
    expect(queryByTestId('benefit-detail-open-link')).toBeNull();
  });

  it('exibe só "Ir para as inscrições" quando o benefício só tem link externo', async () => {
    mockGetBenefit.mockResolvedValue(makeBenefit({ code: null }));

    const { findByTestId, queryByTestId } = await render(<BenefitDetailScreen {...makeProps()} />);

    expect(await findByTestId('benefit-detail-open-link')).toBeTruthy();
    expect(queryByTestId('benefit-detail-copy-code')).toBeNull();
  });

  it('exibe as duas ações, independentes, quando o benefício tem código e link externo', async () => {
    mockGetBenefit.mockResolvedValue(makeBenefit());

    const { findByTestId } = await render(<BenefitDetailScreen {...makeProps()} />);

    expect(await findByTestId('benefit-detail-copy-code')).toBeTruthy();
    expect(await findByTestId('benefit-detail-open-link')).toBeTruthy();
  });

  it('copia o código, instrumenta benefit_code_copied e mostra confirmação temporária', async () => {
    mockGetBenefit.mockResolvedValue(makeBenefit());

    const { findByTestId, findByText, queryByText } = await render(<BenefitDetailScreen {...makeProps()} />);
    const copyButton = await findByTestId('benefit-detail-copy-code');

    await fireEvent.press(copyButton);

    await waitFor(() => expect(mockSetStringAsync).toHaveBeenCalledWith('BASEFOX15'));
    expect(mockTrack).toHaveBeenCalledWith('benefit_code_copied', {
      benefit_id: 'b1',
      partner: 'Inscrições Base Fox',
    });
    expect(await findByText('Código copiado!')).toBeTruthy();

    await waitFor(() => expect(queryByText('Copiar código')).toBeTruthy(), { timeout: 3000 });
  }, 6000);

  it('abre o link externo e instrumenta benefit_link_opened', async () => {
    mockGetBenefit.mockResolvedValue(makeBenefit());

    const { findByTestId } = await render(<BenefitDetailScreen {...makeProps()} />);
    const linkButton = await findByTestId('benefit-detail-open-link');

    await fireEvent.press(linkButton);

    await waitFor(() => expect(mockOpenBrowserAsync).toHaveBeenCalledWith('https://inscricoes.example.com'));
    expect(mockTrack).toHaveBeenCalledWith('benefit_link_opened', {
      benefit_id: 'b1',
      partner: 'Inscrições Base Fox',
    });
  });
});
