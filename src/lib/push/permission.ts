import * as Notifications from 'expo-notifications';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { track } from '../instrumentation';
import { getPushPermissionAsked, setPushPermissionAsked } from './storage';
import { explainAndRequestPermission, getOsPermissionStatus } from './explainAndRequestPermission';
import { registerCurrentDevice } from './deviceRegistration';

/**
 * Push permission request, triggered late — after the first value moment
 * (first confirmed RSVP), never at app open. See "Push real" in design.md.
 *
 * The events feature CALLS this (task 5.6, after `confirmRsvp` succeeds);
 * the notifications feature IMPLEMENTS it (task 9.5). Neither edits the
 * other's file — this seam is what lets both proceed independently.
 */
export type PushPermissionTrigger = 'first_rsvp';

// Lets the app show an alert/sound/banner while foregrounded; without this
// expo-notifications silently drops any push received while the app is
// open. Module-scope side effect, deliberately: this is the one file the
// events feature already imports, so it runs exactly once, as early as any
// other push setup here.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Explains what the club sends, asks the OS for notification permission
 * exactly once ever (per device), and — if granted — registers this
 * device's push token. Safe to call with nobody signed in or a permission
 * already resolved; always a no-op after the first call. See spec
 * "Permissão de notificação pedida no primeiro momento de valor".
 */
export async function maybeRequestPushPermission(trigger: PushPermissionTrigger): Promise<void> {
  void trigger;

  if (await getPushPermissionAsked()) return;

  const associateId = getAuth(getApp()).currentUser?.uid ?? null;

  // The OS may already have a resolved answer (e.g. the associate granted or
  // denied it outside this flow). Don't show our explanation on top of an
  // already-settled permission — just record it and move on.
  const status = await getOsPermissionStatus();
  const granted = status === 'undetermined' ? await explainAndRequestPermission() : status === 'granted';

  await setPushPermissionAsked();
  track('push_permission_result', { granted });

  if (granted && associateId) {
    await registerCurrentDevice(associateId);
  }
}
