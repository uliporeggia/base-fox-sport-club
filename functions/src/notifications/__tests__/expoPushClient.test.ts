/// <reference types="jest" />
import { sendExpoPushNotifications, isDeviceNotRegistered } from '../expoPushClient';

describe('sendExpoPushNotifications', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns [] without calling fetch for an empty message list', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    expect(await sendExpoPushNotifications([])).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts to the Expo push endpoint and returns the tickets in order', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ data: [{ status: 'ok' }, { status: 'ok' }] }),
    } as Response);

    const tickets = await sendExpoPushNotifications([
      { to: 'token-1', title: 'T1', body: 'B1' },
      { to: 'token-2', title: 'T2', body: 'B2' },
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://exp.host/--/api/v2/push/send');
    expect(tickets).toEqual([{ status: 'ok' }, { status: 'ok' }]);
  });

  it('chunks requests into batches of at most 100 messages', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ data: Array.from({ length: 100 }, () => ({ status: 'ok' })) }),
    } as Response);

    const messages = Array.from({ length: 150 }, (_, i) => ({
      to: `token-${i}`,
      title: 'T',
      body: 'B',
    }));

    await sendExpoPushNotifications(messages);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('isDeviceNotRegistered', () => {
  it('is true only for the DeviceNotRegistered error detail', () => {
    expect(isDeviceNotRegistered({ status: 'error', details: { error: 'DeviceNotRegistered' } })).toBe(true);
    expect(isDeviceNotRegistered({ status: 'error', details: { error: 'MessageTooBig' } })).toBe(false);
    expect(isDeviceNotRegistered({ status: 'ok' })).toBe(false);
  });
});
