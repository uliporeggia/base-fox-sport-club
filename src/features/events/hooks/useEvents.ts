import { useEffect, useState } from 'react';
import { listEvents } from '../../../data/eventsRepository';
import type { EventRecord, WithId } from '../../../data/types';
import type { EventModalityFilter } from '../../../navigation/types';

export type EventsLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; events: WithId<EventRecord>[] };

/** Fetches the upcoming events list (05), re-querying whenever the modality filter changes. */
export function useEvents(filter: EventModalityFilter): EventsLoadState {
  const [state, setState] = useState<EventsLoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });

    listEvents(filter === 'todos' ? {} : { modality: filter })
      .then((events) => {
        if (active) setState({ status: 'loaded', events });
      })
      .catch(() => {
        if (active) setState({ status: 'loaded', events: [] });
      });

    return () => {
      active = false;
    };
  }, [filter]);

  return state;
}
