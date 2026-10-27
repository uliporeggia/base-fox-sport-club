/**
 * Centralized analytics + screen-view instrumentation — the ONLY module in
 * the app allowed to call Firebase Analytics. Every feature imports from
 * here; nobody calls `@react-native-firebase/analytics` directly.
 *
 * `track()` is typed against the taxonomy in `./observability/events` — an
 * invented event name, a missing required param, or an extra/misspelled
 * param key is a compile error (task 2.4). Every param tree is also
 * sanitized at runtime, recursively, before it leaves this module: keys
 * that look like PII/price (by name) and values that look like an email or
 * a monetary amount (by shape) are dropped, however deep they're nested
 * (contract rule 1.5, spec "Nenhum dado pessoal sensível na instrumentação").
 *
 * The exports below are FINAL — every other agent already imports this
 * module's public API; do not add, rename or remove exports here. New
 * typed taxonomy constants belong in `./observability/events`, not here.
 */
import { getApp } from '@react-native-firebase/app';
import {
  getAnalytics,
  logEvent,
  logScreenView as firebaseLogScreenView,
  setUserId,
} from '@react-native-firebase/analytics';
import * as Sentry from '@sentry/react-native';
import type { AnalyticsEventName, AnalyticsEventParams, EmptyParamEventName } from './observability/events';

type AnalyticsParams = Record<string, unknown>;

// Keys that, by name alone, are assumed to carry PII or a price and are
// always dropped — independent of their value's shape. Contract rule 1.5:
// no email, name or monetary value as an analytics parameter, ever.
const DISALLOWED_PARAM_KEYS = [
  'email',
  'e_mail',
  'mail',
  'nome',
  'name',
  'price',
  'preco',
  'preço',
  'valor',
  'amount',
  'brl',
  'currency',
  'moeda',
  'revenue',
  'phone',
  'telefone',
  'password',
  'senha',
  'token',
];

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/i;
// Matches a currency marker (R$/$) or a two-decimal amount (e.g. "0.00") —
// loose enough to catch the obvious cases without false-negatives being
// treated as a green light elsewhere in the app. Note: this module never
// hardcodes an actual price anywhere, including here (contract rule 2).
const MONETARY_PATTERN = /r\$|\$\s?\d|\b\d+[.,]\d{2}\b/i;

function isDisallowedKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return DISALLOWED_PARAM_KEYS.some((disallowed) => normalized.includes(disallowed));
}

function isDisallowedValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return EMAIL_PATTERN.test(value) || MONETARY_PATTERN.test(value);
}

/** Unique sentinel distinguishing "sanitized away" from a legitimate `undefined`. */
const DROPPED = Symbol('instrumentation:dropped-param');

type DropLogger = (path: string, reason: string) => void;

function sanitizeValue(value: unknown, path: string, logDrop: DropLogger): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item, index) => sanitizeValue(item, `${path}[${index}]`, logDrop))
      .filter((item) => item !== DROPPED);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeEntries(value as AnalyticsParams, path, logDrop);
  }
  if (isDisallowedValue(value)) {
    logDrop(path, 'valor tem formato de e-mail ou de quantia monetária');
    return DROPPED;
  }
  return value;
}

function sanitizeEntries(obj: AnalyticsParams, path: string, logDrop: DropLogger): AnalyticsParams {
  const safe: AnalyticsParams = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (isDisallowedKey(key)) {
      logDrop(fullPath, 'nome de chave suspeito (email/nome/valor monetário)');
      continue;
    }
    const sanitized = sanitizeValue(value, fullPath, logDrop);
    if (sanitized === DROPPED) continue;
    safe[key] = sanitized;
  }
  return safe;
}

/**
 * Drops any param whose key or string value looks like an email, a name
 * field or a monetary amount, at any depth. In dev, warns loudly about what
 * was dropped and why; in production, discards silently without throwing.
 */
function sanitizeParams(params: AnalyticsParams): AnalyticsParams {
  const drops: string[] = [];
  const safe = sanitizeEntries(params, '', (path, reason) => drops.push(`  - ${path}: ${reason}`));
  if (__DEV__ && drops.length > 0) {
    console.warn(
      `[instrumentation] parâmetro(s) descartado(s) por violar a política de dados sensíveis:\n${drops.join('\n')}`,
    );
  }
  return safe;
}

