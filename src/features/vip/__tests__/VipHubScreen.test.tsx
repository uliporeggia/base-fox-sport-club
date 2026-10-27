import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VipHubScreen from '../screens/VipHubScreen';
import { listEvents } from '../../../data/eventsRepository';
import { getOrCreateAccess } from '../../../data/vipAccessRepository';
import { useMemberAccess } from '../../../lib/membership/gate';
import { track } from '../../../lib/instrumentation';
import type { Timestamp } from '@react-native-firebase/firestore';
import type { EventRecord, WithId } from '../../../data/types';

jest.mock('../../../data/eventsRepository');
jest.mock('../../../data/vipAccessRepository');
// Explicit factory (no automock): gate.ts pulls in
// @react-native-async-storage/async-storage, which isn't mocked in the
// global jest setup and crashes under the native-module stub — an
// automatic mock would still have to load the real file to shape itself.
jest.mock('../../../lib/membership/gate', () => ({
  useMemberAccess: jest.fn(),
  computeMemberAccess: jest.fn(),
}));
jest.mock('../../../lib/instrumentation');
jest.mock('../hooks/useAssociateId', () => ({
  useAssociateId: jest.fn(() => 'assoc_1'),
}));

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
const mockedGetOrCreateAccess = getOrCreateAccess as jest.Mock;
const mockedUseMemberAccess = useMemberAccess as jest.Mock;
const mockedTrack = track as jest.Mock;

function fakeTimestamp(iso: string): Timestamp {
  return { toDate: () => new Date(iso) } as unknown as Timestamp;
}

function makeVipEvent(overrides: Partial<WithId<EventRecord>> = {}): WithId<EventRecord> {
  return {
    id: 'evt_1',
    name: 'Corrida Base Fox 10K',
    modality: 'corrida',
    distance: '10 km',
    starts_at: fakeTimestamp('2026-10-18T09:30:00Z'),
    location: 'Parque Villa-Lobos, SP',
    description: '',
    organizer: 'base_fox',
    has_vip: true,
    vip_window: {
      starts_at: fakeTimestamp('2026-10-18T09:00:00Z'),
      ends_at: fakeTimestamp('2026-10-18T14:00:00Z'),
    },
    vip_perks: ['Café', 'Cerveja', 'Food truck'],
    ...overrides,
  } as WithId<EventRecord>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('VipHubScreen', () => {
  it('shows the generate-access CTA and all informative content for a member', async () => {
    mockedUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: true, isLoading: false });
    mockedListEvents.mockResolvedValue([makeVipEvent()]);

    const { findByText, getByText, getByTestId, queryByTestId } = await render(<VipHubScreen />);

    await findByText('Corrida Base Fox 10K');
    expect(getByText(/lounge do clube/)).toBeTruthy();
    expect(getByText('Café')).toBeTruthy();
    expect(getByText('Cerveja')).toBeTruthy();
    expect(getByText('Food truck')).toBeTruthy();
    expect(getByTestId('vip-generate-access-button')).toBeTruthy();
    expect(queryByTestId('vip-member-access-block')).toBeNull();
    expect(mockedTrack).toHaveBeenCalledWith('vip_hub_viewed');
  });

  it('keeps all informative content visible in the blocked variant, replacing only the generate action', async () => {
    mockedUseMemberAccess.mockReturnValue({ hasMemberAccess: false, membershipEnabled: true, isLoading: false });
    mockedListEvents.mockResolvedValue([makeVipEvent()]);

    const { findByText, getByText, getByTestId, queryByTestId } = await render(<VipHubScreen />);

    await findByText('Corrida Base Fox 10K');
    // Informational content stays visible — it's what sells the subscription.
    expect(getByText(/lounge do clube/)).toBeTruthy();
    expect(getByText('Café')).toBeTruthy();
    expect(getByText('Cerveja')).toBeTruthy();
    expect(getByText('Food truck')).toBeTruthy();
    // ...but the generate action is replaced by the member-access block.
    expect(queryByTestId('vip-generate-access-button')).toBeNull();
    expect(getByTestId('vip-member-access-block')).toBeTruthy();

    fireEvent.press(getByTestId('vip-become-member-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Paywall', { source: 'vip_hub' });
  });

  it('shows an empty state and offers no access path when there is no upcoming VIP event', async () => {
    mockedUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: false, isLoading: false });
    mockedListEvents.mockResolvedValue([]);

    const { findByTestId, queryByTestId } = await render(<VipHubScreen />);

    await findByTestId('vip-hub-empty-state');
    expect(queryByTestId('vip-generate-access-button')).toBeNull();
    expect(queryByTestId('vip-member-access-block')).toBeNull();
  });

  it('generates the access and navigates to the QR screen for the next VIP event', async () => {
    mockedUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: false, isLoading: false });
    mockedListEvents.mockResolvedValue([makeVipEvent()]);
    mockedGetOrCreateAccess.mockResolvedValue({
      id: 'assoc_1_evt_1',
      associate_id: 'assoc_1',
      event_id: 'evt_1',
      issued_at: fakeTimestamp('2026-10-01T00:00:00Z'),
      expires_at: fakeTimestamp('2026-10-18T14:00:00Z'),
      revoked_at: null,
    });

    const { findByTestId, getByTestId } = await render(<VipHubScreen />);
    await findByTestId('vip-generate-access-button');

    fireEvent.press(getByTestId('vip-generate-access-button'));

    await waitFor(() => expect(mockedGetOrCreateAccess).toHaveBeenCalledWith('assoc_1', 'evt_1'));
    expect(mockedTrack).toHaveBeenCalledWith('vip_access_generated', { event_id: 'evt_1' });
    expect(mockNavigate).toHaveBeenCalledWith('VipQr', { eventId: 'evt_1' });
  });

  it('lists the VIP spaces after the next one', async () => {
    mockedUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: false, isLoading: false });
    mockedListEvents.mockResolvedValue([
      makeVipEvent({ id: 'evt_1', name: 'Corrida Base Fox 10K' }),
      makeVipEvent({ id: 'evt_2', name: 'Trilha da Pedra Grande', starts_at: fakeTimestamp('2026-10-26T10:00:00Z') }),
    ]);

    const { findByText, getByText } = await render(<VipHubScreen />);

    await findByText('Corrida Base Fox 10K');
    expect(getByText('Trilha da Pedra Grande')).toBeTruthy();
    expect(getByText('26 out')).toBeTruthy();
  });
});
