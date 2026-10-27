jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import { registerDevice, removeDevice } from '../../../data/devicesRepository';
import { registerCurrentDevice, clearDeviceRegistration } from '../deviceRegistration';
import { getStoredDeviceToken } from '../storage';

jest.mock('../../../data/devicesRepository', () => ({
  registerDevice: jest.fn(async () => undefined),
  removeDevice: jest.fn(async () => undefined),
}));

describe('deviceRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers the current device token and caches it locally', async () => {
    jest
      .spyOn(Notifications, 'getExpoPushTokenAsync')
      .mockResolvedValue({ data: 'ExponentPushToken[abc]', type: 'expo' } as never);

    const token = await registerCurrentDevice('assoc-1');

    expect(token).toBe('ExponentPushToken[abc]');
    expect(registerDevice).toHaveBeenCalledWith('assoc-1', 'ExponentPushToken[abc]', expect.any(String));
    expect(await getStoredDeviceToken()).toBe('ExponentPushToken[abc]');
  });

  it('returns null without throwing when the token can not be obtained', async () => {
    jest.spyOn(Notifications, 'getExpoPushTokenAsync').mockRejectedValue(new Error('no credentials'));

    const token = await registerCurrentDevice('assoc-1');

    expect(token).toBeNull();
    expect(registerDevice).not.toHaveBeenCalled();
  });

  it('removes the cached token from devices on logout, without touching anything else', async () => {
    jest
      .spyOn(Notifications, 'getExpoPushTokenAsync')
      .mockResolvedValue({ data: 'ExponentPushToken[xyz]', type: 'expo' } as never);
    await registerCurrentDevice('assoc-1');

    await clearDeviceRegistration();

    expect(removeDevice).toHaveBeenCalledWith('ExponentPushToken[xyz]');
    expect(await getStoredDeviceToken()).toBeNull();
  });

  it('is a safe no-op on logout when no device was ever registered', async () => {
    await clearDeviceRegistration();
    expect(removeDevice).not.toHaveBeenCalled();
  });
});
