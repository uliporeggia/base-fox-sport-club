import { useCallback, useEffect, useState } from 'react';
import { listDevicesByAssociate } from '../../../data/devicesRepository';
import { getOsPermissionStatus } from '../../../lib/push/explainAndRequestPermission';
import { registerCurrentDevice, clearDeviceRegistration } from '../../../lib/push/deviceRegistration';
import { getStoredDeviceToken } from '../../../lib/push/storage';

export interface NotificationsPreference {
  isLoading: boolean;
  /** The Perfil switch's value: this device currently has a registered token. */
  notificationsEnabled: boolean;
  /** True when the OS permission is denied — Perfil shows "ative nos Ajustes do sistema" and should disable the switch (spec: "Interruptor refletindo permissão negada"). */
  osPermissionDenied: boolean;
  /**
   * Turns delivery on (re-registers this device's push token) or off
   * (removes it) WITHOUT touching the inbox (`notifications`) — task 9.4a.
   * Turning on when `osPermissionDenied` is true is a safe no-op: there is
   * no token to register until the associate grants permission in the
   * system Settings.
   */
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
}

/**
 * API_PARA_PERFIL (task 9.4a) — the "Notificações" row's single switch, in
 * the Perfil "Conta" section. Usage from the Perfil screen, which already
 * knows its own `associateId`:
 *
 *   const { isLoading, notificationsEnabled, osPermissionDenied, setNotificationsEnabled } =
 *     useNotificationsPreference(associateId);
 *   <Switch value={notificationsEnabled} disabled={osPermissionDenied} onValueChange={setNotificationsEnabled} />
 */
export function useNotificationsPreference(associateId: string | null): NotificationsPreference {
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [osPermissionDenied, setOsPermissionDenied] = useState(false);

  const refresh = useCallback(async () => {
    if (!associateId) {
      setIsLoading(false);
      setNotificationsEnabledState(false);
      setOsPermissionDenied(false);
      return;
    }
    setIsLoading(true);
    const [status, token, devices] = await Promise.all([
      getOsPermissionStatus(),
      getStoredDeviceToken(),
      listDevicesByAssociate(associateId),
    ]);
    setOsPermissionDenied(status === 'denied');
    setNotificationsEnabledState(Boolean(token) && devices.some((device) => device.id === token));
    setIsLoading(false);
  }, [associateId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setNotificationsEnabled = useCallback(
    async (enabled: boolean) => {
      if (!associateId) return;
      if (enabled) {
        await registerCurrentDevice(associateId);
      } else {
        await clearDeviceRegistration();
      }
      await refresh();
    },
    [associateId, refresh],
  );

  return { isLoading, notificationsEnabled, osPermissionDenied, setNotificationsEnabled };
}
