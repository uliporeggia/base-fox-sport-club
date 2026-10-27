jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {
  getPushPermissionAsked,
  setPushPermissionAsked,
  getStoredDeviceToken,
  setStoredDeviceToken,
  clearStoredDeviceToken,
} from '../storage';

describe('push/storage', () => {
  it('starts with permission not yet asked', async () => {
    expect(await getPushPermissionAsked()).toBe(false);
  });

  it('persists the asked flag across reads', async () => {
    await setPushPermissionAsked();
    expect(await getPushPermissionAsked()).toBe(true);
  });

  it('stores and clears the device token', async () => {
    expect(await getStoredDeviceToken()).toBeNull();
    await setStoredDeviceToken('ExponentPushToken[abc]');
    expect(await getStoredDeviceToken()).toBe('ExponentPushToken[abc]');
    await clearStoredDeviceToken();
    expect(await getStoredDeviceToken()).toBeNull();
  });
});
