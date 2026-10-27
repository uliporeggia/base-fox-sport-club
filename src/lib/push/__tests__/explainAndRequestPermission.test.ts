import { jest } from '@jest/globals';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  explainAndRequestPermission,
  getOsPermissionStatus,
} from '../explainAndRequestPermission';

describe('explainAndRequestPermission', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('requests OS permission only after the associate taps through the explanation', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const confirm = buttons?.find((b) => b.text === 'Ativar notificações');
      confirm?.onPress?.();
    });
    const requestSpy = jest
      .spyOn(Notifications, 'requestPermissionsAsync')
      .mockResolvedValue({ status: 'granted', granted: true } as never);

    const granted = await explainAndRequestPermission();

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(granted).toBe(true);
  });

  it('never calls the OS prompt when the associate dismisses the explanation', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const decline = buttons?.find((b) => b.text === 'Agora não');
      decline?.onPress?.();
    });
    const requestSpy = jest.spyOn(Notifications, 'requestPermissionsAsync');

    const granted = await explainAndRequestPermission();

    expect(requestSpy).not.toHaveBeenCalled();
    expect(granted).toBe(false);
  });

  it('resolves false when the OS itself denies the request', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const confirm = buttons?.find((b) => b.text === 'Ativar notificações');
      confirm?.onPress?.();
    });
    jest
      .spyOn(Notifications, 'requestPermissionsAsync')
      .mockResolvedValue({ status: 'denied', granted: false } as never);

    expect(await explainAndRequestPermission()).toBe(false);
  });

  it.each([
    ['granted', true, 'granted'],
    ['denied', false, 'denied'],
    ['undetermined', false, 'undetermined'],
  ] as const)('maps OS status %s to %s', async (status, granted, expected) => {
    jest
      .spyOn(Notifications, 'getPermissionsAsync')
      .mockResolvedValue({ status, granted } as never);
    expect(await getOsPermissionStatus()).toBe(expected);
  });
});
