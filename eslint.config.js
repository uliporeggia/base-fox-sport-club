const expoConfig = require('eslint-config-expo/flat');
const { defineConfig, globalIgnores } = require('eslint/config');

module.exports = defineConfig([
  globalIgnores([
    'node_modules/**',
    'functions/**',
    'dist/**',
    '.expo/**',
    'android/**',
    'ios/**',
    'assets/**',
    'coverage/**',
    // Claude Design mockup tooling — generated, not app source. See design/README.md.
    'design/**',
  ]),
  ...expoConfig,
]);
