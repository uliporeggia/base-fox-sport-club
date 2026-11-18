jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { jest } from '@jest/globals';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import { track } from '../../instrumentation';
import { registerDevice } from '../../../data/devicesRepository';
import { maybeRequestPushPermission } from '../permission';

jest.mock('../../instrumentation', () => ({
  track: jest.fn(),
}));

jest.mock('../../../data/devicesRepository', () => ({
  registerDevice: jest.fn(async () => undefined),
  removeDevice: jest.fn(async () => undefined),
}));

function mockSignedInAs(uid: string | null) {
  (getAuth as jest.Mock).mockReturnValue({ currentUser: uid ? { uid } : null });
}

function mockExplanationAccepted() {
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((b) => b.text === 'Ativar notificações')?.onPress?.();
  });
}

describe('maybeRequestPushPermission', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
      status: 'undetermined',
      granted: false,
    } as never);
    jest.spyOn(Notifications, 'getExpoPushTokenAsync').mockResolvedValue({
      data: 'ExponentPushToken[abc]',
      type: 'expo',
    } as never);
  });

  it('shows the explanation, requests permission, registers the device and tracks the result', async () => {
    mockSignedInAs('assoc-1');
    mockExplanationAccepted();
    jest.spyOn(Notifications, 'requestPermissionsAsync').mockResolvedValue({
      status: 'granted',
      granted: true,
    } as never);

    await maybeRequestPushPermission('first_rsvp');

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('push_permission_result', { granted: true });
    expect(registerDevice).toHaveBeenCalledWith('assoc-1', 'ExponentPushToken[abc]', expect.any(String));
  });

  // Reprodução do que o Android 13+ devolve de verdade, encontrado em emulador
  // (API 33) em 18/11/2026. Com `targetSdkVersion >= 33`, o expo-notifications
  // deriva o status de `areNotificationsEnabled()`, que é FALSO para quem nunca
  // concedeu a permissão — então o estado inicial chega como 'denied', nunca
  // como 'undetermined'. Os demais testes deste arquivo mockam 'undetermined' e
  // por isso nunca viram o problema: no aparelho, ninguém no Android 13+ era
  // sequer perguntado, e o registro do token nunca acontecia.
  it('pede a permissão no Android 13, onde o estado inicial chega como denied', async () => {
    mockSignedInAs('assoc-1');
    mockExplanationAccepted();
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: true,
    } as never);
    jest.spyOn(Notifications, 'requestPermissionsAsync').mockResolvedValue({
      status: 'granted',
      granted: true,
    } as never);

    await maybeRequestPushPermission('first_rsvp');

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('push_permission_result', { granted: true });
    expect(registerDevice).toHaveBeenCalledWith('assoc-1', 'ExponentPushToken[abc]', expect.any(String));
  });

  it('never asks nem instrumenta uma segunda vez, mas segue registrando o aparelho', async () => {
    mockSignedInAs('assoc-1');
    mockExplanationAccepted();
    jest.spyOn(Notifications, 'requestPermissionsAsync').mockResolvedValue({
      status: 'granted',
      granted: true,
    } as never);

    await maybeRequestPushPermission('first_rsvp');
    jest.clearAllMocks();
    // Depois de conceder, o SO passa a responder "granted" — o mock do
    // beforeEach ficou em "undetermined" e precisa acompanhar a realidade.
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
      status: 'granted',
      granted: true,
    } as never);

    await maybeRequestPushPermission('first_rsvp');

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    // O registro NÃO é "uma vez e pronto": é a garantia de que, havendo
    // permissão, este aparelho está em `devices`.
    expect(registerDevice).toHaveBeenCalledWith('assoc-1', 'ExponentPushToken[abc]', expect.any(String));
  });

  it('registra o aparelho quando a permissão já foi concedida fora do app, mesmo com o pedido já marcado como feito', async () => {
    // Cenário real encontrado em aparelho no dia 14/11/2026: a flag de "já
    // pedimos" tinha ficado gravada de uma sessão anterior, a permissão do SO
    // estava concedida, e `devices` continuava vazio no Firestore depois de um
    // RSVP bem-sucedido. O push nunca chegaria, sem erro em lugar nenhum.
    mockSignedInAs('assoc-1');
    await AsyncStorage.setItem('@base_fox/push_permission_asked', 'true');
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
      status: 'granted',
      granted: true,
    } as never);

    await maybeRequestPushPermission('first_rsvp');

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    expect(registerDevice).toHaveBeenCalledWith('assoc-1', 'ExponentPushToken[abc]', expect.any(String));
  });

  it('não registra quando o pedido já foi feito e o SO nega a permissão', async () => {
    mockSignedInAs('assoc-1');
    await AsyncStorage.setItem('@base_fox/push_permission_asked', 'true');
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
      status: 'denied',
      granted: false,
    } as never);

    await maybeRequestPushPermission('first_rsvp');

    expect(registerDevice).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('skips the explanation entirely when the OS permission is already settled (granted)', async () => {
    mockSignedInAs('assoc-1');
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
      status: 'granted',
      granted: true,
    } as never);
    const alertSpy = jest.spyOn(Alert, 'alert');

    await maybeRequestPushPermission('first_rsvp');

    expect(alertSpy).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('push_permission_result', { granted: true });
    expect(registerDevice).toHaveBeenCalled();
  });

  it('skips the explanation when the OS permission is blocked for good, and registers no device', async () => {
    mockSignedInAs('assoc-1');
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
      status: 'denied',
      granted: false,
      // Sem este `false` o caso descrito aqui seria o do Android 13 recém
      // instalado, onde perguntar é exatamente o que se espera.
      canAskAgain: false,
    } as never);
    const alertSpy = jest.spyOn(Alert, 'alert');

    await maybeRequestPushPermission('first_rsvp');

    expect(alertSpy).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('push_permission_result', { granted: false });
    expect(registerDevice).not.toHaveBeenCalled();
  });

  it('remains fully functional with nobody signed in (no crash, no device registration)', async () => {
    mockSignedInAs(null);
    mockExplanationAccepted();
    jest.spyOn(Notifications, 'requestPermissionsAsync').mockResolvedValue({
      status: 'granted',
      granted: true,
    } as never);

    await expect(maybeRequestPushPermission('first_rsvp')).resolves.toBeUndefined();
    expect(registerDevice).not.toHaveBeenCalled();
  });
});
