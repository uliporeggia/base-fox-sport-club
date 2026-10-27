/**
 * Jest's `node` test environment runs each test file inside a fresh `vm`
 * context, proxied so a fixed list of Node builtins (incl. `fetch`) resolve
 * lazily from the real `globalThis`. On this Node version that proxy's
 * `getOwnPropertyDescriptor` trap doesn't agree with its `get` trap for
 * `fetch`: `jest.spyOn(global, 'fetch')` succeeds (reads fine through
 * `get`), but `jest.restoreAllMocks()` afterwards computes
 * `isMethodOwner = Object.prototype.hasOwnProperty.call(global, 'fetch')`
 * as `false` and takes the `delete object['fetch']` branch instead of
 * restoring it — so the first spied-on test leaves every later test in the
 * same file with `global.fetch === undefined`
 * (src/notifications/__tests__/expoPushClient.test.ts, which spies on
 * `fetch` across multiple `it`s with an `afterEach(() => jest.restoreAllMocks())`).
 *
 * Fix: install a concrete, always-defined `fetch` (the same implementation
 * Node's own global `fetch` is built on) via `defineFetch`, called both now
 * and again after every test — so a `restoreAllMocks()`-triggered delete is
 * immediately repaired for the next test instead of ever being observed.
 */
const { fetch, Headers, Request, Response } = require('undici');

function defineFetch() {
  for (const [name, value] of [
    ['fetch', fetch],
    ['Headers', Headers],
    ['Request', Request],
    ['Response', Response],
  ]) {
    if (typeof global[name] !== 'function') {
      Object.defineProperty(global, name, { value, writable: true, enumerable: true, configurable: true });
    }
  }
}

defineFetch();

if (typeof afterEach === 'function') {
  afterEach(defineFetch);
}
