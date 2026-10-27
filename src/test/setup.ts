/**
 * Global Jest setup — mocks every native module the app depends on, so
 * feature agents only write test *logic*, never native-module boilerplate.
 * Loaded via `setupFiles` in jest.config.js, before each test file.
 */
import React from 'react';
import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// @react-native-firebase/app
// ---------------------------------------------------------------------------
jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(async (options: unknown) => ({ name: '[DEFAULT]', options })),
}));

// ---------------------------------------------------------------------------
// @react-native-firebase/auth
// ---------------------------------------------------------------------------
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  onAuthStateChanged: jest.fn((_auth: unknown, callback: (user: unknown) => void) => {
    callback(null);
    return jest.fn(); // unsubscribe
  }),
  signOut: jest.fn(async () => undefined),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendSignInLinkToEmail: jest.fn(),
  signInWithEmailLink: jest.fn(),
  isSignInWithEmailLink: jest.fn(() => false),
}));

// ---------------------------------------------------------------------------
// @react-native-firebase/firestore — modular API surface used by src/data/*
// ---------------------------------------------------------------------------
class MockTimestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  static now() {
    return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
  }
  static fromDate(date: Date) {
    return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
  }
  static fromMillis(ms: number) {
    return new MockTimestamp(Math.floor(ms / 1000), 0);
  }
  toDate() {
    return new Date(this.seconds * 1000);
  }
  toMillis() {
    return this.seconds * 1000;
  }
}

class MockFieldValue {
  static serverTimestamp = jest.fn(() => ({ __type: 'serverTimestamp' }));
  static delete = jest.fn(() => ({ __type: 'delete' }));
  static increment = jest.fn((n: number) => ({ __type: 'increment', n }));
  static arrayUnion = jest.fn((...els: unknown[]) => ({ __type: 'arrayUnion', els }));
  static arrayRemove = jest.fn((...els: unknown[]) => ({ __type: 'arrayRemove', els }));
}

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn((_parent: unknown, path: string) => ({
    path,
    withConverter: jest.fn().mockReturnThis(),
  })),
  doc: jest.fn((_parent: unknown, id?: string) => ({ id })),
  query: jest.fn((collectionRef: unknown, ...constraints: unknown[]) => ({ collectionRef, constraints })),
  where: jest.fn((field: string, op: string, value: unknown) => ({ type: 'where', field, op, value })),
  orderBy: jest.fn((field: string, direction?: string) => ({ type: 'orderBy', field, direction })),
  limit: jest.fn((n: number) => ({ type: 'limit', n })),
  getDoc: jest.fn(async () => ({ exists: () => false, data: () => undefined, id: undefined })),
  getDocs: jest.fn(async () => ({ docs: [], empty: true })),
  setDoc: jest.fn(async () => undefined),
  updateDoc: jest.fn(async () => undefined),
  deleteDoc: jest.fn(async () => undefined),
  addDoc: jest.fn(async () => ({ id: 'mock-id' })),
  onSnapshot: jest.fn(() => jest.fn()),
  writeBatch: jest.fn(() => ({
    set: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    commit: jest.fn(async () => undefined),
  })),
  Timestamp: MockTimestamp,
  FieldValue: MockFieldValue,
}));

// ---------------------------------------------------------------------------
// @react-native-firebase/analytics
// ---------------------------------------------------------------------------
jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(async () => undefined),
  setUserId: jest.fn(async () => undefined),
  logScreenView: jest.fn(async () => undefined),
}));

// ---------------------------------------------------------------------------
// @sentry/react-native
// ---------------------------------------------------------------------------
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  wrap: jest.fn((component: unknown) => component),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  ReactNavigationInstrumentation: jest.fn(),
  reactNavigationIntegration: jest.fn(() => ({})),
}));

// ---------------------------------------------------------------------------
// @react-native-async-storage/async-storage — task 3.1 cache for last-known
// membership flag (src/lib/membership/gate.ts). In-memory store with per-test
// cleanup via jest.clearAllMocks() in test beforeEach hooks.
// ---------------------------------------------------------------------------
const mockAsyncStorageStore: Record<string, string> = {};

const createAsyncStorageMock = () => ({
  getItem: jest.fn(async (key: string) => mockAsyncStorageStore[key] ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    mockAsyncStorageStore[key] = value;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete mockAsyncStorageStore[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(mockAsyncStorageStore).forEach((key) => {
      delete mockAsyncStorageStore[key];
    });
  }),
  multiGet: jest.fn(async (keys: string[]) =>
    keys.map((key) => [key, mockAsyncStorageStore[key] ?? null] as [string, string | null]),
  ),
  multiSet: jest.fn(async (pairs: Array<[string, string]>) => {
    pairs.forEach(([key, value]) => {
      mockAsyncStorageStore[key] = value;
    });
  }),
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  ...createAsyncStorageMock(),
  default: createAsyncStorageMock(),
}));

// ---------------------------------------------------------------------------
// expo-updates — OTA bundle identification for Sentry's `dist` field
// (src/lib/observability/sentry.ts, task 2.2.ota). Mocked as an embedded
// launch (OTA disabled) by default; individual tests can override with
// jest.doMock() to test OTA-enabled scenarios.
// ---------------------------------------------------------------------------
jest.mock('expo-updates', () => ({
  updateId: null,
  isEmbeddedLaunch: true,
  isEnabled: false,
  channel: null,
  runtimeVersion: null,
}));

// ---------------------------------------------------------------------------
// expo-notifications
// ---------------------------------------------------------------------------
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined', granted: false })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[mock]' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  // Task 9.9 (RootNavigator.tsx's onReady) calls this unconditionally on
  // every mount — without a default mock, any test rendering RootNavigator
  // (including ones that never mention notifications, e.g.
  // src/lib/membership/__tests__/root-navigator-reachability.test.tsx)
  // throws "Notifications.getLastNotificationResponseAsync is not a
  // function". Individual suites can still override this with their own
  // `jest.mock('expo-notifications', ...)` (see
  // src/lib/push/__tests__/notificationResponse.test.ts).
  getLastNotificationResponseAsync: jest.fn(async () => null),
  scheduleNotificationAsync: jest.fn(async () => 'mock-notification-id'),
  SchedulableTriggerInputTypes: {},
  AndroidImportance: { DEFAULT: 3, HIGH: 4, MAX: 5 },
}));

// ---------------------------------------------------------------------------
// @react-native-firebase/functions — callStravaExchange.ts (src/lib/strava)
// invokes Cloud Functions via httpsCallable + HttpsError for error mapping.
// Tests that don't use Strava still load callStravaExchange indirectly and need
// the mock (see src/lib/membership/__tests__/entry-stack-reachability.test.tsx,
// root-navigator-reachability.test.tsx). Individual suites can override with
// their own jest.mock() (see src/lib/strava/__tests__/callStravaExchange.test.ts).
// ---------------------------------------------------------------------------
class MockHttpsError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpsError';
  }
}

jest.mock('@react-native-firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn((_functions: unknown, _name: string) =>
    jest.fn(async () => ({ data: {} })),
  ),
  HttpsError: MockHttpsError,
}));
