const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// getSentryExpoConfig wraps getDefaultConfig(__dirname) and wires up Sentry's
// Metro serializer/source-map support. Keep this as the single metro.config.js —
// do not replace with a plain expo/metro-config call.
const config = getSentryExpoConfig(__dirname);

module.exports = config;
