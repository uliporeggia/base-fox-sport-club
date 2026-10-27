/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./src/test/setup.ts'],
  // `functions/` is its own package with its own jest config (ts transform
  // via babel + a node test environment) — running it under jest-expo here
  // breaks on missing globals (no `global.fetch`) that are environment
  // issues, not logic bugs. Each package runs its own suite.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/functions/'],
  transformIgnorePatterns: [
    // Same shape as jest-expo's own preset (no trailing "/" after the group —
    // that would require an exact folder-name boundary and silently stop
    // matching prefixed packages like "expo-modules-core"), plus
    // @react-native-firebase added for this project's native modules.
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|@react-native-firebase|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
