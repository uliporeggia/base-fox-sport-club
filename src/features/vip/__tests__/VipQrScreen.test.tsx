import React from 'react';
import { render } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Timestamp } from '@react-native-firebase/firestore';
import VipQrScreen from '../screens/VipQrScreen';
import { getAccess, getOrCreateAccess } from '../../../data/vipAccessRepository';
import { getEvent } from '../../../data/eventsRepository';
import { getAssociate } from '../../../data/associatesRepository';
import { track } from '../../../lib/instrumentation';
import type { VipStackParamList } from '../../../navigation/types';

jest.mock('../../../data/vipAccessRepository', () => {
  const actual = jest.requireActual('../../../data/vipAccessRepository');
  return {
    ...actual,
    getAccess: jest.fn(),
    getOrCreateAccess: jest.fn(),
  };
});
jest.mock('../../../data/eventsRepository');
jest.mock('../../../data/associatesRepository');
jest.mock('../../../lib/instrumentation');
jest.mock('../hooks/useAssociateId', () => ({
  useAssociateId: jest.fn(() => 'assoc_1'),
}));

// react-native-qrcode-svg builds a full QR matrix via react-native-svg; for
// unit tests we only care about the `value` (payload) it was handed, so a
// thin mock stands in for it and exposes that value as text.
jest.mock('react-native-qrcode-svg', () => {
  const RN = require('react-native');
  const ReactLib = require('react');
  return function MockQRCode(props: { value?: string }) {
    return ReactLib.createElement(RN.Text, { testID: 'qr-value' }, props.value);
  };
});

const mockedGetAccess = getAccess as jest.Mock;
const mockedGetOrCreateAccess = getOrCreateAccess as jest.Mock;
const mockedGetEvent = getEvent as jest.Mock;
const mockedGetAssociate = getAssociate as jest.Mock;
const mockedTrack = track as jest.Mock;

function fakeTimestamp(iso: string): Timestamp {
  return { toDate: () => new Date(iso) } as unknown as Timestamp;
}

type Props = NativeStackScreenProps<VipStackParamList, 'VipQr'>;

function renderScreen(eventId = 'evt_1') {
  const navigation = { goBack: jest.fn() } as unknown as Props['navigation'];
  const route = { key: 'VipQr', name: 'VipQr', params: { eventId } } as unknown as Props['route'];
  return render(<VipQrScreen navigation={navigation} route={route} />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('VipQrScreen', () => {
  it('renders the QR, event, associate and validity info from already-fetched data, with no write call', async () => {
    mockedGetAccess.mockResolvedValue({
      id: 'assoc_1_evt_1',
      associate_id: 'assoc_1',
      event_id: 'evt_1',
      issued_at: fakeTimestamp('2026-10-01T00:00:00Z'),
      expires_at: fakeTimestamp('2026-10-18T14:00:00Z'),
      revoked_at: null,
    });
    mockedGetEvent.mockResolvedValue({
      id: 'evt_1',
      name: 'Corrida Base Fox 10K',
      starts_at: fakeTimestamp('2026-10-18T09:30:00Z'),
      location: 'Parque Villa-Lobos, SP',
      has_vip: true,
      vip_window: {
        starts_at: fakeTimestamp('2026-10-18T09:00:00Z'),
        ends_at: fakeTimestamp('2026-10-18T14:00:00Z'),
      },
      vip_perks: ['Café', 'Cerveja', 'Food truck'],
    });
    mockedGetAssociate.mockResolvedValue({
      id: 'assoc_1',
      name: 'Marina Alves',
      member_number: 428,
    });

    const { findByText, getByText, getByTestId } = await renderScreen();

    expect(await findByText('Marina Alves')).toBeTruthy();
    expect(getByText('Corrida Base Fox 10K')).toBeTruthy();
    expect(getByText('Membro Base Fox · nº 0428')).toBeTruthy();
    expect(getByText('Válido para o evento de hoje')).toBeTruthy();
    expect(getByText('Mostre este código na entrada do espaço.')).toBeTruthy();

    const qrValue = getByTestId('qr-value').children.join('');
    const payload = JSON.parse(qrValue);
    expect(payload).toEqual({
      v: 1,
      access: 'assoc_1_evt_1',
      associate: 'assoc_1',
      event: 'evt_1',
      exp: '2026-10-18T14:00:00.000Z',
    });

    // Offline requirement (6.6): rendering the QR reads an already-created
    // access — it never writes/creates one.
    expect(mockedGetOrCreateAccess).not.toHaveBeenCalled();
    expect(mockedTrack).toHaveBeenCalledWith('vip_qr_viewed', { event_id: 'evt_1', has_access: true });
  });

  it('shows a fallback and reports has_access: false when no access is found', async () => {
    mockedGetAccess.mockResolvedValue(null);
    mockedGetEvent.mockResolvedValue({
      id: 'evt_1',
      name: 'Corrida Base Fox 10K',
      has_vip: true,
      vip_window: null,
      vip_perks: [],
    });
    mockedGetAssociate.mockResolvedValue({ id: 'assoc_1', name: 'Marina Alves', member_number: 428 });

    const { findByText } = await renderScreen();

    await findByText(/Não encontramos seu acesso/);
    expect(mockedTrack).toHaveBeenCalledWith('vip_qr_viewed', { event_id: 'evt_1', has_access: false });
    expect(mockedGetOrCreateAccess).not.toHaveBeenCalled();
  });
});
