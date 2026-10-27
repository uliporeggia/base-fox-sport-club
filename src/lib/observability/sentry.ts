/**
 * Sentry bootstrap (task 2.2, extended for OTA observability). `Sentry.init`
 * is called once from `App.tsx`, with `environment`/`release`/`dsn` read from
 * the EAS-build-provided values already exposed by `app.config.ts` under
 * `Constants.expoConfig.extra.sentry` (see "Sentry: configuração mínima viável"
 * in design.md) — this module does not invent its own configuration, it only
 * wires the existing one up.
 *
 * As of task 2.2.ota, the `dist` field is populated with the current update
 * identifier (or a fallback for embedded/unavailable scenarios), enabling
 * Sentry to distinguish errors from different OTA bundles of the same
 * `release`.
 */
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

interface SentryExtraConfig {
  dsn: string;
  environment: string;
  release: string;
}

function readSentryConfig(): SentryExtraConfig {
  const extra = Constants.expoConfig?.extra as { sentry?: Partial<SentryExtraConfig> } | undefined;
  const sentry = extra?.sentry;
  return {
    dsn: typeof sentry?.dsn === 'string' ? sentry.dsn : '',
    environment: typeof sentry?.environment === 'string' ? sentry.environment : 'development',
    release: typeof sentry?.release === 'string' ? sentry.release : 'local',
  };
}

/**
 * Resolves the distribution identifier (Sentry `dist` field) from the
 * currently running update. Requires expo-updates to be available; falls
 * back to honest sentinel values when unavailable or when the app is
 * running the embedded bundle.
 *
 * Returns:
 * - The update UUID (string) if expo-updates is enabled and a non-embedded update is running
 * - 'embedded' if the app is running the embedded bundle (OTA disabled or bundle is native)
 * - 'unknown' if expo-updates is unavailable or cannot be loaded
 *
 * Does not throw — designed to be called at init time without crashing
 * the app or Sentry initialization if expo-updates is not available.
 */
function resolveDist(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Updates = require('expo-updates') as typeof import('expo-updates');

    // If expo-updates is not enabled at all, we're running the embedded bundle.
    if (!Updates.isEnabled) {
      return 'embedded';
    }

    // If we are running an embedded launch (fallback to bundled JS),
    // or updateId is null (updates disabled), report as embedded.
    if (Updates.isEmbeddedLaunch || !Updates.updateId) {
      return 'embedded';
    }

    // We have a valid updateId from a downloaded OTA bundle.
    return Updates.updateId;
  } catch {
    // expo-updates unavailable, not loadable, or throwing —
    // distinguish "couldn't ask" from "asked, result is embedded" by
    // returning a different sentinel. This is honest: the code cannot
    // determine whether the app has updates available.
    return 'unknown';
  }
}

let initialized = false;

/**
 * Initializes Sentry with the environment/release/dist separation required by
 * "Separação de ambientes na observabilidade" in the spec, with per-bundle
 * identification via the `dist` field for OTA-enabled apps. Safe to call more
 * than once (only the first call takes effect). No-ops, with a dev warning,
 * when no DSN is configured — so local development without Sentry access
 * doesn't crash the app or silently start sending events to the wrong place.
 */
export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const { dsn, environment, release } = readSentryConfig();

  if (!dsn) {
    if (__DEV__) {
      console.warn('[observability] SENTRY_DSN não configurado — Sentry.init não foi chamado.');
    }
    return;
  }

  const dist = resolveDist();

  Sentry.init({
    dsn,
    environment,
    release,
    dist,
    debug: __DEV__,
  });
}
