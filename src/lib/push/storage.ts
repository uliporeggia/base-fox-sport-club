import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage keys for the push capability's local-only state — nothing
 * here is per-associate server state (that's `devices`/`notifications` in
 * Firestore); this is just "what has this device already been asked/told".
 */
const PERMISSION_ASKED_KEY = '@base_fox/push_permission_asked';
const DEVICE_TOKEN_KEY = '@base_fox/push_device_token';

/** Whether `maybeRequestPushPermission` has already run its explanation + OS prompt once on this device (9.5 — "nunca repetir o pedido"). */
export async function getPushPermissionAsked(): Promise<boolean> {
  return (await AsyncStorage.getItem(PERMISSION_ASKED_KEY)) === 'true';
}

export async function setPushPermissionAsked(): Promise<void> {
  await AsyncStorage.setItem(PERMISSION_ASKED_KEY, 'true');
}

/** The Expo push token last registered for this device, so it can be removed later (logout, toggle off) without asking the OS for it again. */
export async function getStoredDeviceToken(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_TOKEN_KEY);
}

export async function setStoredDeviceToken(token: string): Promise<void> {
  await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
}

export async function clearStoredDeviceToken(): Promise<void> {
  await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
}
