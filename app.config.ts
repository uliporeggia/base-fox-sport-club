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
 *    into the native build, matching a Firebase project per environment,
 *  - the `environment` / `release` values exposed to Sentry.
 *
 * None of this requires a new app build to change later: swapping Firebase
 * project per environment is a file-path decision here, not app logic.
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

const googleServicesJson =
  process.env.GOOGLE_SERVICES_JSON ??
  (APP_ENV === 'production'
    ? './google-services.json'
    : `./google-services.${APP_ENV}.json`);

const googleServiceInfoPlist =
  process.env.GOOGLE_SERVICE_INFO_PLIST ??
  (APP_ENV === 'production'
    ? './GoogleService-Info.plist'
    : `./GoogleService-Info.${APP_ENV}.plist`);

// release: app version + an EAS-provided build identifier, falling back to
// "local" outside of an EAS Build (e.g. a developer's machine).
const release = `${process.env.APP_VERSION ?? '1.0.0'}+${
  process.env.EAS_BUILD_GIT_COMMIT_HASH ?? process.env.EAS_BUILD_ID ?? 'local'
}`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: appName,
  slug: 'base-fox-sport-club',
  // EAS project owner (transferred to oreggia-tech organization on 25/10/2026; projectId preserved)
  owner: 'oreggia-tech',
  scheme: 'basefox',
  version: '1.0.0',
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
