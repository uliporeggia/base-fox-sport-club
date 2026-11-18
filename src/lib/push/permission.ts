import * as Notifications from 'expo-notifications';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { track } from '../instrumentation';
import { getPushPermissionAsked, setPushPermissionAsked } from './storage';
import { explainAndRequestPermission, getOsPermissionState } from './explainAndRequestPermission';
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

  const associateId = getAuth(getApp()).currentUser?.uid ?? null;
  const alreadyAsked = await getPushPermissionAsked();

  // The OS answer is the source of truth for whether we may send push. Our
  // stored flag answers a DIFFERENT question — "have we already shown our
  // explanation?" — and the two must not be conflated.
  //
  // They were, and it cost us silent push failure on a real device: the flag
  // used to short-circuit this whole function, so once it was set the token
  // was never registered again. An associate who denied the permission and
  // later enabled notifications in the OS settings would stay unregistered
  // forever, with no error anywhere; so would anyone whose first registration
  // failed transiently (offline at that moment). Found on 14/11/2026 with
  // `devices` empty in Firestore after a successful RSVP.
  const { status, canAskAgain } = await getOsPermissionState();
  let granted = status === 'granted';

  // Pergunta no máximo uma vez na vida (9.5, "nunca repetir o pedido") e só
  // enquanto o sistema ainda aceita o pedido. O portão é `!granted &&
  // canAskAgain`, NÃO `status === 'undetermined'`.
  //
  // Foi assim que a 9.10 encontrou, em 18/11/2026, um bug que valia a
  // funcionalidade inteira no Android 13+: lá o expo-notifications deriva o
  // status de `areNotificationsEnabled()`, falso para quem nunca concedeu a
  // permissão, então o estado inicial chega como 'denied' e nunca como
  // 'undetermined'. O portão antigo jamais abria — ninguém no Android 13+ era
  // perguntado, nenhum token era registrado, e o push simplesmente não existia
  // para a maior parte dos aparelhos. Pior: a flag era marcada do mesmo jeito,
  // de modo que nem uma correção posterior faria o app perguntar. Provado em
  // emulador API 33 e confirmado no fonte Kotlin do módulo.
  //
  // A flag e o evento continuam fora desse `if` interno de propósito: no
  // Android 12 a permissão já nasce concedida, e só instrumentar quando houve
  // pergunta apagaria do funil justamente quem consegue receber push.
  if (!alreadyAsked) {
    if (!granted && canAskAgain) {
      granted = await explainAndRequestPermission();
    }
    await setPushPermissionAsked();
    track('push_permission_result', { granted });
  }

  // Registration, unlike the ask, is idempotent and self-healing: whenever
  // the OS allows push and someone is signed in, make sure this device is in
  // `devices`. `registerCurrentDevice` upserts and swallows its own failures.
  if (granted && associateId) {
    await registerCurrentDevice(associateId);
  }
}