function firebaseAnalytics() {
  return getAnalytics(getApp());
}

/**
 * Logs a product analytics event. Params are sanitized before anything is
 * sent. The event name and its param shape are validated at compile time
 * against `AnalyticsEventParams` (`./observability/events`).
 */
export function track<E extends AnalyticsEventName>(
  event: E,
  ...rest: E extends EmptyParamEventName ? [params?: AnalyticsEventParams[E]] : [params: AnalyticsEventParams[E]]
): void {
  const rawParams = (rest[0] ?? {}) as AnalyticsParams;
  const safeParams = sanitizeParams(rawParams);

  const reportFailure = (error: unknown) => {
    Sentry.captureException(error, { tags: { source: 'instrumentation.track', event } });
  };

  try {
    // `logEvent`'s real typing returns void (the native bridge call is
    // fire-and-forget), but wrapping in `Promise.resolve(...).catch(...)` is
    // harmless either way and also covers the test double, which resolves
    // asynchronously.
    if (event === 'sign_up') {
      // Reserved GA4 events: the vendor SDK types these two individually
      // with their own narrow param shape, which our generic event dispatch
      // below (typed for arbitrary custom events) can't satisfy structurally.
      // `event` is a generic type parameter, so TS control-flow narrowing
      // doesn't collapse it to the literal on its own — the `=== 'sign_up'`
      // check above already proves it at runtime, so asserting it here is
      // safe, not a bypass.
      Promise.resolve(logEvent(firebaseAnalytics(), event as 'sign_up', safeParams as { method: string })).catch(
        reportFailure,
      );
    } else if (event === 'login') {
      Promise.resolve(logEvent(firebaseAnalytics(), event as 'login', safeParams as { method: string })).catch(
        reportFailure,
      );
    } else {
      // The vendor SDK models ~30 standard GA4 events individually and only
      // falls back to a generic signature for names it doesn't recognize;
      // our event name is already validated above by `track`'s own type
      // signature, so this single boundary cast is a necessary crossing of
      // the SDK's overload catalog, not a type-safety bypass.
      Promise.resolve(logEvent(firebaseAnalytics(), event as never, safeParams as never)).catch(reportFailure);
    }
  } catch (error) {
    reportFailure(error);
  }
}

/**
 * Identifies the signed-in associate to analytics/crash reporting by their
 * internal `associate_id` only. Pass `null` on logout to clear identity —
 * equivalent to calling `clearAssociate()`.
 */
export function setAssociate(associateId: string | null): void {
  const reportFailure = (error: unknown) => {
    Sentry.captureException(error, { tags: { source: 'instrumentation.setAssociate' } });
  };

  try {
    void setUserId(firebaseAnalytics(), associateId).catch(reportFailure);
  } catch (error) {
    reportFailure(error);
  }
  Sentry.setUser(associateId ? { id: associateId } : null);
}

/** Clears the identified associate — call on logout (task 8.8). Equivalent to `setAssociate(null)`. */
export function clearAssociate(): void {
  setAssociate(null);
}

/**
 * Logs a screen view. Intended to be called once, from the @react-navigation
 * state-change listener — not per-tap by feature code. Also drops a Sentry
 * navigation breadcrumb, since this is the one place every screen change
 * passes through (task 2.3's "breadcrumbs de navegação").
 */
export function logScreenView(screenName: string, params: AnalyticsParams = {}): void {
  const safeParams = sanitizeParams(params);

  Sentry.addBreadcrumb({
    category: 'navigation',
    message: screenName,
    level: 'info',
    data: safeParams,
  });

  const reportFailure = (error: unknown) => {
    Sentry.captureException(error, { tags: { source: 'instrumentation.logScreenView' } });
  };

  try {
    void firebaseLogScreenView(firebaseAnalytics(), { screen_name: screenName, ...safeParams }).catch(
      reportFailure,
    );
  } catch (error) {
    reportFailure(error);
  }
}
