import { jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Timestamp } from '@react-native-firebase/firestore';
import { onAuthStateChanged, type NextOrObserver, type User } from '@react-native-firebase/auth';
import {
  subscribeNotifications,
  markAsRead,
  markAllAsRead,
} from '../../../data/notificationsRepository';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationRecord, WithId } from '../../../data/types';

jest.mock('../../../data/notificationsRepository', () => ({
  subscribeNotifications: jest.fn(),
  markAsRead: jest.fn(async () => undefined),
  markAllAsRead: jest.fn(async () => undefined),
}));

const mockedOnAuthStateChanged = jest.mocked(onAuthStateChanged);
const mockedSubscribeNotifications = jest.mocked(subscribeNotifications);

/** The real `onAuthStateChanged` callback is a `NextOrObserver<User>` (function or observer object) — tests only ever pass a plain function, so this narrows it back for them. */
function fireAuthStateChanged(user: Pick<User, 'uid'> | null) {
  mockedOnAuthStateChanged.mockImplementation((_auth, nextOrObserver: NextOrObserver<User>) => {
    (nextOrObserver as (user: unknown) => void)(user);
    return jest.fn();
  });
}

function notification(id: string, readAt: Date | null): WithId<NotificationRecord> {
  return {
    id,
    associate_id: 'assoc-1',
    type: 'rsvp_confirmed',
    title: `Title ${id}`,
    body: 'body',
    created_at: Timestamp.now(),
    read_at: readAt ? Timestamp.fromDate(readAt) : null,
  };
}

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns no data while signed out', async () => {
    fireAuthStateChanged(null);

    const { result } = await renderHook(() => useNotifications());

    expect(result.current.notifications).toBeNull();
    expect(result.current.unreadCount).toBe(0);
    expect(mockedSubscribeNotifications).not.toHaveBeenCalled();
  });

  it('subscribes once signed in and computes unread count', async () => {
    fireAuthStateChanged({ uid: 'assoc-1' });
    mockedSubscribeNotifications.mockImplementation((_associateId, onChange) => {
      onChange([notification('n1', null), notification('n2', new Date())]);
      return jest.fn();
    });

    const { result } = await renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.notifications).not.toBeNull());
    expect(result.current.unreadCount).toBe(1);
    expect(mockedSubscribeNotifications).toHaveBeenCalledWith('assoc-1', expect.any(Function));
  });

  it('markAllAsRead delegates to the repository with the current associate', async () => {
    fireAuthStateChanged({ uid: 'assoc-1' });
    mockedSubscribeNotifications.mockImplementation((_associateId, onChange) => {
      onChange([notification('n1', null)]);
      return jest.fn();
    });

    const { result } = await renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.notifications).not.toBeNull());

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(markAllAsRead).toHaveBeenCalledWith('assoc-1');
  });

  it('markAsRead delegates to the repository', async () => {
    fireAuthStateChanged({ uid: 'assoc-1' });
    mockedSubscribeNotifications.mockImplementation(() => jest.fn());

    const { result } = await renderHook(() => useNotifications());

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(markAsRead).toHaveBeenCalledWith('n1');
  });
});
