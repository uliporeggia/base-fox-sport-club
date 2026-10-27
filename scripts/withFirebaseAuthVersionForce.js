// @ts-check
const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * Forces the native `com.google.firebase:firebase-auth` Android artifact to
 * version 24.0.1, while leaving the rest of the Firebase BoM (Bill of
 * Materials) at @react-native-firebase's own modern default.
 *
 * Root cause: @react-native-firebase v27's default Firebase BoM resolves
 * `firebase-auth` to 25.0.0, whose embedded `.kotlin_module` metadata
 * (binary version 2.4.0) is newer than what the Kotlin Gradle plugin
 * pinned by Expo SDK 58 (2.2.x) can read:
 *
 *   Module was compiled with an incompatible version of Kotlin. The binary
 *   version of its metadata is 2.4.0, expected version is 2.2.0.
 *
 * `firebase-auth` 24.1.0+ carries the same incompatibility (metadata
 * 2.3.0). 24.0.1 is the newest version whose embedded metadata (2.1.0) a
 * 2.2.x compiler can still read.
 *
 * Why force only `firebase-auth`, instead of pinning the whole BoM down to
 * one old enough to resolve `firebase-auth` 24.0.1 (BoM 34.12.0): the
 * `@react-native-firebase/firestore` v27 native module
 * (`ReactNativeFirebaseFirestorePipelineExecutor.java`) calls
 * `SearchStage#withLanguageCode`/`withRetrievalDepth`/`withOffset`/`withLimit`,
 * which only exist on the `firebase-firestore` version resolved by the
 * *modern* BoM. Downgrading the whole BoM fixes `auth` and breaks
 * `firestore` (`cannot find symbol`) — verified empirically, not assumed.
 * Forcing just the `firebase-auth` artifact keeps `firestore` (and
 * `analytics`/`functions`) on the modern BoM's versions, so this is the
 * smaller-surface fix. Gradle's `resolutionStrategy.force` overrides the
 * BoM's version constraint for this one module while every other Firebase
 * artifact still resolves through the BoM normally; the transitive
 * dependencies `firebase-auth` 24.0.1 itself asks for (e.g. an older
 * `firebase-common`) lose the version conflict to the newer versions the
 * rest of the graph requests, which is fine — Firebase maintains binary
 * compatibility forward across adjacent releases, and this was confirmed by
 * compiling `:react-native-firebase_auth` and `:react-native-firebase_firestore`
 * independently against this setup before running the full build.
 *
 * `react-native-firebase_auth`'s own native sources were confirmed to
 * compile cleanly against 24.0.1 (no "cannot find symbol" on newer
 * `firebase-auth` APIs), so this version is also new enough for the
 * module's own code, not just for the Kotlin metadata constraint.
 *
 * This lives in a config plugin instead of a hand-edit to the generated
 * root `android/build.gradle` because `expo prebuild` regenerates that file
 * from scratch every time.
 *
 * Remove this plugin once @react-native-firebase ships an `auth` version
 * built against a Kotlin compiler the project's own Kotlin Gradle plugin
 * version can read.
 *
 * This file is plain CommonJS (not TypeScript) because Expo's config
 * loader only transpiles the `app.config.ts` entry point itself — a nested
 * `.ts` import from it is resolved through plain Node `require`, which
 * cannot load `.ts` files.
 *
 * @type {import('expo/config-plugins').ConfigPlugin}
 */
const withFirebaseAuthVersionForce = (config) => {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      throw new Error(
        'withFirebaseAuthVersionForce expects the root android/build.gradle to be Groovy.'
      );
    }
    modConfig.modResults.contents = injectForce(modConfig.modResults.contents);
    return modConfig;
  });
};

const FIREBASE_AUTH_VERSION = '24.0.1';

const MARKER = '/* withFirebaseAuthVersionForce */';

/** @param {string} contents */
function injectForce(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }

  const block = `
${MARKER}
allprojects {
  configurations.all {
    resolutionStrategy {
      force 'com.google.firebase:firebase-auth:${FIREBASE_AUTH_VERSION}'
    }
  }
}
`;

  const anchor = 'apply plugin: "expo-root-project"';
  if (contents.includes(anchor)) {
    return contents.replace(anchor, `${block}\n${anchor}`);
  }

  // Anchor not found (template changed) — append at the end so the override
  // still applies rather than silently doing nothing.
  return `${contents}\n${block}`;
}

module.exports = withFirebaseAuthVersionForce;
