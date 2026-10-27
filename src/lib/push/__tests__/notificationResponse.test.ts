import { jest } from '@jest/globals';

const mockRemove = jest.fn<() => void>();
const mockAddListener = jest.fn<(cb: () => void) => { remove: () => void }>();
const mockGetLastResponse = jest.fn<() => Promise<{ notification: unknown } | null>>();

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: (cb: () => void) => mockAddListener(cb),
  getLastNotificationResponseAsync: () => mockGetLastResponse(),
}));

import { registerNotificationResponseHandler } from '../notificationResponse';

describe('registerNotificationResponseHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddListener.mockReturnValue({ remove: mockRemove });
    mockGetLastResponse.mockResolvedValue(null);
  });

  it('navigates to the inbox when a notification is tapped while the app is running', () => {
    let receivedCallback: (() => void) | undefined;
    mockAddListener.mockImplementation((cb: () => void) => {
      receivedCallback = cb;
      return { remove: mockRemove };
    });
    const navigateToInbox = jest.fn();

    registerNotificationResponseHandler(navigateToInbox);
    receivedCallback?.();

    expect(navigateToInbox).toHaveBeenCalledTimes(1);
  });

  it('navigates to the inbox for the response that cold-started the app', async () => {
    mockGetLastResponse.mockResolvedValue({ notification: {} });
    const navigateToInbox = jest.fn();

    registerNotificationResponseHandler(navigateToInbox);
    await Promise.resolve();
    await Promise.resolve();

    expect(navigateToInbox).toHaveBeenCalledTimes(1);
  });

  it('does nothing on cold start when there was no launching notification', async () => {
    const navigateToInbox = jest.fn();
    registerNotificationResponseHandler(navigateToInbox);
    await Promise.resolve();
    await Promise.resolve();
    expect(navigateToInbox).not.toHaveBeenCalled();
  });

  it('removes the listener subscription on cleanup', () => {
    const unregister = registerNotificationResponseHandler(jest.fn());
    unregister();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});
