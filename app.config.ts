import type { ExpoConfig, ConfigContext } from 'expo/config';
import withFirebaseAuthVersionForce from './scripts/withFirebaseAuthVersionForce';

/**
 * Environment separation (dev / staging / production).
 *
 * `APP_ENV` is set by each EAS Build profile's `env` block (see eas.json) and,
 * for local runs, defaults to "development". It drives:
 *  - the app display name and bundle identifier / package name, so dev and
 *    staging builds can be installed side by side with production,
 *  - which `google-services.json` / `GoogleService-Info.plist` file is wired
 *    into the native build, matching a Firebase project per environment
 *    (the Android path is further overridable via `GOOGLE_SERVICES_JSON` —
 *    see `googleServicesJson` below),
 *  - the `environment` / `release` values exposed to Sentry.
 *
 * None of this requires a new app build to change later: swapping Firebase
 * project per environment is a file-path decision here, not app logic.
 *
 * The `google-services*.json` / `GoogleService-Info*.plist` files are
 * gitignored (never committed) but NOT eas-ignored (see `.easignore`) — EAS
 * Build uses `.easignore` instead of `.gitignore` to decide what to upload,
 * so these files do reach the build machine at the same relative path they
 * have locally.
 */
type AppEnv = 'development' | 'staging' | 'production';

function resolveAppEnv(): AppEnv {
  const raw = process.env.APP_ENV;
  if (raw === 'development' || raw === 'staging' || raw === 'production') {
    return raw;
  }
  return 'development';
}

const APP_ENV = resolveAppEnv();

const BASE_BUNDLE_ID = 'club.basefox.app';

const ENV_SUFFIX: Record<AppEnv, string> = {
  development: '.dev',
  staging: '.staging',
  production: '',
};

const ENV_NAME_SUFFIX: Record<AppEnv, string> = {
  development: ' (Dev)',
  staging: ' (Staging)',
  production: '',
};

const bundleIdentifier = `${BASE_BUNDLE_ID}${ENV_SUFFIX[APP_ENV]}`;
const appName = `Base Fox${ENV_NAME_SUFFIX[APP_ENV]}`;

// Single source of truth for the app version, shared by the `version` field
// below and by `release` further down — so the two can never drift apart.
const APP_VERSION = '1.0.0';

// Resolved purely from APP_ENV — NOT from an EAS file-type secret or
// environment variable override (NO `process.env.GOOGLE_SERVICES_JSON`,
// `GOOGLE_SERVICES_FILE`, etc.).
//
// That secret/env mechanism was tried and reverted: `runtimeVersion` uses the
// `fingerprint` policy (see below), which hashes the resolved Expo config —
// including these paths. Locally the secret env var is unset, so the config
// evaluates to the relative path below; on an EAS Build machine with the
// secret attached, it evaluated to the file's materialized *absolute* path
// instead. Different resolved config -> different fingerprint -> EAS Update
// aborted the build with "Runtime version calculated on local machine not
// equal to runtime version calculated during build." Do NOT reintroduce
// `process.env.*` overrides here — they reopen that exact divergence. These
// files now reach the build machine via `.easignore` (which EAS Build uses
// instead of `.gitignore` to pick upload contents), so both Android and iOS
// resolve the identical relative paths based purely on APP_ENV, without any
// environment variable or file-secret interference.
const googleServicesJson =
  APP_ENV === 'production'
    ? './google-services.json'
    : `./google-services.${APP_ENV}.json`;

// iOS: path resolved purely by APP_ENV, no env var override (no
// `GOOGLE_SERVICE_INFO_PLIST` — removed for the same fingerprint reason as
// above; see the comment on `googleServicesJson`).
const googleServiceInfoPlist =
  APP_ENV === 'production'
    ? './GoogleService-Info.plist'
    : `./GoogleService-Info.${APP_ENV}.plist`;

