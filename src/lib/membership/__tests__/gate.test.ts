// `gate.ts` imports `@react-native-async-storage/async-storage` for the
// last-known-value cache (task 3.1); the project's global jest setup
// (src/test/setup.ts, not owned by this agent) doesn't mock it, so the
// package's own official mock is used here.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { computeMemberAccess } from '../gate';

/**
 * Task 3.10 — the three combinations of flag × plano that make up the gate
 * requirement in specs/membership/spec.md ("Acesso de membro derivado de um
 * único valor"): the flag off always grants access; the flag on respects
 * the associate's own plan.
 */
describe('computeMemberAccess', () => {
  it('grants access when the flag is off, regardless of plan (free)', () => {
    expect(computeMemberAccess(false, 'free')).toBe(true);
  });

  it('denies access when the flag is on and the associate is on the free plan', () => {
    expect(computeMemberAccess(true, 'free')).toBe(false);
  });

  it('grants access when the flag is on and the associate is a member', () => {
    expect(computeMemberAccess(true, 'member')).toBe(true);
  });

  it('grants access when the flag is off even for a member (vacuous but documents the rule)', () => {
    expect(computeMemberAccess(false, 'member')).toBe(true);
  });
});
