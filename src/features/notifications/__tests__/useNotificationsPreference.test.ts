import { jest } from '@jest/globals';
import { Timestamp } from '@react-native-firebase/firestore';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { listDevicesByAssociate } from '../../../data/devicesRepository';
import { getOsPermissionStatus } from '../../../lib/push/explainAndRequestPermission';
import { registerCurrentDevice, clearDeviceRegistration } from '../../../lib/push/deviceRegistration';
import { getStoredDeviceToken } from '../../../lib/push/storage';
import { useNotificationsPreference } from '../hooks/useNotificationsPreference';

jest.mock('../../../data/devicesRepository', () => ({
  listDevicesByAssociate: jest.fn(),
}));
jest.mock('../../../lib/push/explainAndRequestPermission', () => ({
  getOsPermissionStatus: jest.fn(),
}));
jest.mock('../../../lib/push/deviceRegistration', () => ({
  registerCurrentDevice: jest.fn(async () => 'ExponentPushToken[abc]'),
  clearDeviceRegistration: jest.fn(async () => undefined),
}));
jest.mock('../../../lib/push/storage', () => ({
  getStoredDeviceToken: jest.fn(),
}));

describe('useNotificationsPreference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is off, and not loading, with no associate signed in', async () => {
    const { result } = await renderHook(() => useNotificationsPreference(null));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notificationsEnabled).toBe(false);
    expect(result.current.osPermissionDenied).toBe(false);
  });

  it('is on when this device token is among the associate devices', async () => {
    jest.mocked(getOsPermissionStatus).mockResolvedValue('granted');
    jest.mocked(getStoredDeviceToken).mockResolvedValue('ExponentPushToken[abc]');
    jest.mocked(listDevicesByAssociate).mockResolvedValue([
      { id: 'ExponentPushToken[abc]', associate_id: 'assoc-1', push_token: 'ExponentPushToken[abc]', platform: 'ios', updated_at: Timestamp.now() },
    ]);

    const { result } = await renderHook(() => useNotificationsPreference('assoc-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.notificationsEnabled).toBe(true);
    expect(result.current.osPermissionDenied).toBe(false);
  });

  it('reflects an OS-denied permission, explaining the switch must stay off', async () => {
    jest.mocked(getOsPermissionStatus).mockResolvedValue('denied');
    jest.mocked(getStoredDeviceToken).mockResolvedValue(null);
    jest.mocked(listDevicesByAssociate).mockResolvedValue([]);

    const { result } = await renderHook(() => useNotificationsPreference('assoc-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.osPermissionDenied).toBe(true);
    expect(result.current.notificationsEnabled).toBe(false);
  });

  it('turning the switch off clears the device registration', async () => {
    jest.mocked(getOsPermissionStatus).mockResolvedValue('granted');
    jest.mocked(getStoredDeviceToken).mockResolvedValue('ExponentPushToken[abc]');
    jest.mocked(listDevicesByAssociate).mockResolvedValue([
      { id: 'ExponentPushToken[abc]', associate_id: 'assoc-1', push_token: 'ExponentPushToken[abc]', platform: 'ios', updated_at: Timestamp.now() },
    ]);

    const { result } = await renderHook(() => useNotificationsPreference('assoc-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setNotificationsEnabled(false);
    });

    expect(clearDeviceRegistration).toHaveBeenCalledTimes(1);
  });

  it('turning the switch on re-registers this device', async () => {
    jest.mocked(getOsPermissionStatus).mockResolvedValue('granted');
    jest.mocked(getStoredDeviceToken).mockResolvedValue(null);
    jest.mocked(listDevicesByAssociate).mockResolvedValue([]);

    const { result } = await renderHook(() => useNotificationsPreference('assoc-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setNotificationsEnabled(true);
    });

    expect(registerCurrentDevice).toHaveBeenCalledWith('assoc-1');
  });
});