// release: app version + environment. Deliberately NOT derived from
// `EAS_BUILD_GIT_COMMIT_HASH` / `EAS_BUILD_ID` (or any other
// `process.env.EAS_BUILD_*` var) — those only exist on the EAS Build
// machine, never locally. `runtimeVersion` uses the `fingerprint` policy,
// which hashes the resolved Expo config, and this `extra.sentry.release`
// string is part of that resolved config. A build-only value here makes the
// locally-computed fingerprint diverge from the one computed during the
// build, and EAS Update aborts with "Runtime version calculated on local
// machine not equal to runtime version calculated during build." (measured:
// adding either var changes the config's hash). The commit that produced a
// build is not lost by dropping it from here — the EAS Build dashboard
// already records the commit per build, and `dist` (see
// src/lib/observability/sentry.ts) identifies the exact OTA bundle via
// `expo-updates`' `updateId`. Do NOT reintroduce an `EAS_BUILD_*` read here;
// if the commit is ever needed in Sentry, attach it as a tag/context at
// runtime, not as a config value.
const release = `${APP_VERSION}+${APP_ENV}`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: appName,
  slug: 'base-fox-sport-club',
  // EAS project owner (transferred to oreggia-tech organization on 25/10/2026; projectId preserved)
  owner: 'oreggia-tech',
  scheme: 'basefox',
  version: APP_VERSION,
  // EAS Update (expo-updates). The project has 14+ native modules (5 from
  // @react-native-firebase, Sentry, expo-notifications, expo-secure-store,
  // react-native-svg, ...) plus expo-build-properties' `useFrameworks:
  // "dynamic"` on iOS — any of those can change the native build without
  // `version` changing. The `appVersion` policy keys compatibility off
  // `version` alone, so it would happily serve a JS bundle built against a
  // newer/older native module set to an incompatible native build (OTA
  // updates can't touch native code, so that mismatch crashes the app in a
  // way no JS fix can undo). `nativeVersion` (version + build number) has
  // the same gap — neither one notices a native dependency change that
  // doesn't bump a version field. `fingerprint` instead hashes the actual
  // native project (config + native deps), so a build only ever receives
  // updates generated against the identical native surface it shipped with.
  // It costs a fingerprint computation per EAS Update publish/build, which is
  // an acceptable trade for not bricking installs.
  runtimeVersion: { policy: 'fingerprint' },
  updates: {
    url: 'https://u.expo.dev/e2021b0f-583e-45c8-8002-8d408180bbb1',
  },
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier,
    googleServicesFile: googleServiceInfoPlist,
  },
  android: {
    package: bundleIdentifier,
    googleServicesFile: googleServicesJson,
    adaptiveIcon: {
      backgroundColor: '#22092F',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-font',
    'expo-dev-client',
    'expo-web-browser',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#22092F',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/android-icon-foreground.png',
        color: '#5A1886',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'O Base Fox usa sua galeria para você escolher uma foto de perfil.',
      },
    ],
    [
      'expo-build-properties',
      {
        // Required by @react-native-firebase v27+ on iOS: Firebase's Apple
        // SDK (13+) ships only via Swift Package Manager, which needs
        // dynamic frameworks. Without this, the first iOS EAS build fails
        // at pod install. See node_modules/@react-native-firebase/app/plugin/src/ios/podfile.ts
        // and https://rnfirebase.io/ios-spm.
        ios: { useFrameworks: 'dynamic' },
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-firebase/analytics',
    // @expo/config-types' `plugins` type only declares string/tuple entries,
    // but the plugin resolver (@expo/config-plugins' withStaticPlugin) does
    // accept a function directly ("Function was provided, no need to
    // resolve"). This cast works around that type-definition gap, not
    // around an actual runtime constraint.
    withFirebaseAuthVersionForce as unknown as string,
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ],
  ],
  extra: {
    appEnv: APP_ENV,
    sentry: {
      environment: APP_ENV,
      release,
      dsn: process.env.SENTRY_DSN ?? '',
    },
    // EAS project ID (generated by eas init, 25/10/2026)
    eas: {
      projectId: 'e2021b0f-583e-45c8-8002-8d408180bbb1',
    },
  },
});
