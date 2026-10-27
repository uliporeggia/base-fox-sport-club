import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Pressable } from 'react-native';
import { listEvents } from '../../../data/eventsRepository';
import type { EventRecord, WithId } from '../../../data/types';
import EventsListScreen from '../screens/EventsListScreen';
import { requestEventsListResetToTodos } from '../lib/eventsListIntent';

jest.mock('../../../data/eventsRepository');

const mockListEvents = listEvents as jest.Mock;

function fakeEvent(overrides: Partial<EventRecord> & { id: string; date: Date }): WithId<EventRecord> {
  const { id, date, ...rest } = overrides;
  return {
    id,
    name: 'Evento',
    modality: 'corrida',
    distance: '10 km',
    starts_at: { toDate: () => date } as never,
    location: 'Villa-Lobos, SP',
    description: '',
    organizer: 'base_fox',
    has_vip: false,
    vip_window: null,
    vip_perks: [],
    ...rest,
  };
}

const CORRIDA_10K = fakeEvent({
  id: 'corrida-10k',
  date: new Date(2026, 9, 17),
  name: 'Corrida Base Fox 10K',
  modality: 'corrida',
});
const TRILHA = fakeEvent({
  id: 'trilha-pedra-grande',
  date: new Date(2026, 9, 26),
  name: 'Trilha da Pedra Grande',
  modality: 'trilha',
});
const TREKKING = fakeEvent({
  id: 'trekking-paranapiacaba',
  date: new Date(2026, 10, 8),
  name: 'Trekking Paranapiacaba',
  modality: 'trekking',
});

const Stack = createNativeStackNavigator();

/** A dummy EventDetail screen, just so pushing to it (and popping back) is observable. */
function DummyEventDetail({ navigation }: { navigation: { goBack: () => void } }) {
  return (
    <View>
      <Text>Tela de detalhe</Text>
      <Pressable onPress={() => navigation.goBack()}>
        <Text>Voltar</Text>
      </Pressable>
    </View>
  );
}

function renderWithNavigator() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="EventsList" component={EventsListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EventDetail" component={DummyEventDetail} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

describe('EventsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListEvents.mockImplementation(async ({ modality }: { modality?: string } = {}) => {
      const all = [CORRIDA_10K, TRILHA, TREKKING];
      return modality ? all.filter((event) => event.modality === modality) : all;
    });
  });

  it('groups events by month in chronological order, under "Todos"', async () => {
    await renderWithNavigator();

    await waitFor(() => expect(screen.getByText('Corrida Base Fox 10K')).toBeTruthy());
    expect(screen.getByText('Outubro')).toBeTruthy();
    expect(screen.getByText('Novembro')).toBeTruthy();
    expect(screen.getByText('Trilha da Pedra Grande')).toBeTruthy();
    expect(screen.getByText('Trekking Paranapiacaba')).toBeTruthy();
  });

  it('filters by modality and re-queries the repository', async () => {
    await renderWithNavigator();
    await waitFor(() => expect(screen.getByText('Corrida Base Fox 10K')).toBeTruthy());

    fireEvent.press(screen.getByText('Trilha'));

    await waitFor(() => expect(mockListEvents).toHaveBeenLastCalledWith({ modality: 'trilha' }));
    await waitFor(() => expect(screen.getByText('Trilha da Pedra Grande')).toBeTruthy());
    expect(screen.queryByText('Corrida Base Fox 10K')).toBeNull();
  });

  it('shows a modality-specific empty state when the filtered modality has no events', async () => {
    mockListEvents.mockImplementation(async ({ modality }: { modality?: string } = {}) => {
      if (modality === 'trekking') return [];
      const all = [CORRIDA_10K, TRILHA, TREKKING];
      return modality ? all.filter((event) => event.modality === modality) : all;
    });

    await renderWithNavigator();
    await waitFor(() => expect(screen.getByText('Corrida Base Fox 10K')).toBeTruthy());

    fireEvent.press(screen.getByText('Trekking'));

    await waitFor(() => expect(screen.getByText('Nenhum evento por aqui')).toBeTruthy());
    expect(screen.queryByText('Trekking Paranapiacaba')).toBeNull();
  });

  it('starts with "Todos" selected and shows the generic empty state when there are no events at all', async () => {
    mockListEvents.mockResolvedValue([]);

    await renderWithNavigator();

    await waitFor(() => expect(screen.getByText('Nenhum evento por aqui')).toBeTruthy());
    expect(screen.getByText('Novos eventos serão anunciados em breve.')).toBeTruthy();
  });

  it('preserves the selected modality filter after navigating to the detail and back', async () => {
    await renderWithNavigator();
    await screen.findByText('Corrida Base Fox 10K');

    fireEvent.press(await screen.findByText('Trilha'));
    await screen.findByText('Trilha da Pedra Grande');

    // The SectionList/VirtualizedList re-measures its visible window on a
    // real timer right after this filter switch, which can transiently
    // detach the just-found cell's fiber — retry the press until it lands
    // on a stable render instead of racing a single `getByText` against it.
    await waitFor(() => fireEvent.press(screen.getByText('Trilha da Pedra Grande')));
    await screen.findByText('Tela de detalhe');

    fireEvent.press(await screen.findByText('Voltar'));

    await screen.findByText('Trilha da Pedra Grande');
    expect(screen.queryByText('Corrida Base Fox 10K')).toBeNull();
    expect(mockListEvents).toHaveBeenLastCalledWith({ modality: 'trilha' });
  });

  it('resets the filter to "Todos" when eventsListIntent requests it on focus', async () => {
    requestEventsListResetToTodos();

    await renderWithNavigator();
    await waitFor(() => expect(screen.getByText('Corrida Base Fox 10K')).toBeTruthy());
    expect(screen.getByText('Trilha da Pedra Grande')).toBeTruthy();
    expect(mockListEvents).toHaveBeenCalledWith({});
  });
});
