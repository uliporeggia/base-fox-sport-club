import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import { getNextEvent } from '../../../data/eventsRepository';
import { track } from '../../../lib/instrumentation';
import type { EventRecord, WithId } from '../../../data/types';
import { NextEventCard } from '../components/NextEventCard';
import { consumeEventsListResetToTodos } from '../lib/eventsListIntent';

jest.mock('../../../data/eventsRepository');
jest.mock('../../../lib/instrumentation', () => ({ track: jest.fn() }));
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return { ...actual, useNavigation: jest.fn() };
});

const mockGetNextEvent = getNextEvent as jest.Mock;
const mockUseNavigation = useNavigation as jest.Mock;
const mockTrack = track as jest.Mock;

const nextEvent: WithId<EventRecord> = {
  id: 'corrida-10k',
  name: 'Corrida Base Fox 10K',
  modality: 'corrida',
  distance: '10 km',
  starts_at: { toDate: () => new Date(2026, 9, 17, 6, 30) } as never,
  location: 'Villa-Lobos, SP',
  description: '',
  organizer: 'base_fox',
  has_vip: false,
  vip_window: null,
  vip_perks: [],
};

describe('NextEventCard', () => {
  const navigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigation.mockReturnValue({ navigate });
    // Drain whatever a previous test left pending.
    consumeEventsListResetToTodos();
  });

  it('renders the next event and opens its detail on press', async () => {
    mockGetNextEvent.mockResolvedValue(nextEvent);

    await render(<NextEventCard />);

    await waitFor(() => expect(screen.getByText('Corrida Base Fox 10K')).toBeTruthy());
    expect(screen.getByText('17')).toBeTruthy();
    expect(screen.getByText('Out')).toBeTruthy();

    fireEvent.press(screen.getByText('Corrida Base Fox 10K'));

    expect(mockTrack).toHaveBeenCalledWith('next_event_card_tapped', { event_id: 'corrida-10k' });
    expect(navigate).toHaveBeenCalledWith('Main', {
      screen: 'EventsTab',
      params: { screen: 'EventDetail', params: { eventId: 'corrida-10k' } },
    });
  });

  it('"Ver todos" requests the list reset to Todos and opens the Eventos tab', async () => {
    mockGetNextEvent.mockResolvedValue(nextEvent);

    await render(<NextEventCard />);
    await waitFor(() => expect(screen.getByText('Corrida Base Fox 10K')).toBeTruthy());

    fireEvent.press(screen.getByText('Ver todos'));

    expect(navigate).toHaveBeenCalledWith('Main', { screen: 'EventsTab', params: { screen: 'EventsList' } });
    expect(consumeEventsListResetToTodos()).toBe(true);
  });

  it('renders an empty state, without breaking, when there is no next event', async () => {
    mockGetNextEvent.mockResolvedValue(null);

    await render(<NextEventCard />);

    await waitFor(() => expect(screen.getByText('Próximo evento')).toBeTruthy());
    expect(screen.getByText('Nenhum evento agendado no momento.')).toBeTruthy();
  });

  it('renders nothing while the next event is still loading', async () => {
    mockGetNextEvent.mockReturnValue(new Promise(() => {}));

    const { toJSON } = await render(<NextEventCard />);

    expect(toJSON()).toBeNull();
  });
});
