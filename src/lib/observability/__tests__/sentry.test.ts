/**
 * Tests for src/lib/observability/sentry.ts — Sentry initialization with
 * expo-updates integration for OTA observability (task 2.2.ota).
 *
 * Module state (`initialized` flag) is reset per test via jest.resetModules(),
 * and each test case loads its own mocks via jest.doMock() to avoid
 * cross-test interference.
 */
import { jest } from '@jest/globals';

/**
 * Helper: loads sentry.ts and Sentry mock within an isolated module scope,
 * after applying custom mocks. Returns both for assertions.
 */
function loadSentryWithMocks(setupMocks: () => void) {
  jest.resetModules();
  setupMocks();
  // Must load both inside isolateModules so they see the mocks.
  let initSentry: any;
  let Sentry: any;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    initSentry = require('../sentry').initSentry;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Sentry = require('@sentry/react-native');
  });
  return { initSentry, Sentry };
}

describe('observability/sentry.ts', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('resolveDist()', () => {
    it('returns the updateId when expo-updates is enabled and a non-embedded update is running', () => {
      const mockUpdateId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
      const { initSentry, Sentry } = loadSentryWithMocks(() => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: {
            expoConfig: {
              extra: {
                sentry: {
                  dsn: 'https://example@sentry.io/123456',
                  environment: 'production',
                  release: '1.0.0',
                },
              },
            },
          },
        }));
        jest.doMock('expo-updates', () => ({
          isEnabled: true,
          isEmbeddedLaunch: false,
          updateId: mockUpdateId,
        }));
      });

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://example@sentry.io/123456',
          release: '1.0.0',
          dist: mockUpdateId,
        }),
      );
    });

    it('returns "embedded" when isEmbeddedLaunch is true', () => {
      const { initSentry, Sentry } = loadSentryWithMocks(() => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: {
            expoConfig: {
              extra: {
                sentry: {
                  dsn: 'https://example@sentry.io/123456',
                  environment: 'staging',
                  release: '1.0.0-rc1',
                },
              },
            },
          },
        }));
        jest.doMock('expo-updates', () => ({
          isEnabled: true,
          isEmbeddedLaunch: true,
          updateId: null,
        }));
      });

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dist: 'embedded',
        }),
      );
    });

    it('returns "embedded" when updateId is null and expo-updates is disabled', () => {
      const { initSentry, Sentry } = loadSentryWithMocks(() => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: {
            expoConfig: {
              extra: {
                sentry: {
                  dsn: 'https://example@sentry.io/123456',
                  environment: 'development',
                  release: 'local',
                },
              },
            },
          },
        }));
        jest.doMock('expo-updates', () => ({
          isEnabled: false,
          isEmbeddedLaunch: false,
          updateId: null,
        }));
      });

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dist: 'embedded',
        }),
      );
    });

    it('returns "unknown" when expo-updates cannot be loaded', () => {
      const { initSentry, Sentry } = loadSentryWithMocks(() => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: {
            expoConfig: {
              extra: {
                sentry: {
                  dsn: 'https://example@sentry.io/123456',
                  environment: 'production',
                  release: '1.0.0',
                },
              },
            },
          },
        }));
        jest.doMock('expo-updates', () => {
          throw new Error('expo-updates not available');
        });
      });

      // Should not throw despite expo-updates being unavailable.
      expect(() => initSentry()).not.toThrow();

      // Sentry.init should still be called with 'unknown' as dist.
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dist: 'unknown',
        }),
      );
    });

    it('still initializes Sentry even when expo-updates throws', () => {
      const { initSentry, Sentry } = loadSentryWithMocks(() => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: {
            expoConfig: {
              extra: {
                sentry: {
                  dsn: 'https://example@sentry.io/123456',
                  environment: 'production',
                  release: '1.0.0',
                },
              },
            },
          },
        }));
        jest.doMock('expo-updates', () => {
          throw new Error('some unexpected error');
        });
      });

      initSentry();

      // Verify Sentry.init was called (initialization succeeded).
      expect(Sentry.init).toHaveBeenCalled();
    });
  });

  describe('initSentry()', () => {
    it('does not call Sentry.init when DSN is not configured', () => {
      const { initSentry, Sentry } = loadSentryWithMocks(() => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: {
            expoConfig: {
              extra: {
                sentry: {
                  dsn: '',
                  environment: 'development',
                  release: 'local',
                },
              },
            },
          },
        }));
        jest.doMock('expo-updates', () => ({
          isEnabled: false,
          isEmbeddedLaunch: true,
          updateId: null,
        }));
      });

      initSentry();

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('is idempotent — second call does not reinitialize', () => {
      const { initSentry, Sentry } = loadSentryWithMocks(() => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: {
            expoConfig: {
              extra: {
                sentry: {
                  dsn: 'https://example@sentry.io/123456',
                  environment: 'production',
                  release: '1.0.0',
                },
              },
            },
          },
        }));
        jest.doMock('expo-updates', () => ({
          isEnabled: true,
          isEmbeddedLaunch: false,
          updateId: 'test-update-id',
        }));
      });

      initSentry();
      initSentry();

      // Should only be called once (idempotent).
      expect(Sentry.init).toHaveBeenCalledTimes(1);
    });
  });
});
