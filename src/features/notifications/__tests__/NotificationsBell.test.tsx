import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

let mockUnreadCount = 0;

jest.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: mockUnreadCount,
    isLoading: false,
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  }),
}));

// eslint-disable-next-line import/first
import { NotificationsBell } from '../components/NotificationsBell';

describe('NotificationsBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnreadCount = 0;
  });

  it('renders without an unread badge when there are no unread notifications', async () => {
    await render(<NotificationsBell />);
    expect(screen.getByLabelText('Notificações')).toBeTruthy();
    expect(screen.queryByLabelText(/não lidas/)).toBeNull();
  });

  it('shows the unread indicator when there is at least one unread notification', async () => {
    mockUnreadCount = 3;
    await render(<NotificationsBell />);
    expect(screen.getByLabelText('Notificações, 3 não lidas')).toBeTruthy();
  });

  it('navigates to the inbox on press', async () => {
    await render(<NotificationsBell />);
    fireEvent.press(screen.getByLabelText('Notificações'));
    expect(mockNavigate).toHaveBeenCalledWith('Notifications', { screen: 'Notifications' });
  });
});
