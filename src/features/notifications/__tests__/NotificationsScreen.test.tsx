import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Timestamp } from '@react-native-firebase/firestore';
import { track } from '../../../lib/instrumentation';
import type { NotificationRecord, WithId } from '../../../data/types';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
  useFocusEffect: (jest.requireActual('react') as typeof import('react')).useEffect,
}));

jest.mock('../../../lib/instrumentation', () => ({
  track: jest.fn(),
}));

let mockNotificationsState: WithId<NotificationRecord>[] | null = null;
let mockMarkAllAsRead: jest.Mock;

jest.mock('../hooks/useNotifications', () => ({
  useNotifications: () => {
    const unreadCount = (mockNotificationsState ?? []).filter((n) => n.read_at === null).length;
    return {
      notifications: mockNotificationsState,
      unreadCount,
      isLoading: mockNotificationsState === null,
      markAsRead: jest.fn(),
      markAllAsRead: mockMarkAllAsRead,
    };
  },
}));

// Imported after the mocks above so the module under test picks them up.
// eslint-disable-next-line import/first
import NotificationsScreen from '../screens/NotificationsScreen';

function notification(
  id: string,
  createdAt: Date,
  readAt: Date | null,
  title = `Title ${id}`,
): WithId<NotificationRecord> {
  return {
    id,
    associate_id: 'assoc-1',
    type: 'rsvp_confirmed',
    title,
    body: `Body for ${id}`,
    created_at: Timestamp.fromDate(createdAt),
    read_at: readAt ? Timestamp.fromDate(readAt) : null,
  };
}

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarkAllAsRead = jest.fn(async () => undefined);
    mockNotificationsState = null;
  });

  it('shows the empty state with no error when there are no notifications', async () => {
    mockNotificationsState = [];
    await render(<NotificationsScreen />);
    expect(screen.getByText('Nenhuma notificação por aqui')).toBeTruthy();
  });

  it('renders notifications grouped by period, with unread ones highlighted', async () => {
    mockNotificationsState = [notification('n1', new Date(), null, 'Novo evento com espaço VIP')];
    await render(<NotificationsScreen />);
    expect(screen.getByText('Hoje')).toBeTruthy();
    expect(screen.getByText('Novo evento com espaço VIP')).toBeTruthy();
  });

  it('fires notifications_viewed with the unread count once data loads', async () => {
    mockNotificationsState = [notification('n1', new Date(), null), notification('n2', new Date(), new Date())];
    await render(<NotificationsScreen />);
    await waitFor(() =>
      expect(track).toHaveBeenCalledWith('notifications_viewed', { unread_count: 1 }),
    );
  });

  it(
    'auto-marks unread notifications as read after viewing, firing notifications_marked_read',
    async () => {
      // Real timers on purpose: this project's test-renderer setup doesn't
      // play well with `jest.useFakeTimers()` once a FlatList is mounted, so
      // this just waits past the (short, 1.5s) real auto-mark delay instead.
      mockNotificationsState = [notification('n1', new Date(), null)];
      await render(<NotificationsScreen />);

      await waitFor(() => expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1), { timeout: 3000 });
      expect(track).toHaveBeenCalledWith('notifications_marked_read');
    },
    8000,
  );

  it(
    'never auto-marks when the inbox is already fully read',
    async () => {
      mockNotificationsState = [notification('n1', new Date(), new Date())];
      await render(<NotificationsScreen />);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(mockMarkAllAsRead).not.toHaveBeenCalled();
    },
    8000,
  );

  it('"Marcar como lidos" marks everything as read on tap', async () => {
    mockNotificationsState = [notification('n1', new Date(), null)];
    await render(<NotificationsScreen />);

    fireEvent.press(screen.getByText('Marcar como lidos'));

    await waitFor(() => expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1));
  });

  it('goes back via the back button', async () => {
    mockNotificationsState = [];
    await render(<NotificationsScreen />);
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
