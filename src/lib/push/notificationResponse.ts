import * as Notifications from 'expo-notifications';

/**
 * Task 9.9 — opening the app on the referenced screen when the associate
 * taps a system notification. Every push this capability sends carries
 * enough in `notifications/{id}` to show the full detail in the inbox (14),
 * which the spec scenario explicitly accepts as the landing screen
 * ("abre o app na caixa de entrada OU na tela referenciada") — so this stays
 * entirely inside `src/lib/push/`, with no change to `src/navigation/**`:
 * the one integration point is the `navigateToInbox` callback the caller
 * passes in (see `PRECISO_DE_TERCEIRO` in the final report for the exact
 * wiring into RootNavigator.tsx).
 *
 * Handles both the warm-start case (app open/backgrounded, tap arrives as an
 * event) and the cold-start case (app was killed; the response that caused
 * the launch is read once on mount).
 */
export function registerNotificationResponseHandler(navigateToInbox: () => void): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(() => {
    navigateToInbox();
  });

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) navigateToInbox();
  });

  return () => subscription.remove();
}
