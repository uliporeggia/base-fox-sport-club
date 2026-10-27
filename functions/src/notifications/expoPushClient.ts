/**
 * Thin wrapper over the Expo push HTTP API. Tokens stored in `devices` are
 * Expo push tokens (`ExponentPushToken[...]`, from `getExpoPushTokenAsync`
 * in the app) — not FCM/APNs tokens — so dispatch goes through Expo's
 * `/push/send` endpoint directly via the Node 20 global `fetch`, no
 * `expo-server-sdk` dependency needed (functions/package.json is not ours to
 * touch per the contract).
 */

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

/** Expo accepts at most 100 messages per request. */
const MAX_MESSAGES_PER_REQUEST = 100;

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

/** One ticket per input message, in the same order — callers zip this back against the token that produced it. */
export async function sendExpoPushNotifications(
  messages: ExpoPushMessage[],
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  const tickets: ExpoPushTicket[] = [];
  for (let i = 0; i < messages.length; i += MAX_MESSAGES_PER_REQUEST) {
    const chunk = messages.slice(i, i + MAX_MESSAGES_PER_REQUEST);
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });
    const json = (await response.json()) as { data?: ExpoPushTicket[] };
    tickets.push(...(json.data ?? chunk.map(() => ({ status: 'error' as const }))));
  }
  return tickets;
}

/** Whether Expo reported this token as permanently invalid — the removal condition for task 9.8. */
export function isDeviceNotRegistered(ticket: ExpoPushTicket): boolean {
  return ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered';
}
