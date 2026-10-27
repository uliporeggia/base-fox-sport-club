import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * The "explicação prévia do que o clube envia" the spec requires before the
 * OS permission dialog (9.5) — a native `Alert` rather than a new screen, so
 * this capability doesn't need a seam into `src/navigation/**`. Resolves
 * `true` only if the associate taps through to the OS prompt AND the OS
 * grants it; `false` for "agora não" or an OS denial — either way the app
 * remembers it already asked (see `storage.ts`) and never shows this again.
 */
export async function explainAndRequestPermission(): Promise<boolean> {
  const wantsToProceed = await new Promise<boolean>((resolve) => {
    Alert.alert(
      'Avisos do Base Fox Sport Club',
      'Avisamos sobre novos eventos com espaço VIP, a confirmação da sua presença e novas parcerias. Você pode desligar quando quiser no Perfil.',
      [
        { text: 'Agora não', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Ativar notificações', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });

  if (!wantsToProceed) return false;

  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

export type OsPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Raw OS permission state — `undetermined` is the only one where it's still safe to show our explanation and ask. */
export async function getOsPermissionStatus(): Promise<OsPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

/** Current OS permission status, used by the Perfil toggle (9.4a) to show "ative nos Ajustes" when denied. */
export async function getOsPermissionGranted(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}
