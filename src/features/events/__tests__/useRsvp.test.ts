import { act, renderHook, waitFor } from '@testing-library/react-native';
import { confirmRsvp, cancelRsvp, listRsvpsByAssociate, subscribeRsvp } from '../../../data/rsvpsRepository';
import { maybeRequestPushPermission } from '../../../lib/push/permission';
import { track } from '../../../lib/instrumentation';
import { useRsvp } from '../hooks/useRsvp';

jest.mock('../../../data/rsvpsRepository');
// Explicit factory — a bare `jest.mock(path)` auto-mock still loads the real
// module first to infer its shape, which would pull in
// `@react-native-async-storage/async-storage` (native module, not present
// under plain jest-expo without extra config) through `lib/push/storage.ts`.
jest.mock('../../../lib/push/permission', () => ({
  maybeRequestPushPermission: jest.fn(),
}));
jest.mock('../../../lib/instrumentation');

const mockConfirmRsvp = confirmRsvp as jest.Mock;
const mockCancelRsvp = cancelRsvp as jest.Mock;
const mockListRsvpsByAssociate = listRsvpsByAssociate as jest.Mock;
const mockSubscribeRsvp = subscribeRsvp as jest.Mock;
const mockMaybeRequestPushPermission = maybeRequestPushPermission as jest.Mock;
const mockTrack = track as jest.Mock;

describe('useRsvp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribeRsvp.mockImplementation((_associateId, _eventId, onChange) => {
      onChange(null);
      return jest.fn();
    });
    mockConfirmRsvp.mockResolvedValue(undefined);
    mockCancelRsvp.mockResolvedValue(undefined);
  });

  it('requests push permission after the first-ever confirmed RSVP', async () => {
    mockListRsvpsByAssociate.mockResolvedValue([]);

    const { result } = await renderHook(() =>
      useRsvp({ associateId: 'assoc-1', eventId: 'evt-1', modality: 'corrida', hasVip: false }),
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(mockConfirmRsvp).toHaveBeenCalledWith('assoc-1', 'evt-1');
    expect(mockTrack).toHaveBeenCalledWith('rsvp_confirmed', {
      event_id: 'evt-1',
      modality: 'corrida',
      has_vip: false,
    });
    expect(mockMaybeRequestPushPermission).toHaveBeenCalledTimes(1);
    expect(mockMaybeRequestPushPermission).toHaveBeenCalledWith('first_rsvp');
  });

  it('does not request push permission again on a later confirmation', async () => {
    // The associate already has one prior RSVP — this is not their first ever.
    mockListRsvpsByAssociate.mockResolvedValue([{ id: 'assoc-1_evt-0', associate_id: 'assoc-1', event_id: 'evt-0' }]);

    const { result } = await renderHook(() =>
      useRsvp({ associateId: 'assoc-1', eventId: 'evt-2', modality: 'trilha', hasVip: true }),
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(mockConfirmRsvp).toHaveBeenCalledWith('assoc-1', 'evt-2');
    expect(mockMaybeRequestPushPermission).not.toHaveBeenCalled();
  });

  it('cancels an existing confirmation without requesting push permission', async () => {
    mockSubscribeRsvp.mockImplementation((_associateId, _eventId, onChange) => {
      onChange({ id: 'assoc-1_evt-1', associate_id: 'assoc-1', event_id: 'evt-1' } as never);
      return jest.fn();
    });

    const { result } = await renderHook(() =>
      useRsvp({ associateId: 'assoc-1', eventId: 'evt-1', modality: 'corrida', hasVip: false }),
    );

    await waitFor(() => expect(result.current.isConfirmed).toBe(true));

    await act(async () => {
      await result.current.toggle();
    });

    expect(mockCancelRsvp).toHaveBeenCalledWith('assoc-1', 'evt-1');
    expect(mockTrack).toHaveBeenCalledWith('rsvp_cancelled', {
      event_id: 'evt-1',
      modality: 'corrida',
      has_vip: false,
    });
    expect(mockMaybeRequestPushPermission).not.toHaveBeenCalled();
    expect(mockConfirmRsvp).not.toHaveBeenCalled();
  });

  it('does nothing when there is no signed-in associate', async () => {
    const { result } = await renderHook(() =>
      useRsvp({ associateId: null, eventId: 'evt-1', modality: 'corrida', hasVip: false }),
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(mockConfirmRsvp).not.toHaveBeenCalled();
    expect(mockMaybeRequestPushPermission).not.toHaveBeenCalled();
  });
});
