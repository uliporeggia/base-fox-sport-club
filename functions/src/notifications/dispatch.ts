import type { NotificationPayload } from './types';
import { sendExpoPushNotifications, isDeviceNotRegistered } from './expoPushClient';
import type { ExpoPushMessage } from './expoPushClient';

/**
 * The dependency seam that keeps `dispatchNotification` a pure, unit-testable
 * function — the trigger layer (`triggers.ts`) supplies the real
 * `firebase-admin`-backed implementation; tests supply fakes. This is the
 * "lógica de negócio em módulos Node/TS que recebem dados e retornam
 * resultado, com o trigger como camada fina" decision from design.md.
 */
export interface DispatchDeps {
  /** Writes one `notifications/{id}` doc — unconditional, independent of push delivery (spec: "Caixa de entrada como fonte de verdade"). */
  writeNotification(associateId: string, payload: NotificationPayload): Promise<void>;
  /** Every `devices` token currently registered for these associates. */
  listDeviceTokens(
    associateIds: string[],
  ): Promise<{ token: string; associateId: string }[]>;
  /** Removes one `devices/{token}` doc — task 9.8, invalid-token cleanup. */
  deleteDevice(token: string): Promise<void>;
  sendPush(messages: ExpoPushMessage[]): Promise<Awaited<ReturnType<typeof sendExpoPushNotifications>>>;
}

export interface DispatchResult {
  notifiedAssociates: number;
  pushesSent: number;
  tokensRemoved: number;
}

/**
 * The one entry point every notification type trigger calls through
 * (task 9.7): writes the inbox doc for every target associate first — this
 * happens whether or not any device token exists, whether or not the push
 * actually reaches a device — then best-efforts a push to whatever device
 * tokens those associates have, removing any Expo reports as permanently
 * invalid (task 9.8).
 */
export async function dispatchNotification(
  targetAssociateIds: string[],
  payload: NotificationPayload,
  deps: DispatchDeps,
): Promise<DispatchResult> {
  const uniqueAssociateIds = Array.from(new Set(targetAssociateIds));

  await Promise.all(
    uniqueAssociateIds.map((associateId) => deps.writeNotification(associateId, payload)),
  );

  const deviceTokens = await deps.listDeviceTokens(uniqueAssociateIds);
  let tokensRemoved = 0;

  if (deviceTokens.length > 0) {
    const messages: ExpoPushMessage[] = deviceTokens.map(({ token }) => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: { type: payload.type, ...payload.data },
    }));
    const tickets = await deps.sendPush(messages);

    await Promise.all(
      tickets.map(async (ticket, index) => {
        if (isDeviceNotRegistered(ticket)) {
          await deps.deleteDevice(deviceTokens[index].token);
          tokensRemoved += 1;
        }
      }),
    );
  }

  return {
    notifiedAssociates: uniqueAssociateIds.length,
    pushesSent: deviceTokens.length - tokensRemoved,
    tokensRemoved,
  };
}
