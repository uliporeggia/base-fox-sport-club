import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VipTeaser } from '../components/VipTeaser';
import { listEvents } from '../../../data/eventsRepository';
import type { Timestamp } from '@react-native-firebase/firestore';
import type { EventRecord, WithId } from '../../../data/types';

jest.mock('../../../data/eventsRepository');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const actualReact = jest.requireActual('react');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      actualReact.useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, []);
    },
  };
});

const mockedListEvents = listEvents as jest.Mock;

function fakeTimestamp(iso: string): Timestamp {
  return { toDate: () => new Date(iso) } as unknown as Timestamp;
}

function makeVipEvent(overrides: Partial<WithId<EventRecord>> = {}): WithId<EventRecord> {
  return {
    id: 'evt_2',
    name: 'Trilha da Pedra Grande',
    modality: 'trilha',
    distance: '12 km',
    starts_at: fakeTimestamp('2026-10-26T10:00:00Z'),
    location: 'Atibaia, SP',
    description: '',
    organizer: 'base_fox',
    has_vip: true,
    vip_window: {
      starts_at: fakeTimestamp('2026-10-26T09:00:00Z'),
      ends_at: fakeTimestamp('2026-10-26T14:00:00Z'),
    },
    vip_perks: ['Café', 'Food truck'],
    ...overrides,
  } as WithId<EventRecord>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('VipTeaser', () => {
  it('renders nothing while there is no upcoming VIP event', async () => {
    mockedListEvents.mockResolvedValue([]);

    const { toJSON } = await render(<VipTeaser />);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(toJSON()).toBeNull();
  });

  it('renders the next VIP event and navigates to the hub on tap', async () => {
    mockedListEvents.mockResolvedValue([makeVipEvent()]);

    const { findByText, getByTestId } = await render(<VipTeaser />);

    await findByText('Trilha da Pedra Grande');
    expect(getByTestId('vip-teaser-card')).toBeTruthy();

    fireEvent.press(getByTestId('vip-teaser-saiba-mais'));
    expect(mockNavigate).toHaveBeenCalledWith('Main', { screen: 'VipTab', params: { screen: 'VipHub' } });
  });
});
