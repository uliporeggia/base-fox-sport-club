/**
 * One-shot signal from "Ver todos" (Home's NextEventCard, tela 04) to the
 * Eventos list (tela 05): force the modality filter back to "Todos" for
 * that single navigation, without threading a nav param through
 * `EventsStackParamList` (owned by the foundation wave, not edited here)
 * and without clobbering the "preservar o filtro ao voltar do detalhe"
 * behavior, which relies on `EventsListScreen` keeping its own local state
 * untouched across every other kind of focus.
 */
let resetToTodosRequested = false;

/** Called by NextEventCard right before navigating to the Eventos tab via "Ver todos". */
export function requestEventsListResetToTodos(): void {
  resetToTodosRequested = true;
}

/** Called by EventsListScreen on focus. Returns true at most once per request. */
export function consumeEventsListResetToTodos(): boolean {
  if (!resetToTodosRequested) return false;
  resetToTodosRequested = false;
  return true;
}
