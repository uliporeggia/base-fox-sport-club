/// <reference types="jest" />
import { dispatchNotification, type DispatchDeps } from '../dispatch';
import type { NotificationPayload } from '../types';
import type { ExpoPushTicket } from '../expoPushClient';

function fakeDeps(overrides: Partial<DispatchDeps> = {}): DispatchDeps {
  return {
    writeNotification: jest.fn(async () => undefined),
    listDeviceTokens: jest.fn(async () => []),
    deleteDevice: jest.fn(async () => undefined),
    sendPush: jest.fn(async () => []),
    ...overrides,
  };
}

const payload: NotificationPayload = {
  type: 'rsvp_confirmed',
  title: 'Presença confirmada',
  body: 'Corrida Base Fox 10K, sábado às 6h30. Sua presença está confirmada.',
};

describe('dispatchNotification', () => {
  it('writes the inbox notification for every target associate, de-duplicated', async () => {
    const deps = fakeDeps();

    await dispatchNotification(['assoc-1', 'assoc-2', 'assoc-1'], payload, deps);

    expect(deps.writeNotification).toHaveBeenCalledTimes(2);
    expect(deps.writeNotification).toHaveBeenCalledWith('assoc-1', payload);
    expect(deps.writeNotification).toHaveBeenCalledWith('assoc-2', payload);
  });

  it('writes the notification even when there is no device to push to', async () => {
    const deps = fakeDeps({ listDeviceTokens: jest.fn(async () => []) });

    const result = await dispatchNotification(['assoc-1'], payload, deps);

    expect(deps.writeNotification).toHaveBeenCalledWith('assoc-1', payload);
    expect(deps.sendPush).not.toHaveBeenCalled();
    expect(result.notifiedAssociates).toBe(1);
  });

  it('writes the notification even when the push send itself fails for that associate', async () => {
    const deps = fakeDeps({
      listDeviceTokens: jest.fn(async () => [{ token: 'tok-1', associateId: 'assoc-1' }]),
      sendPush: jest.fn(
        async (): Promise<ExpoPushTicket[]> => [
          { status: 'error', details: { error: 'MessageRateExceeded' } },
        ],
      ),
    });

    await dispatchNotification(['assoc-1'], payload, deps);

    expect(deps.writeNotification).toHaveBeenCalledWith('assoc-1', payload);
    expect(deps.deleteDevice).not.toHaveBeenCalled();
  });

  it('removes a token Expo reports as permanently invalid (task 9.8), without affecting the others', async () => {
    const deps = fakeDeps({
      listDeviceTokens: jest.fn(async () => [
        { token: 'tok-good', associateId: 'assoc-1' },
        { token: 'tok-bad', associateId: 'assoc-2' },
      ]),
      sendPush: jest.fn(
        async (): Promise<ExpoPushTicket[]> => [
          { status: 'ok' },
          { status: 'error', details: { error: 'DeviceNotRegistered' } },
        ],
      ),
    });

    const result = await dispatchNotification(['assoc-1', 'assoc-2'], payload, deps);

    expect(deps.deleteDevice).toHaveBeenCalledTimes(1);
    expect(deps.deleteDevice).toHaveBeenCalledWith('tok-bad');
    expect(result.tokensRemoved).toBe(1);
  });

  it('sends one push per registered device token, addressed correctly', async () => {
    const deps = fakeDeps({
      listDeviceTokens: jest.fn(async () => [
        { token: 'tok-1', associateId: 'assoc-1' },
        { token: 'tok-2', associateId: 'assoc-1' },
      ]),
      sendPush: jest.fn(async (): Promise<ExpoPushTicket[]> => [{ status: 'ok' }, { status: 'ok' }]),
    });

    await dispatchNotification(['assoc-1'], payload, deps);

    expect(deps.sendPush).toHaveBeenCalledWith([
      { to: 'tok-1', title: payload.title, body: payload.body, data: { type: payload.type } },
      { to: 'tok-2', title: payload.title, body: payload.body, data: { type: payload.type } },
    ]);
  });
});
