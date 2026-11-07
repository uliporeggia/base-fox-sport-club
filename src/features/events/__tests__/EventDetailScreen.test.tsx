import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import { getEvent } from '../../../data/eventsRepository';
import { useMemberAccess } from '../../../lib/membership/gate';
import { track } from '../../../lib/instrumentation';
import type { EventRecord, WithId } from '../../../data/types';
import { useAssociateId } from '../hooks/useAssociateId';
import { useRsvp } from '../hooks/useRsvp';
import EventDetailScreen from '../screens/EventDetailScreen';

jest.mock('../../../data/eventsRepository');
// Explicit factories for modules whose real implementation now reaches into
// native modules (AsyncStorage) not wired up for plain jest-expo — a bare
// `jest.mock(path)` auto-mock still loads the real module first to infer
// its shape, which would execute those imports anyway.
jest.mock('../../../lib/membership/gate', () => ({
  useMemberAccess: jest.fn(),
}));
jest.mock('../../../lib/instrumentation', () => ({
  track: jest.fn(),
}));
jest.mock('../hooks/useAssociateId', () => ({
  useAssociateId: jest.fn(),
}));
// Factory for the same reason as above: the real useRsvp pulls in
// lib/push/permission → lib/push/storage → AsyncStorage transitively.
jest.mock('../hooks/useRsvp', () => ({
  useRsvp: jest.fn(),
}));
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return { ...actual, useNavigation: jest.fn() };
});

const mockGetEvent = getEvent as jest.Mock;
const mockUseMemberAccess = useMemberAccess as jest.Mock;
const mockUseAssociateId = useAssociateId as jest.Mock;
const mockUseRsvp = useRsvp as jest.Mock;
const mockUseNavigation = useNavigation as jest.Mock;
const mockTrack = track as jest.Mock;

const baseEvent: WithId<EventRecord> = {
  id: 'evt-1',
  name: 'Corrida Base Fox 10K',
  modality: 'corrida',
  distance: '10 km',
  starts_at: { toDate: () => new Date('2026-10-17T06:30:00-03:00') } as never,
  location: 'Villa-Lobos, SP',
  description: 'Uma corrida de 10km pelo parque.',
  organizer: 'base_fox',
  has_vip: false,
  vip_window: null,
  vip_perks: [],
};

function routeFor(eventId: string) {
  return { key: 'EventDetail', name: 'EventDetail' as const, params: { eventId } };
}

describe('EventDetailScreen', () => {
  const navigate = jest.fn();
  const goBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigation.mockReturnValue({ navigate, goBack });
    mockUseAssociateId.mockReturnValue('assoc-1');
    mockUseRsvp.mockReturnValue({ isConfirmed: false, isSubmitting: false, toggle: jest.fn() });
  });

  it('tracks event_viewed once the event loads', async () => {
    mockGetEvent.mockResolvedValue(baseEvent);
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: false, isLoading: false });

    await render(<EventDetailScreen route={routeFor('evt-1')} navigation={{} as never} />);

    await waitFor(() => expect(mockTrack).toHaveBeenCalledWith('event_viewed', { event_id: 'evt-1' }));
  });

  it('renders no VIP block at all when the event has no VIP space', async () => {
    mockGetEvent.mockResolvedValue({ ...baseEvent, has_vip: false });
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: false, membershipEnabled: true, isLoading: false });

    await render(<EventDetailScreen route={routeFor('evt-1')} navigation={{} as never} />);

    await waitFor(() => expect(screen.getByText('Corrida Base Fox 10K')).toBeTruthy());
    expect(screen.queryByText('Espaço VIP disponível')).toBeNull();
    expect(screen.queryByText('Espaço VIP')).toBeNull();
    expect(screen.getByText('Confirmar presença')).toBeTruthy();
  });

  it('renders the "com acesso" VIP variant with perks and window', async () => {
    mockGetEvent.mockResolvedValue({
      ...baseEvent,
      has_vip: true,
      vip_perks: ['Café', 'Cerveja', 'Food truck'],
      vip_window: {
        starts_at: { toDate: () => new Date('2026-10-17T10:00:00-03:00') } as never,
        ends_at: { toDate: () => new Date('2026-10-17T14:00:00-03:00') } as never,
      },
    });
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: true, isLoading: false });

    await render(<EventDetailScreen route={routeFor('evt-1')} navigation={{} as never} />);

    await waitFor(() => expect(screen.getByText('Espaço VIP disponível')).toBeTruthy());
    expect(screen.getByText('• Café')).toBeTruthy();
    expect(screen.getByText(/10h00 – 14h00/)).toBeTruthy();
    expect(screen.queryByText('Exclusivo para membros.')).toBeNull();
    // Member plan: RSVP stays the primary, single action — no "convite" alongside it.
    expect(screen.getByText('Confirmar presença')).toBeTruthy();
  });

  it('renders the "sem acesso" VIP variant with the become-a-member CTA, and the secondary RSVP action', async () => {
    mockGetEvent.mockResolvedValue({ ...baseEvent, has_vip: true, vip_perks: ['Café'] });
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: false, membershipEnabled: true, isLoading: false });

    await render(<EventDetailScreen route={routeFor('evt-1')} navigation={{} as never} />);

    await waitFor(() => expect(screen.getByText('Exclusivo para membros.')).toBeTruthy());
    expect(screen.queryByText('Espaço VIP disponível')).toBeNull();
    // Free plan + has_vip: the RSVP action becomes "Confirmar só a presença" (secondary), next to the member CTA.
    expect(screen.getByText('Confirmar só a presença')).toBeTruthy();

    fireEvent.press(screen.getByText('Assinar para acessar VIP'));
    expect(navigate).toHaveBeenCalledWith('Paywall', { source: 'event_detail' });
  });

  it('toggles RSVP on press, through useRsvp', async () => {
    const toggle = jest.fn();
    mockGetEvent.mockResolvedValue(baseEvent);
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: false, isLoading: false });
    mockUseRsvp.mockReturnValue({ isConfirmed: false, isSubmitting: false, toggle });

    await render(<EventDetailScreen route={routeFor('evt-1')} navigation={{} as never} />);

    await waitFor(() => expect(screen.getByText('Confirmar presença')).toBeTruthy());
    fireEvent.press(screen.getByText('Confirmar presença'));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('shows the confirmed label once RSVP is confirmed', async () => {
    mockGetEvent.mockResolvedValue(baseEvent);
    mockUseMemberAccess.mockReturnValue({ hasMemberAccess: true, membershipEnabled: false, isLoading: false });
    mockUseRsvp.mockReturnValue({ isConfirmed: true, isSubmitting: false, toggle: jest.fn() });

    await render(<EventDetailScreen route={routeFor('evt-1')} navigation={{} as never} />);

    await waitFor(() => expect(screen.getByText('Presença confirmada')).toBeTruthy());
  });
});
